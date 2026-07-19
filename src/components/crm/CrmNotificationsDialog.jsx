import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CRM } from "./crmTheme";

const GROUPS = [
  { key: "franchise", label: "Franchising", hint: "Inbound replies on franchise leads" },
  { key: "hiring", label: "Hiring", hint: "Inbound replies on instructor and front desk leads" },
];

export default function CrmNotificationsDialog({ onClose }) {
  const queryClient = useQueryClient();
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["notif-settings"],
    queryFn: () => base44.entities.NotificationSetting.list(),
  });
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (isLoading || rows) return;
    setRows(
      GROUPS.map((g) => {
        const s = settings.find((x) => x.source === g.key);
        return {
          ...g,
          id: s?.id,
          enabled: s ? s.enabled !== false : true,
          emailsText: (s?.emails || []).join("\n"),
        };
      })
    );
  }, [isLoading, settings, rows]);

  const saveMutation = useMutation({
    mutationFn: async (list) => {
      await Promise.all(
        list.map((r) => {
          const data = {
            source: r.key,
            enabled: r.enabled,
            emails: r.emailsText.split(/[\n,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean),
          };
          return r.id
            ? base44.entities.NotificationSetting.update(r.id, data)
            : base44.entities.NotificationSetting.create(data);
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notif-settings"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 crm-root pip-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md pip-pop-in">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(182,118,81,0.1)" }}>
          <h2 className="text-lg font-semibold" style={{ color: CRM.ink }}>Notification preferences</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100" style={{ color: CRM.sub }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          <p className="text-[12px]" style={{ color: CRM.sub }}>
            When a lead replies by email, a notification is sent to these addresses with a direct link to the conversation.
          </p>
          {!rows ? (
            <div className="text-center text-[13px] py-6" style={{ color: CRM.sub }}>Loading…</div>
          ) : (
            rows.map((r, i) => (
              <div key={r.key} className="rounded-xl p-4" style={{ border: "1px solid rgba(182,118,81,0.14)", background: "#fffdfb" }}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: CRM.ink }}>{r.label}</div>
                    <div className="text-[11px]" style={{ color: CRM.sub }}>{r.hint}</div>
                  </div>
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => setRows(rows.map((x, xi) => (xi === i ? { ...x, enabled: v } : x)))}
                  />
                </div>
                <textarea
                  value={r.emailsText}
                  onChange={(e) => setRows(rows.map((x, xi) => (xi === i ? { ...x, emailsText: e.target.value } : x)))}
                  placeholder={"one@email.com\ntwo@email.com"}
                  rows={3}
                  disabled={!r.enabled}
                  className="w-full mt-2 rounded-xl p-3 text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50"
                  style={{ border: "1px solid rgba(182,118,81,0.18)", color: CRM.ink }}
                />
                <div className="text-[10px] mt-1" style={{ color: CRM.sub }}>One address per line.</div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 p-5" style={{ borderTop: "1px solid rgba(182,118,81,0.1)", background: "#fdf8f4" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[12px] font-medium bg-white"
            style={{ border: "1px solid rgba(182,118,81,0.2)", color: CRM.ink }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!rows || saveMutation.isPending}
            onClick={() => saveMutation.mutate(rows)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold disabled:opacity-50"
            style={{ background: CRM.accentSoft, color: "#5b3038" }}
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}