// Public endpoint used by the franchise funnel to detect whether an inquirer
// already started an application. On a positive match for an UNSCHEDULED
// inquiry, generates a 6-digit PIN, hashes it, stores hash + expiry on the
// record, and emails the PIN to the address on file. The response never
// reveals personal data — only a boolean — so attackers can only learn
// "this email has an open inquiry" (the same fact a contact form already leaks).
//
// Payload: { email: string }
// Response: { found: boolean, sent: boolean }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FROM_EMAIL = 'partner@pilatesinpinkstudio.com';
const REPLY_TO_EMAIL = 'franchise@pilatesinpinkstudio.com';
const FROM_NAME = 'Pilates in Pink \u2122';
const BRAND_PINK = '#f1889b';
const BRAND_ROSE = '#b67651';
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png';

const PIN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generatePin() {
  // 6-digit numeric PIN, zero-padded
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, '0');
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

function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pinEmailHtml(firstName, pin) {
  const safeName = escapeHtml(firstName) || 'there';
  const safePin = escapeHtml(pin);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#fbe0e2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#5a3a28;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#f1889b 0%,#f7b1bd 40%,#fbe0e2 100%);padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(182,118,81,0.15);">
        <tr><td style="padding:40px 40px 24px;text-align:center;background:linear-gradient(180deg,#fbe0e2 0%,#ffffff 100%);">
          <img src="${LOGO_URL}" alt="Pilates in Pink" width="64" style="width:64px;height:64px;display:block;margin:0 auto 16px;"/>
          <div style="font-size:11px;letter-spacing:3px;color:${BRAND_ROSE};font-weight:600;">PILATES IN PINK&trade;</div>
        </td></tr>
        <tr><td style="padding:24px 40px 40px;">
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:300;color:${BRAND_ROSE};line-height:1.2;">Your secure <em style="color:${BRAND_PINK};">resume code</em></h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5a3a28;">Hi ${safeName}, you asked to continue your franchise application. Enter the code below to verify it's you and pick a discovery call time.</p>
          <div style="background:#fbe0e2;border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
            <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:10px;">YOUR CODE</div>
            <div style="font-size:36px;letter-spacing:10px;color:${BRAND_ROSE};font-weight:600;font-family:'Courier New',monospace;">${safePin}</div>
            <div style="font-size:12px;color:rgba(90,58,40,0.7);margin-top:10px;">Expires in 15 minutes</div>
          </div>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(90,58,40,0.8);">If you didn't request this, you can safely ignore this email.</p>
          <p style="margin:24px 0 0;font-size:15px;color:${BRAND_ROSE};font-style:italic;">With warmth,<br/>The Pilates in Pink&trade; Franchise Team</p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#2a1a1f;color:rgba(255,255,255,0.7);text-align:center;font-size:12px;">
          <div style="letter-spacing:2px;color:#f7b1bd;font-size:10px;">PRETTY &middot; POWERFUL &middot; PILATES</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendGmail({ accessToken, to, subject, html }) {
  const text = htmlToText(html);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${rfc2047(FROM_NAME)} <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Reply-To: ${REPLY_TO_EMAIL}`,
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
  return { ok: true };
}

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    if (!isValidEmail(email)) {
      return Response.json({ found: false, sent: false });
    }

    const base44 = createClientFromRequest(req);
    const normalized = email.trim().toLowerCase();

    // Find the most recent UNSCHEDULED, non-archived inquiry for this email
    const matches = await base44.asServiceRole.entities.FranchiseInquiry.filter(
      { email: normalized },
      '-created_date',
      20
    );

    const candidate = (matches || []).find(
      (r) => !r.archived && !r.scheduled_call_time
    );

    if (!candidate) {
      // Don't leak existence — always respond similarly
      return Response.json({ found: false, sent: false });
    }

    // Generate PIN, store hash + expiry
    const pin = generatePin();
    const pinHash = await sha256Hex(pin);
    const expiresAt = new Date(Date.now() + PIN_TTL_MS).toISOString();

    await base44.asServiceRole.entities.FranchiseInquiry.update(candidate.id, {
      resume_pin_hash: pinHash,
      resume_pin_expires_at: expiresAt,
      resume_pin_attempts: 0,
    });

    // Email the PIN to the address on file
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    await sendGmail({
      accessToken,
      to: candidate.email,
      subject: 'Your Pilates in Pink resume code',
      html: pinEmailHtml(candidate.first_name, pin),
    });

    return Response.json({ found: true, sent: true });
  } catch (error) {
    console.error('checkInquiryByEmail error', error);
    return Response.json({ found: false, sent: false });
  }
});