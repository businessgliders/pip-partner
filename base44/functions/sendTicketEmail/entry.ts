import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAFF_DOMAINS = ['pilatesinpinkstudio.com', 'pilatesinpink.ca'];
const BUSINESS_NAME = 'Pilates in Pink';

// Map ticket_type → From alias
const FROM_ALIASES = {
  FranchiseInquiry: 'franchise@pilatesinpinkstudio.com',
  InfluencerApplication: 'partner@pilatesinpinkstudio.com',
  InstructorApplication: 'hire@pilatesinpinkstudio.com',
  FrontAdminApplication: 'hire@pilatesinpinkstudio.com',
};

const ENTITY_NAME_MAP = {
  FranchiseInquiry: 'FranchiseInquiry',
  InfluencerApplication: 'InfluencerApplication',
  InstructorApplication: 'InstructorApplication',
  FrontAdminApplication: 'FrontAdminApplication',
};

function isStaffEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return STAFF_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

function getTicketEmail(ticket) {
  return ticket?.email || '';
}

function getTicketName(ticket) {
  if (ticket?.full_name) return ticket.full_name;
  const fn = ticket?.first_name || '';
  const ln = ticket?.last_name || '';
  return `${fn} ${ln}`.trim() || 'there';
}

function htmlToText(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function quotedPrintable(input) {
  // Simple QP encoder for UTF-8 strings
  const bytes = new TextEncoder().encode(input);
  let out = '';
  let lineLen = 0;
  const writeChunk = (chunk) => {
    if (lineLen + chunk.length > 75) {
      out += '=\r\n';
      lineLen = 0;
    }
    out += chunk;
    lineLen += chunk.length;
  };
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x0a) {
      out += '\r\n';
      lineLen = 0;
    } else if (b === 0x0d) {
      // skip — handled by 0x0a
    } else if (b === 0x20 || b === 0x09) {
      // space/tab — encode only at end of line
      const next = bytes[i + 1];
      if (next === 0x0a || next === undefined) {
        writeChunk('=' + b.toString(16).toUpperCase().padStart(2, '0'));
      } else {
        writeChunk(String.fromCharCode(b));
      }
    } else if (b >= 0x21 && b <= 0x7e && b !== 0x3d) {
      writeChunk(String.fromCharCode(b));
    } else {
      writeChunk('=' + b.toString(16).toUpperCase().padStart(2, '0'));
    }
  }
  return out;
}

function rfc2047(str) {
  // Encode the display name as base64 UTF-8 if it has non-ASCII chars
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return `=?UTF-8?B?${b64}?=`;
}

function base64url(str) {
  // Encode a UTF-8 string to base64url
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildSubjectTag(ticketId) {
  return `[Ticket #${ticketId.slice(-8)}]`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !isStaffEmail(user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticket_id, ticket_type, body_html, is_welcome } = await req.json();

    if (!ticket_id || !ticket_type || !body_html) {
      return Response.json({ error: 'Missing ticket_id, ticket_type or body_html' }, { status: 400 });
    }

    const entityName = ENTITY_NAME_MAP[ticket_type];
    if (!entityName) {
      return Response.json({ error: 'Unknown ticket_type' }, { status: 400 });
    }

    const ticket = await base44.asServiceRole.entities[entityName].get(ticket_id);
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const toEmail = getTicketEmail(ticket);
    if (!toEmail) {
      return Response.json({ error: 'Ticket has no email address' }, { status: 400 });
    }

    // Find existing thread context
    const existing = await base44.asServiceRole.entities.EmailMessage.filter(
      { ticket_id, ticket_type },
      'created_date',
      500
    );
    const realEmails = existing.filter((m) => !m.is_welcome);
    const lastReal = realEmails[realEmails.length - 1];

    const subjectTag = buildSubjectTag(ticket_id);
    let subject;
    if (lastReal?.subject) {
      // Strip existing Re: and tag from previous subject, then rebuild
      let prev = lastReal.subject.replace(/^(Re:\s*)+/i, '').replace(/^\[Ticket #[^\]]+\]\s*/, '').trim();
      subject = `Re: ${subjectTag} ${prev}`;
    } else {
      const inquiryWord =
        ticket_type === 'FranchiseInquiry' ? 'Franchise Inquiry'
          : ticket_type === 'InfluencerApplication' ? 'Influencer Application'
          : ticket_type === 'InstructorApplication' ? 'Instructor Application'
          : 'Front Desk Application';
      subject = `${subjectTag} Your ${inquiryWord}`;
    }

    // Auto-append signature unless welcome
    let finalBodyHtml = body_html;
    if (!is_welcome) {
      let signature = user.signature_html;
      if (!signature) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ email: user.email }, '-created_date', 1);
          signature = users?.[0]?.signature_html;
        } catch (_) {}
      }
      if (signature) {
        finalBodyHtml = `${body_html}<br/><br/>${signature}`;
      }
    }

    const fromEmail = FROM_ALIASES[ticket_type] || 'hire@pilatesinpinkstudio.com';
    const fromDisplay = rfc2047(`${BUSINESS_NAME} \u2122`);
    const fromHeader = `${fromDisplay} <${fromEmail}>`;

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Build MIME multipart/alternative
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const bodyText = htmlToText(finalBodyHtml);

    const headers = [];
    headers.push(`From: ${fromHeader}`);
    headers.push(`To: ${toEmail}`);
    headers.push(`Subject: ${rfc2047(subject)}`);
    headers.push('MIME-Version: 1.0');
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    if (lastReal?.rfc_message_id) {
      headers.push(`In-Reply-To: ${lastReal.rfc_message_id}`);
      const refs = lastReal.references
        ? `${lastReal.references} ${lastReal.rfc_message_id}`
        : lastReal.rfc_message_id;
      headers.push(`References: ${refs}`);
    }

    const mimeBody = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      quotedPrintable(bodyText),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      quotedPrintable(finalBodyHtml),
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const rawMime = headers.join('\r\n') + '\r\n\r\n' + mimeBody;
    const raw = base64url(rawMime);

    const sendPayload = { raw };
    if (lastReal?.gmail_thread_id) {
      sendPayload.threadId = lastReal.gmail_thread_id;
    }

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendPayload),
      }
    );

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('Gmail send failed:', errText);
      await base44.asServiceRole.entities.EmailMessage.create({
        ticket_id,
        ticket_type,
        direction: 'outbound',
        from_email: fromEmail,
        from_name: `${BUSINESS_NAME} \u2122`,
        to_email: toEmail,
        subject,
        body_html: finalBodyHtml,
        body_text: bodyText,
        sent_by: user.email,
        sent_at: new Date().toISOString(),
        is_welcome: !!is_welcome,
        send_status: 'failed',
        send_error: errText.slice(0, 1000),
        read_by: [user.email],
        read_at: [{ email: user.email, timestamp: new Date().toISOString() }],
      });
      return Response.json({ error: 'Gmail send failed', details: errText }, { status: 502 });
    }

    const sendResult = await sendRes.json();
    const gmailMessageId = sendResult.id;
    const gmailThreadId = sendResult.threadId;

    // Fetch the sent message to get the RFC Message-ID header
    let rfcMessageId = '';
    try {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}?format=metadata&metadataHeaders=Message-ID`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const hdrs = meta.payload?.headers || [];
        const m = hdrs.find((h) => h.name.toLowerCase() === 'message-id');
        rfcMessageId = m?.value || '';
      }
    } catch (_) {}

    const refsChain = lastReal?.references
      ? `${lastReal.references} ${lastReal.rfc_message_id}`
      : lastReal?.rfc_message_id || '';

    const newMessage = await base44.asServiceRole.entities.EmailMessage.create({
      ticket_id,
      ticket_type,
      gmail_thread_id: gmailThreadId,
      gmail_message_id: gmailMessageId,
      rfc_message_id: rfcMessageId,
      in_reply_to: lastReal?.rfc_message_id || '',
      references: refsChain,
      direction: 'outbound',
      from_email: fromEmail,
      from_name: `${BUSINESS_NAME} \u2122`,
      to_email: toEmail,
      subject,
      body_html: finalBodyHtml,
      body_text: bodyText,
      sent_by: user.email,
      sent_at: new Date().toISOString(),
      is_welcome: !!is_welcome,
      send_status: 'sent',
      read_by: [user.email],
      read_at: [{ email: user.email, timestamp: new Date().toISOString() }],
    });

    return Response.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('sendTicketEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});