import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const SEGMENTS = [
  { key: "franchise", label: "Franchising", color: "#f1889b" },
  { key: "instructor", label: "Instructor", color: "#c4896b" },
  { key: "frontadmin", label: "Front Desk", color: "#d4a088" },
];

// Dashboard "Total leads" tile rendered as a donut/pie breakdown per board.
// Clicking a legend row or pie segment opens that specific board's leads.
export default function CrmLeadsPieTile({ counts, total, signed, onClick, onSelect }) {
  const data = SEGMENTS.map((s) => ({ ...s, value: counts[s.key] || 0 }));
  const hasData = total > 0;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      className="rounded-2xl p-5 text-left flex flex-col flex-1 hover:brightness-[0.98] transition cursor-pointer"
      style={{ background: "var(--tile-pink-bg)", boxShadow: "var(--crm-card-shadow)" }}
    >
      <span className="text-[12px] font-semibold" style={{ color: "var(--tile-pink-fg)" }}>
        Total leads <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/50 ml-1 align-middle">ALL TIME</span>
      </span>

      <div className="relative h-36 mt-2 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? data : [{ value: 1, color: "rgba(255,255,255,0.35)" }]}
              dataKey="value"
              innerRadius="62%"
              outerRadius="95%"
              paddingAngle={hasData ? 2 : 0}
              strokeWidth={0}
              isAnimationActive={false}
              onClick={(d, i, e) => {
                if (d?.key && onSelect) {
                  e?.stopPropagation?.();
                  onSelect(d.key);
                }
              }}
            >
              {(hasData ? data : [{ color: "rgba(255,255,255,0.35)" }]).map((d, i) => (
                <Cell key={i} fill={d.color} style={{ cursor: "pointer" }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold leading-none" style={{ color: "var(--crm-ink)" }}>{total}</span>
          <span className="text-[9px] tracking-[0.12em] uppercase font-semibold mt-1 opacity-70" style={{ color: "var(--tile-pink-fg)" }}>
            leads
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-[12px]" style={{ color: "var(--tile-pink-fg)" }}>
        {data.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              (onSelect || onClick)?.(d.key);
            }}
            className="w-full flex items-center gap-2 rounded-md px-1 -mx-1 py-0.5 hover:bg-white/40 transition-colors text-left"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="flex-1">{d.label}</span>
            <strong>{d.value}</strong>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <div className="text-[10px] tracking-[0.15em] uppercase font-semibold opacity-70" style={{ color: "var(--tile-pink-fg)" }}>
          Signed franchises
        </div>
        <div className="text-xl font-bold" style={{ color: "var(--crm-ink)" }}>{signed}</div>
      </div>
    </div>
  );
}