import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileSignature, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const FDD_DEADLINE_DAYS = 14;

function isFddSubject(subject) {
  if (!subject) return false;
  const s = subject.toLowerCase();
  return s.includes("fdd") || s.includes("franchise disclosure");
}

/**
 * Compact, read-only FDD countdown pill for use on TicketCards.
 * Mirrors FddCountdownBadge logic but without a popover (cards are draggable).
 */
export default function FddCountdownPill({ ticket }) {
  const manualStartIso = ticket?.fdd_countdown_started_at || null;
  const ticketId = ticket?.id;

  const { data: messages = [] } = useQuery({
    queryKey: ["email-messages", ticketId],
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { ticket_id: ticketId, ticket_type: "FranchiseInquiry" },
        "created_date",
        500
      ),
    enabled: !!ticketId && !manualStartIso,
    refetchInterval: 60000,
    staleTime: 30000,
  });

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
    const fddTs = fddMsg ? new Date(fddMsg.sent_at || fddMsg.created_date).getTime() : null;
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

  const manualStartTs = manualStartIso ? new Date(manualStartIso).getTime() : null;
  const effectiveStartTs = manualStartTs || confirmedAt;

  // No timer running and no FDD sent → render nothing on the card
  if (!effectiveStartTs && !fddSentAt) return null;

  if (!effectiveStartTs) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-medium whitespace-nowrap"
        title="FDD sent — waiting for applicant to confirm receipt"
      >
        <FileSignature className="w-3 h-3" />
        FDD sent
      </span>
    );
  }

  const deadline = effectiveStartTs + FDD_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = deadline - now;
  const deadlineStr = new Date(deadline).toLocaleString("en-US", { timeZone: "America/Toronto" });

  if (msLeft <= 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 font-semibold whitespace-nowrap"
        title={`FDD waiting period ended ${deadlineStr}`}
      >
        <AlertTriangle className="w-3 h-3" />
        FDD ready
      </span>
    );
  }

  const totalHours = Math.floor(msLeft / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  const tone =
    days >= 7
      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
      : days >= 3
      ? "bg-amber-100 border-amber-300 text-amber-800"
      : "bg-red-100 border-red-300 text-red-800";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${tone}`}
      title={`FDD review — ends ${deadlineStr}`}
    >
      {days >= 7 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      FDD: {label}
    </span>
  );
}