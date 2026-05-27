// Admin-only helper: render an EmailTemplate with sample variables and send a
// test copy to a specified recipient via Gmail. Used by the builder to preview
// new templates without going through a real ticket.
//
// Payload: { template_id: string, to_email: string, sample_vars?: object }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FROM_EMAIL = 'franchise@pilatesinpinkstudio.com';
const FROM_NAME = 'Pilates in Pink \u2122';

const BRAND_PINK = '#f1889b';
const BRAND_ROSE = '#b67651';
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png';

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
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
function renderVars(text, vars) {
  return String(text || '').replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { template_id, to_email, sample_vars } = await req.json();
    if (!template_id || !to_email || !isValidEmail(to_email)) {
      return Response.json({ error: 'Missing template_id or valid to_email' }, { status: 400 });
    }

    const tpl = await base44.asServiceRole.entities.EmailTemplate.get(template_id);
    if (!tpl) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const vars = {
      client_name: 'Sample Applicant',
      client_first_name: 'Sample',
      client_email: to_email,
      client_phone: '',
      inquiry_type: 'FranchiseInquiry',
      ticket_id: 'TEST',
      staff_name: user.full_name || 'Pilates in Pink Team',
      staff_first_name: (user.full_name || '').split(' ')[0] || 'Team',
      staff_email: user.email,
      ...(sample_vars || {}),
    };

    const subject = `[TEST] ${renderVars(tpl.subject, vars)}`;
    const innerHtml = renderVars(tpl.body_html, vars);
    const bodyHtml = brandedShell(innerHtml, renderVars(tpl.subject, vars));
    const bodyText = htmlToText(innerHtml);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const headers = [
      `From: ${rfc2047(FROM_NAME)} <${FROM_EMAIL}>`,
      `To: ${to_email}`,
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

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Gmail send failed:', errText);
      return Response.json({ error: 'Gmail send failed', details: errText }, { status: 502 });
    }

    return Response.json({ success: true, subject });
  } catch (error) {
    console.error('sendTemplateTestEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});