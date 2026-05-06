import React, { useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";
import BackToHome from "../components/BackToHome";
import CreativeCard from "../components/marketing/CreativeCard";
import CreativeModal from "../components/marketing/CreativeModal";
import { AD_FORMATS, CATEGORY_LABELS, CAMPAIGNS } from "../components/marketing/adFormats";

export default function AdminMarketingCampaign() {
  const { slug } = useParams();
  const campaign = CAMPAIGNS.find((c) => c.slug === slug);

  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFormatKey, setActiveFormatKey] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const load = async () => {
    if (!campaign) return;
    setLoading(true);
    const rows = await base44.entities.CampaignCreative.filter(
      { campaign: campaign.slug },
      "-created_date",
      500
    );
    setCreatives(rows);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  const byFormat = useMemo(() => {
    const map = {};
    for (const c of creatives) {
      (map[c.format_key] = map[c.format_key] || []).push(c);
    }
    return map;
  }, [creatives]);

  if (!campaign) return <Navigate to="/AdminDashboard/Marketing" replace />;

  const grouped = AD_FORMATS.reduce((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  const visibleFormats = (formats) =>
    favoritesOnly
      ? formats.filter((f) => (byFormat[f.key] || []).some((c) => c.favorite))
      : formats;

  const activeFormat = AD_FORMATS.find((f) => f.key === activeFormatKey);
  const activeHistory = activeFormat ? (byFormat[activeFormat.key] || []) : [];

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f1889b 0%, #f7b1bd 35%, #fbe0e2 70%, #f6eee7 100%)",
      }}
    >
      <BackToHome to="/AdminDashboard/Marketing" label="Marketing" />

      <div className="max-w-7xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <p className="text-[11px] tracking-[0.25em] text-white/90 font-semibold mb-2">{campaign.subtitle} CAMPAIGN</p>
          <h1 className="text-3xl md:text-4xl font-light text-white drop-shadow-sm">{campaign.title}</h1>
          <p className="text-white/90 text-sm mt-2 max-w-xl mx-auto">{campaign.description}</p>
        </motion.div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${favoritesOnly ? "bg-[#f1889b] text-white shadow-md" : "bg-white/80 text-[#7a4a30] hover:bg-white"}`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-white" : ""}`} />
            {favoritesOnly ? "Showing favorites" : "Favorites only"}
          </button>
        </div>

        {loading ? (
          <div className="bg-white/70 rounded-2xl p-12 text-center">
            <div className="w-6 h-6 border-2 border-[#b67651]/30 border-t-[#b67651] rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([category, formats]) => {
              const list = visibleFormats(formats);
              if (!list.length) return null;
              return (
                <div key={category}>
                  <p className="text-[11px] tracking-[0.25em] text-white/90 font-semibold mb-4">
                    {CATEGORY_LABELS[category]?.toUpperCase()}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {list.map((f) => {
                      const history = byFormat[f.key] || [];
                      const latest = history.find((c) => c.favorite) || history[0];
                      return (
                        <CreativeCard
                          key={f.key}
                          format={f}
                          latest={latest}
                          onClick={() => setActiveFormatKey(f.key)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreativeModal
        open={!!activeFormat}
        onClose={() => setActiveFormatKey(null)}
        format={activeFormat}
        campaign={campaign}
        history={activeHistory}
        onChange={load}
      />
    </div>
  );
}