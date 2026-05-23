// Sends franchise inquiry notifications via Gmail integration.
//   1) Confirmation to the submitter (when scheduledTime is provided)
//   2) Notification to the three owners (sahil, rashmeen, gurpreen)
//
// Payload: { inquiryData: {...}, scheduledTime?: string, scheduledISO?: string, ownerOnly?: boolean }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Obfuscated 4-digit display number — see /src/lib/appNumberDisplay.js
function formatAppNumber(n) {
  if (!n && n !== 0) return '';
  return String(4720 + Number(n) * 17);
}

// Owner notification recipients are configured via the FRANCHISE_OWNER_EMAILS
// environment variable (comma-separated). Kept out of source to avoid leaking
// internal staff addresses.
const OWNER_EMAILS = (Deno.env.get('FRANCHISE_OWNER_EMAILS') || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

const FROM_EMAIL = 'partner@pilatesinpinkstudio.com';
const REPLY_TO_EMAIL = 'franchise@pilatesinpinkstudio.com';
const FROM_NAME = 'Pilates in Pink \u2122';

const BRAND_PINK = '#f1889b';
const BRAND_ROSE = '#b67651';
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png';

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

function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function brandedShell(innerHtml, preheader = '') {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#fbe0e2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#5a3a28;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#f1889b 0%,#f7b1bd 40%,#fbe0e2 100%);padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(182,118,81,0.15);">
        <tr><td style="padding:40px 40px 24px;text-align:center;background:linear-gradient(180deg,#fbe0e2 0%,#ffffff 100%);">
          <img src="${LOGO_URL}" alt="Pilates in Pink" width="64" style="width:64px;height:64px;display:block;margin:0 auto 16px;"/>
          <div style="font-size:11px;letter-spacing:3px;color:${BRAND_ROSE};font-weight:600;">PILATES IN PINK&trade;</div>
        </td></tr>
        <tr><td style="padding:24px 40px 40px;">${innerHtml}</td></tr>
        <tr><td style="padding:24px 40px;background:#2a1a1f;color:rgba(255,255,255,0.7);text-align:center;font-size:12px;">
          <div style="letter-spacing:2px;color:#f7b1bd;font-size:10px;margin-bottom:8px;">PRETTY &middot; POWERFUL &middot; PILATES</div>
          <div>6161 Mayfield Road, Unit #105 &middot; Brampton, ON</div>
          <div style="margin-top:8px;color:rgba(255,255,255,0.4);">&copy; ${new Date().getFullYear()} Pilates in Pink&trade;</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function submitterEmail(inquiry, scheduledTime, appNumber) {
  const firstName = escapeHtml(inquiry.first_name) || 'there';
  const safeTime = escapeHtml(scheduledTime);
  const safeApp = escapeHtml(appNumber);
  const inner = `
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:${BRAND_ROSE};line-height:1.2;">Your discovery call is <em style="color:${BRAND_PINK};">confirmed</em></h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#5a3a28;">Hi ${firstName}, thank you for your interest in becoming a Pilates in Pink&trade; franchise partner. We're so excited to connect with you.</p>
    <div style="background:#fbe0e2;border-radius:16px;padding:20px;margin:24px 0;">
      <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:8px;">YOUR CALL</div>
      <div style="font-size:18px;color:${BRAND_ROSE};font-weight:500;">${safeTime}</div>
      <div style="font-size:14px;color:rgba(90,58,40,0.7);margin-top:6px;">30 minutes &middot; Virtual &middot; With our Franchise Team</div>
    </div>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5a3a28;">You'll receive a separate calendar invite from Cal.com with the meeting link. Please add it to your calendar and check your spam folder if you don't see it.</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#5a3a28;">In the meantime, feel free to explore our website and come prepared with any questions you'd like to discuss.</p>
    <p style="margin:24px 0 0;font-size:15px;color:${BRAND_ROSE};font-style:italic;">With warmth,<br/>The Pilates in Pink&trade; Franchise Team</p>
    ${safeApp ? `<p style="margin-top:24px;font-size:11px;color:#a08778;text-align:center;">Reference: Application #${safeApp}</p>` : ''}
  `;
  return brandedShell(inner, `Your Pilates in Pink discovery call is confirmed for ${safeTime}`);
}

function buildViewButton(inquiryId) {
  const boardUrl = `https://partner.pilatesinpinkstudio.com/ApplicationBoard?ticket=${inquiryId}`;
  return `<a href="${escapeHtml(boardUrl)}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:${BRAND_ROSE};color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View in Application Board</a>`;
}

function ownerEmail(inquiry, scheduledTime, appNumber) {
  const fullName = `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim() || 'New applicant';
  const safeFullName = escapeHtml(fullName);
  const safeTime = escapeHtml(scheduledTime);
  const safeApp = escapeHtml(appNumber);
  const row = (label, value) => value
    ? `<tr><td style="padding:8px 0;font-size:12px;letter-spacing:1.5px;color:${BRAND_ROSE};font-weight:600;width:160px;vertical-align:top;">${label}</td><td style="padding:8px 0;font-size:14px;color:#5a3a28;">${value}</td></tr>`
    : '';

  const hasSlot = !!scheduledTime;
  const heading = hasSlot
    ? `New franchise inquiry &middot; <em style="color:${BRAND_PINK};">call booked</em>`
    : `New franchise inquiry &middot; <em style="color:${BRAND_PINK};">no slot selected</em>`;
  const subheading = hasSlot
    ? `A new applicant has scheduled a discovery call.`
    : `A new applicant submitted the franchise form but has not selected a time slot yet.`;
  const callBlock = hasSlot
    ? `<div style="background:#fbe0e2;border-radius:16px;padding:18px;margin:0 0 24px;">
         <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:6px;">SCHEDULED CALL</div>
         <div style="font-size:17px;color:${BRAND_ROSE};font-weight:500;">${safeTime}</div>
       </div>`
    : `<div style="background:#fbe0e2;border-radius:16px;padding:18px;margin:0 0 24px;">
         <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:6px;">STATUS</div>
         <div style="font-size:15px;color:${BRAND_ROSE};font-weight:500;">Awaiting time slot selection</div>
       </div>`;

  const safeEmail = isValidEmail(inquiry.email) ? escapeHtml(inquiry.email) : '';

  const inner = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:${BRAND_ROSE};">${heading}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(90,58,40,0.7);">${subheading}</p>
    ${callBlock}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row('APPLICATION #', safeApp ? `#${safeApp}` : '')}
      ${row('NAME', safeFullName)}
      ${row('EMAIL', safeEmail ? `<a href="mailto:${safeEmail}" style="color:${BRAND_ROSE};">${safeEmail}</a>` : '')}
      ${row('PHONE', escapeHtml(inquiry.phone))}
      ${row('PROVINCE', escapeHtml(inquiry.province))}
      ${row('PREFERRED LOCATION', escapeHtml(inquiry.preferred_location))}
      ${row('AVAILABLE CAPITAL', escapeHtml(inquiry.available_capital))}
      ${row('OPERATION STYLE', escapeHtml(inquiry.operation_style))}
      ${row('READY TO SIGN NDA', escapeHtml(inquiry.ready_to_sign_nda))}
      ${row('WHY PILATES IN PINK', escapeHtml(inquiry.why_pilates_in_pink))}
      ${row('BUSINESS EXPERIENCE', inquiry.business_experience ? escapeHtml(inquiry.business_experience).replace(/\n/g, '<br/>') : '')}
    </table>
    ${buildViewButton(inquiry.id)}
  `;
  return brandedShell(inner, hasSlot ? `New franchise inquiry from ${fullName} — ${scheduledTime}` : `New franchise inquiry from ${fullName}`);
}

// Logs a sent (or failed) email as an EmailMessage so it appears in the
// ApplicationBoard email thread for the inquiry.
async function logEmailMessage(base44, { inquiryId, to, subject, html, gmailResult, isInternal }) {
  if (!inquiryId) return;
  try {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    await base44.asServiceRole.entities.EmailMessage.create({
      ticket_id: inquiryId,
      ticket_type: 'FranchiseInquiry',
      direction: 'outbound',
      from_email: FROM_EMAIL,
      from_name: FROM_NAME,
      to_email: recipients,
      subject,
      body_html: html,
      body_text: htmlToText(html),
      snippet: htmlToText(html).slice(0, 160),
      sent_by: 'system',
      sent_at: new Date().toISOString(),
      is_internal: !!isInternal,
      send_status: gmailResult?.ok ? 'sent' : 'failed',
      send_error: gmailResult?.ok ? undefined : (gmailResult?.error || 'Unknown error'),
      gmail_message_id: gmailResult?.data?.id,
      gmail_thread_id: gmailResult?.data?.threadId,
    });
  } catch (err) {
    console.error('Failed to log EmailMessage:', err);
  }
}

async function sendGmail({ accessToken, to, subject, html, replyTo }) {
  const text = htmlToText(html);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const recipients = Array.isArray(to) ? to.join(', ') : to;
  const headers = [
    `From: ${rfc2047(FROM_NAME)} <${FROM_EMAIL}>`,
    `To: ${recipients}`,
    `Reply-To: ${replyTo || REPLY_TO_EMAIL}`,
    `Subject: ${rfc2047(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const mimeBody = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable', '',
    quotedPrintable(text), '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable', '',
    quotedPrintable(html), '',
    `--${boundary}--`, '',
  ].join('\r\n');
  const rawMime = headers.join('\r\n') + '\r\n\r\n' + mimeBody;
  const raw = base64url(rawMime);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Gmail send failed:', errText);
    return { ok: false, error: errText };
  }
  return { ok: true, data: await res.json() };
}

// Wait up to ~10s for an app_number to be assigned by the entity automation.
async function fetchRawAppNumber(base44, inquiryId) {
  if (!inquiryId) return null;
  for (let i = 0; i < 10; i++) {
    try {
      const rec = await base44.asServiceRole.entities.FranchiseInquiry.get(inquiryId);
      if (rec?.app_number) return rec.app_number;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { inquiryId, scheduledTime = '', ownerOnly = false, submitterOnly = false, testRecipient } = await req.json();

    // Auth model: this endpoint is called from the public franchise funnel
    // where submitters are not logged in. We require an unguessable inquiryId
    // (24-char Mongo hex) that resolves to a real FranchiseInquiry. We look it
    // up via service role with a short retry to tolerate read-replica lag
    // immediately after creation. The id itself acts as the bearer token —
    // attackers cannot guess one, so this blocks bogus owner-email spam.
    if (!inquiryId || !/^[a-f0-9]{24}$/i.test(String(inquiryId))) {
      return Response.json({ error: 'Missing or invalid inquiryId' }, { status: 400 });
    }
    let inquiryData = null;
    for (let i = 0; i < 5; i++) {
      try {
        const rec = await base44.asServiceRole.entities.FranchiseInquiry.get(inquiryId);
        if (rec) { inquiryData = rec; break; }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!inquiryData) {
      return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const fullName = `${inquiryData.first_name || ''} ${inquiryData.last_name || ''}`.trim() || 'Applicant';

    // Prefer the canonical app_number from the saved record so both welcome
    // and discovery-call emails share the same reference number.
    const rawNumber = (await fetchRawAppNumber(base44, inquiryId)) || inquiryData.app_number || '';
    const appNumber = rawNumber ? formatAppNumber(rawNumber) : '';
    const appTag = appNumber ? `[Application #${appNumber}] ` : '';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // 1) Send the owner notification immediately
    const timeForSubject = scheduledTime ? scheduledTime.replace(/ \(.*?\)$/, '') : '';
    const ownerSubject = scheduledTime
      ? `${appTag}New franchise inquiry: ${fullName} - ${timeForSubject}`
      : `${appTag}New franchise inquiry (no slot yet): ${fullName}`;

    const safeReplyTo = isValidEmail(inquiryData.email) ? inquiryData.email : undefined;

    // Allow admin-triggered test sends to a single staff recipient
    let ownerRecipients = OWNER_EMAILS;
    let finalOwnerSubject = ownerSubject;
    let isTestSend = false;
    if (testRecipient && isValidEmail(testRecipient)) {
      const me = await base44.auth.me().catch(() => null);
      if (me?.role === 'admin') {
        ownerRecipients = [testRecipient];
        finalOwnerSubject = `[TEST] ${ownerSubject}`;
        isTestSend = true;
      }
    }

    // If this is the owner "no slot yet" notification (ownerOnly + no scheduledTime),
    // skip it when the inquiry already has a Cal.com booking — the "call booked"
    // owner email (sent by the webhook or the frontend confirm flow) will cover it.
    let skipOwnerForBookedSlot = false;
    if (!submitterOnly && !scheduledTime && inquiryData?.scheduled_call_time) {
      skipOwnerForBookedSlot = true;
    }

    let ownerResult = { ok: true, skipped: true };
    if (!submitterOnly && !skipOwnerForBookedSlot) {
      const ownerHtml = ownerEmail(inquiryData, scheduledTime, appNumber);
      ownerResult = await sendGmail({
        accessToken,
        to: ownerRecipients,
        subject: finalOwnerSubject,
        html: ownerHtml,
        replyTo: safeReplyTo,
      });
      if (!isTestSend) {
        await logEmailMessage(base44, {
          inquiryId,
          to: ownerRecipients,
          subject: finalOwnerSubject,
          html: ownerHtml,
          gmailResult: ownerResult,
          isInternal: true,
        });
      }
    }

    // 2) Send the submitter's discovery-call confirmation immediately (no delay).
    let submitterResult = { ok: true, skipped: true };
    if (!isTestSend && !ownerOnly && scheduledTime && inquiryData.email) {
      const submitterSubject = `${appTag}Your discovery call is confirmed \u2014 Pilates in Pink \u2122`;
      const submitterHtml = submitterEmail(inquiryData, scheduledTime, appNumber);
      submitterResult = await sendGmail({
        accessToken,
        to: inquiryData.email,
        subject: submitterSubject,
        html: submitterHtml,
      });
      await logEmailMessage(base44, {
        inquiryId,
        to: inquiryData.email,
        subject: submitterSubject,
        html: submitterHtml,
        gmailResult: submitterResult,
        isInternal: false,
      });
      if (!submitterResult.ok) console.error('Submitter confirmation failed:', submitterResult.error);
    }

    return Response.json({
      success: ownerResult.ok && submitterResult.ok,
      ownerResult,
      submitterResult,
      skippedOwnerForBookedSlot: skipOwnerForBookedSlot,
    });
  } catch (error) {
    console.error('sendFranchiseInquiryEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});