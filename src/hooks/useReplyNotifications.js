import { useMemo } from "react";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BOARD_TYPES } from "@/components/board/boardConfig";

const RECENT_MS = 48 * 60 * 60 * 1000; // "recently replied" window

// Influencer leads are no longer tracked in the CRM dashboard.
const CRM_BOARDS = BOARD_TYPES.filter((b) => b.key !== "influencer");

/**
 * useReplyNotifications — central source for inbound-reply notifications.
 * Returns the notification feed (inbound emails resolved to their lead),
 * unread counts per board/lead, and mark-as-read mutations.
 */
export default function useReplyNotifications() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["crm-current-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });
  const userEmail = (user?.email || "").toLowerCase();

  const { data: inbound = [] } = useQuery({
    queryKey: ["reply-notifications"],
    queryFn: () => base44.entities.EmailMessage.filter({ direction: "inbound" }, "-created_date", 300),
    refetchInterval: 30000,
    staleTime: 15000,
    enabled: !!userEmail,
  });

  // Shares the cache with CrmLeads (same queryKey).
  const ticketResults = useQueries({
    queries: CRM_BOARDS.map((b) => ({
      queryKey: ["crm-leads", b.entity],
      queryFn: () => base44.entities[b.entity].list("-created_date", 500),
      staleTime: 60000,
      enabled: !!userEmail,
    })),
  });
  const ticketData = ticketResults.map((r) => r.data);

  const derived = useMemo(() => {
    const ticketMap = {};
    CRM_BOARDS.forEach((b, i) => {
      (ticketData[i] || []).forEach((t) => {
        ticketMap[t.id] = { ticket: t, boardKey: b.key, entity: b.entity };
      });
    });
    const notifications = [];
    const unreadBySource = {};
    const unreadByTicket = {};
    const recentReplyTicketIds = new Set();
    const now = Date.now();
    inbound.forEach((m) => {
      const info = ticketMap[m.ticket_id];
      if (!info) return;
      const readBy = Array.isArray(m.read_by) ? m.read_by : [];
      const unread = !!userEmail && !readBy.some((e) => (e || "").toLowerCase() === userEmail);
      const ts = new Date(m.sent_at || m.created_date || 0).getTime();
      if (now - ts < RECENT_MS) recentReplyTicketIds.add(m.ticket_id);
      if (unread) {
        unreadBySource[info.boardKey] = (unreadBySource[info.boardKey] || 0) + 1;
        unreadByTicket[m.ticket_id] = (unreadByTicket[m.ticket_id] || 0) + 1;
      }
      notifications.push({ message: m, ticket: info.ticket, boardKey: info.boardKey, entity: info.entity, unread, ts });
    });
    notifications.sort((a, b) => b.ts - a.ts);
    const unreadTotal = Object.values(unreadBySource).reduce((a, b) => a + b, 0);
    return { notifications, unreadBySource, unreadByTicket, recentReplyTicketIds, unreadTotal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbound, userEmail, ...ticketData]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reply-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["email-messages"] });
  };

  const markRead = useMutation({
    mutationFn: (m) =>
      base44.entities.EmailMessage.update(m.id, { read_by: [...(m.read_by || []), user.email] }),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = derived.notifications.filter((n) => n.unread);
      if (!unread.length) return;
      await base44.entities.EmailMessage.bulkUpdate(
        unread.map((n) => ({ id: n.message.id, read_by: [...(n.message.read_by || []), user.email] }))
      );
    },
    onSuccess: invalidate,
  });

  // Dismiss every unread reply belonging to one lead (used by the leads
  // list inline "×" and by the email drawer when a thread is opened).
  const markTicketRead = useMutation({
    mutationFn: async (ticketId) => {
      const unread = derived.notifications.filter((n) => n.unread && n.ticket.id === ticketId);
      if (!unread.length) return;
      await base44.entities.EmailMessage.bulkUpdate(
        unread.map((n) => ({ id: n.message.id, read_by: [...(n.message.read_by || []), user.email] }))
      );
    },
    onSuccess: invalidate,
  });

  return { user, ...derived, markRead, markAllRead, markTicketRead };
}