import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";

const ACCENT = "#b67651";
const ACCENT_HOVER = "#a06a4a";

export function StatusChangeDialog({ open, onOpenChange, ticketName, fromStatus, toStatus, onConfirm }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) { setName(""); setNote(""); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-2xl bg-white/95 border-white/40 max-w-md">
        <h3 className="text-base font-semibold text-gray-900">Move application</h3>
        <p className="text-sm text-gray-600 mt-1">
          Moving <span className="font-semibold">{ticketName}</span> from{" "}
          <span className="font-semibold text-blue-600 capitalize">{fromStatus}</span> to{" "}
          <span className="font-semibold text-green-600 capitalize">{toStatus}</span>.
        </p>
        <div className="space-y-3 mt-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Your Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Note</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you moving this?" rows={3} className="mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || !note.trim()}
            onClick={() => onConfirm({ name: name.trim(), note: note.trim() })}
            style={{ background: ACCENT }}
            className="text-white hover:opacity-90 disabled:opacity-40"
          >
            Confirm Move
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="backdrop-blur-2xl bg-white/95 border-white/40 max-w-md">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm} style={{ background: ACCENT }} className="text-white hover:opacity-90">Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlertDialogComponent({ isOpen, message, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="backdrop-blur-2xl bg-white/95 border-white/40 max-w-md">
        <p className="text-sm text-gray-800">{message}</p>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} style={{ background: ACCENT }} className="text-white hover:opacity-90">OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MobileSearchDialog({ open, onOpenChange, value, onChange, onSubmit }) {
  const [local, setLocal] = useState(value || "");
  useEffect(() => { if (open) setLocal(value || ""); }, [open, value]);

  const submit = () => { onChange(local); onSubmit && onSubmit(); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-2xl bg-white/95 border-white/40 max-w-md">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Search applications</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              autoFocus
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Type to search..."
              className="pl-9"
            />
          </div>
          <Button onClick={submit} style={{ background: ACCENT }} className="text-white hover:opacity-90">Search</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ACCENT, ACCENT_HOVER };