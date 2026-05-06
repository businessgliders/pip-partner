import React from "react";
import { Star, Sparkles, Loader2 } from "lucide-react";

export default function CreativeCard({ format, latest, onClick, onToggleFavorite, isGenerating = false }) {
  const handleFavClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (latest && onToggleFavorite) onToggleFavorite(latest);
  };
  const previewAspect = `${format.w} / ${format.h}`;
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white/85 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
    >
      <div className="relative w-full bg-gradient-to-br from-[#fbe0e2] to-[#f6eee7] flex items-center justify-center" style={{ aspectRatio: "4 / 3" }}>
        <div
          className="relative bg-white shadow-inner border border-white/80 overflow-hidden flex items-center justify-center"
          style={{
            aspectRatio: previewAspect,
            maxWidth: "85%",
            maxHeight: "85%",
            width: format.w >= format.h ? "85%" : "auto",
            height: format.w < format.h ? "85%" : "auto",
          }}
        >
          {latest?.image_url ? (
            <img src={latest.image_url} alt={format.label} className="w-full h-full object-cover" />
          ) : isGenerating ? (
            <div className="flex flex-col items-center gap-1 text-[#b67651]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] tracking-wider">GENERATING…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#b67651]/60">
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] tracking-wider">GENERATE</span>
            </div>
          )}
        </div>
        {isGenerating && latest?.image_url && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#b67651]" />
          </div>
        )}
        {latest?.image_url && (
          <button
            type="button"
            onClick={handleFavClick}
            title={latest.favorite ? "Unfavorite" : "Mark as favorite"}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-sm transition-opacity hover:scale-110 ${
              latest.favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${latest.favorite ? "text-[#f1889b] fill-[#f1889b]" : "text-[#b67651]"}`} />
          </button>
        )}
      </div>
      <div className="p-3.5">
        <p className="text-sm font-medium text-[#7a4a30] truncate">{format.label}</p>
        <p className="text-xs text-[#b67651]/70 mt-0.5">
          {format.w} × {format.h}px
          <span className="text-[#b67651]/40"> · {format.aspect}</span>
        </p>
      </div>
    </button>
  );
}