import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, ChevronRight, Search, Loader2, ArrowLeft } from "lucide-react";

// Picker dialog for Google Drive files.
// onPick: (selected[]) => void  — selected is an array of { label, url, type: 'link', mimeType, drive_id }
export default function DrivePickerDialog({ open, onOpenChange, onPick, multiple = true }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stack, setStack] = useState([{ id: "", name: "My Drive" }]); // breadcrumbs
  const [selected, setSelected] = useState({}); // id -> file

  const current = stack[stack.length - 1];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = appliedSearch
        ? { q: appliedSearch }
        : { parentId: current.id || "" };
      const res = await base44.functions.invoke("listDriveFiles", payload);
      setFiles(res?.data?.files || []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e?.message || "Failed to load Drive files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current.id, appliedSearch]);

  useEffect(() => {
    if (!open) {
      setSelected({});
      setSearch("");
      setAppliedSearch("");
      setStack([{ id: "", name: "My Drive" }]);
    }
  }, [open]);

  const handleOpenFolder = (f) => {
    if (appliedSearch) {
      // Exit search mode when navigating
      setAppliedSearch("");
      setSearch("");
    }
    setStack((s) => [...s, { id: f.id, name: f.name }]);
  };

  const handleBack = () => {
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
  };

  const handleToggle = (f) => {
    setSelected((cur) => {
      const next = { ...cur };
      if (next[f.id]) {
        delete next[f.id];
      } else {
        if (!multiple) return { [f.id]: f };
        next[f.id] = f;
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const picked = Object.values(selected).map((f) => ({
      label: f.name,
      url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      type: "link",
      mimeType: f.mimeType,
      drive_id: f.id,
    }));
    onPick?.(picked);
    onOpenChange(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setAppliedSearch(search.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <img
              src="https://www.google.com/s2/favicons?sz=32&domain=drive.google.com"
              alt=""
              className="w-5 h-5"
            />
            Google Drive
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-3 border-b space-y-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search across all of Drive..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">Search</Button>
            {appliedSearch && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setSearch(""); setAppliedSearch(""); }}
              >
                Clear
              </Button>
            )}
          </form>
          {!appliedSearch && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              {stack.length > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 mr-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
              {stack.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                  <span className={i === stack.length - 1 ? "font-medium text-slate-800" : ""}>
                    {b.name}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-sm text-red-600 py-8 px-4">{error}</div>
          ) : files.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">
              {appliedSearch ? "No files match your search." : "This folder is empty."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {files.map((f) => {
                const isChecked = !!selected[f.id];
                return (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-md"
                  >
                    {f.isFolder ? (
                      <button
                        type="button"
                        onClick={() => handleOpenFolder(f)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                        <span className="truncate text-sm text-slate-800">{f.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
                      </button>
                    ) : (
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(f)}
                        />
                        {f.iconLink ? (
                          <img src={f.iconLink} alt="" className="w-4 h-4 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded bg-slate-200 shrink-0" />
                        )}
                        <span className="truncate text-sm text-slate-800 flex-1">{f.name}</span>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {Object.keys(selected).length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={Object.keys(selected).length === 0}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Attach
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}