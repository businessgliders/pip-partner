// Shared branded email shell + MIME body helpers for outbound Gmail sends.

export const FROM_ALIASES = {
  FranchiseInquiry: { email: 'franchise@pilatesinpinkstudio.com', name: 'Franchise @ Pilates in Pink \u2122' },
  InfluencerApplication: { email: 'internal@pilatesinpinkstudio.com', name: 'Influencer @ Pilates in Pink \u2122' },
  InstructorApplication: { email: 'hire@pilatesinpinkstudio.com', name: 'Instructor @ Pilates in Pink \u2122' },
  FrontAdminApplication: { email: 'hire@pilatesinpinkstudio.com', name: 'Front Desk @ Pilates in Pink \u2122' },
};

const BRAND_ROSE = '#b67651';
const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png';

export function brandedShell(innerHtml, preheader = '') {
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

export function htmlToText(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .trim();
}

export function quotedPrintable(input) {
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