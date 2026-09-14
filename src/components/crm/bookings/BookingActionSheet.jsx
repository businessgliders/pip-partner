import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import RescheduleFlow from "./RescheduleFlow";
import AddGuestsFlow from "./AddGuestsFlow";
import { fmtDayShort, fmtRange } from "./bookingUtils";
import { CRM } from "../crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

const TITLES = { reschedule: "Reschedule Booking", guests: "Add Guests", cancel: "Cancel Event" };

// iOS-style bottom sheet hosting the reschedule / add-guests / cancel flows.
// All three call manageCalBooking and refresh the bookings list on success.
export default function BookingActionSheet({ action, booking, onClose }) {
  const qc = useQueryClient();
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  useLockBodyScroll(true);
  const uid = booking.uid || booking.bookingId;

  const mut = useMutation({
    mutationFn: async (payload) => (await base44.functions.invoke("manageCalBooking", { uid, ...payload }))?.data,
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ["crm-bookings-all"] });
      qc.invalidateQueries({ queryKey: ["cal-booking-details", uid] });
      setDone({
        reschedule: "Booking rescheduled — attendees will be notified by Cal.com.",
        addGuests: "Guests added — Cal.com has sent them the invite.",
        cancel: "Booking cancelled — attendees will be notified by Cal.com.",
      }[payload.action]);
    },
    onError: (e) => setError(e?.response?.data?.error || e.message || "Something went wrong"),
  });

  return (
    <div className="fixed inset-0 z-[80] crm-root flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 pip-fade-in" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6 pip-sheet-up"
        style={{ background: "var(--crm-page-bg)", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full mb-3 sm:hidden" style={{ background: "rgba(182,118,81,0.25)" }} />
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-[20px] font-bold" style={{ color: CRM.ink }}>{TITLES[action]}</h3>
            <p className="text-[13px] truncate" style={{ color: CRM.sub }}>{booking.title} · {fmtDayShort(booking.start)}, {fmtRange(booking)}</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--crm-card-bg)", color: CRM.ink }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "var(--crm-card-bg)" }}>
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#2e9e5b" }} />
            <p className="text-[15px]" style={{ color: CRM.ink }}>{done}</p>
          </div>
        ) : action === "reschedule" ? (
          <RescheduleFlow booking={booking} pending={mut.isPending} error={error} onConfirm={(start) => mut.mutate({ action: "reschedule", start })} />
        ) : action === "guests" ? (
          <AddGuestsFlow booking={booking} pending={mut.isPending} error={error} onConfirm={(guests) => mut.mutate({ action: "addGuests", guests })} />
        ) : (
          <div>
            <p className="text-[15px]" style={{ color: CRM.ink }}>Cancel this event? The attendee will be notified by Cal.com and the slot will reopen.</p>
            {error && <p className="mt-3 text-[13px]" style={{ color: "#e5484d" }}>{error}</p>}
            <button type="button" disabled={mut.isPending} onClick={() => mut.mutate({ action: "cancel" })} className="mt-5 w-full h-12 rounded-2xl text-[16px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "#e5484d" }}>
              {mut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Yes, cancel event
            </button>
            <button type="button" onClick={onClose} className="mt-2 w-full h-12 rounded-2xl text-[16px] font-semibold" style={{ background: "var(--crm-card-bg)", color: CRM.ink }}>Keep booking</button>
          </div>
        )}
      </div>
    </div>
  );
}