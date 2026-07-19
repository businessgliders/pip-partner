import React from "react";
import { CRM } from "./crmTheme";

const ICON = "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png";

// Splash screen with a large PiP watermark, used by sections that are not built out yet.
export default function CrmSplash({ label }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[65vh] text-center overflow-hidden">
      <img
        src={ICON}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[85vw] opacity-[0.07] pointer-events-none select-none"
      />
      <img src={ICON} alt="" className="w-16 h-16 mb-5 relative" />
      <h2 className="text-xl font-semibold relative" style={{ color: CRM.ink }}>
        {label}
      </h2>
      <p className="text-[13px] mt-1.5 relative max-w-xs" style={{ color: CRM.sub }}>
        Coming soon. Tell us what you'd like this section to do and we'll build it.
      </p>
    </div>
  );
}