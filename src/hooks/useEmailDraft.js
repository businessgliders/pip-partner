import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

function isEmpty(html) {
  return !(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
}

/**
 * Persists composer drafts per (ticket, user) in the EmailDraft entity.
 * - Loads existing draft on mount → returns it via `loadedDraft`.
 * - Auto-saves the latest `bodyHtml` every `autoSaveMs` (default 30s) while it's dirty.
 * - Exposes `saveNow()` and `discard()` for the close-confirm dialog.
 */
export function useEmailDraft({ ticketId, ticketType, userEmail, autoSaveMs = 30000 }) {
  const [loadedDraft, setLoadedDraft] = useState(null); // { body_html } or null
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const draftRecordIdRef = useRef(null);
  const latestHtmlRef = useRef("");
  const lastSavedHtmlRef = useRef("");
  const inFlightRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (!ticketId || !ticketType || !userEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const found = await base44.entities.EmailDraft.filter({
          ticket_id: ticketId,
          ticket_type: ticketType,
          user_email: userEmail,
        });
        if (cancelled) return;
        if (found && found.length > 0) {
          const d = found[0];
          draftRecordIdRef.current = d.id;
          lastSavedHtmlRef.current = d.body_html || "";
          setLoadedDraft({ body_html: d.body_html || "" });
          setLastSavedAt(d.last_saved_at || d.updated_date || null);
        }
      } catch (e) {
        console.error("Failed to load email draft", e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [ticketId, ticketType, userEmail]);

  const saveNow = useCallback(async (htmlArg) => {
    const html = typeof htmlArg === "string" ? htmlArg : latestHtmlRef.current;
    if (!ticketId || !ticketType || !userEmail) return;
    if (inFlightRef.current) return;
    // Nothing to do if unchanged
    if ((html || "") === (lastSavedHtmlRef.current || "")) return;
    inFlightRef.current = true;
    setStatus("saving");
    try {
      const now = new Date().toISOString();
      if (draftRecordIdRef.current) {
        if (isEmpty(html)) {
          // Empty draft → delete record
          await base44.entities.EmailDraft.delete(draftRecordIdRef.current);
          draftRecordIdRef.current = null;
        } else {
          await base44.entities.EmailDraft.update(draftRecordIdRef.current, {
            body_html: html,
            last_saved_at: now,
          });
        }
      } else if (!isEmpty(html)) {
        const created = await base44.entities.EmailDraft.create({
          ticket_id: ticketId,
          ticket_type: ticketType,
          user_email: userEmail,
          body_html: html,
          last_saved_at: now,
        });
        draftRecordIdRef.current = created?.id || null;
      }
      lastSavedHtmlRef.current = html || "";
      setLastSavedAt(now);
      setStatus("saved");
    } catch (e) {
      console.error("Failed to save draft", e);
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [ticketId, ticketType, userEmail]);

  const discard = useCallback(async () => {
    if (!draftRecordIdRef.current) {
      lastSavedHtmlRef.current = "";
      return;
    }
    try {
      await base44.entities.EmailDraft.delete(draftRecordIdRef.current);
      draftRecordIdRef.current = null;
      lastSavedHtmlRef.current = "";
      setLastSavedAt(null);
      setStatus("idle");
    } catch (e) {
      console.error("Failed to discard draft", e);
    }
  }, []);

  // Track the latest html locally; auto-save on an interval while dirty
  const trackHtml = useCallback((html) => {
    latestHtmlRef.current = html || "";
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => {
      if ((latestHtmlRef.current || "") !== (lastSavedHtmlRef.current || "")) {
        saveNow(latestHtmlRef.current);
      }
    }, autoSaveMs);
    return () => clearInterval(id);
  }, [loaded, saveNow, autoSaveMs]);

  const isDirty = useCallback(
    () => (latestHtmlRef.current || "") !== (lastSavedHtmlRef.current || ""),
    []
  );

  return {
    loadedDraft,
    loaded,
    status,
    lastSavedAt,
    trackHtml,
    saveNow,
    discard,
    isDirty,
  };
}