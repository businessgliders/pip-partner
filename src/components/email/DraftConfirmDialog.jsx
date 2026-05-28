import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Trash2, FileEdit } from "lucide-react";

/**
 * Beautiful close-confirm dialog for the email composer.
 * Three actions: Save draft (default), Discard, Keep editing (cancel).
 */
export default function DraftConfirmDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  onKeepEditing,
  saving = false,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-pink-50 via-amber-50 to-white px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-pink-600" />
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-semibold text-gray-900">
                You have unsaved changes
              </DialogTitle>
            </DialogHeader>
          </div>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed">
            Would you like to save this reply as a draft so you can pick up where you left
            off, or discard it?
          </DialogDescription>
        </div>
        <DialogFooter className="px-6 py-4 bg-white border-t border-gray-100 gap-2 sm:gap-2 flex-row flex-wrap sm:justify-between">
          <Button
            variant="ghost"
            onClick={onKeepEditing}
            disabled={saving}
            className="text-gray-600 hover:bg-gray-50"
          >
            Keep editing
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={onDiscard}
              disabled={saving}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Discard
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "Saving..." : "Save draft"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}