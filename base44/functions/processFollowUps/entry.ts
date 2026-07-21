// processFollowUps — scheduled automation runner.
//
// For every active ticket where follow_up.enabled = true and next_send_at <= now:
//   1. Re-check the thread: if there's been an inbound reply since last_sent_at
//      (or any outbound from a human staff member since then), PAUSE.
//   2. Otherwise, ask the LLM to draft a context-aware follow-up using the
//      thread history + applicant context, AND to recommend the next interval.
//   3. Send via Gmail (same path as sendTicketEmail), append to EmailMessage
//      thread, and bump follow_up state.
//   4. If we've hit max_steps with no reply, mark status as "not interested"
//      (closed for franchise, declined for others), archive the ticket, and
//      disable the sequence.
//
// Designed to be invoked by a scheduled automation. The handler also supports
// being called with a specific { ticket_id, ticket_type } for ad-hoc testing.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@base44/sdk@0.8.31';
import { buildSubjectTag, cleanSubjectBase } from '../../shared/subjectTags.ts';

const ENTITY_NAMES = ['FranchiseInquiry', 'InfluencerApplication', 'InstructorApplication', 'FrontAdminApplication'];

const FROM_ALIASES = {
  FranchiseInquiry: { email: 'franchise@pilatesinpinkstudio.com', name: 'Franchise @ Pilates in Pink \u2122' },
  InfluencerApplication: { email: 'internal@pilatesinpinkstudio.com', name: 'Influencer @ Pilates in Pink \u2122' },
  InstructorApplication: { email: 'hire@pilatesinpinkstudio.com', name: 'Instructor @ Pilates in Pink \u2122' },
  FrontAdminApplication: { email: 'hire@pilatesinpinkstudio.com', name: 'Front Desk @ Pilates in Pink \u2122' },
};

// "Not Interested" status per entity. Franchise uses "closed", everyone else "declined".
function notInterestedStatusFor(entityName) {
  return entityName === 'FranchiseInquiry' ? 'closed' : 'declined';
}

const BRAND_ROSE = '#b67651';
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png';

function brandedShell(innerHtml, preheader = '') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#fbe0e2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#5a3a28;">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#f1889b 0%,#f7b1bd 40%,#fbe0e2 100%);padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(182,118,81,0.15);">
<tr><td style="padding:40px 40px 24px;text-align:center;background:linear-gradient(180deg,#fbe0e2 0%,#ffffff 100%);">
<img src="${LOGO_URL}" alt="Pilates in Pink" width="64" style="width:64px;height:64px;display:block;margin:0 auto 16px;"/>
<div style="font-size:11px;letter-spacing:3px;color:${BRAND_ROSE};font-weight:600;">PILATES IN PINK&trade;</div></td></tr>
<tr><td style="padding:24px 40px 40px;">${innerHtml}</td></tr>
<tr><td style="padding:24px 40px;background:#2a1a1f;color:rgba(255,255,255,0.7);text-align:center;font-size:12px;">
<div style="letter-spacing:2px;color:#f7b1bd;font-size:10px;margin-bottom:8px;">PRETTY &middot; POWERFUL &middot; PILATES</div>
<div>6161 Mayfield Road, Unit #105 &middot; Brampton, ON</div>
<div style="margin-top:8px;color:rgba(255,255,255,0.4);">&copy; ${new Date().getFullYear()} Pilates in Pink&trade;</div>
</td></tr></table></td></tr></table></body></html>`;
}

function htmlToText(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .trim();
}

function quotedPrintable(input) {
  const bytes = new TextEncoder().encode(input);
  let out = ''; let lineLen = 0;
  const writeChunk = (chunk) => { if (lineLen + chunk.length > 75) { out += '=\r\n'; lineLen = 0; } out += chunk; lineLen += chunk.length; };
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

function getTicketName(t) {
  if (t?.full_name) return t.full_name;
  const fn = `${t?.first_name || ''} ${t?.last_name || ''}`.trim();
  return fn || 'there';
}

// Min and max wait between follow-ups (days). LLM is asked to choose
// inside this window, but we clamp to keep behavior predictable.
const MIN_INTERVAL_DAYS = 2;
const MAX_INTERVAL_DAYS = 7;
// Default cap on follow-ups before auto-archiving.
const DEFAULT_MAX_STEPS = 5;

function clampInterval(days) {
  if (!Number.isFinite(days)) return MIN_INTERVAL_DAYS + 2;
  return Math.max(MIN_INTERVAL_DAYS, Math.min(MAX_INTERVAL_DAYS, Math.round(days)));
}

function addDays(iso, days) {
  const d = iso ? new Date(iso) : new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

// Process a single ticket. Returns { action, detail } summary.
async function processOne(base44, entityName, ticket) {
  const fu = ticket.follow_up || {};
  if (!fu.enabled) return { action: 'skip', detail: 'not enabled' };

  // Pull thread history (we use ALL emails for this ticket; ordered oldest→newest).
  const allEmails = await base44.asServiceRole.entities.EmailMessage.filter(
    { ticket_id: ticket.id, ticket_type: entityName },
    'created_date',
    500
  );
  const realEmails = allEmails.filter((m) => !m.is_welcome && !m.is_internal);

  // Anchor for "since last activity" checks. Before the first follow-up has
  // been sent, use enabled_at (when the sequence was turned on) — anything
  // that happened BEFORE the sequence started is not a reason to pause it
  // (manual template sends before enabling the sequence are expected).
  const activityAnchor = fu.last_sent_at
    ? new Date(fu.last_sent_at).getTime()
    : fu.enabled_at
    ? new Date(fu.enabled_at).getTime()
    : 0;

  // Pause: any inbound since the anchor means the lead responded.
  const hasInboundReply = realEmails.some((m) => {
    if (m.direction !== 'inbound') return false;
    const ts = new Date(m.sent_at || m.created_date).getTime();
    return ts > activityAnchor;
  });
  if (hasInboundReply) {
    await base44.asServiceRole.entities[entityName].update(ticket.id, {
      follow_up: { ...fu, enabled: false, paused_reason: 'replied' },
    });
    return { action: 'paused', detail: 'inbound reply detected' };
  }

  // Pause: any manual human outbound since the anchor — a staff member
  // jumped in with the composer, defer to them. Staff-manual replies are
  // strictly those sent via the composer (they carry a real staff email in
  // sent_by AND have no template_name / auto-tag). Automated outbounds
  // include:
  //   - sent_by = 'system' (Cal.com / welcome / owner notifications)
  //   - sent_by = '' with template_name starting "Auto Follow-up" (bot)
  //   - template-based sends fired from the "Templates" picker — these
  //     carry sent_by=<staff email> BUT also carry template_name, which
  //     distinguishes them from a real human-composed reply.
  const hasHumanOutbound = realEmails.some((m) => {
    if (m.direction !== 'outbound') return false;
    const by = (m.sent_by || '').toLowerCase().trim();
    if (!by || by === 'system') return false;
    // Template-based sends are not manual composer replies.
    if (m.template_name && String(m.template_name).trim().length > 0) return false;
    const ts = new Date(m.sent_at || m.created_date).getTime();
    return ts > activityAnchor;
  });
  if (hasHumanOutbound) {
    await base44.asServiceRole.entities[entityName].update(ticket.id, {
      follow_up: { ...fu, enabled: false, paused_reason: 'manual_reply' },
    });
    return { action: 'paused', detail: 'human staff replied' };
  }

  // Cap check: already at max_steps? Mark not interested + archive.
  const step = fu.step || 0;
  const maxSteps = fu.max_steps || DEFAULT_MAX_STEPS;
  if (step >= maxSteps) {
    const notInterested = notInterestedStatusFor(entityName);
    const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
    await base44.asServiceRole.entities[entityName].update(ticket.id, {
      status: notInterested,
      status_history: [...history, { status: notInterested, note: `Auto-marked after ${maxSteps} follow-ups with no reply`, by_name: 'Follow-up Bot', timestamp: new Date().toISOString() }],
      archived: true,
      follow_up: { ...fu, enabled: false, paused_reason: 'completed' },
    });
    return { action: 'completed', detail: `marked not interested after ${maxSteps} sends` };
  }

  // Find the last outbound APPLICANT-FACING email (anchors threading + subject).
  // Internal team emails are excluded so follow-ups never thread into — or take
  // their subject from — the internal conversation.
  const externalEmails = realEmails.filter((m) => !m.is_internal);
  const lastReal = [...externalEmails].reverse().find((m) => m.direction === 'outbound') || externalEmails[externalEmails.length - 1] || null;

  // Build a compact thread digest for the LLM (last 6 messages).
  const tail = realEmails.slice(-6).map((m) => {
    const txt = (m.body_text || htmlToText(m.body_html || '')).slice(0, 1000);
    return `[${m.direction.toUpperCase()} @ ${m.sent_at || m.created_date}]\n${m.subject || ''}\n${txt}`;
  }).join('\n\n---\n\n');

  const ticketSummary = JSON.stringify({
    name: getTicketName(ticket),
    email: ticket.email,
    type: entityName,
    submitted_at: ticket.created_date,
    status: ticket.status,
    preferred_location: ticket.preferred_location,
    preferred_studio: ticket.preferred_studio,
    province: ticket.province,
    available_capital: ticket.available_capital,
    operation_style: ticket.operation_style,
    follower_count: ticket.follower_count,
    instagram_handle: ticket.instagram_handle,
    why_partner: ticket.why_partner,
    why_pilates_in_pink: ticket.why_pilates_in_pink,
    business_experience: ticket.business_experience,
    qualifications: ticket.qualifications,
    message: ticket.message,
  });

  const stepNum = step + 1;
  const isLast = stepNum >= maxSteps;

  const prompt = `You are writing the next polite follow-up email in an ongoing conversation with a lead. The lead has NOT replied to our last outreach.

LEAD CONTEXT (JSON):
${ticketSummary}

THREAD SO FAR (oldest → newest, last few messages):
${tail || '(no prior emails)'}

This will be follow-up #${stepNum} of at most ${maxSteps}. ${isLast ? 'THIS IS THE FINAL FOLLOW-UP — gently let them know we won\'t reach out again unless they reply, but keep the door open.' : 'Keep it short, warm, on-brand for Pilates in Pink (uplifting, professional, no hard sell).'}

Tone rules:
- ${stepNum === 1 ? 'Lightly bump the previous message ("just floating this back to the top of your inbox").' : ''}
- ${stepNum === 2 ? 'Add a touch of new value or a soft question to invite a response.' : ''}
- ${stepNum >= 3 && !isLast ? 'Acknowledge it\'s been a few attempts, offer to pause if timing is bad.' : ''}
- ${isLast ? 'Final note — kind, no pressure, easy out.' : ''}
- 80–140 words, plain HTML (<p>, <br>, <a>). No images, no signature (a signature is appended automatically).
- Address the lead by first name. Never invent details that aren\'t in the context.

Also pick the optimal number of days to wait BEFORE the NEXT follow-up (between ${MIN_INTERVAL_DAYS} and ${MAX_INTERVAL_DAYS}), considering:
- Time since last outreach, lead engagement signals, and how many attempts we\'ve made.
- Later attempts usually space out further to avoid pressure.

Return JSON: { "subject_hint": string (short, no [Application #] tag), "body_html": string, "next_interval_days": integer }.`;

  const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        subject_hint: { type: 'string' },
        body_html: { type: 'string' },
        next_interval_days: { type: 'integer' },
      },
      required: ['body_html', 'next_interval_days'],
    },
  });

  const bodyHtml = (llm?.body_html || '').trim();
  if (!bodyHtml) return { action: 'error', detail: 'LLM returned empty body' };
  const nextIntervalDays = clampInterval(llm?.next_interval_days);

  // Compose subject: thread Re: + canonical [Application #] tag.
  const subjectTag = buildSubjectTag(ticket, entityName);
  let subject;
  if (lastReal?.subject) {
    const prev = cleanSubjectBase(lastReal.subject);
    subject = `Re: ${subjectTag} ${prev}`;
  } else {
    subject = `${subjectTag} Following up`;
  }
  subject = subject.slice(0, 200).replace(/[\r\n]+/g, ' ');

  // Append the admin who started the sequence's signature, if available.
  let signature = '';
  if (fu.enabled_by) {
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: fu.enabled_by }, '-created_date', 1);
      signature = users?.[0]?.signature_html || '';
    } catch (_) {}
  }
  const finalBodyHtml = signature ? `${bodyHtml}<br/><br/>${signature}` : bodyHtml;

  const fromAlias = FROM_ALIASES[entityName] || FROM_ALIASES.InstructorApplication;
  const fromHeader = `${rfc2047(fromAlias.name)} <${fromAlias.email}>`;
  const toEmail = ticket.email;
  if (!toEmail) return { action: 'error', detail: 'ticket has no email' };

  // Get Gmail token via the service-role connector.
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const wrappedHtml = brandedShell(finalBodyHtml, subject);
  const bodyText = htmlToText(finalBodyHtml);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [];
  headers.push(`From: ${fromHeader}`);
  headers.push(`To: ${toEmail}`);
  headers.push(`Subject: ${rfc2047(subject)}`);
  headers.push('MIME-Version: 1.0');
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  if (lastReal?.rfc_message_id) {
    headers.push(`In-Reply-To: ${lastReal.rfc_message_id}`);
    const refs = lastReal.references ? `${lastReal.references} ${lastReal.rfc_message_id}` : lastReal.rfc_message_id;
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
    quotedPrintable(wrappedHtml),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  const rawMime = headers.join('\r\n') + '\r\n\r\n' + mimeBody;
  const raw = base64url(rawMime);
  const sendPayload = { raw };
  if (lastReal?.gmail_thread_id) sendPayload.threadId = lastReal.gmail_thread_id;

  const gmailSend = (payload) => fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let sendRes = await gmailSend(sendPayload);
  if (sendRes.status === 404 && sendPayload.threadId) {
    const { threadId, ...retry } = sendPayload;
    sendRes = await gmailSend(retry);
  }
  if (!sendRes.ok) {
    const errText = await sendRes.text();
    console.error('Follow-up Gmail send failed:', errText);
    return { action: 'error', detail: `gmail send failed: ${errText.slice(0, 200)}` };
  }

  const sendResult = await sendRes.json();
  const gmailMessageId = sendResult.id;
  const gmailThreadId = sendResult.threadId;

  // Pull the RFC Message-ID for threading.
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

  const refsChain = lastReal ? (lastReal.references ? `${lastReal.references} ${lastReal.rfc_message_id || ''}`.trim() : (lastReal?.rfc_message_id || '')) : '';

  const newMessage = await base44.asServiceRole.entities.EmailMessage.create({
    ticket_id: ticket.id,
    ticket_type: entityName,
    gmail_thread_id: gmailThreadId,
    gmail_message_id: gmailMessageId,
    rfc_message_id: rfcMessageId,
    in_reply_to: lastReal?.rfc_message_id || '',
    references: refsChain,
    direction: 'outbound',
    from_email: fromAlias.email,
    from_name: fromAlias.name,
    to_email: toEmail,
    subject,
    body_html: finalBodyHtml,
    body_text: bodyText,
    sent_by: '', // empty = system/follow-up bot
    sent_at: new Date().toISOString(),
    is_welcome: false,
    is_internal: false,
    template_name: `Auto Follow-up #${stepNum}`,
    send_status: 'sent',
    read_by: [],
    read_at: [],
  });

  const newStep = step + 1;
  const completed = newStep >= maxSteps;
  const nowIso = new Date().toISOString();
  const nextSendAt = completed ? '' : addDays(nowIso, nextIntervalDays);
  const newHistory = Array.isArray(fu.history) ? fu.history : [];

  await base44.asServiceRole.entities[entityName].update(ticket.id, {
    follow_up: {
      ...fu,
      step: newStep,
      last_sent_at: nowIso,
      next_send_at: nextSendAt,
      enabled: !completed,
      paused_reason: completed ? 'completed' : '',
      history: [...newHistory, { step: newStep, sent_at: nowIso, email_message_id: newMessage.id, subject, interval_days: nextIntervalDays }],
    },
  });

  // If this WAS the final send, also mark not interested + archive.
  if (completed) {
    const notInterested = notInterestedStatusFor(entityName);
    const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
    await base44.asServiceRole.entities[entityName].update(ticket.id, {
      status: notInterested,
      status_history: [...history, { status: notInterested, note: `Auto-marked after ${maxSteps} follow-ups with no reply`, by_name: 'Follow-up Bot', timestamp: nowIso }],
      archived: true,
    });
  }

  return { action: 'sent', detail: `step ${newStep}/${maxSteps}, next in ${completed ? 'n/a (done)' : nextIntervalDays + 'd'}` };
}

Deno.serve(async (req) => {
  try {
    // The scheduled automation calls this with no auth — use a service-role client.
    // If invoked from the app (e.g. manual run by an admin), createClientFromRequest
    // returns an authed client too; we'll use service-role for entity ops either way.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const onlyTicketId = body?.ticket_id || null;
    const onlyTicketType = body?.ticket_type || null;

    const now = Date.now();
    const results = [];

    const entitiesToScan = onlyTicketType ? [onlyTicketType] : ENTITY_NAMES;

    for (const entityName of entitiesToScan) {
      let tickets = [];
      if (onlyTicketId) {
        const one = await base44.asServiceRole.entities[entityName].get(onlyTicketId);
        if (one) tickets = [one];
      } else {
        // We can't filter on nested fields server-side, so pull recent active
        // tickets and filter in memory. Cap at 1000 per entity.
        const all = await base44.asServiceRole.entities[entityName].list('-created_date', 1000);
        tickets = all.filter((t) => {
          const fu = t.follow_up;
          if (!fu || !fu.enabled) return false;
          if (t.archived) return false;
          // No next_send_at yet = run immediately (first-time activation path).
          if (!fu.next_send_at) return true;
          return new Date(fu.next_send_at).getTime() <= now;
        });
      }

      for (const ticket of tickets) {
        try {
          const r = await processOne(base44, entityName, ticket);
          results.push({ entity: entityName, ticket_id: ticket.id, ...r });
        } catch (err) {
          console.error(`Follow-up failed for ${entityName}/${ticket.id}:`, err);
          results.push({ entity: entityName, ticket_id: ticket.id, action: 'error', detail: err.message });
        }
      }
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('processFollowUps error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});