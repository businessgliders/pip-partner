import React, { useState } from "react";
import { PenLine, LayoutTemplate, Bell, Users } from "lucide-react";
import CrmSignatureDialog from "./CrmSignatureDialog";
import CrmNotificationsDialog from "./CrmNotificationsDialog";
import { CRM } from "./crmTheme";

function SettingCard({ icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`crm-card p-5 flex items-start gap-4 text-left transition-shadow ${disabled ? "opacity-60" : "hover:shadow-md"}`}
    >
      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: CRM.blush }}>
        <Icon className="w-[18px] h-[18px]" style={{ color: CRM.accent }} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold" style={{ color: CRM.ink }}>{title}</span>
        <span className="block text-[12px] mt-0.5" style={{ color: CRM.sub }}>{description}</span>
      </span>
    </button>
  );
}

export default function CrmSettings({ onNavigate }) {
  const [sigOpen, setSigOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-[13px] mb-6" style={{ color: CRM.sub }}>
        Manage your workspace configuration.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SettingCard
          icon={LayoutTemplate}
          title="Email templates"
          description="Create and edit reusable reply templates."
          onClick={() => onNavigate("templates")}
        />
        <SettingCard
          icon={PenLine}
          title="Email signature"
          description="Edit your personal outgoing signature."
          onClick={() => setSigOpen(true)}
        />
        <SettingCard
          icon={Users}
          title="Team & access"
          description="Coming soon."
          disabled
        />
        <SettingCard
          icon={Bell}
          title="Notification preferences"
          description="Choose who gets emailed when leads reply."
          onClick={() => setNotifOpen(true)}
        />
      </div>

      {sigOpen && <CrmSignatureDialog onClose={() => setSigOpen(false)} />}
      {notifOpen && <CrmNotificationsDialog onClose={() => setNotifOpen(false)} />}
    </div>
  );
}