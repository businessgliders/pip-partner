// sendMeetingReminders — scheduled automation runner.
//
// Scans upcoming Cal.com bookings and sends the lead two reminder emails:
//   • "24h"  — sent when the meeting is 20–24 hours away ("it's tomorrow")
//   • "1h"   — sent when the meeting is under 1 hour away ("talk to you soon")
//
// Both emails emphasize the Google Meet link from Cal.com when available.
// Content comes from the editable EmailTemplate records
// "Meeting Reminder — 24 Hours" / "Meeting Reminder — 1 Hour" (Follow-up
// category), with a built-in fallback. Emails thread into the lead's existing
// Gmail conversation and are logged as EmailMessage records. A MeetingReminder
// record per (booking, kind) guarantees each reminder is only sent once.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { buildSubjectTag } from '../../shared/subjectTags.ts';
import { FROM_ALIASES, brandedShell, htmlToText, quotedPrintable } from '../../shared/emailBranding.ts';
import { base64UrlEncode, rfc2047 } from '../../shared/gmailMime.ts';

const ENTITY_NAMES = ['FranchiseInquiry', 'InstructorApplication', 'FrontAdminApplication', 'InfluencerApplication'];

const TEMPLATE_NAMES = { '24h': 'Meeting Reminder — 24 Hours', '1h': 'Meeting Reminder — 1 Hour' };

const FALLBACKS = {
  '24h': {
    subject: 'See you tomorrow — your meeting is at {{meeting_time}}',
    body_html: '<p>Hi {{client_first_name}},</p><p>Just a friendly reminder that your meeting with the Pilates in Pink team is <strong>24 hours away</strong> — {{meeting_day}} at {{meeting_time}}.</p>{{meet_link_button}}<p>If anything has changed and you need to reschedule, just reply to this email.</p><p>See you tomorrow!<br/>The Pilates in Pink Team</p>',
  },
  '1h': {
    subject: 'Talk to you soon — your meeting starts at {{meeting_time}}',
    body_html: '<p>Hi {{client_first_name}},</p><p>We will talk to you soon! Your meeting with the Pilates in Pink team starts in about an hour — today at {{meeting_time}}.</p>{{meet_link_button}}<p>Find a quiet spot and we\u2019ll see you there.</p><p>Talk soon,<br/>The Pilates in Pink Team</p>',
  },
};

const TZ = 'America/Toronto';

function fmtDay(iso) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(iso));
}
function fmtTime(iso) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).toLowerCase().replace(/\s/g, '') + ' ET';
}

function meetLinkButton(url) {
  if (!url) return '';
  return `<p style="text-align:center;margin:24px 0 8px;"><a href="${url}" style="display:inline-block;background:#f1889b;color:#ffffff;padding:13px 32px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none;">Join Google Meet</a></p><p style="text-align:center;font-size:12px;color:#96806f;margin:0 0 16px;">Or copy this link: <a href="${url}" style="color:#b67651;">${url}</a></p>`;
}

function fill(str, vars) {
  return String(str || '').replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, k) => {
    const key = k.toLowerCase();
    return vars[key] !== undefined ? vars[key] : m;
  });
}

function getTicketName(t) {
  if (t?.full_name) return t.full_name;
  const fn = `${t?.first_name || ''} ${t?.last_name || ''}`.trim();
  return fn || 'there';
}

// Fetch every upcoming, non-cancelled Cal.com booking (paginated).
async function fetchUpcomingBookings(apiKey) {
  const out = [];
  const take = 100;
  let skip = 0;
  for (let page = 0; page < 10; page++) {
    const url = new URL('https://api.cal.com/v2/bookings');
    url.searchParams.set('status', 'upcoming');
    url.searchParams.set('take', String(take));
    url.searchParams.set('skip', String(skip));
    const resp = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'cal-api-version': '2024-08-13' },
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Cal.com bookings fetch failed (${resp.status})`);
    const bookings = Array.isArray(data?.data) ? data.data : [];
    if (bookings.length === 0) break;
    for (const b of bookings) {
      if (b?.status && String(b.status).toLowerCase() === 'cancelled') continue;
      out.push(b);
    }
    if (bookings.length < take) break;
    skip += take;
  }
  return out;
}

// Find the lead this booking belongs to across all boards.
async function findLead(base44, email) {
  for (const entityName of ENTITY_NAMES) {
    const matches = await base44.asServiceRole.entities[entityName].filter({ email }, '-created_date', 1);
    if (matches.length > 0) return { entityName, ticket: matches[0] };
  }
  return null;
}

async function sendReminder(base44, accessToken, { kind, booking, entityName, ticket, template }) {
  const start = booking.start || booking.startTime;
  const meetUrl = booking.meetingUrl || (typeof booking.location === 'string' && /^https?:\/\//i.test(booking.location) ? booking.location : '');
  const fullName = getTicketName(ticket);
  const vars = {
    client_name: fullName,
    client_first_name: (ticket.first_name || fullName.split(' ')[0] || 'there'),
    meeting_day: fmtDay(start),
    meeting_time: fmtTime(start),
    meet_link: meetUrl,
    meet_link_button: meetLinkButton(meetUrl),
  };

  const subjectTag = buildSubjectTag(ticket, entityName);
  const subject = `${subjectTag} ${fill(template.subject, vars)}`.slice(0, 200).replace(/[\r\n]+/g, ' ');
  const bodyHtml = fill(template.body_html, vars);

  // Thread into the last applicant-facing outbound email, if any.
  const allEmails = await base44.asServiceRole.entities.EmailMessage.filter(
    { ticket_id: ticket.id, ticket_type: entityName }, 'created_date', 500
  );
  const external = allEmails.filter((m) => !m.is_internal);
  const lastReal = [...external].reverse().find((m) => m.direction === 'outbound') || external[external.length - 1] || null;

  const fromAlias = FROM_ALIASES[entityName] || FROM_ALIASES.InstructorApplication;
  const fromHeader = `${rfc2047(fromAlias.name)} <${fromAlias.email}>`;
  const toEmail = ticket.email;

  const wrappedHtml = brandedShell(bodyHtml, fill(template.subject, vars));
  const bodyText = htmlToText(bodyHtml);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${fromHeader}`,
    `To: ${toEmail}`,
    `Subject: ${rfc2047(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
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
  const raw = base64UrlEncode(headers.join('\r\n') + '\r\n\r\n' + mimeBody);
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
    throw new Error(`gmail send failed: ${errText.slice(0, 200)}`);
  }
  const sendResult = await sendRes.json();

  // Pull the RFC Message-ID for future threading.
  let rfcMessageId = '';
  try {
    const metaRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${sendResult.id}?format=metadata&metadataHeaders=Message-ID`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const m = (meta.payload?.headers || []).find((h) => h.name.toLowerCase() === 'message-id');
      rfcMessageId = m?.value || '';
    }
  } catch (_) {}

  const refsChain = lastReal ? (lastReal.references ? `${lastReal.references} ${lastReal.rfc_message_id || ''}`.trim() : (lastReal?.rfc_message_id || '')) : '';

  await base44.asServiceRole.entities.EmailMessage.create({
    ticket_id: ticket.id,
    ticket_type: entityName,
    gmail_thread_id: sendResult.threadId,
    gmail_message_id: sendResult.id,
    rfc_message_id: rfcMessageId,
    in_reply_to: lastReal?.rfc_message_id || '',
    references: refsChain,
    direction: 'outbound',
    from_email: fromAlias.email,
    from_name: fromAlias.name,
    to_email: toEmail,
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
    sent_by: '',
    sent_at: new Date().toISOString(),
    is_welcome: false,
    is_internal: false,
    template_name: TEMPLATE_NAMES[kind],
    send_status: 'sent',
    read_by: [],
    read_at: [],
  });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const apiKey = Deno.env.get('CAL_API_KEY');
    if (!apiKey) return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });

    const bookings = await fetchUpcomingBookings(apiKey);
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;

    // Load editable templates once (fallback to built-in copy).
    const templates = {};
    for (const kind of ['24h', '1h']) {
      const found = await base44.asServiceRole.entities.EmailTemplate.filter({ name: TEMPLATE_NAMES[kind] }, '-created_date', 1);
      const t = found[0];
      templates[kind] = (t && t.is_active !== false && t.subject && t.body_html)
        ? { subject: t.subject, body_html: t.body_html }
        : FALLBACKS[kind];
    }

    let accessToken = null;
    const results = [];

    for (const b of bookings) {
      const start = b?.start || b?.startTime;
      if (!start) continue;
      const msUntil = new Date(start).getTime() - now;
      if (msUntil <= 0) continue;

      let kind = null;
      if (msUntil <= HOUR) kind = '1h';
      else if (msUntil <= 24 * HOUR && msUntil > 20 * HOUR) kind = '24h';
      if (!kind) continue;

      const uid = String(b?.uid || b?.id || '');
      if (!uid) continue;

      // Already sent this reminder for this booking?
      const existing = await base44.asServiceRole.entities.MeetingReminder.filter({ booking_uid: uid, kind }, '-created_date', 1);
      if (existing.length > 0) continue;

      // Match the attendee back to a lead on any board.
      const attendees = Array.isArray(b?.attendees) ? b.attendees : [];
      let lead = null;
      for (const a of attendees) {
        const email = (a?.email || '').toLowerCase().trim();
        if (!email || email.endsWith('@pilatesinpinkstudio.com')) continue;
        lead = await findLead(base44, email);
        if (lead) break;
      }
      if (!lead) {
        results.push({ uid, kind, action: 'skip', detail: 'no matching lead' });
        continue;
      }

      if (!accessToken) {
        const conn = await base44.asServiceRole.connectors.getConnection('gmail');
        accessToken = conn.accessToken;
      }

      try {
        await sendReminder(base44, accessToken, {
          kind, booking: b, entityName: lead.entityName, ticket: lead.ticket, template: templates[kind],
        });
        await base44.asServiceRole.entities.MeetingReminder.create({
          booking_uid: uid,
          kind,
          ticket_id: lead.ticket.id,
          ticket_type: lead.entityName,
          to_email: lead.ticket.email,
          meeting_start: start,
          sent_at: new Date().toISOString(),
        });
        results.push({ uid, kind, action: 'sent', to: lead.ticket.email });
      } catch (err) {
        console.error(`Meeting reminder failed for booking ${uid} (${kind}):`, err);
        results.push({ uid, kind, action: 'error', detail: err.message });
      }
    }

    return Response.json({ success: true, scanned: bookings.length, processed: results.length, results });
  } catch (error) {
    console.error('sendMeetingReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}