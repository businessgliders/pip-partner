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

export function buildWelcomeHtml({ clientName, programLabel, appNumber, ticketShortId, ticketType }) {
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