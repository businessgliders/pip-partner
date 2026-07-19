import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  MessageCircleReply,
  Send,
  Clock,
  ChevronDown,
  Mail,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * FollowUpControl — start / stop / preview / manage the intelligent automated
 * follow-up sequence on a single ticket. The actual sending is handled by the
 * scheduled processFollowUps function; this UI flips state and surfaces
 * controls (send next now, reschedule, stop) plus a history preview.
 */
function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = (d - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const future = diff > 0;
  if (abs < 60) return future ? "in a moment" : "just now";
  if (abs < 3600) return future ? `in ${Math.round(abs / 60)} min` : `${Math.round(abs / 60)} min ago`;
  if (abs < 86400) return future ? `in ${Math.round(abs / 3600)}h` : `${Math.round(abs / 3600)}h ago`;
  return future ? `in ${Math.round(abs / 86400)}d` : `${Math.round(abs / 86400)}d ago`;
}

function absTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PAUSE_LABELS = {
  replied: { label: "Paused — lead replied", icon: MessageCircleReply, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  manual_reply: { label: "Paused — staff replied", icon: MessageCircleReply, color: "text-sky-700 bg-sky-50 border-sky-200" },
  completed: { label: "Sequence complete", icon: CheckCircle2, color: "text-slate-700 bg-slate-50 border-slate-200" },
  stopped: { label: "Stopped manually", icon: Pause, color: "text-slate-700 bg-slate-50 border-slate-200" },
};

export default function FollowUpControl({ ticket, ticketType, iconOnly = false, withLabel = false }) {
  const queryClient = useQueryClient();
  const fu = ticket?.follow_up || {};
  const enabled = !!fu.enabled;
  const step = fu.step || 0;
  const maxSteps = fu.max_steps || 5;
  const pauseReason = fu.paused_reason || "";
  const history = Array.isArray(fu.history) ? fu.history : [];
  const [open, setOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [firstDelay, setFirstDelay] = useState(2);
  const [cap, setCap] = useState(maxSteps || 5);
  const [rescheduleDays, setRescheduleDays] = useState(2);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await base44.functions.invoke("toggleFollowUp", payload);
      if (res?.data?.error) throw new Error(res.data.error);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-board", ticketType] });
      // Also refresh the thread so the new follow-up email shows up.
      queryClient.invalidateQueries({ queryKey: ["emailMessages"] });
    },
  });

  const runAction = (payload, closeOnSuccess = false) => {
    mutation.mutate(payload, {
      onSuccess: () => {
        if (closeOnSuccess) {
          setOpen(false);
          setActiveOpen(false);
        }
      },
    });
  };

  const handleStart = () => {
    runAction({
      ticket_id: ticket.id,
      ticket_type: ticketType,
      action: "start",
      first_delay_days: firstDelay,
      max_steps: cap,
    }, true);
  };

  const handleStop = () => {
    runAction({ ticket_id: ticket.id, ticket_type: ticketType, action: "stop" }, true);
  };

  const handleSendNow = () => {
    runAction({ ticket_id: ticket.id, ticket_type: ticketType, action: "send_now" });
  };

  const handleReschedule = () => {
    runAction({
      ticket_id: ticket.id,
      ticket_type: ticketType,
      action: "reschedule",
      first_delay_days: rescheduleDays,
    });
  };

  // Active sequence rendering — click to open management popover.
  if (enabled) {
    return (
      <Popover open={activeOpen} onOpenChange={setActiveOpen}>
        <PopoverTrigger asChild>
          {iconOnly ? (
            <button
              type="button"
              title={`Auto Follow-up Active — Step ${step}/${maxSteps}`}
              className={`relative inline-flex items-center justify-center gap-1.5 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors ${withLabel ? "px-2.5" : "w-7"}`}
            >
              <Bot className="w-3.5 h-3.5" />
              {withLabel && <span className="text-[11px] font-semibold whitespace-nowrap">AI follow-up</span>}
              {withLabel ? (
                <span className="min-w-[14px] h-3.5 px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {step}/{maxSteps}
                </span>
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {step}/{maxSteps}
                </span>
              )}
            </button>
          ) : (
          <button
            type="button"
            className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-3 text-left hover:bg-amber-100/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-amber-900">Auto Follow-up Active</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                  Step {step}/{maxSteps}
                </span>
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                {fu.next_send_at
                  ? <>Next email <strong>{relTime(fu.next_send_at)}</strong></>
                  : "Sending next email shortly…"}
              </div>
              {fu.last_sent_at && (
                <div className="text-[10px] text-amber-700/80 mt-0.5">
                  Last sent {relTime(fu.last_sent_at)}
                </div>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-amber-700/70 shrink-0 mt-1" />
          </button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-700" />
              <div className="text-xs font-semibold text-slate-800">Manage Follow-up</div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {step} of {maxSteps} sent · pauses automatically when they reply.
            </p>
            <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
              {fu.next_send_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Next: <strong>{relTime(fu.next_send_at)}</strong> · <span className="text-slate-500">{absTime(fu.next_send_at)}</span></span>
                </div>
              )}
              {fu.last_sent_at && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>Last: <strong>{relTime(fu.last_sent_at)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="p-3 space-y-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handleSendNow}
              disabled={mutation.isPending}
              className="w-full h-9 rounded-lg bg-slate-900 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-slate-800 disabled:opacity-50"
            >
              {mutation.isPending && mutation.variables?.action === "send_now"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />}
              Send next email now
            </button>
            <div className="flex items-center gap-2">
              <select
                value={rescheduleDays}
                onChange={(e) => setRescheduleDays(Number(e.target.value))}
                className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-xs"
              >
                <option value={0}>Right away</option>
                <option value={1}>In 1 day</option>
                <option value={2}>In 2 days</option>
                <option value={3}>In 3 days</option>
                <option value={5}>In 5 days</option>
                <option value={7}>In 1 week</option>
              </select>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={mutation.isPending}
                className="h-8 px-3 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1"
              >
                {mutation.isPending && mutation.variables?.action === "reschedule"
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Clock className="w-3 h-3" />}
                Reschedule
              </button>
            </div>
            <button
              type="button"
              onClick={handleStop}
              disabled={mutation.isPending}
              className="w-full h-8 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {mutation.isPending && mutation.variables?.action === "stop"
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Pause className="w-3 h-3" />}
              Stop sequence
            </button>
            {mutation.isError && (
              <div className="text-[11px] text-rose-600">{mutation.error?.message || "Action failed"}</div>
            )}
          </div>

          {/* History preview */}
          <div className="p-3 max-h-56 overflow-y-auto">
            <div className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold mb-1.5">
              Sent so far
            </div>
            {history.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">
                No follow-ups sent yet. The first will go out {fu.next_send_at ? relTime(fu.next_send_at) : "shortly"}.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {history.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {h.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-800 truncate" title={h.subject}>
                        {h.subject || "Follow-up sent"}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        {relTime(h.sent_at)} · {absTime(h.sent_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Paused / completed status pill (and offer restart)
  const pauseInfo = pauseReason ? PAUSE_LABELS[pauseReason] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {iconOnly ? (
          <button
            type="button"
            title={pauseInfo ? pauseInfo.label : "Start Auto Follow-up"}
            className={`inline-flex items-center justify-center gap-1.5 h-7 rounded-full transition-colors ${withLabel ? "px-2.5" : "w-7"} ${
              pauseInfo
                ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            {withLabel && <span className="text-[11px] font-semibold whitespace-nowrap">AI follow-up</span>}
          </button>
        ) : (
        <button
          type="button"
          className={`w-full rounded-xl border p-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors ${
            pauseInfo ? pauseInfo.color : "border-slate-200 bg-white"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800">
              {pauseInfo ? pauseInfo.label : "Start Auto Follow-up"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              {pauseInfo
                ? step > 0
                  ? `Sent ${step} of ${maxSteps} · click to restart`
                  : "Click to restart"
                : "AI sends timed, context-aware nudges until they reply."}
            </div>
          </div>
          <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-slate-800 mb-1">Auto Follow-up</div>
            <p className="text-[11px] text-slate-500 leading-snug">
              The bot drafts each email using the thread context, chooses a smart send time, and pauses the moment they reply. Stops after the final follow-up and moves the ticket to <strong>Not Interested</strong>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-slate-600">
              <span className="block mb-1">First email in</span>
              <select
                value={firstDelay}
                onChange={(e) => setFirstDelay(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
              >
                <option value={0}>Right away</option>
                <option value={1}>1 day</option>
                <option value={2}>2 days</option>
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>1 week</option>
              </select>
            </label>
            <label className="text-[11px] text-slate-600">
              <span className="block mb-1">Max emails</span>
              <select
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </label>
          </div>
          {mutation.isError && (
            <div className="text-[11px] text-rose-600">{mutation.error?.message || "Failed to start"}</div>
          )}
          <button
            type="button"
            onClick={handleStart}
            disabled={mutation.isPending}
            className="w-full h-9 rounded-lg bg-slate-900 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-slate-800 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {pauseReason ? "Restart sequence" : "Start sequence"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}