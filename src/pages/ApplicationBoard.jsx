import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Archive, Search, ChevronLeft, ChevronRight, Settings as SettingsIcon, Home as HomeIcon, ChevronsRight, ChevronsLeft } from "lucide-react";

import UserMenu from "../components/dashboard/UserMenu";
import NotificationCenter from "../components/admin/NotificationCenter";
import ChangelogPopup from "../components/admin/ChangelogPopup";
import useUnreadMessages from "../hooks/useUnreadMessages";
import { useAuth } from "@/lib/AuthContext";
import KanbanColumn from "../components/board/KanbanColumn";
import ClosedSidePanel from "../components/board/ClosedSidePanel";
import ArchivedTicketsList from "../components/board/ArchivedTicketsList";
import ResolvedCleanupPopup from "../components/board/ResolvedCleanupPopup";
import { StatusChangeDialog, ConfirmDialog, AlertDialogComponent, MobileSearchDialog } from "../components/board/BoardDialogs";
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
  const allowedBoards = useMemo(
    () => (isAdmin ? BOARD_TYPES : BOARD_TYPES.filter((b) => b.key === "influencer")),
    [isAdmin]
  );
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const defaultTab = isAdmin ? "franchise" : "influencer";
    if (!isAdmin) return "influencer";
    return tabParam && BOARD_TYPES.find((b) => b.key === tabParam) ? tabParam : defaultTab;
  });

  // Force non-admins to influencer if they somehow ended up elsewhere
  useEffect(() => {
    if (!isAdmin && activeTab !== "influencer") setActiveTab("influencer");
  }, [isAdmin, activeTab]);

  const board = useMemo(() => BOARD_TYPES.find((b) => b.key === activeTab), [activeTab]);
  const showMapView = board?.key === "franchise";

  const { unreadMessages, unreadCountByTicket, totalUnread, markAsRead } = useUnreadMessages(user?.email);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState(null);
  const [dragNoteDialog, setDragNoteDialog] = useState(null);
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [boardStep, setBoardStep] = useState("one"); // "one" | "two" — only used when board defines stepOne/stepTwo
  const [mobilePage, setMobilePage] = useState(0); // mobile-only swimlane pagination (2 columns per page)
  const swimlaneScrollRef = useRef(null);

  useEffect(() => {
    setSearchQuery("");
    setHiddenColumns([]);
    setShowArchived(false);
    setCleanupDismissed(false);
    setBoardStep("one");
    setMobilePage(0);
    // Map view is only available for franchise board
    if (activeTab !== "franchise") {
      setViewMode((v) => (v === "map" ? "status" : v));
    }
  }, [activeTab]);

  // Reset mobile pagination when the visible column set changes
  useEffect(() => {
    setMobilePage(0);
  }, [boardStep, viewMode, showArchived]);

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

  // "table" and "map" are always available; "category" requires categoryField
  const effectiveViewMode = (viewMode === "table" || viewMode === "map")
    ? viewMode
    : (board.categoryField ? viewMode : "status");

  // The last status (closed / declined) and "ghosted" are rendered in a side
  // panel, not in the main swimlane grid — so split them out here.
  const SIDE_PANEL_KEYS = new Set(["ghosted"]);
  const sidePanelStatuses = useMemo(() => {
    if (effectiveViewMode !== "status") return [];
    const last = allStatusColumns[allStatusColumns.length - 1];
    const ghosted = allStatusColumns.filter((s) => SIDE_PANEL_KEYS.has(s) && s !== last);
    return [last, ...ghosted].filter(Boolean);
  }, [effectiveViewMode, allStatusColumns]);

  // If the board defines stepOne/stepTwo, the main grid swaps between them.
  const hasSteps = Array.isArray(board.stepOne) && Array.isArray(board.stepTwo);
  const mainStatusColumns =
    effectiveViewMode === "status"
      ? (hasSteps
          ? (boardStep === "one" ? board.stepOne : board.stepTwo)
          : allStatusColumns.filter((s) => !sidePanelStatuses.includes(s)))
      : allStatusColumns;

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



      <ProgramDock activeTab={activeTab} onTabChange={setActiveTab} boards={allowedBoards} />

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

          {/* Mobile-only Step One / Step Two underline tabs (full width) */}
          {hasSteps && !showArchived && effectiveViewMode === "status" && (() => {
            const stepTwoCount = (board.stepTwo || []).reduce(
              (acc, s) => acc + getTicketsByColumn(s).length,
              0
            );
            const stepOneCount = (board.stepOne || []).reduce(
              (acc, s) => acc + getTicketsByColumn(s).length,
              0
            );
            return (
              <div className="flex mt-2 -mx-2 px-2 border-b border-white/20 lg:hidden">
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

          {/* Legacy Step switcher block (now unused — kept hidden to avoid layout shift) */}
          {false && hasSteps && !showArchived && effectiveViewMode === "status" && (() => {
            const stepTwoCount = 0;
            const stepOneCount = 0;
            return (
              <div className="flex gap-1.5 mt-2 -mx-2 px-2 hidden">
                <button
                  onClick={() => setBoardStep("one")}
                  className={`flex-1 px-1.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
                    boardStep === "one"
                      ? "bg-white/90 text-gray-900 border-white"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/15"
                  }`}
                >
                  Step One
                  {stepOneCount > 0 && (
                    <span className={`min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-semibold flex items-center justify-center ${
                      boardStep === "one" ? "bg-gray-900 text-white" : "bg-white/60 text-gray-900"
                    }`}>
                      {stepOneCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setBoardStep("two")}
                  className={`flex-1 px-1.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
                    boardStep === "two"
                      ? "bg-white/90 text-gray-900 border-white"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/15"
                  }`}
                >
                  {stepTwoCount > 0 ? (
                    <>
                      <span>{stepTwoCount}</span>
                      <span>Step Two</span>
                    </>
                  ) : (
                    "Step Two"
                  )}
                </button>
              </div>
            );
          })()}
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
        ) : effectiveViewMode === "map" ? (
          <MapView
            tickets={tickets.filter((t) => !t.archived && matchesSearch(t))}
            accentColor={board.color}
            statusOrder={board.statuses}
            onTicketClick={(t) => setSelectedTicket(t)}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="relative flex-1 min-h-0 mt-1 lg:mt-2">

              {hasSteps && (() => {
                const stepTwoCount = (board.stepTwo || []).reduce(
                  (acc, s) => acc + getTicketsByColumn(s).length,
                  0
                );
                const showBadge = boardStep === "one" && stepTwoCount > 0;
                return (
                  <button
                    onClick={() => setBoardStep((s) => (s === "one" ? "two" : "one"))}
                    title={boardStep === "one" ? "Show Step Two" : "Back to Step One"}
                    className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 flex-col items-center justify-center gap-1.5 px-2 py-4 rounded-l-xl backdrop-blur-md bg-white/20 border border-r-0 border-white/30 shadow-lg text-white hover:bg-white/30 transition-all ${
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
                      {showBadge && (
                        <span
                          className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[8px] font-bold text-gray-900"
                          style={{ writingMode: "horizontal-tb", transform: "rotate(180deg)" }}
                        >
                          {stepTwoCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })()}

              <div
                ref={swimlaneScrollRef}
                className={`relative h-full min-h-0 overflow-hidden pb-2 lg:flex-1 ${
                  hasSteps && boardStep === "two" ? "lg:pl-16 lg:pr-0" : "lg:pl-0 lg:pr-16"
                }`}
              >
                {(() => {
                  const MOBILE_PAGE_SIZE = 2;
                  const totalPages = Math.max(1, Math.ceil(columns.length / MOBILE_PAGE_SIZE));
                  const safePage = Math.min(mobilePage, totalPages - 1);
                  const mobileStart = safePage * MOBILE_PAGE_SIZE;
                  const mobileColumns = columns.slice(mobileStart, mobileStart + MOBILE_PAGE_SIZE);
                  const canPrev = safePage > 0;
                  const canNext = safePage < totalPages - 1;

                  const renderColumn = (col) => (
                    <div key={col} data-swimlane className="min-w-0 h-full">
                      <KanbanColumn
                        status={col}
                        tickets={getTicketsByColumn(col)}
                        onStatusChange={(ticket, newStatus) => handleStatusChange(ticket, newStatus)}
                        onArchiveChange={handleArchiveChange}
                        onTicketClick={(t) => setSelectedTicket(t)}
                        isLoading={isLoading}
                        highlightedTicketId={highlightedTicketId}
                        viewMode={effectiveViewMode}
                        statusOptions={board.statuses}
                        boardKey={board.key}
                        unreadCountByTicket={unreadCountByTicket}
                      />
                    </div>
                  );

                  const desktopGrid = hasSteps ? (
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={boardStep}
                        initial={{ x: boardStep === "two" ? "100%" : "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: boardStep === "two" ? "-100%" : "100%", opacity: 0 }}
                        transition={{ type: "tween", ease: "easeInOut", duration: 0.35 }}
                        className="hidden lg:grid grid-cols-4 gap-6 h-full"
                      >
                        {columns.map(renderColumn)}
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="hidden lg:grid grid-cols-4 gap-6 h-full">
                      {columns.map(renderColumn)}
                    </div>
                  );

                  return (
                    <>
                      {desktopGrid}

                      {/* Mobile/tablet: 2 columns per page with arrow nav */}
                      <div className="lg:hidden h-full flex flex-col">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={`${boardStep}-${safePage}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 gap-1.5 md:gap-3 flex-1 min-h-0"
                          >
                            {mobileColumns.map(renderColumn)}
                          </motion.div>
                        </AnimatePresence>
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-3 mt-2 flex-shrink-0">
                            <button
                              onClick={() => setMobilePage((p) => Math.max(0, p - 1))}
                              disabled={!canPrev}
                              className="h-8 w-8 rounded-full backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 shadow-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Previous columns"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setMobilePage(i)}
                                  className={`h-1.5 rounded-full transition-all ${
                                    i === safePage ? "w-5 bg-white" : "w-1.5 bg-white/40"
                                  }`}
                                  title={`Page ${i + 1}`}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => setMobilePage((p) => Math.min(totalPages - 1, p + 1))}
                              disabled={!canNext}
                              className="h-8 w-8 rounded-full backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 shadow-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Next columns"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {sidePanelStatuses.length > 0 && (
              <div className="hidden lg:block">
                <ClosedSidePanel
                  statuses={sidePanelStatuses.map((s) => ({
                    status: s,
                    tickets: getTicketsByColumn(s),
                    onArchiveSome: () => handleArchiveSome(s),
                    onArchiveAll: () => setArchiveAllConfirmDialog({ status: s }),
                  }))}
                  onStatusChange={(ticket, newStatus) => handleStatusChange(ticket, newStatus)}
                  onArchiveChange={handleArchiveChange}
                  onTicketClick={(t) => setSelectedTicket(t)}
                  isLoading={isLoading}
                  highlightedTicketId={highlightedTicketId}
                  viewMode={effectiveViewMode}
                  statusOptions={board.statuses}
                  boardKey={board.key}
                  unreadCountByTicket={unreadCountByTicket}
                />
              </div>
            )}

            {/* Mobile: Bottom-right floating panel for closed/ghosted */}
            {sidePanelStatuses.length > 0 && (
              <div className="block lg:hidden">
                <ClosedSidePanel
                  statuses={sidePanelStatuses.map((s) => ({
                    status: s,
                    tickets: getTicketsByColumn(s),
                    onArchiveSome: () => handleArchiveSome(s),
                    onArchiveAll: () => setArchiveAllConfirmDialog({ status: s }),
                  }))}
                  onStatusChange={(ticket, newStatus) => handleStatusChange(ticket, newStatus)}
                  onArchiveChange={handleArchiveChange}
                  onTicketClick={(t) => setSelectedTicket(t)}
                  isLoading={isLoading}
                  highlightedTicketId={highlightedTicketId}
                  viewMode={effectiveViewMode}
                  statusOptions={board.statuses}
                  boardKey={board.key}
                  unreadCountByTicket={unreadCountByTicket}
                />
              </div>
            )}
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