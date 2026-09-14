import { format, isSameMonth, addMonths } from "date-fns";

// Franchise sub-types — kept in sync with getCalAvailability's whitelist.
export const FRANCHISE_EVENT_TYPE_IDS = ["5595622", "6052661"];

export const fmtTime = (iso) => format(new Date(iso), "h:mm a");
export const fmtRange = (b) => `${fmtTime(b.start)}${b.end ? ` - ${fmtTime(b.end)}` : ""}`;
export const fmtDayShort = (iso) => format(new Date(iso), "EEE, d MMM");
export const fmtDayLong = (iso) => format(new Date(iso), "EEEE, MMM d, yyyy");

export const joinUrl = (b) => {
  const u = b?.meetingUrl;
  return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
};

export const joinLabel = (url) => {
  if (!url) return "Join meeting";
  if (/meet\.google/i.test(url)) return "Join Google Meet";
  if (/zoom\.us/i.test(url)) return "Join Zoom";
  if (/cal\.com\/video/i.test(url)) return "Join Cal Video";
  return "Join meeting";
};

export const isCancelled = (b) => String(b?.status || "").toLowerCase() === "cancelled";
export const isPending = (b) => String(b?.status || "").toLowerCase() === "pending";
export const isPast = (b) => (b?.end ? new Date(b.end) : new Date(b.start)) < new Date();

export const durationMin = (b) =>
  b?.duration || (b?.start && b?.end ? Math.round((new Date(b.end) - new Date(b.start)) / 60000) : null);

export const attendeeNames = (b) =>
  (b?.attendees || []).map((a) => a.name || a.email).filter(Boolean);

// Group bookings by month with Cal.com-style section labels.
export function groupByMonth(list) {
  const now = new Date();
  const groups = [];
  list.forEach((b) => {
    const d = new Date(b.start);
    const key = format(d, "yyyy-MM");
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const label = isSameMonth(d, now)
        ? "This month"
        : isSameMonth(d, addMonths(now, 1))
        ? "Next month"
        : format(d, "MMMM yyyy");
      g = { key, label, items: [] };
      groups.push(g);
    }
    g.items.push(b);
  });
  return groups;
}

export const STATUS_FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "unconfirmed", label: "Unconfirmed" },
  { key: "recurring", label: "Recurring" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

export function matchesStatus(b, key) {
  switch (key) {
    case "upcoming": return !isCancelled(b) && !isPast(b);
    case "unconfirmed": return isPending(b) && !isCancelled(b);
    case "recurring": return !!b.recurring && !isCancelled(b);
    case "past": return !isCancelled(b) && isPast(b);
    case "cancelled": return isCancelled(b);
    default: return true;
  }
}