import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Download, Star, Loader2, Trash2 } from "lucide-react";

function buildPrompt({ format, headline, subheadline, cta, campaign }) {
  return `Design a high-end advertising creative for "${campaign.title}" campaign.
Format: ${format.label} (${format.w}×${format.h}px, aspect ratio ${format.aspect}).
Style: ${campaign.promptStyle}
Include the following text rendered cleanly and legibly on the image:
- Headline: "${headline}"
${subheadline ? `- Subheadline: "${subheadline}"` : ""}
- Call-to-action button: "${cta}"
Use elegant serif and modern sans-serif typography. Plenty of whitespace, soft natural lighting, professional ad-quality composition. Brand: Pilates in Pink. Include subtle "Pilates in Pink" wordmark or icon. No watermarks, no stock-photo borders.`;
}

async function downloadImage(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function CreativeModal({ open, onClose, format, campaign, history, onChange }) {
  const [headline, setHeadline] = useState(campaign.defaults.headline);
  const [subheadline, setSubheadline] = useState(campaign.defaults.subheadline);
  const [cta, setCta] = useState(campaign.defaults.cta);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState(history[0]?.id || null);

  useEffect(() => {
    if (open) {
      setHeadline(campaign.defaults.headline);
      setSubheadline(campaign.defaults.subheadline);
      setCta(campaign.defaults.cta);
      setSelectedId(history[0]?.id || null);
    }
  }, [open, format?.key]);

  if (!format) return null;

  const selected = history.find((h) => h.id === selectedId) || history[0];

  const handleGenerate = async () => {
    setGenerating(true);
    const prompt = buildPrompt({ format, headline, subheadline, cta, campaign });
    const { url } = await base44.integrations.Core.GenerateImage({ prompt });
    const record = await base44.entities.CampaignCreative.create({
      campaign: campaign.slug,
      format_key: format.key,
      format_label: format.label,
      category: format.category,
      width: format.w,
      height: format.h,
      aspect_ratio: format.aspect,
      headline,
      subheadline,
      cta,
      image_url: url,
      favorite: false,
    });
    setSelectedId(record.id);
    onChange();
    setGenerating(false);
  };

  const handleFavorite = async (item) => {
    await base44.entities.CampaignCreative.update(item.id, { favorite: !item.favorite });
    onChange();
  };

  const handleDelete = async (item) => {
    await base44.entities.CampaignCreative.delete(item.id);
    if (item.id === selectedId) setSelectedId(null);
    onChange();
  };

  const handleDownload = async (item) => {
    const ext = item.image_url.split(".").pop().split("?")[0] || "png";
    await downloadImage(item.image_url, `${campaign.slug}-${format.key}-${item.id}.${ext}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#faf3ec] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#b67651]/10 bg-white/60">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-[#b67651]/70 font-semibold">{format.category.toUpperCase()}</p>
                <h2 className="text-xl font-light text-[#7a4a30]">{format.label}</h2>
                <p className="text-xs text-[#b67651]/70">{format.w} × {format.h}px · aspect {format.aspect}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-[#fbe0e2]/60 flex items-center justify-center text-[#b67651]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 flex-1 overflow-hidden">
              {/* Left: editor */}
              <div className="lg:col-span-2 p-6 overflow-y-auto border-r border-[#b67651]/10">
                <p className="text-[11px] tracking-[0.2em] text-[#b67651]/70 font-semibold mb-4">EDIT COPY</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#7a4a30] mb-1 block">Headline</label>
                    <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="bg-white/80" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a4a30] mb-1 block">Subheadline</label>
                    <Input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className="bg-white/80" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a4a30] mb-1 block">CTA Button</label>
                    <Input value={cta} onChange={(e) => setCta(e.target.value)} className="bg-white/80" />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !headline.trim()}
                    className="w-full h-11 text-white font-medium hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Creative</>
                    )}
                  </Button>
                  <p className="text-[11px] text-[#b67651]/60 leading-relaxed">
                    Generated at the closest supported aspect ratio ({format.aspect}). Resize/crop as needed for placement.
                  </p>
                </div>
              </div>

              {/* Right: preview + history */}
              <div className="lg:col-span-3 p-6 overflow-y-auto bg-white/40">
                <p className="text-[11px] tracking-[0.2em] text-[#b67651]/70 font-semibold mb-4">PREVIEW</p>
                <div className="bg-[#fbe0e2]/40 rounded-2xl p-6 flex items-center justify-center min-h-[300px] mb-4">
                  {selected ? (
                    <img
                      src={selected.image_url}
                      alt={format.label}
                      className="max-w-full max-h-[420px] object-contain rounded-lg shadow-md"
                      style={{ aspectRatio: `${format.w} / ${format.h}` }}
                    />
                  ) : (
                    <div className="text-center text-[#b67651]/60">
                      <Sparkles className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No creative yet — generate one to start.</p>
                    </div>
                  )}
                </div>

                {selected && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                      onClick={() => handleDownload(selected)}
                      className="bg-[#7a4a30] hover:bg-[#5a3a28] text-white"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleFavorite(selected)}
                      className="border-[#b67651]/30 text-[#7a4a30]"
                    >
                      <Star className={`w-4 h-4 mr-2 ${selected.favorite ? "fill-[#f1889b] text-[#f1889b]" : ""}`} />
                      {selected.favorite ? "Favorited" : "Favorite"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(selected)}
                      className="text-[#b67651]/70 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                )}

                {history.length > 0 && (
                  <div>
                    <p className="text-[11px] tracking-[0.2em] text-[#b67651]/70 font-semibold mb-3">HISTORY ({history.length})</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {history.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setSelectedId(h.id)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedId === h.id ? "border-[#b67651]" : "border-transparent hover:border-[#b67651]/40"}`}
                        >
                          <img src={h.image_url} alt="" className="w-full h-full object-cover" />
                          {h.favorite && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/95 flex items-center justify-center">
                              <Star className="w-2.5 h-2.5 text-[#f1889b] fill-[#f1889b]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}