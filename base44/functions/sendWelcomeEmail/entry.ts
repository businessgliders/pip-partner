import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FROM_ALIASES = {
  FranchiseInquiry: 'partner@pilatesinpinkstudio.com',
  InfluencerApplication: 'partner@pilatesinpinkstudio.com',
  InstructorApplication: 'hire@pilatesinpinkstudio.com',
  FrontAdminApplication: 'hire@pilatesinpinkstudio.com',
};

// Override Reply-To for specific programs (else defaults to FROM)
const REPLY_TO_ALIASES = {
  FranchiseInquiry: 'franchise@pilatesinpinkstudio.com',
};

const PROGRAM_LABELS = {
  FranchiseInquiry: 'Franchise Inquiry',
  InfluencerApplication: 'Influencer Application',
  InstructorApplication: 'Instructor Application',
  FrontAdminApplication: 'Front Desk Application',
};

// Per-program branding for welcome emails (mirrors owner-notification look)
const PROGRAM_THEMES = {
  FranchiseInquiry: {
    headingTitle: 'Welcome to Pilates in Pink \u2122',
    bgGradient: 'linear-gradient(180deg, #f1889b 0%, #f7b1bd 30%, #fbe0e2 60%, #fbe0e2 100%)',
    accent: '#b67651',
    softBg: '#fbe0e2',
    borderColor: '#f7b1bd',
  },
  InfluencerApplication: {
    headingTitle: 'Welcome to the Pilates in Pink \u2122 Influencer Program',
    bgGradient: 'linear-gradient(180deg, #f1889b 0%, #f7b1bd 30%, #fce8ee 60%, #fce8ee 100%)',
    accent: '#f1889b',
    softBg: '#fce8ee',
    borderColor: '#f7b1bd',
  },
  InstructorApplication: {
    headingTitle: 'Welcome to the Pilates in Pink \u2122 Instructor Team',
    bgGradient: 'linear-gradient(180deg, #c4896b 0%, #d4a088 30%, #f6eee7 60%, #f6eee7 100%)',
    accent: '#c4896b',
    softBg: '#f6eee7',
    borderColor: '#d4a088',
  },
  FrontAdminApplication: {
    headingTitle: 'Welcome to the Pilates in Pink \u2122 Front Desk Team',
    bgGradient: 'linear-gradient(180deg, #d4a088 0%, #e0b59c 30%, #faf3ec 60%, #faf3ec 100%)',
    accent: '#d4a088',
    softBg: '#faf3ec',
    borderColor: '#e0b59c',
  },
};

// Obfuscated 4-digit display number — see /src/lib/appNumberDisplay.js
const DISPLAY_CFG = {
  FranchiseInquiry:      { base: 4720, stride: 17 },
  InfluencerApplication: { base: 2380, stride: 23 },
  InstructorApplication: { base: 6150, stride: 19 },
  FrontAdminApplication: { base: 3840, stride: 29 },
};
function formatAppNumber(n, type) {
  if (!n && n !== 0) return '';
  const cfg = DISPLAY_CFG[type];
  return cfg ? String(cfg.base + Number(n) * cfg.stride) : String(n);
}

function ticketName(t) {
  if (t?.full_name) return t.full_name;
  const fn = t?.first_name || '';
  const ln = t?.last_name || '';
  return `${fn} ${ln}`.trim() || 'there';
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

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png';

// Franchise welcome — matches the "discovery call is confirmed" branded shell
function buildFranchiseWelcomeHtml({ firstName, appNumber }) {
  const BRAND_PINK = '#f1889b';
  const BRAND_ROSE = '#b67651';
  const safeFirst = escapeHtml(firstName);
  const safeApp = escapeHtml(appNumber);
  const inner = `
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:${BRAND_ROSE};line-height:1.2;">Welcome to <em style="color:${BRAND_PINK};">Pilates in Pink&trade;</em></h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#5a3a28;">Hi ${safeFirst}, thank you for your interest in becoming a Pilates in Pink&trade; franchise partner. We're so excited to connect with you.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5a3a28;">We've received your inquiry and a member of our Franchise Team will be in touch personally within 1-2 business days to discuss the next steps.</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#5a3a28;">In the meantime, feel free to reply to this email with any questions &mdash; we read every message.</p>
    <p style="margin:24px 0 0;font-size:15px;color:${BRAND_ROSE};font-style:italic;">With warmth,<br/>The Pilates in Pink&trade; Franchise Team</p>
    ${safeApp ? `<p style="margin-top:24px;font-size:11px;color:#a08778;text-align:center;">Reference: Application #${safeApp}</p>` : ''}
  `;
  const preheader = `Thank you for your interest in becoming a Pilates in Pink franchise partner.`;
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
        <tr><td style="padding:24px 40px 40px;">${inner}</td></tr>
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

function buildWelcomeHtml({ clientName, programLabel, appNumber, theme }) {
  const safeName = escapeHtml(clientName);
  const safeProgram = escapeHtml(programLabel);
  const safeApp = escapeHtml(appNumber);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${theme.bgGradient}; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink" style="width: 80px; height: 80px; margin-bottom: 15px;" />
      </div>
      <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: ${theme.accent}; margin-top: 0; font-size: 24px; font-weight: 300;">${theme.headingTitle}${safeApp ? ` &middot; #${safeApp}` : ''}</h2>
        <div style="margin: 20px 0; padding: 18px 20px; background: ${theme.softBg}; border-radius: 10px;">
          <p style="margin: 0 0 12px 0; color: #4a3a30; line-height: 1.6; font-size: 15px;">Hi ${safeName},</p>
          <p style="margin: 0 0 12px 0; color: #4a3a30; line-height: 1.6; font-size: 15px;">Thank you for submitting your ${safeProgram} to <strong style="color:${theme.accent};">Pilates in Pink&trade;</strong>. We&rsquo;ve received it and a member of our team will be in touch personally within 1-2 business days.</p>
          <p style="margin: 0 0 12px 0; color: #4a3a30; line-height: 1.6; font-size: 15px;">In the meantime, feel free to reply to this email with any questions &mdash; we read every message.</p>
          <p style="margin: 0; color: ${theme.accent}; font-style: italic; font-size: 15px;">Pretty. Powerful. Pilates.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid ${theme.borderColor};">
          <p style="color: ${theme.accent}; margin: 0; font-size: 12px;">${safeApp ? `Reference: Application #${safeApp} &middot; ` : ''}&copy; ${new Date().getFullYear()} Pilates in Pink&trade;</p>
        </div>
      </div>
    </div>
  `;
}

async function ensureAppNumber(base44, ticket_type, ticket_id, ticket) {
  if (ticket?.app_number) return ticket.app_number;
  // Race-safe: re-fetch in case automation already assigned it
  const fresh = await base44.asServiceRole.entities[ticket_type].get(ticket_id);
  if (fresh?.app_number) return fresh.app_number;
  // Assign now
  const recent = await base44.asServiceRole.entities[ticket_type].list('-app_number', 1);
  const nextNumber = (recent?.[0]?.app_number || 0) + 1;
  await base44.asServiceRole.entities[ticket_type].update(ticket_id, { app_number: nextNumber });
  return nextNumber;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    // Supports entity automation payload: { event: { entity_id, entity_name }, data }
    const ticket_id = body?.ticket_id || body?.event?.entity_id;
    const ticket_type = body?.ticket_type || body?.event?.entity_name;

    // Auth: this endpoint accepts ONLY two callers —
    //   1) The entity automation, which passes a shared secret in the body
    //      (configured via the WELCOME_EMAIL_AUTOMATION_SECRET env var and the
    //      automation's function_args).
    //   2) A signed-in admin user (for manual re-sends / testing).
    // Unauthenticated public callers are rejected so a leaked ticket id can't
    // be used to flood applicants with welcome emails.
    const expectedSecret = Deno.env.get('WELCOME_EMAIL_AUTOMATION_SECRET') || '';
    const providedSecret = body?.automation_secret || '';
    const isAutomation = !!expectedSecret && providedSecret === expectedSecret;

    if (!isAutomation) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (!ticket_id || !ticket_type) {
      return Response.json({ error: 'Missing ticket_id or ticket_type' }, { status: 400 });
    }
    if (!FROM_ALIASES[ticket_type]) {
      return Response.json({ skipped: true, reason: 'unsupported entity' });
    }

    const ticket = body?.data || await base44.asServiceRole.entities[ticket_type].get(ticket_id);
    if (!ticket?.email || !isValidEmail(ticket.email)) {
      return Response.json({ skipped: true, reason: 'no valid email' });
    }

    // Idempotency — skip if a welcome already exists for this ticket
    const existingWelcome = await base44.asServiceRole.entities.EmailMessage.filter(
      { ticket_id, ticket_type, is_welcome: true },
      '-created_date',
      1
    );
    if (existingWelcome.length > 0) {
      return Response.json({ skipped: true, reason: 'already sent' });
    }

    const clientName = ticketName(ticket);
    const programLabel = PROGRAM_LABELS[ticket_type];
    const theme = PROGRAM_THEMES[ticket_type];
    const appNumber = await ensureAppNumber(base44, ticket_type, ticket_id, ticket);
    const displayNumber = formatAppNumber(appNumber, ticket_type);
    const bodyHtml = ticket_type === 'FranchiseInquiry'
      ? buildFranchiseWelcomeHtml({ firstName: ticket?.first_name || clientName.split(' ')[0] || 'there', appNumber: displayNumber })
      : buildWelcomeHtml({ clientName, programLabel, appNumber: displayNumber, theme });
    const bodyText = htmlToText(bodyHtml);
    const subject = `[Application #${displayNumber}] Welcome to Pilates in Pink \u2122`;
    const fromEmail = FROM_ALIASES[ticket_type];
    const replyToEmail = REPLY_TO_ALIASES[ticket_type] || fromEmail;
    const fromHeader = `${rfc2047('Pilates in Pink \u2122')} <${fromEmail}>`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const headers = [
      `From: ${fromHeader}`,
      `To: ${ticket.email}`,
      `Reply-To: ${replyToEmail}`,
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

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      }
    );

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('Welcome send failed:', errText);
      await base44.asServiceRole.entities.EmailMessage.create({
        ticket_id, ticket_type, direction: 'outbound',
        from_email: fromEmail, from_name: 'Pilates in Pink \u2122',
        to_email: ticket.email, subject, body_html: bodyHtml, body_text: bodyText,
        sent_by: 'system', sent_at: new Date().toISOString(),
        is_welcome: true, send_status: 'failed', send_error: errText.slice(0, 1000),
      });
      return Response.json({ error: 'Gmail send failed' }, { status: 502 });
    }

    const result = await sendRes.json();
    let rfcMessageId = '';
    try {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${result.id}?format=metadata&metadataHeaders=Message-ID`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const hdr = (meta.payload?.headers || []).find((h) => h.name.toLowerCase() === 'message-id');
        rfcMessageId = hdr?.value || '';
      }
    } catch (_) {}

    await base44.asServiceRole.entities.EmailMessage.create({
      ticket_id, ticket_type,
      gmail_thread_id: result.threadId,
      gmail_message_id: result.id,
      rfc_message_id: rfcMessageId,
      direction: 'outbound',
      from_email: fromEmail, from_name: 'Pilates in Pink \u2122',
      to_email: ticket.email, subject, body_html: bodyHtml, body_text: bodyText,
      sent_by: 'system', sent_at: new Date().toISOString(),
      is_welcome: true, send_status: 'sent',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendWelcomeEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});