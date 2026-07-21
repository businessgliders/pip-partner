// Shared helpers for email subject [Application #] tags.
// The tag always uses the PUBLIC display number (same obfuscation as
// /src/lib/appNumberDisplay.js and sendWelcomeEmail) so applicants see one
// consistent reference number across every email.

export const DISPLAY_CFG = {
  FranchiseInquiry:      { base: 4720, stride: 17 },
  InfluencerApplication: { base: 2380, stride: 23 },
  InstructorApplication: { base: 6150, stride: 19 },
  FrontAdminApplication: { base: 3840, stride: 29 },
};

export function displayAppNumber(rawNumber, ticketType) {
  if (!rawNumber && rawNumber !== 0) return '';
  const cfg = DISPLAY_CFG[ticketType];
  return cfg ? String(cfg.base + Number(rawNumber) * cfg.stride) : String(rawNumber);
}

// Invert a public display number back to the raw app_number (or null if it
// can't belong to this entity type).
export function rawFromDisplay(display, ticketType) {
  const cfg = DISPLAY_CFG[ticketType];
  if (!cfg) return null;
  const diff = Number(display) - cfg.base;
  if (!Number.isFinite(diff) || diff < 0 || diff % cfg.stride !== 0) return null;
  return diff / cfg.stride;
}

export function buildSubjectTag(ticket, ticketType) {
  const display = displayAppNumber(ticket?.app_number, ticketType);
  if (display) return `[Application #${display}]`;
  return `[Application #${(ticket?.id || '').slice(-8)}]`;
}

// Strip ALL leading "Re:" prefixes and [Application/Ticket/Internal ...] tags,
// repeatedly, so rebuilt subjects never stack duplicate tags or double "Re:".
export function cleanSubjectBase(subject) {
  let out = String(subject || '').trim();
  let prev;
  do {
    prev = out;
    out = out
      .replace(/^(Re:\s*)+/i, '')
      .replace(/^\[(Ticket|Application|Internal)[^\]]*\]\s*/i, '')
      .trim();
  } while (out !== prev);
  return out;
}