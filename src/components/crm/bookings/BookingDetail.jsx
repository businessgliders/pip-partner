import React, { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, Star, CheckCircle2, Copy, User, ChevronRight } from "lucide-react";
import BookingDetailMenu from "./BookingDetailMenu";
import { fmtDayLong, fmtRange, joinUrl, durationMin, isCancelled, isPending } from "./bookingUtils";
import { displayName } from "@/components/board/boardConfig";
import { CRM } from "../crmTheme";

const CARD = { background: "var(--crm-card-bg)", boxShadow: "0 1px 6px rgba(45,35,32,0.08)", border: CRM.cardBorder };

function CopyBtn({ text, onCopied }) {
  return (
    <button type="button" aria-label="Copy" onClick={() => { navigator.clipboard?.writeText(text); onCopied(); }} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: CRM.sub }}>
      <Copy className="w-4 h-4" />
    </button>
  );
}

// Full-screen meeting detail view (Cal.com iOS style).
export default function BookingDetail({ booking, lead, onBack, onAction, onOpenLead }) {
  const [toast, setToast] = useState("");
  const url = joinUrl(booking);
  const mins = durationMin(booking);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1600); };
  const organizer = booking.hosts?.[0];
  const attendees = booking.attendees || [];
  // Cal.com merges guests into the attendees list, so the same person can appear
  // in both. Keep the attendee row and drop the duplicate guest row.
  const seen = new Set(
    [organizer?.email, ...attendees.map((a) => a.email)]
      .filter(Boolean)
      .map((e) => String(e).toLowerCase())
  );
  const guests = (booking.guests || []).filter((g) => {
    const email = String(typeof g === "string" ? g : g?.email || "").toLowerCase();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
  const participantCount = (organizer ? 1 : 0) + attendees.length + guests.length;
  const primaryEmail = attendees[0]?.email || booking.emails?.[0];
  const pillStyle = { background: "var(--crm-blush)", color: CRM.ink };

  return (
    <div className="pip-view-in pb-32">
      <div className="flex items-center justify-between gap-2 mb-4">
        <button type="button" onClick={onBack} className="h-10 pl-2 pr-4 rounded-full inline-flex items-center gap-1 text-[13px] font-medium" style={{ background: "var(--crm-card-bg)", color: CRM.ink, boxShadow: "0 1px 6px rgba(45,35,32,0.10)", border: CRM.cardBorder }}>
          <ChevronLeft className="w-5 h-5" /> {format(new Date(booking.start), "MMMM")}
        </button>
        <div className="flex items-center gap-2">
          <BookingDetailMenu booking={booking} joinUrl={url} onAction={onAction} onCopied={() => flash("Meeting link copied")} />
          {url && !isCancelled(booking) && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="h-10 px-4 rounded-full inline-flex items-center text-[13px] font-semibold" style={{ background: CRM.ink, color: "var(--crm-page-bg)" }}>
              Join
            </a>
          )}
        </div>
      </div>

      <h1 className="text-[19px] font-bold leading-tight" style={{ color: CRM.ink }}>{booking.title || "Meeting"}</h1>
      <div className="mt-2 flex items-center flex-wrap gap-2 text-[12px]" style={{ color: CRM.sub }}>
        {booking.source && <span>{booking.source}</span>}
        {booking.source && mins && <span>•</span>}
        {mins && <span className="px-2.5 py-0.5 rounded-full font-medium" style={pillStyle}>{mins} min</span>}
        {isCancelled(booking) && <span className="px-2.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(229,72,77,0.12)", color: "#e5484d" }}>Cancelled</span>}
        {isPending(booking) && !isCancelled(booking) && <span className="px-2.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(241,136,155,0.16)", color: CRM.accent }}>Awaiting confirmation</span>}
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: CRM.ink }}>
        {fmtDayLong(booking.start)}<br />{fmtRange(booking)}
      </p>

      {isPending(booking) && !isCancelled(booking) && (
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={() => onAction("confirm")} className="flex-1 h-11 rounded-2xl inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white" style={{ background: "#2e9e5b" }}>
            <CheckCircle2 className="w-4 h-4" /> Confirm booking
          </button>
          <button type="button" onClick={() => onAction("decline")} className="h-11 px-4 rounded-2xl text-[14px] font-semibold" style={{ background: "var(--crm-card-bg)", color: "#e5484d", border: CRM.cardBorder }}>
            Decline
          </button>
        </div>
      )}

      {/* Participants */}
      <section className="mt-6 rounded-2xl overflow-hidden" style={CARD}>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(182,118,81,0.10)" }}>
          <h2 className="text-[14px] font-semibold" style={{ color: CRM.ink }}>Participants</h2>
          <span className="text-[12px]" style={{ color: CRM.sub }}>{participantCount}</span>
        </div>
        {organizer && (
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(182,118,81,0.08)" }}>
            <Star className="w-4 h-4 shrink-0" fill="#f5b400" style={{ color: "#f5b400" }} />
            <span className="flex-1 text-[13px] truncate" style={{ color: CRM.ink }}>{organizer.name || organizer.email} <span style={{ color: CRM.sub }}>(Organizer)</span></span>
            {organizer.email && <CopyBtn text={organizer.email} onCopied={() => flash("Email copied")} />}
          </div>
        )}
        {attendees.map((a) => (
          <div key={a.email} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(182,118,81,0.08)" }}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" fill="#2e9e5b" style={{ color: "#fff" }} />
            <span className="flex-1 text-[13px] truncate" style={{ color: CRM.ink }}>{a.name || a.email}</span>
            <CopyBtn text={a.email} onCopied={() => flash("Email copied")} />
          </div>
        ))}
        {guests.map((g) => (
          <div key={g} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(182,118,81,0.08)" }}>
            <User className="w-4 h-4 shrink-0" style={{ color: CRM.sub }} />
            <span className="flex-1 text-[13px] truncate" style={{ color: CRM.ink }}>{g} <span style={{ color: CRM.sub }}>(Guest)</span></span>
            <CopyBtn text={g} onCopied={() => flash("Email copied")} />
          </div>
        ))}
      </section>

      {/* Booking details */}
      <section className="mt-4 rounded-2xl overflow-hidden" style={CARD}>
        <p className="px-4 pt-4 text-[12px] font-semibold uppercase tracking-wide" style={{ color: CRM.sub }}>Booking details</p>
        {primaryEmail && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px]" style={{ color: CRM.sub }}>Display Email</p>
              <p className="text-[13px] truncate" style={{ color: CRM.ink }}>{primaryEmail}</p>
            </div>
            <CopyBtn text={primaryEmail} onCopied={() => flash("Email copied")} />
          </div>
        )}
        {lead && (
          <button type="button" onClick={() => onOpenLead(lead)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ borderTop: "1px solid rgba(182,118,81,0.10)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-[12px]" style={{ color: CRM.sub }}>Lead profile</p>
              <p className="text-[13px] font-medium truncate" style={{ color: CRM.ink }}>{displayName(lead)}</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: CRM.sub }} />
          </button>
        )}
      </section>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[60] px-4 py-2 rounded-full text-[13px] font-medium pip-pop-in" style={{ background: CRM.ink, color: "var(--crm-page-bg)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}