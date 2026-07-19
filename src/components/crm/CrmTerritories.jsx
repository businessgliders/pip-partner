import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BOARD_TYPES, displayName } from "@/components/board/boardConfig";
import MapView from "@/components/board/MapView";
import CrmLeadDetailDrawer from "./CrmLeadDetailDrawer";
import { CRM } from "./crmTheme";

// Territories — map of franchise leads (excludes Not Interested / archived).
export default function CrmTerritories({ currentUser }) {
  const [detailTicket, setDetailTicket] = useState(null);
  const board = BOARD_TYPES.find((b) => b.key === "franchise");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["crm-territories-franchise"],
    queryFn: () => base44.entities.FranchiseInquiry.list("-created_date", 500),
  });

  const mapTickets = useMemo(
    () =>
      tickets
        .filter((t) => !t.archived && t.status !== "closed")
        .map((t) => ({
          ...t,
          _display_name: displayName(t),
          _boardKey: "franchise",
          _entity: "FranchiseInquiry",
        })),
    [tickets]
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[70vh] pb-6">
      {isLoading ? (
        <div className="crm-card p-10 text-center text-sm" style={{ color: CRM.sub }}>
          Loading territories…
        </div>
      ) : (
        <MapView
          tickets={mapTickets}
          accentColor={CRM.accent}
          statusOrder={board.statuses}
          onTicketClick={(t) => setDetailTicket(t)}
        />
      )}

      {detailTicket && (
        <CrmLeadDetailDrawer
          ticket={detailTicket}
          board={board}
          currentUser={currentUser}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </div>
  );
}