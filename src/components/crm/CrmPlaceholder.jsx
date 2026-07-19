import React from "react";
import { Sparkles } from "lucide-react";
import { CRM } from "./crmTheme";

export default function CrmPlaceholder({ label }) {
  return (
    <div className="crm-card max-w-xl mx-auto mt-16 p-12 text-center">
      <div
        className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ background: CRM.blush }}
      >
        <Sparkles className="w-6 h-6" style={{ color: CRM.accent }} />
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: CRM.ink }}>
        {label} — coming soon
      </h2>
      <p className="text-sm" style={{ color: CRM.sub }}>
        This section is a placeholder. Tell us what you'd like it to do and we'll build it.
      </p>
    </div>
  );
}