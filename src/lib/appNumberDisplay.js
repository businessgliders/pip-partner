// Obfuscated 4-digit display number for application records.
// We keep the raw sequential `app_number` in the DB (1, 2, 3...) for ordering,
// but transform it for display so the actual count isn't revealed.
// Formula: display = base + (n * stride). Each program has its own base/stride
// so the displayed numbers always increase but jump in non-obvious increments.

const PROGRAM_CONFIG = {
  FranchiseInquiry:      { base: 4720, stride: 17 },
  InfluencerApplication: { base: 2380, stride: 23 },
  InstructorApplication: { base: 6150, stride: 19 },
  FrontAdminApplication: { base: 3840, stride: 29 },
};

// Board-key aliases (used by frontend code that uses tabKey/boardKey)
const KEY_ALIASES = {
  franchise:  "FranchiseInquiry",
  influencer: "InfluencerApplication",
  instructor: "InstructorApplication",
  frontadmin: "FrontAdminApplication",
};

export function formatAppNumber(rawNumber, programKey) {
  if (!rawNumber && rawNumber !== 0) return "";
  const key = KEY_ALIASES[programKey] || programKey;
  const cfg = PROGRAM_CONFIG[key];
  if (!cfg) return String(rawNumber);
  return String(cfg.base + Number(rawNumber) * cfg.stride);
}

/**
 * Preferred display helper — always uses the stored `display_ticket_number`
 * when available so the UI matches what's in the database. Falls back to
 * computing from `app_number` only for legacy records that don't have one yet.
 */
export function displayAppNumber(ticket, programKey) {
  if (!ticket) return "";
  if (ticket.display_ticket_number || ticket.display_ticket_number === 0) {
    return String(ticket.display_ticket_number);
  }
  return formatAppNumber(ticket.app_number, programKey);
}