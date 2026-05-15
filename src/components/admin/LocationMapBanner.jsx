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
          method: "GET",
          params: { q: query, w: 800, h: 1200, z: postalCode ? 13 : 10 },
          responseType: "blob",
        });
        if (cancelled) return;
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "image/png" });
        const objUrl = URL.createObjectURL(blob);
        setMapSrc(objUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, hasQuery, postalCode]);

  useEffect(() => {
    return () => {
      if (mapSrc) URL.revokeObjectURL(mapSrc);
    };
  }, [mapSrc]);

  if (!hasQuery) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <>
      {/* Map image fixed as background of parent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {mapSrc && !failed ? (
          <img
            src={mapSrc}
            alt={label || query}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        {/* Strong gradient wash to keep details readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/92 to-white/98" />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/40 via-white/50 to-amber-50/40" />
      </div>

      {/* Clickable "View in Google Maps" pill — floats above */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Google Maps"
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-white/90 hover:bg-white border border-slate-200 hover:border-pink-300 px-2.5 py-1.5 rounded-full shadow-sm transition-all"
      >
        <MapPin className="w-3 h-3 text-pink-600" />
        <span>View on Google Maps</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </>
  );
}