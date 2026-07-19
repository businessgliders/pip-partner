import React from "react";
import { Link } from "react-router-dom";
import { PenLine, LayoutTemplate, Home, Bell, Users } from "lucide-react";
import { CRM } from "./crmTheme";

function SettingCard({ icon: Icon, title, description, onClick, to, disabled }) {
  const inner = (
    <>
      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: CRM.blush }}>
        <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: CRM.accent }} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold" style={{ color: CRM.ink }}>{title}</span>
        <span className="block text-[12px] mt-0.5" style={{ color: CRM.sub }}>{description}</span>
      </span>
    </>
  );
  const cls = `crm-card p-5 flex items-start gap-4 text-left transition-shadow ${disabled ? "opacity-60" : "hover:shadow-md"}`;
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

export default function CrmSettings({ onNavigate }) {
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
          to="/Settings/Signature"
        />
        <SettingCard
          icon={Home}
          title="Classic admin home"
          description="Open the previous settings hub."
          to="/Settings"
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
          description="Coming soon."
          disabled
        />
      </div>
    </div>
  );
}