// Renders the same welcome HTML used by sendWelcomeEmail — used for the
// synthetic in-thread welcome bubble preview.
// Keep visual parity with functions/sendWelcomeEmail.js buildWelcomeHtml.

const PROGRAM_THEMES = {
  FranchiseInquiry: {
    headingTitle: "Welcome to Pilates in Pink \u2122",
    bgGradient: "linear-gradient(180deg, #f1889b 0%, #f7b1bd 30%, #fbe0e2 60%, #fbe0e2 100%)",
    accent: "#b67651",
    softBg: "#fbe0e2",
    borderColor: "#f7b1bd",
  },
  InfluencerApplication: {
    headingTitle: "Welcome to the Pilates in Pink \u2122 Influencer Program",
    bgGradient: "linear-gradient(180deg, #f1889b 0%, #f7b1bd 30%, #fce8ee 60%, #fce8ee 100%)",
    accent: "#f1889b",
    softBg: "#fce8ee",
    borderColor: "#f7b1bd",
  },
  InstructorApplication: {
    headingTitle: "Welcome to the Pilates in Pink \u2122 Instructor Team",
    bgGradient: "linear-gradient(180deg, #c4896b 0%, #d4a088 30%, #f6eee7 60%, #f6eee7 100%)",
    accent: "#c4896b",
    softBg: "#f6eee7",
    borderColor: "#d4a088",
  },
  FrontAdminApplication: {
    headingTitle: "Welcome to the Pilates in Pink \u2122 Front Desk Team",
    bgGradient: "linear-gradient(180deg, #d4a088 0%, #e0b59c 30%, #faf3ec 60%, #faf3ec 100%)",
    accent: "#d4a088",
    softBg: "#faf3ec",
    borderColor: "#e0b59c",
  },
};

function buildFranchiseWelcomeHtml({ clientName, appNumber }) {
  const BRAND_PINK = "#f1889b";
  const BRAND_ROSE = "#b67651";
  const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png";
  const firstName = (clientName || "there").split(" ")[0];
  const inner = `
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:${BRAND_ROSE};line-height:1.2;">Welcome to <em style="color:${BRAND_PINK};">Pilates in Pink&trade;</em></h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#5a3a28;">Hi ${firstName}, thank you for your interest in becoming a Pilates in Pink&trade; franchise partner. We're so excited to connect with you.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5a3a28;">We've received your inquiry and a member of our Franchise Team will be in touch personally within 1-2 business days to discuss the next steps.</p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#5a3a28;">In the meantime, feel free to reply to this email with any questions &mdash; we read every message.</p>
    <p style="margin:24px 0 0;font-size:15px;color:${BRAND_ROSE};font-style:italic;">With warmth,<br/>The Pilates in Pink&trade; Franchise Team</p>
    ${appNumber ? `<p style="margin-top:24px;font-size:11px;color:#a08778;text-align:center;">Reference: Application #${appNumber}</p>` : ""}
  `;
  return `
    <div style="margin:0;padding:0;background:#fbe0e2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#5a3a28;">
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
    </div>
  `;
}

export function buildWelcomeHtml({ clientName, programLabel, appNumber, ticketShortId, ticketType }) {
  if (ticketType === "FranchiseInquiry") {
    return buildFranchiseWelcomeHtml({ clientName, appNumber });
  }
  const theme = PROGRAM_THEMES[ticketType] || PROGRAM_THEMES.FranchiseInquiry;
  const ref = appNumber ? `Application #${appNumber}` : `Application #${ticketShortId || ""}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${theme.bgGradient}; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink" style="width: 80px; height: 80px; margin-bottom: 15px;" />
      </div>
      <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: ${theme.accent}; margin-top: 0; font-size: 24px; font-weight: 300;">${theme.headingTitle}${appNumber ? ` &middot; #${appNumber}` : ""}</h2>
        <div style="margin: 20px 0; padding: 18px 20px; background: ${theme.softBg}; border-radius: 10px;">
          <p style="margin: 0 0 12px 0; color: #4a3a30; line-height: 1.6; font-size: 15px;">Hi ${clientName},</p>
          <p style="margin: 0 0 12px 0; color: #4a3a30; line-height: 1.6; font-size: 15px;">Thank you for submitting your ${programLabel} to <strong style="color:${theme.accent};">Pilates in Pink&trade;</strong>. We&rsquo;ve received it and a member of our team will be in touch personally within 1-2 business days.</p>
          <p style="margin: 0 0 12px 0; color: #4a3a30; line-height: 1.6; font-size: 15px;">In the meantime, feel free to reply to this email with any questions &mdash; we read every message.</p>
          <p style="margin: 0; color: ${theme.accent}; font-style: italic; font-size: 15px;">Pretty. Powerful. Pilates.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid ${theme.borderColor};">
          <p style="color: ${theme.accent}; margin: 0; font-size: 12px;">Reference: ${ref} &middot; &copy; ${new Date().getFullYear()} Pilates in Pink&trade;</p>
        </div>
      </div>
    </div>
  `;
}