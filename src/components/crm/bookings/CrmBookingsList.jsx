import React, { useMemo, useState } from "react";
import BookingStatusFilter from "./BookingStatusFilter";
import BookingLinkFilter from "./BookingLinkFilter";
import BookingCard from "./BookingCard";
import BookingDetail from "./BookingDetail";
import BookingActionSheet from "./BookingActionSheet";
import CalTabBar from "./CalTabBar";
import { groupByMonth, matchesStatus, statusCounts } from "./bookingUtils";
import { CRM } from "../crmTheme";

// The Cal.com-style tab bar is parked for now (only Bookings exists). Flip to
// true to bring it back once Links / Availability views are built.
const SHOW_CAL_TAB_BAR = false;

// Cal.com-style bookings list: filters → month sections → cards → detail.
export default function CrmBookingsList({ bookings, ticketByEmail, isLoading, onOpenLead }) {
  const [status, setStatus] = useState("upcoming");
  const [eventTypeId, setEventTypeId] = useState("");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // { action, booking }

  const leadFor = (b) => {
    const email = (b.emails || []).find((e) => ticketByEmail[e]);
    return email ? ticketByEmail[email] : null;
  };

  const groups = useMemo(() => {
    const list = bookings
      .filter((b) => matchesStatus(b, status))
      .filter((b) => !eventTypeId || String(b.eventTypeId) === String(eventTypeId))
      .sort((a, b) => (status === "past" || status === "cancelled" ? new Date(b.start) - new Date(a.start) : new Date(a.start) - new Date(b.start)));
    return groupByMonth(list);
  }, [bookings, status, eventTypeId]);

  const counts = useMemo(() => statusCounts(bookings), [bookings]);

  // Keep the detail view in sync when the list refreshes after an action.
  const current = selected ? bookings.find((b) => (b.uid || b.bookingId) === (selected.uid || selected.bookingId)) || selected : null;

  return (
    <div className="max-w-2xl mx-auto -mx-5 lg:mx-auto lg:-mt-2">
      {current ? (
        <div className="px-4">
          <BookingDetail
            booking={current}
            lead={leadFor(current)}
            onBack={() => setSelected(null)}
            onAction={(a) => setAction({ action: a, booking: current })}
            onOpenLead={onOpenLead}
          />
        </div>
      ) : (
        <div className="pip-view-in pb-32">
          <div className="flex items-center justify-end gap-2 px-4 mb-3">
            <BookingLinkFilter value={eventTypeId} onChange={setEventTypeId} />
            <BookingStatusFilter value={status} onChange={setStatus} counts={counts} />
          </div>
          <h1 className="px-5 mb-3 text-[32px] font-bold tracking-tight" style={{ color: CRM.ink }}>Bookings</h1>

          {isLoading ? (
            <p className="px-5 py-10 text-center text-[14px]" style={{ color: CRM.sub }}>Loading bookings…</p>
          ) : groups.length === 0 ? (
            <p className="px-5 py-14 text-center text-[15px]" style={{ color: CRM.sub }}>No {status} bookings.</p>
          ) : (
            groups.map((g) => (
              <section key={g.key}>
                <div className="px-4 py-2.5 text-[15px] font-semibold" style={{ background: "rgba(182,118,81,0.10)", color: CRM.ink }}>{g.label}</div>
                {g.items.map((b) => (
                  <BookingCard
                    key={b.uid || b.bookingId || b.start}
                    booking={b}
                    onOpen={() => setSelected(b)}
                    onAction={(a) => setAction({ action: a, booking: b })}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      )}

      {SHOW_CAL_TAB_BAR && <CalTabBar />}

      {action && (
        <BookingActionSheet action={action.action} booking={action.booking} onClose={() => setAction(null)} />
      )}
    </div>
  );
}