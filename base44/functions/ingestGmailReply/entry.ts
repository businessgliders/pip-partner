import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITY_NAMES = [
  'FranchiseInquiry',
  'InfluencerApplication',
  'InstructorApplication',
  'FrontAdminApplication',
];

// Domains we own — any "From" address in these domains is an outbound message
// (sent from Gmail directly or via our send function) that's being looped back
// by Gmail (alias delivery, group forwarding, etc.). Never treat as inbound.
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
  // "Name" <email> or Name <email> or email
  if (!value) return { name: '', email: '' };
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: '', email: value.trim() };
}

async function processMessageId(base44, accessToken, messageId) {
  // Idempotency by Gmail message id
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

  // Skip our own outbound emails being looped back (alias delivery / group forwarding).
  // Any message whose "From" is on our staff domains is one we sent — never inbound.
  if (isStaffEmail(fromParsed.email)) {
    return { messageId, status: 'skipped_own_outbound' };
  }

  // Defense-in-depth: dedupe by RFC Message-ID too (same logical email can arrive
  // multiple times across alias/forward delivery, each with a different gmail_message_id).
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

  // Find parent record
  let parentId = null;
  let parentType = null;

  // Try ticket tag in subject: [Ticket #XXXXXXXX]
  const tagMatch = subject.match(/\[Ticket #([A-Za-z0-9]+)\]/);
  if (tagMatch) {
    const shortId = tagMatch[1];
    for (const entityName of ENTITY_NAMES) {
      try {
        const candidates = await base44.asServiceRole.entities[entityName].list('-created_date', 1000);
        const hit = candidates.find((r) => r.id?.slice(-8) === shortId);
        if (hit) {
          parentId = hit.id;
          parentType = entityName;
          break;
        }
      } catch (_) {}
    }
  }

  // Fallback: In-Reply-To header → existing EmailMessage
  if (!parentId && inReplyTo) {
    const linked = await base44.asServiceRole.entities.EmailMessage.filter(
      { rfc_message_id: inReplyTo },
      '-created_date',
      1
    );
    if (linked.length > 0) {
      parentId = linked[0].ticket_id;
      parentType = linked[0].ticket_type;
    }
  }

  // Fallback: match by sender email across all submission entities. This catches
  // emails the applicant sent fresh (no In-Reply-To, no ticket tag in subject)
  // — e.g. a new follow-up they composed from their inbox.
  if (!parentId && fromParsed.email) {
    const senderEmail = fromParsed.email.toLowerCase();
    for (const entityName of ENTITY_NAMES) {
      try {
        const matches = await base44.asServiceRole.entities[entityName].filter(
          { email: senderEmail },
          '-created_date',
          1
        );
        if (matches.length > 0) {
          parentId = matches[0].id;
          parentType = entityName;
          break;
        }
      } catch (_) {}
    }
  }

  if (!parentId || !parentType) {
    return { messageId, status: 'no_parent', subject };
  }

  const { html, text } = walkParts(msg.payload);
  const from = fromParsed;
  let sentAt;
  try {
    sentAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
  } catch {
    sentAt = new Date().toISOString();
  }

  await base44.asServiceRole.entities.EmailMessage.create({
    ticket_id: parentId,
    ticket_type: parentType,
    gmail_thread_id: msg.threadId || '',
    gmail_message_id: messageId,
    rfc_message_id: rfcMessageId,
    in_reply_to: inReplyTo,
    references,
    direction: 'inbound',
    from_email: from.email,
    from_name: from.name,
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

  return { messageId, status: 'ingested', parent: parentId, parent_type: parentType };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: shared secret (for Gmail webhook / system calls) OR admin session (for manual invocation).
    const expectedSecret = Deno.env.get('AUTOMATION_SHARED_SECRET');
    const providedSecret =
      req.headers.get('x-automation-secret') ||
      req.headers.get('X-Automation-Secret') ||
      body?.secret ||
      '';
    const secretOk = !!expectedSecret && providedSecret === expectedSecret;

    if (!secretOk) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }


    // Accept webhook payload { data: { new_message_ids } } or poller { message_ids }
    const messageIds =
      body?.data?.new_message_ids ??
      body?.message_ids ??
      [];

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return Response.json({ processed: 0, results: [] });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const results = [];
    for (const mid of messageIds) {
      try {
        const r = await processMessageId(base44, accessToken, mid);
        results.push(r);
      } catch (e) {
        console.error('ingest error for', mid, e);
        results.push({ messageId: mid, status: 'error', error: e.message });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    console.error('ingestGmailReply error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});