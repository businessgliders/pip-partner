import React, { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Renders a full-area map as an absolutely-positioned background behind
 * its parent (parent must be `relative`). Uses postal code if available,
 * otherwise falls back to city/province. Click opens Google Maps.
 */
export default function LocationMapBanner({
  postalCode,
  city,
  province,
  label,
}) {
  const [mapSrc, setMapSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  const query = [postalCode, city, province, "Canada"].filter(Boolean).join(", ");
  const hasQuery = !!(postalCode || city || province);

  useEffect(() => {
    let cancelled = false;
    setMapSrc(null);
    setFailed(false);
    if (!hasQuery) return;

    (async () => {
      try {
        const res = await base44.functions.invoke("getStaticMap", {
          q: query,
          w: 800,
          h: 1200,
          z: postalCode ? 13 : 10,
        });
        if (cancelled) return;
        const dataUrl = res?.data?.dataUrl;
        if (dataUrl) {
          setMapSrc(dataUrl);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, hasQuery, postalCode]);

  if (!hasQuery) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <>
      {/* Map image sticky as background of parent column */}
      <div className="sticky top-0 left-0 right-0 h-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[100vh] -mt-0">
          {mapSrc && !failed ? (
            <img
              src={mapSrc}
              alt={label || query}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-amber-50" />
          )}
          {/* Radial gradient: opaque white in center (behind text), transparent at edges (map visible) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 70% at 50% 45%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 35%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.25) 85%, rgba(255,255,255,0) 100%)",
            }}
          />
          {/* Subtle warm tint only at edges */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 60%, rgba(253,242,248,0.35) 100%)",
            }}
          />
        </div>
      </div>

      {/* Clickable "View on Google Maps" pill — sticky in top-right */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Google Maps"
        className="sticky top-3 float-right z-20 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-white/95 hover:bg-white border border-slate-200 hover:border-pink-300 px-2.5 py-1.5 rounded-full shadow-md transition-all mr-3 mt-3"
      >
        <MapPin className="w-3 h-3 text-pink-600" />
        <span>View on Google Maps</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </>
  );
}