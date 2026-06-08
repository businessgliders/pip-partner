import React, { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Archive, Search, ChevronsLeft, ChevronsRight } from "lucide-react";

import AdminFavicon from "../components/AdminFavicon";
import UserMenu from "../components/dashboard/UserMenu";
import NotificationCenter from "../components/admin/NotificationCenter";
import ChangelogPopup from "../components/admin/ChangelogPopup";
import useUnreadMessages from "../hooks/useUnreadMessages";
import { useAuth } from "@/lib/AuthContext";
import { MasterKanbanBoard, MasterKanbanGlassTheme } from "@/components/master-kanban";
import MasterSidePanel from "../components/board/MasterSidePanel";
import TicketCard from "../components/board/TicketCard";
import { getStatusMeta } from "../components/board/boardConfig";
import { getColumnPalette } from "../components/board/KanbanGridPalettes";
import StatusChangeDialog from "../components/board/StatusChangeDialog";

// Toggle: when true, cross-column drops open a confirmation dialog that
// captures `by_name` + `note` before applying the status change. When false,
// drops commit immediately (current behavior).
const STATUS_CHANGE_REQUIRES_DIALOG = false;
import ArchivedTicketsList from "../components/board/ArchivedTicketsList";
import ResolvedCleanupPopup from "../components/board/ResolvedCleanupPopup";
import { ConfirmDialog, AlertDialogComponent, MobileSearchDialog } from "../components/board/BoardDialogs";
import { BOARD_TYPES, displayName } from "../components/board/boardConfig";
import SubmissionDetailModal from "../components/admin/SubmissionDetailModal";
import SubmissionsTable from "../components/admin/SubmissionsTable";
import { TABLE_COLUMN_CONFIG, downloadCsv } from "../components/board/tableColumns";
import ProgramDock from "../components/board/ProgramDock";
import { LayoutGrid, Table2, Download, Map as MapIcon } from "lucide-react";
import MapView from "../components/board/MapView";

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
  const isAdmin = user?.role === "admin";
  const INFLUENCER_ONLY_EMAILS = ["info@pilatesinpinkstudio.com"];
  const isInfluencerOnly = INFLUENCER_ONLY_EMAILS.includes((user?.email || "").toLowerCase());
  const allowedBoards = useMemo(
    () => (isInfluencerOnly ? BOARD_TYPES.filter((b) => b.key === "influencer") : BOARD_TYPES),
    [isInfluencerOnly]
  );
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const defaultTab = isInfluencerOnly ? "influencer" : "franchise";
    if (isInfluencerOnly) return "influencer";
    return tabParam && BOARD_TYPES.find((b) => b.key === tabParam) ? tabParam : defaultTab;
  });

  // Force influencer-only users to influencer if they somehow ended up elsewhere
  useEffect(() => {
    if (isInfluencerOnly && activeTab !== "influencer") setActiveTab("influencer");
  }, [isInfluencerOnly, activeTab]);

  const board = useMemo(() => BOARD_TYPES.find((b) => b.key === activeTab), [activeTab]);
  const showMapView = board?.key === "franchise";

  const { unreadMessages, unreadCountByTicket, totalUnread, markAsRead } = useUnreadMessages(user?.email);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "table") return "table";
    if (v === "map") return "map";
    return "status";
  });
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showCleanupPopup, setShowCleanupPopup] = useState(false);
  const [cleanupDismissed, setCleanupDismissed] = useState(false);
  const [mobileSearchDialog, setMobileSearchDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState(null);
  const [archiveAllConfirmDialog, setArchiveAllConfirmDialog] = useState(null);
  // Franchise-only: which "step" of the funnel is shown in the main row.
  // Step one = early funnel (new → qualified). Step two = post-signing
  // (site_selection → training). Closed / ghosted are always hosted side
  // panels, never part of either step.
  const [boardStep, setBoardStep] = useState("one");
  // Optimistic manual-reorder overrides: { ticketId: indexInColumn }.
  // Set synchronously via flushSync in handleDragEnd so the new order paints
  // in the same frame @hello-pangea/dnd clears its drag transforms — react-
  // query's setQueryData does NOT flush synchronously, so without flushSync
  // there's a visible snap-back flicker.
  const [orderOverrides, setOrderOverrides] = useState({});

  // Optional cross-column confirm dialog state (only used when
  // STATUS_CHANGE_REQUIRES_DIALOG is true).
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  useEffect(() => {
    setSearchQuery("");
    setHiddenColumns([]);
    setShowArchived(false);
    setCleanupDismissed(false);
    // Map view is only available for franchise board
    if (activeTab !== "franchise") {
      setViewMode((v) => (v === "map" ? "status" : v));
    }
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

  // "table" and "map" are always available; "category" requires categoryField
  const effectiveViewMode = (viewMode === "table" || viewMode === "map")
    ? viewMode
    : (board.categoryField ? viewMode : "status");

  // Hosted side-panel statuses (closed-style buckets) — rendered as slim
  // vertical drawers anchored to the right edge of the board, NOT inside the
  // horizontal scroll row. They stay live drop targets via the shared
  // DragDropContext.
  const SIDE_PANEL_STATUSES_BY_BOARD = {
    franchise: ["ghosted", "closed"],
    instructor: ["ghosted", "declined"],
    frontadmin: ["ghosted", "declined"],
    influencer: ["declined"],
  };
  const sidePanelStatuses = (SIDE_PANEL_STATUSES_BY_BOARD[board.key] || []).filter(
    (s) => board.statuses.includes(s)
  );

  // Franchise has a two-step funnel. The vertical step toggle lets the user
  // flip the main row between "Step One" (early funnel) and "Step Two" (post-
  // signing). Closed / ghosted live in side panels regardless of step.
  const hasSteps = Array.isArray(board.stepOne) && Array.isArray(board.stepTwo);

  const stepColumns = hasSteps
    ? (boardStep === "two" ? board.stepTwo : board.stepOne)
    : null;

  const mainStatusColumns = (stepColumns || allStatusColumns).filter(
    (c) => !sidePanelStatuses.includes(c)
  );

  const columns = (effectiveViewMode === "table" || effectiveViewMode === "map")
    ? []
    : (effectiveViewMode === "status" ? mainStatusColumns : allCategoryColumns)
        .filter((c) => !hiddenColumns.includes(c));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("ticket");
    if (id && tickets.length) {
      const found = tickets.find((t) => t.id === id);
      if (found) {
        // Reset filters so the ticket is always visible underneath the modal
        setSearchQuery("");
        setHiddenColumns([]);
        setViewMode("status");
        setShowArchived(!!found.archived);
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
    const inCol = tickets.filter((t) => {
      if (t.archived) return false;
      const matchCol = effectiveViewMode === "status"
        ? t.status === column
        : (board.categoryField && t[board.categoryField] === column);
      return matchCol && matchesSearch(t);
    });

    // Sort priority:
    //  1. orderOverrides (in-flight optimistic drag result)
    //  2. manual_sort_index (any card dragged in this column → respect manual order)
    //  3. newest created first (default)
    //
    // Once ANY card in the column carries a manual_sort_index, the column is
    // considered "manually sorted" and we never auto-rearrange it. Cards
    // without an index (e.g. brand-new submissions) sort to the top by
    // created_date so newcomers appear naturally at the head of the column.
    const columnIsManuallySorted = inCol.some(
      (t) => orderOverrides[t.id] != null || t.manual_sort_index != null
    );

    const sorted = [...inCol].sort((a, b) => {
      if (columnIsManuallySorted) {
        const ovA = orderOverrides[a.id];
        const ovB = orderOverrides[b.id];
        const aIdx = ovA != null ? ovA : a.manual_sort_index;
        const bIdx = ovB != null ? ovB : b.manual_sort_index;
        const aHas = aIdx != null;
        const bHas = bIdx != null;
        if (aHas && bHas) return aIdx - bIdx;
        if (aHas) return 1;   // un-indexed (newer) goes to top
        if (bHas) return -1;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      }
      // Default: newest created first
      return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    });

    return sorted;
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

  // Persist a manual reorder for a column: writes manual_sort_index on every
  // ticket in `orderedIds` (parallel updates), then clears the optimistic
  // overrides once the query refetches.
  const persistColumnOrder = async (orderedIds) => {
    await Promise.all(
      orderedIds.map((id, idx) =>
        base44.entities[board.entity].update(id, { manual_sort_index: idx })
      )
    );
    await queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] });
    // Clear overrides after the fresh data arrives.
    setOrderOverrides((prev) => {
      const next = { ...prev };
      orderedIds.forEach((id) => { delete next[id]; });
      return next;
    });
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const ticket = tickets.find((t) => t.id === draggableId);
    if (!ticket) return;

    // ─── SAME COLUMN: manual reorder ──────────────────────────────────────
    if (destination.droppableId === source.droppableId) {
      const colTickets = getTicketsByColumn(source.droppableId);
      const reordered = [...colTickets];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // flushSync forces the optimistic order to paint in the same frame
      // @hello-pangea/dnd resets its drag transforms — without it the card
      // briefly snaps back to its old slot.
      const overrides = {};
      reordered.forEach((t, idx) => { overrides[t.id] = idx; });
      flushSync(() => {
        setOrderOverrides((prev) => ({ ...prev, ...overrides }));
      });

      persistColumnOrder(reordered.map((t) => t.id));
      return;
    }

    // ─── CROSS COLUMN: status change ──────────────────────────────────────
    if (STATUS_CHANGE_REQUIRES_DIALOG) {
      setPendingStatusChange({
        ticket,
        fromStatus: source.droppableId,
        toStatus: destination.droppableId,
      });
      return;
    }
    commitStatusChange(ticket, destination.droppableId, "", "");
  };

  const commitStatusChange = (ticket, newStatus, note = "", byName = "") => {
    const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
    const updated = [
      ...history,
      { status: newStatus, note, by_name: byName, timestamp: new Date().toISOString() },
    ];
    // Clear manual_sort_index on cross-column move so the card sorts by its
    // new column's default order rather than carrying a stale position.
    updateMutation.mutate({
      id: ticket.id,
      data: { status: newStatus, status_history: updated, manual_sort_index: null },
    });
  };

  const handleStatusChange = (ticket, newStatus, note = "", byName = "") => {
    const history = Array.isArray(ticket.status_history) ? ticket.status_history : [];
    const updated = [...history, { status: newStatus, note, by_name: byName, timestamp: new Date().toISOString() }];
    updateMutation.mutate({ id: ticket.id, data: { status: newStatus, status_history: updated } });
  };

  const handleArchiveSome = async (targetStatus) => {
    const statusKey = targetStatus || board.statuses[board.statuses.length - 1];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const targets = tickets.filter((t) => {
      if (t.archived || t.status !== statusKey) return false;
      const ts = new Date(t.updated_date || t.created_date);
      return ts.getMonth() !== currentMonth || ts.getFullYear() !== currentYear;
    });
    if (targets.length === 0) {
      setAlertDialog({ message: `No older ${statusKey} applications to archive yet.` });
      return;
    }
    await Promise.all(targets.map((t) => base44.entities[board.entity].update(t.id, { archived: true })));
    queryClient.invalidateQueries({ queryKey: ["app-board", board.entity] });
    setAlertDialog({ message: `Archived ${targets.length} application${targets.length === 1 ? "" : "s"}.` });
  };

  const handleArchiveAllConfirm = async () => {
    const statusKey = archiveAllConfirmDialog?.status || board.statuses[board.statuses.length - 1];
    const targets = tickets.filter((t) => !t.archived && t.status === statusKey);
    setArchiveAllConfirmDialog(null);
    if (targets.length === 0) {
      setAlertDialog({ message: `Nothing to archive — no ${statusKey} applications.` });
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

  const handleArchiveChange = (ticket, archived) => {
    updateMutation.mutate({ id: ticket.id, data: { archived } });
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



  return (
    <div
      className="h-screen flex flex-col px-4 md:px-8 pt-4 md:pt-8 pb-2 relative overflow-hidden"
      style={{
        backgroundImage: "linear-gradient(to bottom, #2b1a1f, #5a3a42)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <AdminFavicon title="PIP Partner — Application Board" />
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



      <ProgramDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        boards={BOARD_TYPES}
        allowedKeys={allowedBoards.map((b) => b.key)}
      />

      <div className="max-w-7xl mx-auto relative flex flex-col flex-1 w-full min-h-0" style={{ zIndex: 2 }}>
        <div className="mb-2 lg:mb-6 pb-1 lg:pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Top row: Logo + Count on mobile, Top row with buttons on desktop */}
            <div className="flex items-center justify-between lg:gap-3 lg:flex-row">
              <Link
                to="/Settings"
                onClick={() => { setShowArchived(false); setSearchQuery(""); setViewMode("status"); }}
              >
                <img src={LOGO_URL} alt="Pilates in Pink" className="h-12 md:h-16 drop-shadow-xl hover:scale-105 transition-transform" />
              </Link>
              {/* Mobile-only count text */}
              <div className="text-white text-xs font-medium drop-shadow md:hidden">
                {showArchived ? (
                  <>{archivedTickets.length} archived applications</>
                ) : (
                  <>{activeCount} active applications</>
                )}
              </div>

              {/* Tablet-only (md → lg): Search + View filter centered */}
              <div className="hidden md:flex lg:hidden items-center justify-center gap-2 flex-1">
                <button
                  onClick={() => setMobileSearchDialog(true)}
                  title="Search"
                  className="h-10 w-10 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 hover:bg-white/80 shadow-lg flex items-center justify-center"
                >
                  <Search className="w-4 h-4" />
                </button>
                {!showArchived && (
                  <div className="h-10 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 shadow-lg flex items-center p-1 gap-1">
                    <button
                      onClick={() => setViewMode("status")}
                      title="Board view"
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        viewMode === "status" ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      title="Table view"
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        viewMode === "table" ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                      }`}
                    >
                      <Table2 className="w-4 h-4" />
                    </button>
                    {showMapView && (
                      <button
                        onClick={() => setViewMode("map")}
                        title="Map view"
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                          viewMode === "map" ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                        }`}
                      >
                        <MapIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowArchived((v) => !v)}
                      title="Archived"
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        showArchived ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                      }`}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {showArchived && (
                  <button
                    onClick={() => setShowArchived(false)}
                    title="Back to board"
                    className="h-10 px-3 rounded-xl backdrop-blur-md bg-purple-500/80 border border-purple-400/80 text-white shadow-lg flex items-center gap-1.5 text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archived</span>
                  </button>
                )}
              </div>

              {/* Tablet-only: Notification bell + user menu (right side) */}
              <div className="hidden md:flex lg:hidden items-center gap-2">
                <ChangelogPopup user={user} />
                <NotificationCenter
                  unreadMessages={unreadMessages}
                  totalUnread={totalUnread}
                  markAsRead={markAsRead}
                  onSelect={(ticket, messageId, tabKey) => {
                    if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
                    setSearchQuery("");
                    setHiddenColumns([]);
                    setViewMode("status");
                    setShowArchived(!!ticket?.archived);
                    setHighlightedTicketId(ticket?.id || null);
                    setTimeout(() => setHighlightedTicketId(null), 3000);
                    setHighlightMessageId(messageId);
                    setSelectedTicket(ticket);
                  }}
                />
                <UserMenu />
              </div>

              {/* Notification bell + user menu on mobile, top right */}
              <div className="md:hidden flex items-center gap-1">
                <ChangelogPopup user={user} />
                <NotificationCenter
                  unreadMessages={unreadMessages}
                  totalUnread={totalUnread}
                  markAsRead={markAsRead}
                  onSelect={(ticket, messageId, tabKey) => {
                    if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
                    setSearchQuery("");
                    setHiddenColumns([]);
                    setViewMode("status");
                    setShowArchived(!!ticket?.archived);
                    setHighlightedTicketId(ticket?.id || null);
                    setTimeout(() => setHighlightedTicketId(null), 3000);
                    setHighlightMessageId(messageId);
                    setSelectedTicket(ticket);
                  }}
                />
                <UserMenu />
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="text-white text-xs md:text-sm font-medium drop-shadow">
                {showArchived ? (
                  <>{archivedTickets.length} archived applications</>
                ) : (
                  <>{activeCount} active applications · {firstColumnCount} in {firstColumn || "—"}</>
                )}
              </div>
            </div>

            <div className="hidden lg:flex flex-wrap items-center gap-3 max-w-7xl lg:mr-16">
               {/* Search */}
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

               {/* View Filter */}
               <div className="h-11 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 shadow-lg flex items-center p-1 gap-1 ml-3">
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
                   {showMapView && (
                     <button
                       onClick={() => setViewMode("map")}
                       title="Map view"
                       className={`h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                         viewMode === "map" ? "bg-white text-gray-900 shadow" : "text-gray-700 hover:bg-white/60"
                       }`}
                     >
                       <MapIcon className="w-4 h-4" />
                       <span className="hidden md:inline">Map</span>
                     </button>
                   )}
                 </div>

               {!showArchived && viewMode === "table" && (
                 <button
                   onClick={() => {
                     if (!isAdmin) return;
                     const rows = tickets.filter((t) => !t.archived && matchesSearch(t));
                     downloadCsv(rows, activeTab);
                   }}
                   disabled={!isAdmin}
                   className={`h-11 px-3 rounded-xl backdrop-blur-md border shadow-lg text-sm font-medium flex items-center gap-1.5 ${
                     isAdmin
                       ? "bg-white/70 border-white/80 text-gray-900 hover:bg-white/80"
                       : "bg-white/30 border-white/40 text-gray-500 cursor-not-allowed opacity-50"
                   }`}
                   title={isAdmin ? "Export CSV" : "Export CSV — admin access only"}
                 >
                   <Download className="w-4 h-4" />
                   <span className="hidden md:inline">Export</span>
                 </button>
               )}

               {/* Archive */}
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

               {/* Changelog */}
               <ChangelogPopup user={user} />

               {/* Notification Bell */}
               <NotificationCenter
                 unreadMessages={unreadMessages}
                 totalUnread={totalUnread}
                 markAsRead={markAsRead}
                 onSelect={(ticket, messageId, tabKey) => {
                   if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
                   // Reset filters so the ticket is visible underneath the modal
                   setSearchQuery("");
                   setHiddenColumns([]);
                   setViewMode("status");
                   setShowArchived(!!ticket?.archived);
                   setHighlightedTicketId(ticket?.id || null);
                   setTimeout(() => setHighlightedTicketId(null), 3000);
                   setHighlightMessageId(messageId);
                   setSelectedTicket(ticket);
                 }}
               />

               {/* User Switcher - desktop only */}
               <UserMenu />
               </div>
              </div>

          {/* Mobile-only horizontal pill switcher */}
          <div className={`flex gap-2 mt-6 mb-1 -mx-2 px-2 lg:hidden ${allowedBoards.length <= 1 ? "hidden" : ""}`}>
            {allowedBoards.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 min-w-0 px-2 py-1.5 rounded-full text-[10px] sm:text-xs font-medium border transition-all whitespace-nowrap ${
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
                storageKey={board.key}
              />
            )}
          </div>
        ) : effectiveViewMode === "map" ? (
          <MapView
            tickets={tickets.filter((t) => !t.archived && matchesSearch(t))}
            accentColor={board.color}
            statusOrder={board.statuses}
            onTicketClick={(t) => setSelectedTicket(t)}
          />
        ) : (
          <>
            {/* Mobile-only Step One / Step Two underline tabs (franchise only).
                Rendered OUTSIDE .board-height-wrap so they don't steal vertical
                space from the swimlane viewport (which is height-locked). */}
            {hasSteps && effectiveViewMode === "status" && (() => {
              const stepOneCount = (board.stepOne || []).reduce(
                (acc, s) => acc + getTicketsByColumn(s).length,
                0
              );
              const stepTwoCount = (board.stepTwo || []).reduce(
                (acc, s) => acc + getTicketsByColumn(s).length,
                0
              );
              return (
                <div className="flex -mt-1 mb-1 -mx-2 px-2 border-b border-white/20 lg:hidden">
                  <button
                    onClick={() => setBoardStep("one")}
                    className={`flex-1 px-1 py-1.5 text-[11px] font-medium transition-all flex items-center justify-center gap-1 border-b-2 -mb-px ${
                      boardStep === "one"
                        ? "text-white border-b-white"
                        : "text-white/60 border-b-transparent hover:text-white/80"
                    }`}
                  >
                    <span>Step One</span>
                    {stepOneCount > 0 && (
                      <span className="text-[10px] font-semibold">({stepOneCount})</span>
                    )}
                  </button>
                  <button
                    onClick={() => setBoardStep("two")}
                    className={`flex-1 px-1 py-1.5 text-[11px] font-medium transition-all flex items-center justify-center gap-1 border-b-2 -mb-px ${
                      boardStep === "two"
                        ? "text-white border-b-white"
                        : "text-white/60 border-b-transparent hover:text-white/80"
                    }`}
                  >
                    <span>Step Two</span>
                    {stepTwoCount > 0 && (
                      <span className="text-[10px] font-semibold">({stepTwoCount})</span>
                    )}
                  </button>
                </div>
              );
            })()}
          <div className="board-height-wrap flex-1 min-h-0 mt-1 lg:mt-2">
            {(() => {
              const masterColumns = columns.map((col) => {
                const meta = getStatusMeta(board.key, col);
                const palette = getColumnPalette(board.key, col);
                return {
                  status: meta?.label || col,
                  statusKey: col,
                  tickets: getTicketsByColumn(col),
                  colorClasses: palette.colorClasses,
                  headerClasses: palette.headerClasses,
                  description: meta?.description,
                  emptyLabel: "No applications",
                };
              });
              // Translate Master's label-keyed onDragEnd back to the raw status key.
              const labelToKey = Object.fromEntries(masterColumns.map((c) => [c.status, c.statusKey]));
              const onDragEnd = (result) => {
                if (!result?.destination) return handleDragEnd(result);
                const rebuilt = {
                  ...result,
                  source: { ...result.source, droppableId: labelToKey[result.source.droppableId] || result.source.droppableId },
                  destination: { ...result.destination, droppableId: labelToKey[result.destination.droppableId] || result.destination.droppableId },
                };
                handleDragEnd(rebuilt);
              };
              // Map labelToKey for the translator AND build the side panels.
              const renderTicketCard = (ticket) => (
                <TicketCard
                  ticket={ticket}
                  onStatusChange={(t, newStatus) => handleStatusChange(t, newStatus)}
                  onArchiveChange={handleArchiveChange}
                  isDragging={false}
                  isHighlighted={ticket.id === highlightedTicketId}
                  viewMode="status"
                  statusOptions={board.statuses}
                  boardKey={board.key}
                  unreadCount={unreadCountByTicket[ticket.id] || 0}
                />
              );

              const sidePanelsNode = sidePanelStatuses.length > 0 && effectiveViewMode === "status" ? (
                <>
                  {sidePanelStatuses.map((s, idx) => {
                    const meta = getStatusMeta(board.key, s);
                    const palette = getColumnPalette(board.key, s);
                    // Position grabbers at bottom-right, stacked vertically
                    // idx=0 is the topmost grabber, so offset it higher
                    const align = `bottom-${idx}`;  // e.g. "bottom-0", "bottom-1"
                    return (
                      <MasterSidePanel
                        key={s}
                        statusKey={s}
                        status={meta?.label || s}
                        description={meta?.description}
                        tickets={getTicketsByColumn(s)}
                        colorClasses={palette.colorClasses}
                        headerClasses={palette.headerClasses}
                        highlightedTicketId={highlightedTicketId}
                        unreadByTicket={unreadCountByTicket}
                        onTicketClick={(t) => setSelectedTicket(t)}
                        renderCardContent={renderTicketCard}
                        onArchiveSome={() => handleArchiveSome(s)}
                        onArchiveAll={() => setArchiveAllConfirmDialog({ status: s })}
                        verticalAlign={align}
                      />
                    );
                  })}
                </>
              ) : null;

              // Franchise Step One / Step Two vertical handle (desktop).
              const stepTwoCount = hasSteps
                ? (board.stepTwo || []).reduce((acc, s) => acc + getTicketsByColumn(s).length, 0)
                : 0;
              const showStepBadge = hasSteps && boardStep === "one" && stepTwoCount > 0;
              const stepOverlay = hasSteps && effectiveViewMode === "status" && !showArchived ? (
                <button
                  onClick={() => setBoardStep((s) => (s === "one" ? "two" : "one"))}
                  title={boardStep === "one" ? "Show Step Two" : "Back to Step One"}
                  className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-30 flex-col items-center justify-center gap-1.5 px-2 py-4 rounded-l-xl backdrop-blur-md bg-white/20 border border-r-0 border-white/30 shadow-lg text-white hover:bg-white/30 transition-all ${
                    boardStep === "one" ? "right-0" : "left-0"
                  }`}
                  style={{
                    writingMode: "vertical-rl",
                    transform: boardStep === "one"
                      ? "translateY(-50%) rotate(180deg)"
                      : "translateY(-50%)",
                  }}
                >
                  <span className="text-[10px] font-semibold tracking-wider uppercase">
                    {boardStep === "one" ? "Step Two" : "Step One"}
                  </span>
                  <div className="flex items-center gap-1">
                    {boardStep === "one" ? (
                      <ChevronsLeft className="w-4 h-4" />
                    ) : (
                      <ChevronsRight className="w-4 h-4" />
                    )}
                    {showStepBadge && (
                      <span
                        className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[8px] font-bold text-gray-900"
                        style={{ writingMode: "horizontal-tb", transform: "rotate(180deg)" }}
                      >
                        {stepTwoCount}
                      </span>
                    )}
                  </div>
                </button>
              ) : null;

              // Reserve right-edge gutter for side panels so the scroll row
              // doesn't slide under them. When the step handle is visible on
              // the LEFT (step two), reserve a small gutter there too.
              const gutterRight = sidePanelStatuses.length > 0 || (hasSteps && boardStep === "one") ? "lg:pr-12" : "";
              const gutterLeft = hasSteps && boardStep === "two" ? "lg:pl-12" : "";

              return (
                <MasterKanbanBoard
                  className={`h-full ${gutterRight} ${gutterLeft}`}
                  columns={masterColumns}
                  isLoading={isLoading}
                  highlightedTicketId={highlightedTicketId}
                  unreadByTicket={unreadCountByTicket}
                  onTicketClick={(t) => setSelectedTicket(t)}
                  onDragEnd={onDragEnd}
                  renderCardContent={renderTicketCard}
                  sidePanels={sidePanelsNode}
                  overlay={stepOverlay}
                  getActions={(label) => {
                    const statusKey = labelToKey[label];
                    // Bulk actions only appear on the resolved / closing-style columns.
                    const isClosingCol = ["closed", "ghosted", "declined"].includes(statusKey);
                    if (!isClosingCol) return {};
                    return {
                      onArchiveSome: () => handleArchiveSome(statusKey),
                      onArchiveAll: () => setArchiveAllConfirmDialog({ status: statusKey }),
                    };
                  }}
                />
              );
            })()}
            <MasterKanbanGlassTheme />
          </div>
          </>
        )}

        <div className="mt-2 mb-0 flex items-center justify-center gap-3 flex-shrink-0">
          <img src={FOOTER_LOGO_URL} className="w-6 h-6 rounded shadow" alt="" />
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} Pilates in Pink™ Studio • All rights reserved</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!archiveAllConfirmDialog}
        title={`Archive all ${archiveAllConfirmDialog?.status || "closed"} applications?`}
        message={`This will archive every ${archiveAllConfirmDialog?.status || "closed"} application, including this month's.`}
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

      <StatusChangeDialog
        open={!!pendingStatusChange}
        onOpenChange={(v) => { if (!v) setPendingStatusChange(null); }}
        ticketName={pendingStatusChange?.ticket?._display_name}
        fromStatus={pendingStatusChange?.fromStatus}
        toStatus={pendingStatusChange?.toStatus}
        defaultByName={user?.full_name || ""}
        onCancel={() => setPendingStatusChange(null)}
        onConfirm={({ byName, note }) => {
          if (pendingStatusChange?.ticket) {
            commitStatusChange(
              pendingStatusChange.ticket,
              pendingStatusChange.toStatus,
              note,
              byName
            );
          }
          setPendingStatusChange(null);
        }}
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