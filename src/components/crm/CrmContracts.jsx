import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CRM } from "./crmTheme";
import { CONTRACT_GROUPS, DEFAULT_CONTRACT_STAGES } from "./contractsConfig";
import CrmContractLeadList from "./CrmContractLeadList";
import CrmContractPanel from "./CrmContractPanel";
import CrmContractStagesDialog from "./CrmContractStagesDialog";
import { Settings2 } from "lucide-react";

// Contracts hub: contract-eligible leads per group + their Drive contract folders.
export default function CrmContracts({ currentUser }) {
  const [groupKey, setGroupKey] = useState("franchise");
  const [selected, setSelected] = useState(null);
  const [showStages, setShowStages] = useState(false);

  const group = CONTRACT_GROUPS.find((g) => g.key === groupKey);

  const { data: settings = [] } = useQuery({
    queryKey: ["contract-settings"],
    queryFn: () => base44.entities.ContractSetting.list(),
  });

  const leadQueries = {
    franchise: useQuery({ queryKey: ["contract-leads", "franchise"], queryFn: () => base44.entities.FranchiseInquiry.list("-updated_date", 500) }),
    instructor: useQuery({ queryKey: ["contract-leads", "instructor"], queryFn: () => base44.entities.InstructorApplication.list("-updated_date", 500) }),
    frontadmin: useQuery({ queryKey: ["contract-leads", "frontadmin"], queryFn: () => base44.entities.FrontAdminApplication.list("-updated_date", 500) }),
  };

  const { data: allContracts = [] } = useQuery({
    queryKey: ["contracts-all"],
    queryFn: () => base44.entities.Contract.list("-updated_date", 500),
  });

  const stagesFor = (key) => {
    const s = settings.find((x) => x.board_key === key);
    return s?.statuses?.length ? s.statuses : DEFAULT_CONTRACT_STAGES[key];
  };

  const eligibleByGroup = useMemo(() => {
    const out = {};
    CONTRACT_GROUPS.forEach((g) => {
      const leads = leadQueries[g.key].data || [];
      const stages = stagesFor(g.key);
      out[g.key] = leads.filter((t) => !t.archived && stages.includes(t.status));
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, leadQueries.franchise.data, leadQueries.instructor.data, leadQueries.frontadmin.data]);

  const contractCounts = useMemo(() => {
    const counts = {};
    allContracts.forEach((c) => { counts[c.ticket_id] = (counts[c.ticket_id] || 0) + 1; });
    return counts;
  }, [allContracts]);

  const leads = eligibleByGroup[groupKey] || [];

  return (
    <div className="pip-view-in">
      {/* Group tabs + stages settings */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {CONTRACT_GROUPS.map((g) => {
            const active = g.key === groupKey;
            const count = (eligibleByGroup[g.key] || []).length;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => { setGroupKey(g.key); setSelected(null); }}
                className="h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                style={{
                  background: active ? CRM.ink : "var(--crm-card-bg)",
                  color: active ? "var(--crm-page-bg)" : CRM.sub,
                  boxShadow: active ? "none" : CRM.cardShadow,
                }}
              >
                {g.label}{count > 0 ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowStages(true)}
          className="h-9 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 shrink-0 bg-white"
          style={{ color: CRM.sub, boxShadow: CRM.cardShadow }}
        >
          <Settings2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Contract stages</span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr] items-start">
        <div className={selected ? "hidden lg:block" : ""}>
          <CrmContractLeadList
            leads={leads}
            boardKey={groupKey}
            selectedId={selected?.id}
            onSelect={setSelected}
            contractCounts={contractCounts}
          />
        </div>
        <div className={!selected ? "hidden lg:block" : ""}>
          {selected ? (
            <CrmContractPanel
              key={selected.id}
              lead={selected}
              group={group}
              currentUser={currentUser}
              onBack={() => setSelected(null)}
            />
          ) : (
            <div className="crm-card p-10 text-center">
              <p className="text-sm font-medium" style={{ color: CRM.ink }}>Select a lead</p>
              <p className="text-xs mt-1" style={{ color: CRM.sub }}>
                Contracts are stored in Google Drive, organized by lead type and name.
              </p>
            </div>
          )}
        </div>
      </div>

      <CrmContractStagesDialog open={showStages} onClose={() => setShowStages(false)} />
    </div>
  );
}