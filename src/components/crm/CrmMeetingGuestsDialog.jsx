import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Loader2, CalendarClock, Plus } from "lucide-react";
import { CRM } from "./crmTheme";

const DEFAULT_FRANCHISE_GUESTS = [
  "gurpreen@pilatesinpinkstudio.com",
  "rashmeen@pilatesinpinkstudio.com",
  "sahil@pilatesinpinkstudio.com",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Settings dialog: per Cal.com event type, choose which team members are
// added as guests on every new booking of that call type.
export default function CrmMeetingGuestsDialog({ onClose }) {
  const queryClient = useQueryClient();
  const [guestsByType, setGuestsByType] = useState(null); // { [eventTypeId]: [emails] }
  const [inputs, setInputs] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: eventTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["cal-event-types"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getCalEventTypes", {});
      return res?.data?.eventTypes || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["meeting-guest-settings"],
    queryFn: () => base44.entities.MeetingGuestSetting.list("-created_date", 100),
  });

  // Initialize editable state once both queries land.
  useEffect(() => {
    if (typesLoading || settingsLoading || guestsByType) return;
    const next = {};
    for (const t of eventTypes) {
      const existing = settings.find((s) => String(s.event_type_id) === t.id);
      if (existing) next[t.id] = existing.guests || [];
      else next[t.id] = t.group === "franchise" ? [...DEFAULT_FRANCHISE_GUESTS] : [];
    }
    setGuestsByType(next);
  }, [typesLoading, settingsLoading, eventTypes, settings, guestsByType]);

  const saveMut = useMutation({
    mutationFn: async () => {
      for (const t of eventTypes) {
        const guests = guestsByType[t.id] || [];
        const existing = settings.find((s) => String(s.event_type_id) === t.id);
        if (existing) {
          await base44.entities.MeetingGuestSetting.update(existing.id, { guests, event_label: t.title });
        } else {
          await base44.entities.MeetingGuestSetting.create({ event_type_id: t.id, event_label: t.title, guests });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-guest-settings"] });
      setSaved(true);
      setTimeout(onClose, 900);
    },
  });

  const addGuest = (typeId) => {
    const email = (inputs[typeId] || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return;
    setGuestsByType((prev) => {
      const cur = prev[typeId] || [];
      if (cur.includes(email)) return prev;
      return { ...prev, [typeId]: [...cur, email] };
    });
    setInputs((prev) => ({ ...prev, [typeId]: "" }));
  };

  const removeGuest = (typeId, email) => {
    setGuestsByType((prev) => ({ ...prev, [typeId]: (prev[typeId] || []).filter((g) => g !== email) }));
  };

  const loading = typesLoading || settingsLoading || !guestsByType;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 pip-fade-in" onClick={onClose} />
      <div className="relative crm-card w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 pip-pop-in">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" style={{ color: CRM.accent }} />
            <h3 className="text-[15px] font-semibold" style={{ color: CRM.ink }}>Meeting guests</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-slate-100">
            <X className="w-4 h-4" style={{ color: CRM.sub }} />
          </button>
        </div>
        <p className="text-[12px] mb-4" style={{ color: CRM.sub }}>
          Choose which team members are automatically invited as guests on each Cal.com call type. The lead is always the main attendee.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-xs" style={{ color: CRM.sub }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading call types…
          </div>
        ) : (
          <div className="space-y-4">
            {eventTypes.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 p-3">
                <div className="text-[13px] font-semibold" style={{ color: CRM.ink }}>{t.title}</div>
                <div className="text-[11px] mb-2" style={{ color: CRM.sub }}>
                  {t.length ? `${t.length} min · ` : ""}{(guestsByType[t.id] || []).length} guest{(guestsByType[t.id] || []).length === 1 ? "" : "s"}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(guestsByType[t.id] || []).length === 0 && (
                    <span className="text-[11px] italic" style={{ color: CRM.sub }}>No team guests — only the lead attends.</span>
                  )}
                  {(guestsByType[t.id] || []).map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1 h-6 rounded-full text-[11px] font-medium"
                      style={{ background: CRM.blush, color: CRM.ink }}
                    >
                      {g}
                      <button type="button" onClick={() => removeGuest(t.id, g)} className="p-0.5 rounded-full hover:bg-black/10">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={inputs[t.id] || ""}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGuest(t.id); } }}
                    placeholder="Add team member email…"
                    className="flex-1 h-8 px-2.5 rounded-md border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addGuest(t.id)}
                    disabled={!EMAIL_RE.test((inputs[t.id] || "").trim())}
                    className="h-8 px-2.5 rounded-md text-xs font-semibold text-white disabled:opacity-40 inline-flex items-center gap-1"
                    style={{ background: CRM.accent }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            ))}

            {saveMut.isError && (
              <div className="text-[11px] text-rose-600">{saveMut.error?.message || "Save failed"}</div>
            )}
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || saved}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: saved ? "#059669" : CRM.ink }}
            >
              {saveMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved ? "Saved!" : "Save guest settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}