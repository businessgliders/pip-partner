import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function fillTemplate(text, vars) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

export default function TemplatePicker({ vars, onSelect }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    base44.entities.EmailTemplate.filter({ is_active: true }, "name", 200)
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const grouped = templates.reduce((acc, t) => {
    const cat = t.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Templates
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
        {templates.length === 0 && (
          <div className="px-3 py-4 text-xs text-gray-500 text-center">No templates yet</div>
        )}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-gray-500">
              {cat}
            </DropdownMenuLabel>
            {items.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() =>
                  onSelect({
                    subject: fillTemplate(t.subject, vars),
                    body_html: fillTemplate(t.body_html, vars),
                  })
                }
              >
                {t.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}