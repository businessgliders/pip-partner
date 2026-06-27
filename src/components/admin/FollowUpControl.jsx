import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Play, Pause, Loader2, CheckCircle2, MessageCircleReply } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * FollowUpControl — start / stop the intelligent automated follow-up
 * sequence on a single ticket. The actual sending is handled by the
 * scheduled processFollowUps function; this UI just flips state.
 *
 * Drop into the contact panel; works for every source (franchise,
 * instructor, frontadmin, influencer).
 */
function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = (d - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const future = diff > 0;
  if (abs < 60) return future ? "in a moment" : "just now";
  if (abs < 3600) return future ? `in ${Math.round(abs / 60)}m` : `${Math.round(abs / 60)}m ago`;
  if (abs < 86400) return future ? `in ${Math.round(abs / 3600)}h` : `${Math.round(abs / 3600)}h ago`;
  return future ? `in ${Math.round(abs / 86400)}d` : `${Math.round(abs / 86400)}d ago`;
}

const PAUSE_LABELS = {
  replied: { label: "Paused — lead replied", icon: MessageCircleReply, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  manual_reply: { label: "Paused — staff replied", icon: MessageCircleReply, color: "text-sky-700 bg-sky-50 border-sky-200" },
  completed: { label: "Sequence complete", icon: CheckCircle2, color: "text-slate-700 bg-slate-50 border-slate-200" },
  stopped: { label: "Stopped manually", icon: Pause, color: "text-slate-700 bg-slate-50 border-slate-200" },
};

export default function FollowUpControl({ ticket, ticketType }) {
  const queryClient = useQueryClient();
  const fu = ticket?.follow_up || {};
  const enabled = !!fu.enabled;
  const step = fu.step || 0;
  const maxSteps = fu.max_steps || 5;
  const pauseReason = fu.paused_reason || "";
  const [open, setOpen] = useState(false);
  const [firstDelay, setFirstDelay] = useState(2);
  const [cap, setCap] = useState(maxSteps || 5);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await base44.functions.invoke("toggleFollowUp", payload);
      if (res?.data?.error) throw new Error(res.data.error);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-board", ticketType] });
      setOpen(false);
    },
  });

  const handleStart = () => {
    mutation.mutate({
      ticket_id: ticket.id,
      ticket_type: ticketType,
      action: "start",
      first_delay_days: firstDelay,
      max_steps: cap,
    });
  };

  const handleStop = () => {
    mutation.mutate({
      ticket_id: ticket.id,
      ticket_type: ticketType,
      action: "stop",
    });
  };

  // Active sequence rendering
  if (enabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-3">
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
        <button
          type="button"
          onClick={handleStop}
          disabled={mutation.isPending}
          className="text-[11px] font-medium text-amber-900 hover:text-amber-950 inline-flex items-center gap-1 shrink-0"
          title="Stop the follow-up sequence"
        >
          {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
          Stop
        </button>
      </div>
    );
  }

  // Paused / completed status pill (and offer restart)
  const pauseInfo = pauseReason ? PAUSE_LABELS[pauseReason] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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