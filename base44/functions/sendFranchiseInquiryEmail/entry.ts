// Sends franchise inquiry notifications via Gmail integration.
//   1) Confirmation to the submitter (when scheduledTime is provided)
//   2) Notification to the three owners (sahil, rashmeen, gurpreen)
//
// Payload: { inquiryData: {...}, scheduledTime?: string, scheduledISO?: string, ownerOnly?: boolean }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OWNER_EMAILS = [
  'sahil@pilatesinpinkstudio.com',
  'rashmeen@pilatesinpinkstudio.com',
  'gurpreen@pilatesinpinkstudio.com',
];

const FROM_EMAIL = 'franchise@pilatesinpinkstudio.com';
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
  const firstName = inquiry.first_name || 'there';
  const inner = `
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:${BRAND_ROSE};line-height:1.2;">Your discovery call is <em style="color:${BRAND_PINK};">confirmed</em></h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#5a3a28;">Hi ${firstName}, thank you for your interest in becoming a Pilates in Pink&trade; franchise partner. We're so excited to connect with you.</p>
    <div style="background:#fbe0e2;border-radius:16px;padding:20px;margin:24px 0;">
      <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:8px;">YOUR CALL</div>
      <div style="font-size:18px;color:${BRAND_ROSE};font-weight:500;">${scheduledTime}</div>
      <div style="font-size:14px;color:rgba(90,58,40,0.7);margin-top:6px;">30 minutes &middot; Virtual &middot; With our Franchise Team</div>
    </div>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5a3a28;">You'll receive a separate calendar invite from Cal.com with the meeting link. Please add it to your calendar and check your spam folder if you don't see it.</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#5a3a28;">In the meantime, feel free to explore our website and come prepared with any questions you'd like to discuss.</p>
    <p style="margin:24px 0 0;font-size:15px;color:${BRAND_ROSE};font-style:italic;">With warmth,<br/>The Pilates in Pink&trade; Franchise Team</p>
    ${appNumber ? `<p style="margin-top:24px;font-size:11px;color:#a08778;text-align:center;">Reference: Application #${appNumber}</p>` : ''}
  `;
  return brandedShell(inner, `Your Pilates in Pink discovery call is confirmed for ${scheduledTime}`);
}

function ownerEmail(inquiry, scheduledTime, appNumber) {
  const fullName = `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim() || 'New applicant';
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
         <div style="font-size:17px;color:${BRAND_ROSE};font-weight:500;">${scheduledTime}</div>
       </div>`
    : `<div style="background:#fbe0e2;border-radius:16px;padding:18px;margin:0 0 24px;">
         <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:6px;">STATUS</div>
         <div style="font-size:15px;color:${BRAND_ROSE};font-weight:500;">Awaiting time slot selection</div>
       </div>`;

  const inner = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:${BRAND_ROSE};">${heading}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(90,58,40,0.7);">${subheading}</p>
    ${callBlock}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row('APPLICATION #', appNumber ? `#${appNumber}` : '')}
      ${row('NAME', fullName)}
      ${row('EMAIL', inquiry.email ? `<a href="mailto:${inquiry.email}" style="color:${BRAND_ROSE};">${inquiry.email}</a>` : '')}
      ${row('PHONE', inquiry.phone)}
      ${row('PROVINCE', inquiry.province)}
      ${row('PREFERRED LOCATION', inquiry.preferred_location)}
      ${row('AVAILABLE CAPITAL', inquiry.available_capital)}
      ${row('OPERATION STYLE', inquiry.operation_style)}
      ${row('READY TO SIGN NDA', inquiry.ready_to_sign_nda)}
      ${row('WHY PILATES IN PINK', inquiry.why_pilates_in_pink)}
      ${row('BUSINESS EXPERIENCE', inquiry.business_experience ? String(inquiry.business_experience).replace(/\n/g, '<br/>') : '')}
    </table>
  `;
  return brandedShell(inner, hasSlot ? `New franchise inquiry from ${fullName} — ${scheduledTime}` : `New franchise inquiry from ${fullName}`);
}

async function sendGmail({ accessToken, to, subject, html }) {
  const text = htmlToText(html);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const recipients = Array.isArray(to) ? to.join(', ') : to;
  const headers = [
    `From: ${rfc2047(FROM_NAME)} <${FROM_EMAIL}>`,
    `To: ${recipients}`,
    `Reply-To: ${FROM_EMAIL}`,
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { inquiryData = {}, scheduledTime = '', ownerOnly = false } = await req.json();
    const fullName = `${inquiryData.first_name || ''} ${inquiryData.last_name || ''}`.trim() || 'Applicant';
    const appNumber = inquiryData.app_number || '';
    const appTag = appNumber ? `[Application #${appNumber}] ` : '';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const tasks = [];

    if (!ownerOnly && scheduledTime && inquiryData.email) {
      tasks.push(sendGmail({
        accessToken,
        to: inquiryData.email,
        subject: `${appTag}Your discovery call is confirmed \u2014 Pilates in Pink \u2122`,
        html: submitterEmail(inquiryData, scheduledTime, appNumber),
      }));
    }

    const ownerSubject = scheduledTime
      ? `${appTag}New franchise inquiry: ${fullName} \u2014 ${scheduledTime}`
      : `${appTag}New franchise inquiry (no slot yet): ${fullName}`;

    tasks.push(sendGmail({
      accessToken,
      to: OWNER_EMAILS,
      subject: ownerSubject,
      html: ownerEmail(inquiryData, scheduledTime, appNumber),
    }));

    const results = await Promise.all(tasks);
    const allOk = results.every((r) => r.ok);
    return Response.json({ success: allOk, results });
  } catch (error) {
    console.error('sendFranchiseInquiryEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});