import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FROM_ALIASES = {
  FranchiseInquiry: 'franchise@pilatesinpinkstudio.com',
  InfluencerApplication: 'partner@pilatesinpinkstudio.com',
  InstructorApplication: 'hire@pilatesinpinkstudio.com',
  FrontAdminApplication: 'hire@pilatesinpinkstudio.com',
};

const PROGRAM_LABELS = {
  FranchiseInquiry: 'Franchise Inquiry',
  InfluencerApplication: 'Influencer Application',
  InstructorApplication: 'Instructor Application',
  FrontAdminApplication: 'Front Desk Application',
};

function ticketName(t) {
  if (t?.full_name) return t.full_name;
  const fn = t?.first_name || '';
  const ln = t?.last_name || '';
  return `${fn} ${ln}`.trim() || 'there';
}

function rfc2047(str) {
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return `=?UTF-8?B?${b64}?=`;
}

function base64url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function quotedPrintable(input) {
  const bytes = new TextEncoder().encode(input);
  let out = '';
  let lineLen = 0;
  const writeChunk = (chunk) => {
    if (lineLen + chunk.length > 75) { out += '=\r\n'; lineLen = 0; }
    out += chunk;
    lineLen += chunk.length;
  };
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x0a) { out += '\r\n'; lineLen = 0; }
    else if (b === 0x0d) {}
    else if (b === 0x20 || b === 0x09) {
      const next = bytes[i + 1];
      if (next === 0x0a || next === undefined) writeChunk('=' + b.toString(16).toUpperCase().padStart(2, '0'));
      else writeChunk(String.fromCharCode(b));
    } else if (b >= 0x21 && b <= 0x7e && b !== 0x3d) writeChunk(String.fromCharCode(b));
    else writeChunk('=' + b.toString(16).toUpperCase().padStart(2, '0'));
  }
  return out;
}

function htmlToText(html) {
  return (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').trim();
}

function buildWelcomeHtml({ clientName, programLabel, ticketShortId }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fbe0e2;font-family:'Helvetica Neue',Arial,sans-serif;color:#3a2a23;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff8f4;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <img src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink" style="height:48px;"/>
  </div>
  <h2 style="color:#b67651;font-weight:500;font-size:22px;margin:0 0 12px;">Hi ${clientName},</h2>
  <p style="line-height:1.6;font-size:15px;">Thank you for submitting your ${programLabel} to <strong>Pilates in Pink™</strong>. We've received it and a member of our team will be in touch personally within 1-2 business days.</p>
  <p style="line-height:1.6;font-size:15px;">In the meantime, feel free to reply to this email with any questions — we read every message.</p>
  <p style="line-height:1.6;font-size:15px;color:#b67651;font-style:italic;">Pretty. Powerful. Pilates.</p>
  <hr style="border:none;border-top:1px solid #f7b1bd;margin:24px 0;"/>
  <p style="font-size:11px;color:#a08778;text-align:center;">Reference: Ticket #${ticketShortId}</p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Supports entity automation payload: { event: { entity_id, entity_name }, data }
    const ticket_id = body?.ticket_id || body?.event?.entity_id;
    const ticket_type = body?.ticket_type || body?.event?.entity_name;

    if (!ticket_id || !ticket_type) {
      return Response.json({ error: 'Missing ticket_id or ticket_type' }, { status: 400 });
    }
    if (!FROM_ALIASES[ticket_type]) {
      return Response.json({ skipped: true, reason: 'unsupported entity' });
    }

    const ticket = body?.data || await base44.asServiceRole.entities[ticket_type].get(ticket_id);
    if (!ticket?.email) {
      return Response.json({ skipped: true, reason: 'no email' });
    }

    // Idempotency — skip if a welcome already exists for this ticket
    const existingWelcome = await base44.asServiceRole.entities.EmailMessage.filter(
      { ticket_id, ticket_type, is_welcome: true },
      '-created_date',
      1
    );
    if (existingWelcome.length > 0) {
      return Response.json({ skipped: true, reason: 'already sent' });
    }

    const clientName = ticketName(ticket);
    const programLabel = PROGRAM_LABELS[ticket_type];
    const ticketShortId = ticket_id.slice(-8);
    const bodyHtml = buildWelcomeHtml({ clientName, programLabel, ticketShortId });
    const bodyText = htmlToText(bodyHtml);
    const subject = `[Ticket #${ticketShortId}] Welcome to Pilates in Pink \u2122`;
    const fromEmail = FROM_ALIASES[ticket_type];
    const fromHeader = `${rfc2047('Pilates in Pink \u2122')} <${fromEmail}>`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const headers = [
      `From: ${fromHeader}`,
      `To: ${ticket.email}`,
      `Subject: ${rfc2047(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    const mimeBody = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable', '',
      quotedPrintable(bodyText), '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: quoted-printable', '',
      quotedPrintable(bodyHtml), '',
      `--${boundary}--`, '',
    ].join('\r\n');

    const rawMime = headers.join('\r\n') + '\r\n\r\n' + mimeBody;
    const raw = base64url(rawMime);

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      }
    );

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('Welcome send failed:', errText);
      await base44.asServiceRole.entities.EmailMessage.create({
        ticket_id, ticket_type, direction: 'outbound',
        from_email: fromEmail, from_name: 'Pilates in Pink \u2122',
        to_email: ticket.email, subject, body_html: bodyHtml, body_text: bodyText,
        sent_by: 'system', sent_at: new Date().toISOString(),
        is_welcome: true, send_status: 'failed', send_error: errText.slice(0, 1000),
      });
      return Response.json({ error: 'Gmail send failed' }, { status: 502 });
    }

    const result = await sendRes.json();
    let rfcMessageId = '';
    try {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${result.id}?format=metadata&metadataHeaders=Message-ID`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const hdr = (meta.payload?.headers || []).find((h) => h.name.toLowerCase() === 'message-id');
        rfcMessageId = hdr?.value || '';
      }
    } catch (_) {}

    await base44.asServiceRole.entities.EmailMessage.create({
      ticket_id, ticket_type,
      gmail_thread_id: result.threadId,
      gmail_message_id: result.id,
      rfc_message_id: rfcMessageId,
      direction: 'outbound',
      from_email: fromEmail, from_name: 'Pilates in Pink \u2122',
      to_email: ticket.email, subject, body_html: bodyHtml, body_text: bodyText,
      sent_by: 'system', sent_at: new Date().toISOString(),
      is_welcome: true, send_status: 'sent',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendWelcomeEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});