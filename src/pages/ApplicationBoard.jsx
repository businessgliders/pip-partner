import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Input } from "@/components/ui/input";
import { Archive, Search, ChevronLeft, ChevronRight, Settings as SettingsIcon, Home as HomeIcon } from "lucide-react";

import UserMenu from "../components/dashboard/UserMenu";
import NotificationCenter from "../components/admin/NotificationCenter";
import useUnreadMessages from "../hooks/useUnreadMessages";
import { useAuth } from "@/lib/AuthContext";
import KanbanColumn from "../components/board/KanbanColumn";
import ArchivedTicketsList from "../components/board/ArchivedTicketsList";
import ResolvedCleanupPopup from "../components/board/ResolvedCleanupPopup";
import { StatusChangeDialog, ConfirmDialog, AlertDialogComponent, MobileSearchDialog } from "../components/board/BoardDialogs";
import { BOARD_TYPES, displayName } from "../components/board/boardConfig";
import SubmissionDetailModal from "../components/admin/SubmissionDetailModal";
import SubmissionsTable from "../components/admin/SubmissionsTable";
import { TABLE_COLUMN_CONFIG, downloadCsv } from "../components/board/tableColumns";
import ProgramDock from "../components/board/ProgramDock";
import { LayoutGrid, Table2, Download } from "lucide-react";

const PRIMARY = "#f1889b";
const LOGO_URL = "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/c51835c8a_PiPPartner.png";
const FOOTER_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png";

const DETAIL_FIELDS = {
  franchise: [
    { key: "phone", label: "Phone", get: (r) => [r.phone_country, r.phone].filter(Boolean).join(" ") },
    { key: "province", label: "Province" },
    { key: "preferred_location", label: "Preferred Location" },
    { key: "available_capital", label: "Available Capital" },
    { key: "operation_style", label: "Operation Style" },
    { key: "ready_to_sign_nda", label: "Ready to Sign NDA" },
    { key: "why_pilates_in_pink", label: "Why Pilates in Pink" },
    { key: "business_experience", label: "Business Experience" },
    { key: "scheduled_call_time", label: "Discovery Call" },
  ],
  influencer: [
    { key: "instagram_handle", label: "Instagram", get: (r) => r.instagram_handle ? `@${r.instagram_handle}` : "" },
    { key: "tiktok_handle", label: "TikTok", get: (r) => r.tiktok_handle ? `@${r.tiktok_handle}` : "" },
    { key: "follower_count", label: "Followers" },
    { key: "content_style", label: "Content Style" },
    { key: "location", label: "Location" },
    { key: "why_partner", label: "Why Partner" },
  ],
  instructor: [
    { key: "preferred_studio", label: "Preferred Studio" },
    { key: "postal_code", label: "Postal Code" },
    { key: "province", label: "Province" },
    { key: "qualifications", label: "Qualifications", get: (r) => (r.qualifications || []).join(", ") },
    { key: "resume_url", label: "Resume" },
    { key: "message", label: "Message" },
  ],
  frontadmin: [
    { key: "preferred_studio", label: "Preferred Studio" },
    { key: "postal_code", label: "Postal Code" },
    { key: "province", label: "Province" },
    { key: "resume_url", label: "Resume" },
    { key: "message", label: "Message" },
  ],
};

export default function ApplicationBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    return tabParam && BOARD_TYPES.find((b) => b.key === tabParam) ? tabParam : "franchise";
  });
  const board = useMemo(() => BOARD_TYPES.find((b) => b.key === activeTab), [activeTab]);

  const { unreadMessages, unreadCountByTicket, totalUnread, markAsRead } = useUnreadMessages(user?.email);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);
  const [dragNoteDialog, setDragNoteDialog] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "table" ? "table" : "status";
  });
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showCleanupPopup, setShowCleanupPopup] = useState(false);
  const [cleanupDismissed, setCleanupDismissed] = useState(false);
  const [mobileSearchDialog, setMobileSearchDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState(null);
  const [archiveAllConfirmDialog, setArchiveAllConfirmDialog] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const swimlaneScrollRef = useRef(null);

  useEffect(() => {
    setSearchQuery("");
    setHiddenColumns([]);
    setShowArchived(false);
    setCleanupDismissed(false);
  }, [activeTab]);

  const { data: rawTickets = [], isLoading } = useQuery({
    queryKey: ["app-board", board.entity],
    queryFn: () => base44.entities[board.entity].list("-created_date", 500),
    refetchInterval: 5000,
  });

  const { data: calBookings = {} } = useQuery({
    queryKey: ["cal-bookings"],
    queryFn: async () => {
      const resp = await base44.functions.invoke("getCalBookings", {});
      return resp?.data?.bookings || {};
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const tickets = useMemo(
    () =>
      (rawTickets || []).map((t) => {
        const emailKey = (t.email || "").toLowerCase().trim();
        return {
          ...t,
          _display_name: displayName(t),
          _category: board.categoryField ? (t[board.categoryField] || "") : "",
          _dragId: t.id,
          _cal_booking: emailKey ? calBookings[emailKey] || null : null,
        };
      }),
    [rawTickets, board.categoryField, calBookings]
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[board.entity].update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] }),
  });

  const allStatusColumns = board.statuses;
  const allCategoryColumns = useMemo(() => {
    if (!board.categoryField) return [];
    const vals = new Set();
    tickets.forEach((t) => { const v = t[board.categoryField]; if (v) vals.add(v); });
    return Array.from(vals).sort();
  }, [board.categoryField, tickets]);

  // "table" is always available; "category" requires categoryField
  const effectiveViewMode = viewMode === "table"
    ? "table"
    : (board.categoryField ? viewMode : "status");
  const columns = effectiveViewMode === "table"
    ? []
    : (effectiveViewMode === "status" ? allStatusColumns : allCategoryColumns)
        .filter((c) => !hiddenColumns.includes(c));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("ticket");
    if (id && tickets.length) {
      const found = tickets.find((t) => t.id === id);
      if (found) {
        setHighlightedTicketId(id);
        setTimeout(() => setSelectedTicket(found), 500);
        setTimeout(() => setHighlightedTicketId(null), 3000);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [tickets, activeTab]);

  const matchesSearch = (t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [
      t._display_name, t.email, t.phone, t.notes,
      board.categoryField ? t[board.categoryField] : "",
    ].some((v) => v && String(v).toLowerCase().includes(q));
  };

  const getTicketsByColumn = (column) => {
    const filtered = tickets.filter((t) => {
      if (t.archived) return false;
      const inCol = effectiveViewMode === "status"
        ? t.status === column
        : (board.categoryField && t[board.categoryField] === column);
      return inCol && matchesSearch(t);
    });
    
    // Sort "scheduled" status by call time (soonest upcoming first).
    // Prefer the Cal.com booking start; fall back to scheduled_call_time.
    if (effectiveViewMode === "status" && column === "scheduled") {
      const getTime = (t) => {
        const calStart = t?._cal_booking?.start;
        if (calStart) return new Date(calStart).getTime();
        if (t?.scheduled_call_time) {
          const parsed = new Date(t.scheduled_call_time).getTime();
          if (!isNaN(parsed)) return parsed;
        }
        return Infinity; // no time → push to bottom
      };
      return filtered.sort((a, b) => getTime(a) - getTime(b));
    }
    
    return filtered;
  };

  const archivedTickets = useMemo(
    () => tickets.filter((t) => t.archived && matchesSearch(t)),
    [tickets, searchQuery]
  );

  const activeCount = tickets.filter((t) => !t.archived).length;
  const firstColumn = columns[0];
  const firstColumnCount = firstColumn ? getTicketsByColumn(firstColumn).length : 0;

  const resolvedKey = useMemo(() => {
    const last = board.statuses[board.statuses.length - 1];
    const candidates = ["qualified", "approved", "reviewed"];
    return candidates.find((c) => board.statuses.includes(c) && c !== last) || null;
  }, [board.statuses]);

  const resolvedTickets = useMemo(
    () => (resolvedKey ? tickets.filter((t) => !t.archived && t.status === resolvedKey) : []),
    [tickets, resolvedKey]
  );

  useEffect(() => {
    if (!cleanupDismissed && resolvedTickets.length > 6) setShowCleanupPopup(true);
  }, [resolvedTickets.length, cleanupDismissed]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const ticket = tickets.find((t) => t.id === draggableId);
    if (!ticket) return;

    if (effectiveViewMode === "category") {
      if (!board.categoryField) return;
      updateMutation.mutate({ id: ticket.id, data: { [board.categoryField]: destination.droppableId } });
      return;
    }

    setDragNoteDialog({
      ticket,
      ticketName: ticket._display_name,
      from: source.droppableId,
      to: destination.droppableId,
    });
  };

  const handleStatusChange = (ticket, newStatus, note = "", byName = "") => {
    const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
    const updated = [...history, { status: newStatus, note, by_name: byName, timestamp: new Date().toISOString() }];
    updateMutation.mutate({ id: ticket.id, data: { status: newStatus, status_history: updated } });
  };

  const handleDragConfirm = ({ name, note }) => {
    if (!dragNoteDialog) return;
    handleStatusChange(dragNoteDialog.ticket, dragNoteDialog.to, note, name);
    setDragNoteDialog(null);
  };

  const handleArchiveSome = async () => {
    const closedKey = board.statuses[board.statuses.length - 1];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const targets = tickets.filter((t) => {
      if (t.archived || t.status !== closedKey) return false;
      const ts = new Date(t.updated_date || t.created_date);
      return ts.getMonth() !== currentMonth || ts.getFullYear() !== currentYear;
    });
    if (targets.length === 0) {
      setAlertDialog({ message: "No older closed applications to archive yet." });
      return;
    }
    await Promise.all(targets.map((t) => base44.entities[board.entity].update(t.id, { archived: true })));
    queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] });
    setAlertDialog({ message: `Archived ${targets.length} application${targets.length === 1 ? "" : "s"}.` });
  };

  const handleArchiveAllConfirm = async () => {
    const closedKey = board.statuses[board.statuses.length - 1];
    const targets = tickets.filter((t) => !t.archived && t.status === closedKey);
    setArchiveAllConfirmDialog(null);
    if (targets.length === 0) {
      setAlertDialog({ message: "Nothing to archive — no closed applications." });
      return;
    }
    await Promise.all(targets.map((t) => base44.entities[board.entity].update(t.id, { archived: true })));
    queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] });
    setAlertDialog({ message: `Archived ${targets.length} application${targets.length === 1 ? "" : "s"}.` });
  };

  const handleRestoreTicket = async (id) => {
    await base44.entities[board.entity].update(id, { archived: false });
    queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] });
  };

  const handleTidyUpMove = async (ids) => {
    const closedKey = board.statuses[board.statuses.length - 1];
    for (const id of ids) {
      const t = tickets.find((x) => x.id === id);
      if (!t) continue;
      const history = Array.isArray(t.status_history) ? t.status_history : [];
      const updated = [...history, { status: closedKey, note: "Bulk closed via Resolved cleanup", timestamp: new Date().toISOString() }];
      await base44.entities[board.entity].update(id, { status: closedKey, status_history: updated });
    }
    queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] });
    setCleanupDismissed(true);
  };

  const updateScrollState = () => {
    const el = swimlaneScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
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
    const w = (first?.clientWidth || 320) + 16;
    el.scrollBy({ left: direction === "left" ? -w : w, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col px-4 md:px-8 pt-4 md:pt-8 pb-2 relative overflow-hidden"
      style={{
        backgroundImage: "linear-gradient(to bottom, #2b1a1f, #5a3a42)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{
          zIndex: 1,
          WebkitMaskImage:
            "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,1) 85%, rgba(0,0,0,1) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 110px, rgba(0,0,0,1) 160px, rgba(0,0,0,1) 100%)",
          maskImage:
            "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(0,0,0,1) 85%, rgba(0,0,0,1) 100%), linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 110px, rgba(0,0,0,1) 160px, rgba(0,0,0,1) 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: "140%",
            height: "140%",
            transform: "rotate(-30deg)",
            transformOrigin: "center center",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontSize: "7rem",
            lineHeight: "210px",
            letterSpacing: "0.25em",
            color: "rgba(255,255,255,0.16)",
            whiteSpace: "nowrap",
          }}
        >
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row}>APPLICATIONS&nbsp;&nbsp;APPLICATIONS&nbsp;&nbsp;APPLICATIONS</div>
          ))}
        </div>
      </div>

      <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
        <Link to="/" className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-full w-10 h-10 shadow-lg flex items-center justify-center">
          <HomeIcon className="w-4 h-4" />
        </Link>
        <Link to="/Settings" className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-full w-10 h-10 shadow-lg flex items-center justify-center">
          <SettingsIcon className="w-4 h-4" />
        </Link>
      </div>

      <ProgramDock activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto relative flex flex-col flex-1 w-full lg:min-h-0" style={{ zIndex: 2 }}>
        <div className="mb-4 lg:mb-6 pb-3 lg:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/Settings"
                onClick={() => { setShowArchived(false); setSearchQuery(""); setViewMode("status"); }}
              >
                <img src={LOGO_URL} alt="Pilates in Pink" className="h-12 md:h-16 drop-shadow-xl hover:scale-105 transition-transform" />
              </Link>
              <div className="text-white text-xs md:text-sm font-medium drop-shadow">
                {showArchived ? (
                  <>{archivedTickets.length} archived applications</>
                ) : (
                  <>{activeCount} active applications · {firstColumnCount} in {firstColumn || "—"}</>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NotificationCenter
                unreadMessages={unreadMessages}
                totalUnread={totalUnread}
                markAsRead={markAsRead}
                onSelect={(ticket, messageId, tabKey) => {
                  if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
                  setHighlightMessageId(messageId);
                  setSelectedTicket(ticket);
                }}
              />
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 w-64 backdrop-blur-md bg-white/70 border-white/80 text-gray-900 rounded-xl shadow-lg"
                  />
                </div>
              </div>
              <button
                onClick={() => setMobileSearchDialog(true)}
                className="md:hidden h-11 w-11 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 hover:bg-white/80 shadow-lg flex items-center justify-center"
              >
                <Search className="w-4 h-4" />
              </button>

              {!showArchived && (
                <div className="h-11 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 shadow-lg flex items-center p-1 gap-1">
                  <button
                    onClick={() => setViewMode("status")}
                    title="Board view"
                    className={`h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      viewMode === "status" ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden md:inline">Board</span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    title="Table view"
                    className={`h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      viewMode === "table" ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                    }`}
                  >
                    <Table2 className="w-4 h-4" />
                    <span className="hidden md:inline">Table</span>
                  </button>
                </div>
              )}

              {!showArchived && viewMode === "table" && (
                <button
                  onClick={() => {
                    const rows = tickets.filter((t) => !t.archived && matchesSearch(t));
                    downloadCsv(rows, activeTab);
                  }}
                  className="h-11 px-3 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 hover:bg-white/80 shadow-lg text-sm font-medium flex items-center gap-1.5"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Export</span>
                </button>
              )}

              <button
                onClick={() => setShowArchived((v) => !v)}
                className={`h-11 w-11 rounded-xl border shadow-lg flex items-center justify-center backdrop-blur-md ${
                  showArchived
                    ? "bg-purple-500/80 border-purple-400/80 text-white"
                    : "bg-white/70 border-white/80 text-gray-900 hover:bg-white/80"
                }`}
              >
                <Archive className="w-4 h-4" />
              </button>
              <UserMenu />
            </div>
          </div>

          {/* Mobile-only horizontal pill switcher */}
          <div className="flex gap-2 mt-3 overflow-x-auto -mx-2 px-2 lg:hidden">
            {BOARD_TYPES.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                    isActive
                      ? "bg-white text-gray-900 border-white shadow"
                      : "bg-white/20 text-white border-white/40 hover:bg-white/30"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {showArchived ? (
          <div className="flex-1 lg:min-h-0 flex flex-col mt-2">
            <ArchivedTicketsList
              tickets={archivedTickets}
              accentColor={board.color}
              onView={(t) => setSelectedTicket(t)}
              onRestore={(t) => handleRestoreTicket(t.id)}
            />
          </div>
        ) : effectiveViewMode === "table" ? (
          <div className="flex-1 lg:min-h-0 mt-2 overflow-auto pb-4">
            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <SubmissionsTable
                rows={tickets.filter((t) => !t.archived && matchesSearch(t))}
                columns={TABLE_COLUMN_CONFIG[board.key].columns}
                detailFields={TABLE_COLUMN_CONFIG[board.key].detail}
                accentColor={board.color}
                accentBg={board.bg}
                onRowClick={(row) => setSelectedTicket(row)}
              />
            )}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="relative flex-1 lg:min-h-0 mt-2">
              {canScrollLeft && (
                <button
                  onClick={() => scrollSwimlanes("left")}
                  className="lg:hidden absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 border border-white/80 shadow flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => scrollSwimlanes("right")}
                  className="lg:hidden absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 border border-white/80 shadow flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <div
                ref={swimlaneScrollRef}
                className="flex overflow-x-auto -mx-4 md:-mx-8 pl-6 pr-4 md:pl-10 md:pr-8 pb-2 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain gap-4 lg:grid lg:grid-cols-4 lg:gap-6 lg:flex-1 lg:min-h-0 lg:mx-0 lg:px-0 lg:overflow-visible"
              >
                {columns.map((col) => (
                  <div
                    key={col}
                    data-swimlane
                    className="flex-shrink-0 w-[85%] sm:w-[60%] md:w-[45%] snap-start lg:w-auto lg:snap-align-none"
                  >
                    <KanbanColumn
                      status={col}
                      tickets={getTicketsByColumn(col)}
                      onStatusChange={(ticket, newStatus) => handleStatusChange(ticket, newStatus)}
                      onTicketClick={(t) => setSelectedTicket(t)}
                      isLoading={isLoading}
                      highlightedTicketId={highlightedTicketId}
                      onArchiveSome={col === board.statuses[board.statuses.length - 1] ? handleArchiveSome : undefined}
                      onArchiveAll={col === board.statuses[board.statuses.length - 1] ? () => setArchiveAllConfirmDialog(true) : undefined}
                      onTidyUp={col === resolvedKey ? () => setShowCleanupPopup(true) : undefined}
                      viewMode={effectiveViewMode}
                      statusOptions={board.statuses}
                      boardKey={board.key}
                      unreadCountByTicket={unreadCountByTicket}
                    />
                  </div>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}

        <div className="mt-2 mb-0 flex items-center justify-center gap-3 flex-shrink-0">
          <img src={FOOTER_LOGO_URL} className="w-6 h-6 rounded shadow" alt="" />
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} Pilates in Pink™ Studio • All rights reserved</p>
        </div>
      </div>

      <StatusChangeDialog
        open={!!dragNoteDialog}
        payload={dragNoteDialog}
        onConfirm={handleDragConfirm}
        onCancel={() => setDragNoteDialog(null)}
      />
      <ConfirmDialog
        isOpen={!!archiveAllConfirmDialog}
        title="Archive all closed applications?"
        message="This will archive every closed application, including this month's."
        onConfirm={handleArchiveAllConfirm}
        onCancel={() => setArchiveAllConfirmDialog(null)}
      />
      <AlertDialogComponent
        isOpen={!!alertDialog}
        message={alertDialog?.message}
        onClose={() => setAlertDialog(null)}
      />
      <MobileSearchDialog
        open={mobileSearchDialog}
        onClose={() => setMobileSearchDialog(false)}
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={() => {}}
      />
      <ResolvedCleanupPopup
        open={showCleanupPopup}
        onOpenChange={(v) => { setShowCleanupPopup(v); if (!v) setCleanupDismissed(true); }}
        resolvedTickets={resolvedTickets}
        onMoveToClosed={handleTidyUpMove}
      />

      <SubmissionDetailModal
        open={!!selectedTicket}
        onOpenChange={(v) => {
          if (!v) {
            setSelectedTicket(null);
            setHighlightMessageId(null);
          }
        }}
        row={selectedTicket}
        tabKey={board.key}
        detailFields={DETAIL_FIELDS[board.key]}
        accentColor={board.color}
        highlightMessageId={highlightMessageId}
        markAsRead={markAsRead}
      />
    </div>
  );
}