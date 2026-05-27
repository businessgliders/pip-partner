import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileSignature, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const FDD_DEADLINE_DAYS = 14;

// Heuristic: a sent email is "the FDD" if its subject mentions FDD or
// "Franchise Disclosure". Adjust here if your template subjects change.
function isFddSubject(subject) {
  if (!subject) return false;
  const s = subject.toLowerCase();
  return s.includes("fdd") || s.includes("franchise disclosure");
}

/**
 * Shows a 14-day countdown for Franchise applications, starting from the
 * moment the applicant FIRST replies AFTER we've sent them the FDD template.
 *
 * - No FDD sent yet → renders nothing
 * - FDD sent, no applicant reply yet → "Awaiting confirmation"
 * - Applicant replied after FDD → 14-day countdown from that reply
 */
export default function FddCountdownBadge({ ticketId }) {
  const { data: messages = [] } = useQuery({
    queryKey: ["email-messages", ticketId],
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { ticket_id: ticketId, ticket_type: "FranchiseInquiry" },
        "created_date",
        500
      ),
    enabled: !!ticketId,
    refetchInterval: 30000,
  });

  // Live "now" so the countdown ticks each minute
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { fddSentAt, confirmedAt } = useMemo(() => {
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
  }, [messages]);

  if (!fddSentAt) return null;

  // FDD sent but no applicant reply yet
  if (!confirmedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-medium whitespace-nowrap"
        title="FDD sent — waiting for applicant to confirm receipt before the 14-day countdown starts"
      >
        <FileSignature className="w-3 h-3" />
        <span>FDD sent · awaiting reply</span>
      </span>
    );
  }

  const deadline = confirmedAt + FDD_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = deadline - now;

  if (msLeft <= 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800 font-semibold whitespace-nowrap"
        title={`14-day FDD waiting period ended on ${new Date(deadline).toLocaleString("en-US", { timeZone: "America/Toronto" })}`}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>FDD: ready to sign</span>
      </span>
    );
  }

  const totalHours = Math.floor(msLeft / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  // Colour scale: green > 7d, amber 3–7d, red < 3d
  const tone =
    days >= 7
      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
      : days >= 3
      ? "bg-amber-100 border-amber-300 text-amber-800"
      : "bg-red-100 border-red-300 text-red-800";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${tone}`}
      title={`14-day FDD waiting period — started ${new Date(confirmedAt).toLocaleString("en-US", { timeZone: "America/Toronto" })}, ends ${new Date(deadline).toLocaleString("en-US", { timeZone: "America/Toronto" })}`}
    >
      {days >= 7 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      <span>FDD: {label} left</span>
    </span>
  );
}