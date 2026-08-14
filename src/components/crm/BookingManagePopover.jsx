import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Info, CalendarClock, XCircle, ChevronLeft, Loader2, Video, CheckCircle2, CalendarPlus,
} from "lucide-react";

// Franchise sub-types — kept in sync with the backend whitelist in
// getCalAvailability / bookCalEvent.
const FRANCHISE_EVENT_TYPES = [
  { id: "5595622", label: "[Part 1] Discovery", slug: "/franchise" },
  { id: "6052661", label: "[Part 2] Prospectus", slug: "/franchise2" },
];

// Popover that wraps a Cal.com booking pill and offers view details,
// reschedule (via Cal.com API + availability for the right event type),
// cancel booking, and booking a new meeting. `boardKey` "franchise" lets
// staff pick between the /franchise and /franchise2 event types; everything
// else uses the hiring event type.
export default function BookingManagePopover({ meeting, boardKey = "hiring", lead = null, children }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu"); // menu | details | eventtype | reschedule | cancel | done
  const [flow, setFlow] = useState(null); // "book" | "reschedule"
  const [eventTypeId, setEventTypeId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doneMsg, setDoneMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const uid = meeting?.uid || meeting?.bookingId;
  const availBoardKey = boardKey === "franchise" ? "franchise" : "hiring";
  // No existing booking → the popover becomes a "book a meeting" flow.
  const bookMode = !uid;
  const isBooking = flow === "book";
  const canBookNew = !!lead?.email;

  const reset = () => {
    setView("menu");
    setFlow(null);
    setEventTypeId(null);
    setSelectedDay(null);
    setSelectedSlot(null);
    setDoneMsg("");
    setErrorMsg("");
  };

  // Booking a new meeting: franchise picks an event type first, hiring goes
  // straight to the slot picker.
  const startBookFlow = () => {
    setFlow("book");
    setSelectedDay(null);
    setSelectedSlot(null);
    if (availBoardKey === "franchise") {
      setView("eventtype");
    } else {
      setView("reschedule");
    }
  };

  const startRescheduleFlow = () => {
    setFlow("reschedule");
    setEventTypeId(null);
    setSelectedDay(null);
    setSelectedSlot(null);
    setView("reschedule");
  };

  // Booking details — fetched when the details view opens
  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ["cal-booking-details", uid],
    queryFn: async () => {
      const resp = await base44.functions.invoke("manageCalBooking", { action: "details", uid });
      return resp?.data?.booking || null;
    },
    enabled: open && view === "details" && !!uid,
    staleTime: 60000,
  });

  // Availability — fetched when the slot picker opens
  const { data: avail, isLoading: availLoading } = useQuery({
    queryKey: ["cal-availability", availBoardKey, eventTypeId || "default"],
    queryFn: async () => {
      const payload = { boardKey: availBoardKey };
      if (availBoardKey === "franchise" && eventTypeId) payload.eventTypeId = eventTypeId;
      const resp = await base44.functions.invoke("getCalAvailability", payload);
      return resp?.data?.slots || {};
    },
    enabled: open && view === "reschedule",
    staleTime: 60000,
  });

  const invalidateBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["crm-bookings-all"] });
    queryClient.invalidateQueries({ queryKey: ["cal-booking-details", uid] });
  };

  const rescheduleMut = useMutation({
    mutationFn: async (start) => {
      const resp = await base44.functions.invoke("manageCalBooking", { action: "reschedule", uid, start });
      return resp?.data;
    },
    onSuccess: () => {
      invalidateBookings();
      setDoneMsg("Booking rescheduled — attendees will be notified by Cal.com.");
      setView("done");
    },
    onError: (e) => setErrorMsg(e?.response?.data?.error || e.message || "Reschedule failed"),
  });

  const cancelMut = useMutation({
    mutationFn: async () => {
      const resp = await base44.functions.invoke("manageCalBooking", { action: "cancel", uid });
      return resp?.data;
    },
    onSuccess: () => {
      invalidateBookings();
      setDoneMsg("Booking cancelled — attendees will be notified by Cal.com.");
      setView("done");
    },
    onError: (e) => setErrorMsg(e?.response?.data?.error || e.message || "Cancel failed"),
  });

  const bookMut = useMutation({
    mutationFn: async (start) => {
      const resp = await base44.functions.invoke("bookCalEvent", {
        start,
        boardKey: availBoardKey,
        name: lead?.name || lead?.email,
        email: lead?.email,
        ...(availBoardKey === "franchise" && eventTypeId ? { eventTypeId } : {}),
      });
      return resp?.data;
    },
    onSuccess: () => {
      invalidateBookings();
      setDoneMsg("Meeting booked — Cal.com has sent the invite.");
      setView("done");
    },
    onError: (e) => setErrorMsg(e?.response?.data?.error || e.message || "Booking failed"),
  });

  if (bookMode && !lead?.email) return children;

  const days = Object.keys(avail || {}).filter((d) => (avail[d] || []).length > 0).slice(0, 14);
  const slots = selectedDay ? avail?.[selectedDay] || [] : [];

  const menuItem = (icon, label, onClick, danger = false) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md text-left hover:bg-slate-100 ${danger ? "text-red-600" : "text-slate-700"}`}
    >
      {icon}
      {label}
    </button>
  );

  const backBtn = (
    <button
      type="button"
      onClick={reset}
      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 mb-2"
    >
      <ChevronLeft className="w-3 h-3" /> Back
    </button>
  );

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2 crm-root z-[70]" onClick={(e) => e.stopPropagation()}>
        {view === "menu" && (
          <>
            <div className="px-2.5 pb-1.5 pt-0.5">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {bookMode ? "No meeting booked" : (meeting?.title || "Cal.com booking")}
              </div>
              {bookMode ? (
                <div className="text-[11px] text-slate-500 truncate">{lead?.email}</div>
              ) : meeting?.start && (
                <div className="text-[11px] text-slate-500">
                  {format(new Date(meeting.start), "EEE, MMM d · h:mma").toLowerCase()}
                </div>
              )}
            </div>
            {bookMode ? (
              <>
                {menuItem(<CalendarPlus className="w-3.5 h-3.5 text-emerald-700" />, "Book a meeting", startBookFlow)}
                <a
                  href="https://app.cal.com/bookings/upcoming"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md text-slate-700 hover:bg-slate-100"
                >
                  <Info className="w-3.5 h-3.5 text-blue-600" /> Open Cal.com
                </a>
              </>
            ) : (
              <>
                {menuItem(<Info className="w-3.5 h-3.5 text-blue-600" />, "View details", () => setView("details"))}
                {menuItem(<CalendarClock className="w-3.5 h-3.5 text-emerald-700" />, "Reschedule booking", startRescheduleFlow)}
                {menuItem(<XCircle className="w-3.5 h-3.5 text-red-600" />, "Cancel booking", () => setView("cancel"), true)}
                {canBookNew && menuItem(<CalendarPlus className="w-3.5 h-3.5 text-emerald-700" />, "Book new meeting", startBookFlow)}
              </>
            )}
          </>
        )}

        {view === "eventtype" && (
          <div className="px-1">
            {backBtn}
            <div className="px-2 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Meeting type</div>
            {FRANCHISE_EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setEventTypeId(t.id); setView("reschedule"); }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-md text-left text-slate-700 hover:bg-slate-100"
              >
                <span>{t.label}</span>
                <span className="text-[10px] text-slate-400">{t.slug}</span>
              </button>
            ))}
          </div>
        )}

        {view === "details" && (
          <div className="px-1">
            {backBtn}
            {detailsLoading ? (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading details…
              </div>
            ) : details ? (
              <div className="space-y-1.5 px-2 pb-1 text-[12px] text-slate-700">
                <div className="font-semibold text-slate-900">{details.title || "Booking"}</div>
                {details.start && (
                  <div>
                    {format(new Date(details.start), "EEEE, MMM d, yyyy")}<br />
                    {format(new Date(details.start), "h:mma").toLowerCase()}
                    {details.end ? ` – ${format(new Date(details.end), "h:mma").toLowerCase()}` : ""}
                  </div>
                )}
                {details.status && (
                  <div className="text-[11px] text-slate-500">Status: {String(details.status).toLowerCase()}</div>
                )}
                {Array.isArray(details.attendees) && details.attendees.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    Attendees: {details.attendees.map((a) => a?.name || a?.email).filter(Boolean).join(", ")}
                  </div>
                )}
                {Array.isArray(details.guests) && details.guests.length > 0 && (
                  <div className="text-[11px] text-slate-500">Guests: {details.guests.join(", ")}</div>
                )}
                {(details.meetingUrl || (typeof details.location === "string" && /^https?:\/\//i.test(details.location))) && (
                  <a
                    href={details.meetingUrl || details.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 underline"
                  >
                    <Video className="w-3 h-3" /> Join meeting
                  </a>
                )}
              </div>
            ) : (
              <div className="px-2 py-2 text-xs text-slate-500">Couldn't load booking details.</div>
            )}
          </div>
        )}

        {view === "reschedule" && (
          <div className="px-1">
            {backBtn}
            {availLoading ? (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading availability…
              </div>
            ) : !selectedDay ? (
              <div className="max-h-56 overflow-y-auto">
                <div className="px-2 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pick a day</div>
                {days.length === 0 && (
                  <div className="px-2 py-2 text-xs text-slate-500">No available slots in the next 30 days.</div>
                )}
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 rounded-md hover:bg-slate-100"
                  >
                    {format(new Date(`${d}T12:00:00`), "EEE, MMM d")}
                    <span className="text-slate-400 ml-1">({(avail[d] || []).length} slots)</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => { setSelectedDay(null); setSelectedSlot(null); }}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 mb-1 px-2"
                >
                  <ChevronLeft className="w-3 h-3" /> {format(new Date(`${selectedDay}T12:00:00`), "EEE, MMM d")}
                </button>
                <div className="max-h-44 overflow-y-auto grid grid-cols-3 gap-1 px-1">
                  {slots.map((s) => {
                    const iso = s?.start || s;
                    const active = selectedSlot === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelectedSlot(iso)}
                        className={`px-1.5 py-1 text-[11px] rounded-md border ${
                          active
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {format(new Date(iso), "h:mma").toLowerCase()}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={!selectedSlot || rescheduleMut.isPending || bookMut.isPending}
                  onClick={() => selectedSlot && ((bookMode || isBooking) ? bookMut : rescheduleMut).mutate(selectedSlot)}
                  className="w-full mt-2 h-8 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {(rescheduleMut.isPending || bookMut.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {(bookMode || isBooking) ? "Confirm booking" : "Confirm reschedule"}
                </button>
              </div>
            )}
            {errorMsg && <div className="px-2 pt-1.5 text-[11px] text-red-600">{errorMsg}</div>}
          </div>
        )}

        {view === "cancel" && (
          <div className="px-1">
            {backBtn}
            <div className="px-2 pb-2 text-xs text-slate-700">
              Cancel this booking? The attendee will be notified by Cal.com.
            </div>
            <button
              type="button"
              disabled={cancelMut.isPending}
              onClick={() => cancelMut.mutate()}
              className="w-full h-8 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {cancelMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Yes, cancel booking
            </button>
            {errorMsg && <div className="px-2 pt-1.5 text-[11px] text-red-600">{errorMsg}</div>}
          </div>
        )}

        {view === "done" && (
          <div className="flex items-start gap-2 px-2.5 py-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            {doneMsg}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}