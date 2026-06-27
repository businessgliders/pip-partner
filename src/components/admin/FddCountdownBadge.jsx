import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileSignature, Clock, AlertTriangle, CheckCircle2, Play, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FDD_DEADLINE_DAYS = 14;

// Heuristic: a sent email is "the FDD" if its subject mentions FDD or
// "Franchise Disclosure". Adjust here if your template subjects change.
function isFddSubject(subject) {
  if (!subject) return false;
  const s = subject.toLowerCase();
  return s.includes("fdd") || s.includes("franchise disclosure");
}

/**
 * Shows a 14-day countdown for Franchise applications.
 *
 * Source of truth (in priority order):
 * 1. Manual override (`fdd_countdown_started_at`) — admin clicks "Start now"
 * 2. Auto-detection from email thread:
 *    - FDD sent → "Awaiting confirmation"
 *    - Applicant replied after FDD → 14-day countdown from that reply
 *
 * Clicking the badge opens a popover to start/restart/clear the timer manually.
 */
export default function FddCountdownBadge({ ticketId, ticket, hideWhenInactive = false }) {
  const queryClient = useQueryClient();
  const manualStartIso = ticket?.fdd_countdown_started_at || null;

  const { data: messages = [] } = useQuery({
    queryKey: ["email-messages", ticketId],
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { ticket_id: ticketId, ticket_type: "FranchiseInquiry" },
        "created_date",
        500
      ),
    enabled: !!ticketId && !manualStartIso, // skip fetching when manual override is set
    refetchInterval: 30000,
  });

  // Live "now" so the countdown ticks each minute
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { fddSentAt, confirmedAt } = useMemo(() => {
    if (manualStartIso) return { fddSentAt: null, confirmedAt: null };
    const sorted = [...messages].sort((a, b) => {
      const da = new Date(a.sent_at || a.created_date || 0).getTime();
      const db = new Date(b.sent_at || b.created_date || 0).getTime();
      return da - db;
    });

    const fddMsg = sorted.find(
      (m) =>
        m.direction === "outbound" &&
        m.send_status !== "failed" &&
        !m.is_internal &&
        isFddSubject(m.subject)
    );
    const fddTs = fddMsg
      ? new Date(fddMsg.sent_at || fddMsg.created_date).getTime()
      : null;

    let confirmTs = null;
    if (fddTs) {
      const reply = sorted.find((m) => {
        if (m.direction !== "inbound") return false;
        const ts = new Date(m.sent_at || m.created_date || 0).getTime();
        return ts > fddTs;
      });
      if (reply) confirmTs = new Date(reply.sent_at || reply.created_date).getTime();
    }

    return { fddSentAt: fddTs, confirmedAt: confirmTs };
  }, [messages, manualStartIso]);

  const updateManual = async (iso) => {
    await base44.entities.FranchiseInquiry.update(ticketId, {
      fdd_countdown_started_at: iso,
    });
    if (ticket) ticket.fdd_countdown_started_at = iso;
    queryClient.invalidateQueries({ queryKey: ["app-board", "FranchiseInquiry"] });
  };

  // Manual override is active → countdown from that timestamp
  const manualStartTs = manualStartIso ? new Date(manualStartIso).getTime() : null;
  const effectiveStartTs = manualStartTs || confirmedAt;

  // Nothing to show and no override → render a small "Start timer" trigger.
  // When `hideWhenInactive` is set (used by the compact email header) we
  // suppress the trigger entirely; the details panel will surface it instead.
  if (!effectiveStartTs && !fddSentAt) {
    if (hideWhenInactive) return null;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-medium hover:bg-slate-200 transition whitespace-nowrap"
            title="Manually start the 14-day FDD review period"
          >
            <Play className="w-3 h-3" />
            <span>Start FDD timer</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <p className="text-xs text-slate-600 mb-2">
            Start the 14-day FDD review period now. Use this when the applicant has confirmed receipt outside of email.
          </p>
          <button
            type="button"
            onClick={() => updateManual(new Date().toISOString())}
            className="w-full inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Play className="w-3 h-3" /> Start now
          </button>
        </PopoverContent>
      </Popover>
    );
  }

  // FDD sent but no applicant reply yet (and no manual override).
  // Header (hideWhenInactive) hides this — the timer isn't actually running.
  if (!effectiveStartTs) {
    if (hideWhenInactive) return null;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-medium hover:bg-amber-200 transition whitespace-nowrap"
            title="FDD sent — waiting for applicant to confirm receipt. Click to start manually."
          >
            <FileSignature className="w-3 h-3" />
            <span>FDD sent · awaiting reply</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <p className="text-xs text-slate-600 mb-2">
            Applicant hasn't replied yet. Start the 14-day clock manually if they've confirmed receipt another way.
          </p>
          <button
            type="button"
            onClick={() => updateManual(new Date().toISOString())}
            className="w-full inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Play className="w-3 h-3" /> Start now
          </button>
        </PopoverContent>
      </Popover>
    );
  }

  const deadline = effectiveStartTs + FDD_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = deadline - now;

  const sourceLabel = manualStartTs ? "manually started" : "applicant reply";
  const startedStr = new Date(effectiveStartTs).toLocaleString("en-US", { timeZone: "America/Toronto" });
  const deadlineStr = new Date(deadline).toLocaleString("en-US", { timeZone: "America/Toronto" });

  const renderControls = () => (
    <PopoverContent align="start" className="w-64 p-3 space-y-2">
      <div className="text-[11px] text-slate-500">
        Source: <span className="font-medium text-slate-700">{sourceLabel}</span>
      </div>
      <div className="text-[11px] text-slate-500">
        Started: <span className="font-medium text-slate-700">{startedStr}</span>
      </div>
      <div className="text-[11px] text-slate-500">
        Ends: <span className="font-medium text-slate-700">{deadlineStr}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => updateManual(new Date().toISOString())}
          className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          title="Reset start time to now"
        >
          <RotateCcw className="w-3 h-3" /> Restart
        </button>
        {manualStartTs && (
          <button
            type="button"
            onClick={() => updateManual(null)}
            className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            title="Remove manual override (use auto-detection)"
          >
            Clear
          </button>
        )}
      </div>
    </PopoverContent>
  );

  if (msLeft <= 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 font-semibold hover:bg-red-200 transition whitespace-nowrap"
            title={`14-day FDD waiting period ended on ${deadlineStr}`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>FDD: ready to sign</span>
          </button>
        </PopoverTrigger>
        {renderControls()}
      </Popover>
    );
  }

  const totalHours = Math.floor(msLeft / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  // Colour scale: green > 7d, amber 3–7d, red < 3d
  const tone =
    days >= 7
      ? "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200"
      : days >= 3
      ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
      : "bg-red-100 border-red-300 text-red-800 hover:bg-red-200";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium transition whitespace-nowrap ${tone}`}
          title={`14-day FDD waiting period — started ${startedStr}, ends ${deadlineStr}`}
        >
          {days >= 7 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          <span>FDD: {label} left{manualStartTs ? " ·" : ""}</span>
        </button>
      </PopoverTrigger>
      {renderControls()}
    </Popover>
  );
}