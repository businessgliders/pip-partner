import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/**
 * StatusChangeDialog — optional confirmation dialog for cross-column drag.
 *
 * Captures `by_name` and `note` and appends a structured entry to
 * `status_history` when confirmed. Disabled by default; turn on by setting
 * STATUS_CHANGE_REQUIRES_DIALOG = true in ApplicationBoard.
 */
export default function StatusChangeDialog({
  open,
  onOpenChange,
  ticketName,
  fromStatus,
  toStatus,
  defaultByName = "",
  onConfirm,
  onCancel,
}) {
  const [byName, setByName] = useState(defaultByName);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setByName(defaultByName);
      setNote("");
    }
  }, [open, defaultByName]);

  const handleConfirm = () => {
    onConfirm?.({ byName: byName.trim(), note: note.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md pip-pop-in">
        <DialogHeader>
          <DialogTitle>Move to {toStatus}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{ticketName}</span> will move from{" "}
            <span className="font-medium">{fromStatus}</span> to{" "}
            <span className="font-medium">{toStatus}</span>.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Your name</label>
            <Input
              value={byName}
              onChange={(e) => setByName(e.target.value)}
              placeholder="Who's making this change?"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Reason / note</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional context for the status change..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!byName.trim()}>
            Confirm move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}