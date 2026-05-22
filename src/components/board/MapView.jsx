import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { getCanadaLand, clipCircleToLand } from "./landMask";

// Status → swimlane color (matches KanbanColumn palette)
const STATUS_COLORS = {
  new: { hex: "#9ca3af", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", dot: "bg-slate-400" },
  pending: { hex: "#9ca3af", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", dot: "bg-slate-400" },
  scheduled: { hex: "#3b82f6", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-500" },
  reviewed: { hex: "#3b82f6", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-500" },
  contacted: { hex: "#a855f7", bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", dot: "bg-purple-500" },
  approved: { hex: "#10b981", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  invited: { hex: "#10b981", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  qualified: { hex: "#ec4899", bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700", dot: "bg-pink-500" },
  closed: { hex: "#64748b", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", dot: "bg-slate-500" },
  declined: { hex: "#f43f5e", bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", dot: "bg-rose-500" },
};

const getStatusColor = (status) => STATUS_COLORS[String(status).toLowerCase()] || { hex: "#94a3b8", bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", dot: "bg-slate-400" };

const HQ = {
  name: "Brampton East (HQ)",
  address: "6161 Mayfield Road, Unit #105, Brampton, Ontario, Canada",
  // approximate, will be geocoded on load to be exact
  lat: 43.7846,
  lng: -79.7297,
};

const ONTARIO_CENTER = { lat: 44.5, lng: -79.5 };
const RADIUS_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50];

// Cache the JS API loader across mounts
let googleMapsPromise = null;
function loadGoogleMaps(apiKey) {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function buildQuery(t) {
  const postal = t.preferred_postal_code || t.postal_code;
  if (postal) {
    const province = t.province ? `, ${t.province}` : "";
    return `${String(postal).trim().toUpperCase()}${province}, Canada`;
  }
  const loc = t.preferred_location || t.location || t.city;
  if (loc) {
    const province = t.province ? `, ${t.province}` : "";
    return `${loc}${province}, Canada`;
  }
  return null;
}

export default function MapView({ tickets, accentColor = "#f1889b", statusOrder = [], onTicketClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const overlaysRef = useRef([]); // markers + circles
  const hqMarkerRef = useRef(null);
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radiusKm, setRadiusKm] = useState(15);
  const [geocoded, setGeocoded] = useState({}); // { query: {lat,lng} | null }
  const [geocoding, setGeocoding] = useState(false);
  const [selectedSidebarTicket, setSelectedSidebarTicket] = useState(null);
  const [landReady, setLandReady] = useState(false);

  // Load the Canada land mask once
  useEffect(() => {
    let mounted = true;
    getCanadaLand().then(() => { if (mounted) setLandReady(true); });
    return () => { mounted = false; };
  }, []);

  // Tickets with a usable location query (exclude closed)
  const ticketsWithQuery = useMemo(
    () =>
      (tickets || [])
        .filter((t) => t.status !== "closed")
        .map((t) => ({ ticket: t, query: buildQuery(t) }))
        .filter((x) => !!x.query),
    [tickets]
  );

  // 1. Fetch API key + load Google Maps script
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await base44.functions.invoke("getMapsApiKey", {});
        const key = resp?.data?.apiKey;
        if (!key) throw new Error("Maps API key not available");
        if (!mounted) return;
        setApiKey(key);
        await loadGoogleMaps(key);
        if (!mounted) return;
        setLoading(false);
      } catch (e) {
        if (mounted) {
          setError(e.message || "Failed to load map");
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 2. Initialize map once script + container are ready
  useEffect(() => {
    if (loading || error || !mapRef.current || mapInstance.current || !window.google) return;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: ONTARIO_CENTER,
      zoom: 6,
      scrollwheel: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });

    // HQ marker (use approximate, refine via geocode)
    hqMarkerRef.current = new window.google.maps.Marker({
      position: { lat: HQ.lat, lng: HQ.lng },
      map: mapInstance.current,
      title: HQ.name,
      label: { text: "HQ", color: "#fff", fontSize: "11px", fontWeight: "700" },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: "#ec4899",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      zIndex: 9999,
    });

    const hqInfo = new window.google.maps.InfoWindow({
      content: `<div style="font-family:sans-serif;font-size:12px;max-width:220px"><div style="font-weight:700;margin-bottom:4px">${HQ.name}</div><div style="color:#475569">${HQ.address}</div></div>`,
    });
    hqMarkerRef.current.addListener("click", () => hqInfo.open(mapInstance.current, hqMarkerRef.current));

    // Try to refine HQ location via geocoding
    base44.functions
      .invoke("geocodePostalCodes", { queries: [HQ.address] })
      .then((resp) => {
        const r = resp?.data?.results?.[HQ.address];
        if (r && hqMarkerRef.current) {
          hqMarkerRef.current.setPosition({ lat: r.lat, lng: r.lng });
        }
      })
      .catch(() => {});
  }, [loading, error]);

  // 3. Geocode any new queries
  useEffect(() => {
    if (loading || error) return;
    const needed = ticketsWithQuery
      .map((x) => x.query)
      .filter((q) => !(q in geocoded));
    if (!needed.length) return;
    // dedupe
    const unique = Array.from(new Set(needed));
    setGeocoding(true);
    base44.functions
      .invoke("geocodePostalCodes", { queries: unique })
      .then((resp) => {
        const results = resp?.data?.results || {};
        setGeocoded((prev) => ({ ...prev, ...results }));
      })
      .catch(() => {
        // Mark as null so we don't retry forever
        setGeocoded((prev) => {
          const next = { ...prev };
          unique.forEach((q) => { if (!(q in next)) next[q] = null; });
          return next;
        });
      })
      .finally(() => setGeocoding(false));
  }, [ticketsWithQuery, geocoded, loading, error]);

  // Helper: clip a circle to the Canada land mass. Returns an array of paths
  // (one per polygon piece) — Google Maps Polygon accepts an array of paths.
  const createCirclePolygonPaths = (center, radiusKm) => {
    try {
      return clipCircleToLand(center.lng, center.lat, radiusKm);
    } catch {
      return null;
    }
  };

  // 4. Render markers + clipped polygons whenever tickets / radius / geocoded change
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;

    // Clear existing overlays
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    if (hqMarkerRef.current) bounds.extend(hqMarkerRef.current.getPosition());

    // Add HQ radius polygon (clipped to land — can be one or multiple pieces)
    const hqPaths = createCirclePolygonPaths({ lat: HQ.lat, lng: HQ.lng }, radiusKm);
    if (hqPaths && hqPaths.length) {
      const hqPoly = new window.google.maps.Polygon({
        map: mapInstance.current,
        paths: hqPaths,
        strokeColor: "#ec4899",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: "#ec4899",
        fillOpacity: 0.2,
        clickable: false,
      });
      overlaysRef.current.push(hqPoly);
    }

    ticketsWithQuery.forEach(({ ticket, query }) => {
      const loc = geocoded[query];
      if (!loc) return;
      const position = { lat: loc.lat, lng: loc.lng };

      const markerColor = getStatusColor(ticket.status).hex;

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstance.current,
        title: `${ticket._display_name || ticket.email || "Application"}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Radius polygon for each ticket (clipped to land)
      const ticketPaths = createCirclePolygonPaths(position, radiusKm);
      if (ticketPaths && ticketPaths.length) {
        const poly = new window.google.maps.Polygon({
          map: mapInstance.current,
          paths: ticketPaths,
          strokeColor: markerColor,
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: markerColor,
          fillOpacity: 0.18,
          clickable: false,
        });
        overlaysRef.current.push(poly);
      }

      const info = new window.google.maps.InfoWindow({
        content: `<div style="font-family:sans-serif;font-size:12px;max-width:240px">
          <div style="font-weight:700;margin-bottom:2px">${ticket._display_name || "Application"}</div>
          <div style="color:#475569;margin-bottom:2px">${ticket.email || ""}</div>
          <div style="color:#64748b">${loc.formatted || query}</div>
          <div style="margin-top:6px;color:${accentColor};font-weight:600;cursor:pointer">Open application →</div>
        </div>`,
      });
      marker.addListener("mouseover", () => info.open(mapInstance.current, marker));
      marker.addListener("mouseout", () => info.close());
      marker.addListener("click", () => {
        if (onTicketClick) {
          setTimeout(() => onTicketClick(ticket), 50);
        }
        setSelectedSidebarTicket(ticket.id);
      });

      overlaysRef.current.push(marker);
      bounds.extend(position);
    });

    if (overlaysRef.current.length > 0 && !bounds.isEmpty()) {
      mapInstance.current.fitBounds(bounds, 60);
      // Don't zoom in too far if there's only one point
      const listener = window.google.maps.event.addListenerOnce(
        mapInstance.current,
        "bounds_changed",
        () => {
          if (mapInstance.current.getZoom() > 10) mapInstance.current.setZoom(10);
        }
      );
      // cleanup listener if effect re-runs
      return () => window.google.maps.event.removeListener(listener);
    }
  }, [ticketsWithQuery, geocoded, radiusKm, accentColor, onTicketClick, landReady]);

  const mappedCount = ticketsWithQuery.filter((x) => geocoded[x.query]).length;
  const missingCount = ticketsWithQuery.length - mappedCount;
  const noLocationCount = (tickets?.length || 0) - ticketsWithQuery.length;

  // Group tickets by status — ordered by swimlane order
  const ticketsByStatus = useMemo(() => {
    const groups = {};
    ticketsWithQuery.forEach(({ ticket }) => {
      const status = ticket.status || "unknown";
      if (!groups[status]) groups[status] = [];
      groups[status].push(ticket);
    });
    const ordered = [];
    (statusOrder || []).forEach((s) => {
      if (groups[s]) ordered.push([s, groups[s]]);
    });
    Object.keys(groups).forEach((s) => {
      if (!statusOrder.includes(s)) ordered.push([s, groups[s]]);
    });
    return ordered;
  }, [ticketsWithQuery, statusOrder]);

  // Collapsed sections — default: all expanded
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (status) =>
    setCollapsedSections((prev) => ({ ...prev, [status]: !prev[status] }));

  return (
    <div className="flex-1 lg:min-h-0 mt-2 flex flex-col lg:flex-row gap-3">
      {/* Map */}
      <div className="flex-1 lg:min-h-0 flex flex-col">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex-1 flex flex-col min-h-[500px]">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin className="w-4 h-4" style={{ color: accentColor }} />
              <span className="font-semibold">{mappedCount}</span> mapped
              {geocoding && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 ml-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> geocoding...
                </span>
              )}
              {missingCount > 0 && !geocoding && (
                <span className="text-xs text-amber-600 ml-2">· {missingCount} couldn't be located</span>
              )}
              {noLocationCount > 0 && (
                <span className="text-xs text-slate-400 ml-2">· {noLocationCount} with no postal code/location</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-medium">Radius:</label>
              <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
                <SelectTrigger className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((r) => (
                    <SelectItem key={r} value={String(r)}>{r} km</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map */}
          <div className="relative flex-1">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 p-6 text-center">
                {error}
              </div>
            ) : loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : null}
            <div ref={mapRef} className="absolute inset-0" />
          </div>
        </div>
      </div>

      {/* Sidebar: Requests grouped by status */}
      <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-xs tracking-widest uppercase font-semibold text-slate-600">Requests by Status</p>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {ticketsByStatus.map(([status, statusTickets]) => {
            const c = getStatusColor(status);
            const isCollapsed = !!collapsedSections[status];
            return (
              <div key={status} className="border-b border-slate-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleSection(status)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold sticky top-0 capitalize border-l-4 ${c.bg} ${c.text} ${c.border} hover:brightness-95 transition`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {status} ({statusTickets.length})
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {statusTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          setSelectedSidebarTicket(ticket.id);
                          onTicketClick(ticket);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors border-l-4 ${
                          selectedSidebarTicket === ticket.id
                            ? "bg-slate-100"
                            : "hover:bg-slate-200 border-transparent"
                        }`}
                        style={selectedSidebarTicket === ticket.id ? { borderLeftColor: c.hex } : {}}
                      >
                        <div className="font-medium text-slate-900 truncate">{ticket._display_name || ticket.email}</div>
                        <div className="text-slate-500 truncate">{ticket.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}