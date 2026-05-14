// Sends front desk admin application notification to the team via Gmail integration.
// Payload: { applicationData: {...} }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Obfuscated 4-digit display number — see /src/lib/appNumberDisplay.js
function formatAppNumber(n) {
  if (!n && n !== 0) return '';
  return String(3840 + Number(n) * 29);
}

const OWNER_EMAILS = [
  'rashmeen@pilatesinpinkstudio.com',
  'gurpreen@pilatesinpinkstudio.com',
  'sahil@pilatesinpinkstudio.com',
];
const FROM_EMAIL = 'hire@pilatesinpinkstudio.com';
const FROM_NAME = 'Pilates in Pink \u2122';

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

function buildHtml(applicationData, appNumber) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #7b9e9e 0%, #a8c5c5 30%, #d6eaea 60%, #eef6f6 100%); padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink" style="width: 80px; height: 80px; margin-bottom: 15px;" />
      </div>
      <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #4a7c7c; margin-top: 0; font-size: 24px; font-weight: 300;">New Front Desk Admin Application${appNumber ? ` &middot; #${appNumber}` : ''}</h2>
        <div style="margin: 20px 0; padding: 15px; background: #d6eaea; border-radius: 10px;">
          <h3 style="color: #4a7c7c; margin: 0 0 15px 0; font-size: 16px;">Contact Information</h3>
          <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Name:</strong> ${applicationData.first_name || ''} ${applicationData.last_name || ''}</p>
          <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Email:</strong> ${applicationData.email || ''}</p>
          <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Preferred Studio:</strong> ${applicationData.preferred_studio || 'Not provided'}</p>
          <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Postal Code:</strong> ${applicationData.postal_code || 'Not provided'}</p>
          <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Province:</strong> ${applicationData.province || 'Not provided'}</p>
        </div>
        ${applicationData.message ? `
        <div style="margin: 20px 0; padding: 15px; background: #d6eaea; border-radius: 10px;">
          <h3 style="color: #4a7c7c; margin: 0 0 15px 0; font-size: 16px;">Message</h3>
          <p style="margin: 0; color: #666; line-height: 1.6;">${applicationData.message}</p>
        </div>` : ''}
        ${applicationData.resume_url ? `
        <div style="margin: 20px 0; padding: 15px; background: #d6eaea; border-radius: 10px;">
          <h3 style="color: #4a7c7c; margin: 0 0 15px 0; font-size: 16px;">Resume</h3>
          <a href="${applicationData.resume_url}" style="color: #4a7c7c;">View Attached Resume</a>
        </div>` : ''}
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #a8c5c5;">
          <p style="color: #4a7c7c; margin: 0; font-size: 12px;">${appNumber ? `Reference: Application #${appNumber} &middot; ` : ''}&copy; ${new Date().getFullYear()} Pilates in Pink&trade;</p>
        </div>
      </div>
    </div>
  `;
}

async function sendGmail({ accessToken, to, subject, html }) {
  const text = htmlToText(html);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${rfc2047(FROM_NAME)} <${FROM_EMAIL}>`,
    `To: ${to}`,
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
    const { applicationData = {} } = await req.json();
    const rawNumber = applicationData.app_number || '';
    const appNumber = rawNumber ? formatAppNumber(rawNumber) : '';
    const appTag = appNumber ? `[Application #${appNumber}] ` : '';
    const html = buildHtml(applicationData, appNumber);
    const name = `${applicationData.first_name || ''} ${applicationData.last_name || ''}`.trim();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const result = await sendGmail({
      accessToken,
      to: OWNER_EMAILS.join(', '),
      subject: `${appTag}New Front Desk Admin Application: ${name}`,
      html,
    });

    return Response.json({ success: result.ok, results: [result] });
  } catch (error) {
    console.error('sendFrontAdminApplicationEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});