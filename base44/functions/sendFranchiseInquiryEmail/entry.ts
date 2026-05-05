// Sends two branded emails after a franchise discovery call is booked:
//   1) A confirmation to the submitter
//   2) A notification to the three owners (sahil, rashmeen, gurpreen)
// Uses Resend.
// Payload: { inquiryData: {...}, scheduledTime: "Friendly string", scheduledISO?: "ISO" }

const OWNER_EMAILS = [
  'sahil@pilatesinpinkstudio.com',
  'rashmeen@pilatesinpinkstudio.com',
  'gurpreen@pilatesinpinkstudio.com',
];

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

function submitterEmail(inquiry, scheduledTime) {
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
  `;
  return brandedShell(inner, `Your Pilates in Pink discovery call is confirmed for ${scheduledTime}`);
}

function ownerEmail(inquiry, scheduledTime) {
  const fullName = `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim() || 'New applicant';
  const row = (label, value) => value
    ? `<tr><td style="padding:8px 0;font-size:12px;letter-spacing:1.5px;color:${BRAND_ROSE};font-weight:600;width:160px;vertical-align:top;">${label}</td><td style="padding:8px 0;font-size:14px;color:#5a3a28;">${value}</td></tr>`
    : '';

  const inner = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:${BRAND_ROSE};">New franchise inquiry &middot; <em style="color:${BRAND_PINK};">call booked</em></h1>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(90,58,40,0.7);">A new applicant has scheduled a discovery call.</p>

    <div style="background:#fbe0e2;border-radius:16px;padding:18px;margin:0 0 24px;">
      <div style="font-size:11px;letter-spacing:2px;color:${BRAND_ROSE};font-weight:600;margin-bottom:6px;">SCHEDULED CALL</div>
      <div style="font-size:17px;color:${BRAND_ROSE};font-weight:500;">${scheduledTime}</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
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
  return brandedShell(inner, `New franchise inquiry from ${fullName} — ${scheduledTime}`);
}

async function sendViaResend({ to, subject, html }) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pilates in Pink™ <noreply@pilatesinpink.ca>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) console.error('Resend error', resp.status, data);
  return { ok: resp.ok, data };
}

Deno.serve(async (req) => {
  try {
    const { inquiryData = {}, scheduledTime = '' } = await req.json();
    const fullName = `${inquiryData.first_name || ''} ${inquiryData.last_name || ''}`.trim() || 'Applicant';

    const tasks = [];

    if (inquiryData.email) {
      tasks.push(sendViaResend({
        to: inquiryData.email,
        subject: `Your discovery call is confirmed — Pilates in Pink™`,
        html: submitterEmail(inquiryData, scheduledTime),
      }));
    }

    tasks.push(sendViaResend({
      to: OWNER_EMAILS,
      subject: `New franchise inquiry: ${fullName} — ${scheduledTime}`,
      html: ownerEmail(inquiryData, scheduledTime),
    }));

    const results = await Promise.all(tasks);
    const allOk = results.every((r) => r.ok);
    return Response.json({ success: allOk, results });
  } catch (error) {
    console.error('sendFranchiseInquiryEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});