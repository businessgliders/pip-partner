// Shared sort logic used by both InboxView (for auto-selecting the first
// visible thread on status change) and InboxThreadList (for rendering).
// Keeping these in one place ensures the "first item" highlighted by the
// auto-select effect matches the first item the user actually sees.

export function getDefaultSort(sourceKey, statusKey) {
  const showAppointment = sourceKey === "franchise";
  return showAppointment && statusKey && statusKey !== "new"
    ? "appointment"
    : "submission";
}

export function sortTickets(tickets, sortMode) {
  const arr = [...(tickets || [])];
  if (sortMode === "appointment") {
    const now = Date.now();
    return arr.sort((a, b) => {
      const aT = a._cal_booking?.start ? new Date(a._cal_booking.start).getTime() : null;
      const bT = b._cal_booking?.start ? new Date(b._cal_booking.start).getTime() : null;
      const aBucket = aT == null ? 2 : aT >= now ? 0 : 1;
      const bBucket = bT == null ? 2 : bT >= now ? 0 : 1;
      if (aBucket !== bBucket) return aBucket - bBucket;
      if (aBucket === 0) return aT - bT;       // upcoming: soonest first
      if (aBucket === 1) return bT - aT;       // past: most recent first
      return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
    });
  }
  return arr.sort(
    (a, b) =>
      new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
  );
}