import React, { useEffect, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Subtle map banner background.
 * Uses postal code if available, otherwise city/province.
 * Click opens Google Maps in a new tab.
 */
export default function LocationMapBanner({
  postalCode,
  city,
  province,
  label,
}) {
  const [mapSrc, setMapSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  // Prefer postal code, fall back to city/province
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
          params: { q: query, w: 700, h: 160, z: postalCode ? 13 : 10 },
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

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (mapSrc) URL.revokeObjectURL(mapSrc);
    };
  }, [mapSrc]);

  if (!hasQuery) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 hover:border-pink-300 transition-all mb-3"
      title="Open in Google Maps"
    >
      {/* Map image background */}
      {mapSrc && !failed ? (
        <img
          src={mapSrc}
          alt={label || query}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
      )}

      {/* Gradient wash overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-pink-50/40 to-amber-50/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

      {/* Label */}
      <div className="relative h-full flex items-end justify-between p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-pink-600" />
          <span className="truncate">{label || query}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-white/90 px-2 py-1 rounded-md shadow-sm">
          <ExternalLink className="w-3 h-3" />
          Google Maps
        </div>
      </div>
    </a>
  );
}