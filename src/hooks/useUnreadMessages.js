import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Tracks unread inbound emails per current user across all tickets.
 *
 * @param {string} userEmail - the logged in staff user's email
 * @returns {{
 *   unreadMessages: Array,
 *   unreadCountByTicket: Record<string, number>,
 *   totalUnread: number,
 *   markAsRead: (messageId: string) => Promise<void>,
 *   isLoading: boolean,
 * }}
 */
export default function useUnreadMessages(userEmail) {
  const queryClient = useQueryClient();
  const normalizedEmail = (userEmail || "").toLowerCase().trim();

  const queryKey = ["unread-messages"];

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      base44.entities.EmailMessage.filter(
        { direction: "inbound" },
        "-sent_at",
        500
      ),
    refetchInterval: 10000,
    enabled: !!normalizedEmail,
  });

  const unreadMessages = useMemo(() => {
    if (!normalizedEmail) return [];
    return messages.filter((m) => {
      if (m.direction !== "inbound") return false;
      const readBy = Array.isArray(m.read_by) ? m.read_by : [];
      return !readBy.some((e) => (e || "").toLowerCase() === normalizedEmail);
    });
  }, [messages, normalizedEmail]);

  const unreadCountByTicket = useMemo(() => {
    const counts = {};
    for (const m of unreadMessages) {
      if (!m.ticket_id) continue;
      counts[m.ticket_id] = (counts[m.ticket_id] || 0) + 1;
    }
    return counts;
  }, [unreadMessages]);

  const totalUnread = unreadMessages.length;

  const markAsRead = useCallback(
    async (messageId) => {
      if (!messageId || !normalizedEmail) return;

      const current = queryClient.getQueryData(queryKey) || [];
      const target = current.find((m) => m.id === messageId);
      if (!target) return;

      const existingReadBy = Array.isArray(target.read_by) ? target.read_by : [];
      // Idempotent — skip if already read
      if (existingReadBy.some((e) => (e || "").toLowerCase() === normalizedEmail)) {
        return;
      }

      const newReadBy = [...existingReadBy, normalizedEmail];
      const existingReadAt = Array.isArray(target.read_at) ? target.read_at : [];
      const newReadAt = [
        ...existingReadAt,
        { email: normalizedEmail, timestamp: new Date().toISOString() },
      ];

      // Optimistic cache update — badge disappears immediately
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map((m) =>
          m.id === messageId ? { ...m, read_by: newReadBy, read_at: newReadAt } : m
        )
      );

      try {
        await base44.entities.EmailMessage.update(messageId, {
          read_by: newReadBy,
          read_at: newReadAt,
        });
      } catch (e) {
        // Rollback on failure
        queryClient.setQueryData(queryKey, (old = []) =>
          old.map((m) => (m.id === messageId ? target : m))
        );
        throw e;
      }
    },
    [normalizedEmail, queryClient]
  );

  const markAllAsRead = useCallback(
    async (messageIds) => {
      if (!normalizedEmail) return;
      const current = queryClient.getQueryData(queryKey) || [];
      const idSet = messageIds ? new Set(messageIds) : null;
      const targets = current.filter((m) => {
        if (idSet && !idSet.has(m.id)) return false;
        if (m.direction !== "inbound") return false;
        const readBy = Array.isArray(m.read_by) ? m.read_by : [];
        return !readBy.some((e) => (e || "").toLowerCase() === normalizedEmail);
      });
      if (targets.length === 0) return;

      const nowIso = new Date().toISOString();
      const updates = targets.map((t) => {
        const newReadBy = [...(Array.isArray(t.read_by) ? t.read_by : []), normalizedEmail];
        const newReadAt = [
          ...(Array.isArray(t.read_at) ? t.read_at : []),
          { email: normalizedEmail, timestamp: nowIso },
        ];
        return { id: t.id, read_by: newReadBy, read_at: newReadAt };
      });

      // Optimistic update
      queryClient.setQueryData(queryKey, (old = []) =>
        old.map((m) => {
          const u = updates.find((x) => x.id === m.id);
          return u ? { ...m, read_by: u.read_by, read_at: u.read_at } : m;
        })
      );

      try {
        await Promise.all(
          updates.map((u) =>
            base44.entities.EmailMessage.update(u.id, {
              read_by: u.read_by,
              read_at: u.read_at,
            })
          )
        );
      } catch (e) {
        queryClient.invalidateQueries({ queryKey });
        throw e;
      }
    },
    [normalizedEmail, queryClient]
  );

  return {
    unreadMessages,
    unreadCountByTicket,
    totalUnread,
    markAsRead,
    markAllAsRead,
    isLoading,
  };
}