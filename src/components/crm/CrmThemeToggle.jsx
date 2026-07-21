import React from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import useTheme from "@/hooks/useTheme";
import { CRM } from "./crmTheme";

const ORDER = ["light", "dark", "auto"];
const META = {
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
  auto: { icon: SunMoon, label: "Auto — dark after sunset" },
};

// Single header icon that cycles Light → Dark → Auto on each tap.
export default function CrmThemeToggle() {
  const { mode, setMode } = useTheme();
  const Icon = META[mode]?.icon || SunMoon;
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      title={`Theme: ${META[mode]?.label || "Auto"} — tap to switch`}
      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/70 transition-colors"
    >
      <Icon className="w-[18px] h-[18px]" style={{ color: CRM.ink }} />
    </button>
  );
}