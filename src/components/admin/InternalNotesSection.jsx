import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InternalNotesSection({ notes = [], onAddNote, accentColor, large = false }) {
  const [expanded, setExpanded] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [openNote, setOpenNote] = useState(null);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    setIsAdding(true);
    await onAddNote(newNote.trim());
    setNewNote("");
    setIsAdding(false);
  };

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
            Internal Notes
          </span>
          {notes.length > 0 && (
            <span
              className="text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center text-white"
              style={{ background: accentColor }}
            >
              {notes.length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Existing notes */}
          {notes.length > 0 && (
            <div className={`space-y-2 overflow-y-auto ${large ? "max-h-[420px]" : "max-h-48"}`}>
              {[...notes].reverse().map((note, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-lg p-3 border border-slate-100 cursor-pointer hover:bg-slate-100 transition"
                  onClick={() => setOpenNote(note)}
                >
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3">
                    {note.comment}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {note.user_name || note.user_email?.split("@")[0] || "Staff"}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      {note.timestamp ? formatRelativeTime(note.timestamp) : ""}
                      <Maximize2 className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add an internal note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className={`resize-none text-sm bg-white ${large ? "min-h-[100px]" : "min-h-[60px]"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!newNote.trim() || isAdding}
              className="h-10 w-10 shrink-0 self-end"
              style={{ background: accentColor }}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">Press ⌘+Enter to submit</p>
        </div>
      )}

      <Dialog open={!!openNote} onOpenChange={(o) => !o && setOpenNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Internal Note</DialogTitle>
          </DialogHeader>
          {openNote && (
            <>
              <div className="text-xs text-slate-500 border-b pb-3">
                <strong>{openNote.user_name || openNote.user_email?.split("@")[0] || "Staff"}</strong>
                {openNote.timestamp && (
                  <> · {new Date(openNote.timestamp).toLocaleString()}</>
                )}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
                {openNote.comment}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}