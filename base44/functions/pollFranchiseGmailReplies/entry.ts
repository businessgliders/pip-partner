import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Connector id for the app-user Gmail connector pointed at franchise@pilatesinpinkstudio.com
const FRANCHISE_GMAIL_CONNECTOR_ID = '6a17b6076b79e4d2d3fa4a55';

const STAFF_DOMAINS = ['pilatesinpinkstudio.com', 'pilatesinpink.ca'];

function isStaffEmail(email) {
  if (!email) return false;
  const lower = String(email).toLowerCase();
  return STAFF_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

function base64urlDecode(str) {
  if (!str) return '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function getHeader(headers, name) {
  const h = headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

function walkParts(payload) {
  const out = { html: '', text: '' };
  const walk = (part) => {
    if (!part) return;
    const mime = (part.mimeType || '').toLowerCase();
    if (mime === 'text/html' && part.body?.data) {
      out.html += base64urlDecode(part.body.data);
    } else if (mime === 'text/plain' && part.body?.data) {
      out.text += base64urlDecode(part.body.data);
    }
    if (part.parts) part.parts.forEach(walk);
  };
  walk(payload);
  return out;
}

function parseFrom(value) {
  if (!value) return { name: '', email: '' };
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: '', email: value.trim() };
}

// Ingest a single message from the franchise mailbox. Restricted to FranchiseInquiry tickets.
async function processFranchiseMessageId(base44, accessToken, messageId) {
  const existing = await base44.asServiceRole.entities.EmailMessage.filter(
    { gmail_message_id: messageId },
    '-created_date',
    1
  );
  if (existing.length > 0) {
    return { messageId, status: 'duplicate' };
  }

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    return { messageId, status: 'fetch_failed', code: res.status };
  }
  const msg = await res.json();

  const labels = msg.labelIds || [];
  if (labels.includes('SENT')) {
    return { messageId, status: 'skipped_sent' };
  }

  const headers = msg.payload?.headers || [];
  const autoSubmitted = getHeader(headers, 'Auto-Submitted');
  const precedence = getHeader(headers, 'Precedence');
  if (autoSubmitted && autoSubmitted.toLowerCase() !== 'no') {
    return { messageId, status: 'skipped_auto' };
  }
  if (precedence && /bulk|auto_reply|list/i.test(precedence)) {
    return { messageId, status: 'skipped_bulk' };
  }

  const subject = getHeader(headers, 'Subject');
  const fromHeader = getHeader(headers, 'From');
  const toHeader = getHeader(headers, 'To');
  const dateHeader = getHeader(headers, 'Date');
  const rfcMessageId = getHeader(headers, 'Message-ID');
  const inReplyTo = getHeader(headers, 'In-Reply-To');
  const references = getHeader(headers, 'References');

  const fromParsed = parseFrom(fromHeader);

  if (isStaffEmail(fromParsed.email)) {
    return { messageId, status: 'skipped_own_outbound' };
  }

  if (rfcMessageId) {
    const byRfc = await base44.asServiceRole.entities.EmailMessage.filter(
      { rfc_message_id: rfcMessageId },
      '-created_date',
      1
    );
    if (byRfc.length > 0) {
      return { messageId, status: 'duplicate_rfc' };
    }
  }

  // Find parent FranchiseInquiry only
  let parentId = null;

  const tagMatch = subject.match(/\[Ticket #([A-Za-z0-9]+)\]/);
  if (tagMatch) {
    const shortId = tagMatch[1];
    try {
      const candidates = await base44.asServiceRole.entities.FranchiseInquiry.list('-created_date', 1000);
      const hit = candidates.find((r) => r.id?.slice(-8) === shortId);
      if (hit) parentId = hit.id;
    } catch (_) {}
  }

  if (!parentId && inReplyTo) {
    const linked = await base44.asServiceRole.entities.EmailMessage.filter(
      { rfc_message_id: inReplyTo, ticket_type: 'FranchiseInquiry' },
      '-created_date',
      1
    );
    if (linked.length > 0) {
      parentId = linked[0].ticket_id;
    }
  }

  if (!parentId) {
    return { messageId, status: 'no_parent', subject };
  }

  const { html, text } = walkParts(msg.payload);
  let sentAt;
  try {
    sentAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
  } catch {
    sentAt = new Date().toISOString();
  }

  await base44.asServiceRole.entities.EmailMessage.create({
    ticket_id: parentId,
    ticket_type: 'FranchiseInquiry',
    gmail_thread_id: msg.threadId || '',
    gmail_message_id: messageId,
    rfc_message_id: rfcMessageId,
    in_reply_to: inReplyTo,
    references,
    direction: 'inbound',
    from_email: fromParsed.email,
    from_name: fromParsed.name,
    to_email: toHeader,
    subject,
    body_html: html,
    body_text: text,
    snippet: msg.snippet || '',
    sent_at: sentAt,
    send_status: 'received',
    read_by: [],
    read_at: [],
  });

  return { messageId, status: 'ingested', parent: parentId };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Read from the franchise@ mailbox via the app-user connector connection
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(
      FRANCHISE_GMAIL_CONNECTOR_ID
    );

    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' +
        encodeURIComponent('newer_than:1h -in:sent in:inbox') +
        '&maxResults=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      return Response.json(
        { error: 'Gmail list failed', details: errText },
        { status: 502 }
      );
    }

    const list = await listRes.json();
    const messages = list.messages || [];

    if (messages.length === 0) {
      return Response.json({ found: 0, new: 0, results: [] });
    }

    const results = [];
    for (const m of messages) {
      try {
        const r = await processFranchiseMessageId(base44, accessToken, m.id);
        results.push(r);
      } catch (e) {
        console.error('franchise ingest error for', m.id, e);
        results.push({ messageId: m.id, status: 'error', error: e.message });
      }
    }

    const ingestedCount = results.filter((r) => r.status === 'ingested').length;
    console.log(
      `pollFranchiseGmailReplies: scanned=${messages.length} ingested=${ingestedCount}`
    );

    return Response.json({
      found: messages.length,
      ingested: ingestedCount,
      results,
    });
  } catch (error) {
    console.error('pollFranchiseGmailReplies error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});