import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, Archive, ChevronLeft, ChevronRight, BarChart3, Settings, LayoutGrid, MapPin } from "lucide-react";
import KanbanColumn from "../components/board/KanbanColumn";
import ArchivedTicketsList from "../components/board/ArchivedTicketsList";
import ResolvedCleanupPopup from "../components/board/ResolvedCleanupPopup";
import { StatusChangeDialog, ConfirmDialog, AlertDialogComponent, MobileSearchDialog } from "../components/board/BoardDialogs";
import SubmissionDetailModal from "../components/admin/SubmissionDetailModal";
import { fullName as adminFullName, locationLabel } from "../components/admin/SubmissionsTable";

const PRIMARY = "#f1889b";
const ACCENT = "#b67651";
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png";
const BUSINESS_NAME = "Pilates in Pink™ Studio";

const TABS = [
  {
    key: "franchise",
    label: "Franchise",
    entity: "FranchiseInquiry",
    statuses: ["new", "scheduled", "contacted", "qualified", "closed"],
    supportsCategory: true,
    detail: [
      { key: "phone", label: "Phone", get: (r) => [r.phone_country, r.phone].filter(Boolean).join(" ") },
      { key: "operation_style", label: "Operation Style" },
      { key: "ready_to_sign_nda", label: "Ready to Sign NDA" },
      { key: "why_pilates_in_pink", label: "Why Pilates in Pink" },
      { key: "business_experience", label: "Business Experience" },
      { key: "preferred_location", label: "Preferred Location" },
    ],
  },
  {
    key: "influencer",
    label: "Influencer",
    entity: "InfluencerApplication",
    statuses: ["pending", "approved", "declined"],
    supportsCategory: false,
    detail: [
      { key: "tiktok_handle", label: "TikTok" },
      { key: "location", label: "Location" },
      { key: "why_partner", label: "Why Partner" },
    ],
  },
  {
    key: "instructor",
    label: "Instructor",
    entity: "InstructorApplication",
    statuses: ["pending", "reviewed", "invited", "declined"],
    supportsCategory: true,
    detail: [
      { key: "postal_code", label: "Postal Code" },
      { key: "qualifications", label: "Qualifications", get: (r) => (r.qualifications || []).join(", ") },
      { key: "message", label: "Message" },
    ],
  },
  {
    key: "frontadmin",
    label: "Front Desk",
    entity: "FrontAdminApplication",
    statuses: ["pending", "reviewed", "invited", "declined"],
    supportsCategory: true,
    detail: [
      { key: "postal_code", label: "Postal Code" },
      { key: "message", label: "Message" },
    ],
  },
];

const PROVINCES = ["Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Northwest Territories","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"];

function decorateTicket(ticket) {
  return { ...ticket, _displayName: ticket.full_name || `${ticket.first_name || ""} ${ticket.last_name || ""}`.trim() };
}

export default function ApplicationBoard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("franchise");
  const tabMeta = TABS.find((t) => t.key === activeTab);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);
  const [dragNoteDialog, setDragNoteDialog] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("status");
  const [hiddenColumns] = useState([]);
  const [showCleanupPopup, setShowCleanupPopup] = useState(false);
  const [cleanupDismissed, setCleanupDismissed] = useState(false);
  const [mobileSearchDialog, setMobileSearchDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState(null);
  const [archiveAllConfirmDialog, setArchiveAllConfirmDialog] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const swimlaneScrollRef = useRef(null);

  // Reset viewMode when switching tabs to a non-category-supporting tab
  useEffect(() => {
    if (!tabMeta.supportsCategory && viewMode === "category") setViewMode("status");
  }, [activeTab, tabMeta.supportsCategory, viewMode]);

  const ticketsQuery = useQuery({
    queryKey: ["board-tickets", activeTab],
    queryFn: async () => {
      const rows = await base44.entities[tabMeta.entity].list("-created_date", 1000);
      return rows.map(decorateTicket);
    },
    refetchInterval: 5000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[tabMeta.entity].update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board-tickets", activeTab] }),
  });

  const tickets = ticketsQuery.data || [];

  // URL deep-link
  useEffect(() => {
    if (!tickets.length) return;
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get("ticket");
    if (ticketId) {
      const found = tickets.find((t) => t.id === ticketId);
      if (found) {
        setHighlightedTicketId(ticketId);
        setTimeout(() => setSelectedTicket(found), 500);
        setTimeout(() => setHighlightedTicketId(null), 3000);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [tickets.length]); // eslint-disable-line

  const activeTickets = useMemo(() => tickets.filter((t) => !t.archived), [tickets]);
  const archivedTickets = useMemo(() => tickets.filter((t) => t.archived), [tickets]);

  const columns = useMemo(() => {
    const all = viewMode === "status" ? tabMeta.statuses : PROVINCES;
    return all.filter((c) => !hiddenColumns.includes(c));
  }, [viewMode, tabMeta.statuses, hiddenColumns]);

  const matchesSearch = (t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [t._displayName, t.email, t.phone, t.province, t.notes, t.content_style]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  };

  const getTicketsByColumn = (column) => {
    return activeTickets.filter((t) => {
      const matches = viewMode === "status" ? t.status === column : t.province === column;
      return matches && matchesSearch(t);
    });
  };

  const filteredArchived = useMemo(() => archivedTickets.filter(matchesSearch), [archivedTickets, searchQuery]); // eslint-disable-line

  // Cleanup popup auto-open: > 6 in "resolved-like" status
  const resolvedStatus = tabMeta.statuses.includes("qualified") ? "qualified" : tabMeta.statuses.includes("approved") ? "approved" : tabMeta.statuses.includes("invited") ? "invited" : null;
  const closedStatus = tabMeta.statuses.includes("closed") ? "closed" : "declined";
  const resolvedTickets = useMemo(() => resolvedStatus ? activeTickets.filter((t) => t.status === resolvedStatus) : [], [activeTickets, resolvedStatus]);

  useEffect(() => {
    if (!cleanupDismissed && resolvedTickets.length > 6) setShowCleanupPopup(true);
  }, [resolvedTickets.length, cleanupDismissed]);

  // Drag handling
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const ticket = tickets.find((t) => t.id === draggableId);
    if (!ticket) return;

    if (viewMode === "category") {
      updateMutation.mutate({ id: ticket.id, data: { province: destination.droppableId } });
    } else {
      setDragNoteDialog({ ticket, fromStatus: source.droppableId, toStatus: destination.droppableId });
    }
  };

  const handleStatusChange = (id, newStatus, note = "", author = "") => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;
    const history = [...(ticket.status_history || []), { status: newStatus, note, author, timestamp: new Date().toISOString() }];
    updateMutation.mutate({ id, data: { status: newStatus, status_history: history } });
  };

  const handleConfirmDragMove = ({ name, note }) => {
    if (!dragNoteDialog) return;
    handleStatusChange(dragNoteDialog.ticket.id, dragNoteDialog.toStatus, note, name);
    setDragNoteDialog(null);
  };

  // Archive operations
  const handleArchiveSome = async () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const toArchive = activeTickets.filter((t) => {
      if (t.status !== closedStatus) return false;
      const d = new Date(t.updated_date || t.created_date);
      return d.getFullYear() !== y || d.getMonth() !== m;
    });
    for (const t of toArchive) {
      await base44.entities[tabMeta.entity].update(t.id, { archived: true });
    }
    queryClient.invalidateQueries({ queryKey: ["board-tickets", activeTab] });
    setAlertDialog(`Archived ${toArchive.length} application${toArchive.length === 1 ? "" : "s"}.`);
  };

  const handleArchiveAll = () => {
    const toArchive = activeTickets.filter((t) => t.status === closedStatus);
    setArchiveAllConfirmDialog({
      title: "Archive All Closed",
      message: `Archive all ${toArchive.length} closed application${toArchive.length === 1 ? "" : "s"}, including this month?`,
      onConfirm: async () => {
        for (const t of toArchive) {
          await base44.entities[tabMeta.entity].update(t.id, { archived: true });
        }
        queryClient.invalidateQueries({ queryKey: ["board-tickets", activeTab] });
        setArchiveAllConfirmDialog(null);
        setAlertDialog(`Archived ${toArchive.length} application${toArchive.length === 1 ? "" : "s"}.`);
      },
    });
  };

  const handleRestore = async (id) => {
    await base44.entities[tabMeta.entity].update(id, { archived: false });
    queryClient.invalidateQueries({ queryKey: ["board-tickets", activeTab] });
  };

  const handleBulkClose = async (ids) => {
    for (const id of ids) {
      const t = tickets.find((x) => x.id === id);
      if (!t) continue;
      const history = [...(t.status_history || []), { status: closedStatus, note: "Bulk closed via Resolved cleanup", timestamp: new Date().toISOString() }];
      await base44.entities[tabMeta.entity].update(id, { status: closedStatus, status_history: history });
    }
    queryClient.invalidateQueries({ queryKey: ["board-tickets", activeTab] });
    setCleanupDismissed(true);
  };

  // Mobile scroll arrows
  const updateScrollState = () => {
    const el = swimlaneScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = swimlaneScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [columns.length, showArchived]);

  const scrollSwimlanes = (direction) => {
    const el = swimlaneScrollRef.current;
    if (!el) return;
    const first = el.querySelector("[data-swimlane]");
    const width = (first?.clientWidth || 300) + 16;
    el.scrollBy({ left: direction === "left" ? -width : width, behavior: "smooth" });
  };

  const firstCol = columns[0];
  const firstColCount = firstCol ? getTicketsByColumn(firstCol).length : 0;
  const counterText = showArchived
    ? `${archivedTickets.length} archived applications`
    : `${activeTickets.length} active applications${firstCol ? ` • ${firstColCount} in ${firstCol}` : ""}`;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col px-4 md:px-8 pt-4 md:pt-8 pb-2 relative overflow-x-hidden lg:overflow-hidden" style={{ background: `linear-gradient(to bottom, ${PRIMARY}, #ffffff)` }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-pink-400/40 rounded-full blur-3xl" />

      {/* Floating top-right icons */}
      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
        <Link to="/AdminDashboard" className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-full w-10 h-10 shadow-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4" />
        </Link>
        <Link to="/AdminDashboard/Settings" className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-full w-10 h-10 shadow-lg flex items-center justify-center">
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col flex-1 w-full lg:min-h-0">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 lg:static -mx-4 md:-mx-8 px-4 md:px-8 pt-4 md:pt-8 -mt-4 md:-mt-8 mb-4 lg:mb-0 backdrop-blur-sm lg:backdrop-blur-none lg:p-0 lg:m-0 pb-3 lg:pb-0"
          style={{ background: `linear-gradient(to bottom, ${PRIMARY}, ${PRIMARY}f2, ${PRIMARY}cc)` }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" onClick={() => { setShowArchived(false); setSearchQuery(""); setViewMode("status"); }}>
                <img src={LOGO_URL} alt="Pilates in Pink" className="h-12 md:h-16 drop-shadow-xl hover:scale-105 transition-transform" />
              </Link>
              <div className="text-white">
                <div className="text-[10px] tracking-[0.25em] font-semibold opacity-90">APPLICATION BOARD</div>
                <div className="text-sm font-medium opacity-95">{counterText}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 backdrop-blur-md bg-white/70 border-white/80 text-gray-900 h-11 w-64 rounded-xl shadow-lg"
                />
              </div>
              <button
                onClick={() => setMobileSearchDialog(true)}
                className="md:hidden backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 h-11 w-11 rounded-xl shadow-lg flex items-center justify-center"
              >
                <Search className="w-4 h-4" />
              </button>
              {!showArchived && tabMeta.supportsCategory && (
                <button
                  onClick={() => setViewMode(viewMode === "status" ? "category" : "status")}
                  className="backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 hover:bg-white/80 rounded-xl h-11 px-3 shadow-lg text-sm font-medium flex items-center gap-2"
                >
                  <span className="hidden md:inline">{viewMode === "status" ? "View by Province" : "View by Status"}</span>
                  <span className="md:hidden">{viewMode === "status" ? <MapPin className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}</span>
                </button>
              )}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`backdrop-blur-md border h-11 w-11 rounded-xl shadow-lg flex items-center justify-center ${showArchived ? "bg-purple-500/80 border-purple-400/80 text-white" : "bg-white/70 border-white/80 text-gray-900 hover:bg-white/80"}`}
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setCleanupDismissed(false); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-white text-gray-900 shadow-lg" : "bg-white/30 text-white hover:bg-white/40"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Board or archive */}
        {showArchived ? (
          <div className="flex-1 min-h-0 mt-2">
            <ArchivedTicketsList
              tickets={filteredArchived}
              onView={setSelectedTicket}
              onRestore={handleRestore}
            />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="relative flex-1 lg:min-h-0 mt-2">
              {canScrollLeft && (
                <button onClick={() => scrollSwimlanes("left")} className="lg:hidden absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
              )}
              {canScrollRight && (
                <button onClick={() => scrollSwimlanes("right")} className="lg:hidden absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              )}
              <div
                ref={swimlaneScrollRef}
                className="flex overflow-x-auto -mx-4 md:-mx-8 pl-6 pr-4 md:pl-10 md:pr-8 pb-2 gap-4 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain lg:grid lg:grid-cols-4 lg:gap-6 lg:flex-1 lg:min-h-0 lg:mx-0 lg:px-0 lg:overflow-visible"
              >
                {columns.map((col) => (
                  <div key={col} className="flex-shrink-0 w-[85%] sm:w-[60%] md:w-[45%] snap-start lg:w-auto lg:snap-align-none">
                    <KanbanColumn
                      status={col}
                      tickets={getTicketsByColumn(col)}
                      onStatusChange={handleStatusChange}
                      onTicketClick={setSelectedTicket}
                      isLoading={ticketsQuery.isLoading}
                      highlightedTicketId={highlightedTicketId}
                      onArchiveSome={viewMode === "status" ? handleArchiveSome : undefined}
                      onArchiveAll={viewMode === "status" ? handleArchiveAll : undefined}
                      onTidyUp={viewMode === "status" && resolvedStatus === col ? () => setShowCleanupPopup(true) : undefined}
                      viewMode={viewMode}
                      statusOptions={tabMeta.statuses}
                      tabKey={activeTab}
                    />
                  </div>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}

        {/* Footer */}
        <div className="mt-2 mb-0 flex items-center justify-center gap-3 flex-shrink-0">
          <img src={LOGO_URL} alt="" className="w-6 h-6 rounded shadow" />
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} {BUSINESS_NAME} • All rights reserved</p>
        </div>
      </div>

      {/* Dialogs */}
      <StatusChangeDialog
        open={!!dragNoteDialog}
        onOpenChange={(v) => { if (!v) setDragNoteDialog(null); }}
        ticketName={dragNoteDialog?.ticket._displayName || ""}
        fromStatus={dragNoteDialog?.fromStatus || ""}
        toStatus={dragNoteDialog?.toStatus || ""}
        onConfirm={handleConfirmDragMove}
      />
      <ConfirmDialog
        isOpen={!!archiveAllConfirmDialog}
        title={archiveAllConfirmDialog?.title || ""}
        message={archiveAllConfirmDialog?.message || ""}
        onConfirm={() => archiveAllConfirmDialog?.onConfirm()}
        onCancel={() => setArchiveAllConfirmDialog(null)}
      />
      <AlertDialogComponent isOpen={!!alertDialog} message={alertDialog || ""} onClose={() => setAlertDialog(null)} />
      <MobileSearchDialog open={mobileSearchDialog} onOpenChange={setMobileSearchDialog} value={searchQuery} onChange={setSearchQuery} />
      <ResolvedCleanupPopup
        open={showCleanupPopup}
        onOpenChange={(v) => { setShowCleanupPopup(v); if (!v) setCleanupDismissed(true); }}
        resolvedTickets={resolvedTickets}
        onMoveToClosed={handleBulkClose}
        closedStatusLabel={closedStatus}
      />
      <SubmissionDetailModal
        open={!!selectedTicket}
        onOpenChange={(v) => { if (!v) setSelectedTicket(null); }}
        row={selectedTicket}
        tabKey={activeTab}
        detailFields={tabMeta.detail}
        accentColor={ACCENT}
      />
    </div>
  );
}