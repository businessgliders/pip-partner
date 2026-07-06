import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";

const glass = "bg-white/95 backdrop-blur-2xl border border-white/40 pip-pop-in";

export function StatusChangeDialog({ open, payload, onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) { setName(""); setNote(""); }
  }, [open]);

  if (!payload) return null;
  const canSubmit = name.trim() && note.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel?.()}>
      <DialogContent className={`${glass} max-w-md`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Move application</h3>
        <p className="text-sm text-gray-600 mb-4">
          Moving <span className="font-medium">{payload.ticketName}</span> from{" "}
          <span className="font-medium text-blue-600">{payload.from}</span> to{" "}
          <span className="font-medium text-emerald-600">{payload.to}</span>
        </p>
        <div className="space-y-3">
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Note about this change..." value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            disabled={!canSubmit}
            onClick={() => onConfirm?.({ name: name.trim(), note: note.trim() })}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm move
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onCancel?.()}>
      <DialogContent className={`${glass} max-w-md`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800">Confirm</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlertDialogComponent({ isOpen, message, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className={`${glass} max-w-sm`}>
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800">OK</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MobileSearchDialog({ open, onClose, value, onChange, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className={`${glass} max-w-sm`}>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit?.(); onClose?.(); }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input autoFocus placeholder="Search applications..." value={value} onChange={(e) => onChange?.(e.target.value)} />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-sm rounded-md text-white hover:opacity-90"
            style={{ background: "#b67651" }}
          >
            Search
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}