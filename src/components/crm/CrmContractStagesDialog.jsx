import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CRM } from "./crmTheme";
import { BOARD_TYPES, getStatusLabel } from "@/components/board/boardConfig";
import { CONTRACT_GROUPS, DEFAULT_CONTRACT_STAGES } from "./contractsConfig";

// Settings dialog: choose which lead statuses qualify for contracts, per board.
export default function CrmContractStagesDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [stages, setStages] = useState(DEFAULT_CONTRACT_STAGES);

  const { data: settings = [] } = useQuery({
    queryKey: ["contract-settings"],
    queryFn: () => base44.entities.ContractSetting.list(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const next = { ...DEFAULT_CONTRACT_STAGES };
    settings.forEach((s) => {
      if (s.board_key && Array.isArray(s.statuses) && s.statuses.length) next[s.board_key] = s.statuses;
    });
    setStages(next);
  }, [open, settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const group of CONTRACT_GROUPS) {
        const existing = settings.find((s) => s.board_key === group.key);
        const statuses = stages[group.key] || [];
        if (existing) {
          await base44.entities.ContractSetting.update(existing.id, { statuses });
        } else {
          await base44.entities.ContractSetting.create({ board_key: group.key, statuses });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-settings"] });
      onClose();
    },
  });

  const toggle = (boardKey, status) => {
    setStages((prev) => {
      const list = prev[boardKey] || [];
      return {
        ...prev,
        [boardKey]: list.includes(status) ? list.filter((s) => s !== status) : [...list, status],
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg crm-root">
        <DialogHeader>
          <DialogTitle style={{ color: CRM.ink }}>Contract stages</DialogTitle>
        </DialogHeader>
        <p className="text-xs -mt-2" style={{ color: CRM.sub }}>
          Leads in the selected statuses appear on the Contracts page.
        </p>
        <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
          {CONTRACT_GROUPS.map((group) => {
            const board = BOARD_TYPES.find((b) => b.key === group.key);
            return (
              <div key={group.key}>
                <p className="text-sm font-semibold mb-2" style={{ color: CRM.ink }}>{group.label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {(board?.statuses || []).map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: CRM.ink }}>
                      <Checkbox
                        checked={(stages[group.key] || []).includes(status)}
                        onCheckedChange={() => toggle(group.key, status)}
                      />
                      {getStatusLabel(group.key, status)}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{ background: CRM.ink, color: "#fff" }}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}