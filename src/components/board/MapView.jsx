import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, ExternalLink, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCanadaLand, clipCircleToLand } from "./landMask";
import { statusOrderFor } from "@/components/inbox/inboxConfig";

// Status → color, aligned with the StatusBadge palette in the status dropdown
// (see SubmissionsTable.STATUS_COLORS). Each entry uses the badge's -100/-700
// shades so the map legend chip reads the same as the pill in the dropdown.
const STATUS_COLORS = {
  // Franchise pipeline
  new: { hex: "#1d4ed8", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-500" },
  discovery: { hex: "#b45309", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  no_show: { hex: "#be123c", bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", dot: "bg-rose-500" },
  nda: { hex: "#0e7490", bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-700", dot: "bg-cyan-500" },
  fdd: { hex: "#6d28d9", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", dot: "bg-violet-500" },
  signed: { hex: "#a21caf", bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  site_selection: { hex: "#4338ca", bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", dot: "bg-indigo-500" },
  lease: { hex: "#1d4ed8", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-500" },
  build_out: { hex: "#0e7490", bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-700", dot: "bg-cyan-500" },
  training: { hex: "#0f766e", bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700", dot: "bg-teal-500" },
  closed: { hex: "#475569", bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-600", dot: "bg-slate-500" },
  ghosted: { hex: "#6d28d9", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", dot: "bg-violet-500" },
  // Legacy franchise aliases (map to their replacement colors)
  scheduled: { hex: "#7e22ce", bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", dot: "bg-purple-500" },
  discussion: { hex: "#b45309", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  contacted: { hex: "#b45309", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  qualified: { hex: "#047857", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  // Hiring / influencer pipeline
  pending: { hex: "#1d4ed8", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-500" },
  reviewed: { hex: "#b45309", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  invited: { hex: "#047857", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  approved: { hex: "#047857", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  declined: { hex: "#be123c", bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", dot: "bg-rose-500" },
};

const getStatusColor = (status) => STATUS_COLORS[String(status).toLowerCase()] || { hex: "#8b5cf6", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", dot: "bg-violet-500" };

// Statuses that should NOT render a per-ticket radius circle on the map.
const NO_RADIUS_STATUSES = new Set(["ghosted", "declined"]);

const HQ = {
  name: "Brampton East (HQ)",
  address: "6161 Mayfield Road, Unit #105, Brampton, Ontario, Canada",
  // approximate, will be geocoded on load to be exact
  lat: 43.7846,
  lng: -79.7297,
};

const ONTARIO_CENTER = { lat: 44.5, lng: -79.5 };
const RADIUS_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50];

// Hard cap to keep the map lightweight. The board itself can hold hundreds of
// tickets — plotting them all (with markers + listeners) freezes the page.
const MAX_MAP_PINS = 100;

// Approximate province centroids — used to fit bounds instantly while waiting
// for geocoding to finish.
const PROVINCE_CENTROIDS = {
  "Alberta": { lat: 53.9333, lng: -116.5765 },
  "British Columbia": { lat: 53.7267, lng: -127.6476 },
  "Manitoba": { lat: 53.7609, lng: -98.8139 },
  "New Brunswick": { lat: 46.5653, lng: -66.4619 },
  "Newfoundland and Labrador": { lat: 53.1355, lng: -57.6604 },
  "Nova Scotia": { lat: 44.6820, lng: -63.7443 },
  "Northwest Territories": { lat: 64.8255, lng: -124.8457 },
  "Nunavut": { lat: 70.2998, lng: -83.1076 },
  "Ontario": { lat: 50.0000, lng: -85.0000 },
  "Prince Edward Island": { lat: 46.5107, lng: -63.4168 },
  "Quebec": { lat: 52.9399, lng: -73.5491 },
  "Saskatchewan": { lat: 52.9399, lng: -106.4509 },
  "Yukon": { lat: 64.2823, lng: -135.0000 },
};

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
  const markersByTicketRef = useRef({}); // ticketId -> { marker, position }
  const hqMarkerRef = useRef(null);
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [geocoded, setGeocoded] = useState({}); // { query: {lat,lng} | null }
  const [geocoding, setGeocoding] = useState(false);
  const [selectedSidebarTicket, setSelectedSidebarTicket] = useState(null);
  const [landReady, setLandReady] = useState(false);
  const hasAutoFitRef = useRef(false);

  // Load the Canada land mask once
  useEffect(() => {
    let mounted = true;
    getCanadaLand().then(() => { if (mounted) setLandReady(true); });
    return () => { mounted = false; };
  }, []);

  // Tickets with a usable location query (exclude closed). Capped to keep the
  // map responsive — sorted newest-first so the cap drops the oldest tickets.
  const ticketsWithQuery = useMemo(
    () =>
      (tickets || [])
        .filter((t) => t.status !== "closed")
        .slice()
        .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
        .slice(0, MAX_MAP_PINS)
        .map((t) => ({ ticket: t, query: buildQuery(t) }))
        .filter((x) => !!x.query),
    [tickets]
  );

  const totalEligibleCount = useMemo(
    () => (tickets || []).filter((t) => t.status !== "closed" && !!buildQuery(t)).length,
    [tickets]
  );
  const cappedOut = Math.max(0, totalEligibleCount - ticketsWithQuery.length);

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
      center: { lat: HQ.lat, lng: HQ.lng },
      zoom: 9,
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

  // Shared InfoWindow — one instance, not N. Massively cuts memory + listener
  // overhead vs creating one InfoWindow per marker.
  const sharedInfoRef = useRef(null);

  // 4. Render markers whenever tickets / geocoded change.
  // NOTE: per-ticket radius polygons were removed — they ran `clipCircleToLand`
  // (heavy turf.js geometry) once per ticket, blocking the main thread for
  // seconds and freezing the whole page. Only the HQ radius is clipped now.
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;

    // Clear existing overlays
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    markersByTicketRef.current = {};

    if (!sharedInfoRef.current) {
      sharedInfoRef.current = new window.google.maps.InfoWindow();
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
      markersByTicketRef.current[ticket.id] = { marker, position };

      marker.addListener("click", () => {
        const safeName = (ticket._display_name || "Application").replace(/"/g, "&quot;");
        const content = `<div style="font-family:sans-serif;font-size:13px;max-width:240px">
          <div style="font-weight:700;margin-bottom:6px;color:#0f172a">${safeName}</div>
          <button id="map-open-details-${ticket.id}" style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;background:#0f172a;color:#fff;font-size:12px;font-weight:600;border:none;cursor:pointer">
            Open details
          </button>
        </div>`;
        sharedInfoRef.current.setContent(content);
        sharedInfoRef.current.open(mapInstance.current, marker);
        setSelectedSidebarTicket(ticket.id);
        // Wire up the "Open details" button after the InfoWindow renders.
        window.google.maps.event.addListenerOnce(sharedInfoRef.current, "domready", () => {
          const btn = document.getElementById(`map-open-details-${ticket.id}`);
          if (btn) {
            btn.addEventListener("click", () => {
              if (onTicketClick) onTicketClick(ticket);
              sharedInfoRef.current.close();
            });
          }
        });
      });

      overlaysRef.current.push(marker);
    });
  }, [ticketsWithQuery, geocoded, onTicketClick]);

  // Render per-ticket radius circles (10km by default) — excludes ghosted /
  // declined statuses. Uses plain google.maps.Circle (no land-clipping) to
  // keep this lightweight even with up to MAX_MAP_PINS markers.
  const ticketCirclesRef = useRef([]);
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;
    // Clear existing circles
    ticketCirclesRef.current.forEach((c) => c.setMap(null));
    ticketCirclesRef.current = [];

    ticketsWithQuery.forEach(({ ticket, query }) => {
      const loc = geocoded[query];
      if (!loc) return;
      if (NO_RADIUS_STATUSES.has(String(ticket.status).toLowerCase())) return;
      const color = getStatusColor(ticket.status).hex;
      const circle = new window.google.maps.Circle({
        map: mapInstance.current,
        center: { lat: loc.lat, lng: loc.lng },
        radius: radiusKm * 1000,
        strokeColor: color,
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 0.12,
        clickable: false,
      });
      ticketCirclesRef.current.push(circle);
    });

    return () => {
      ticketCirclesRef.current.forEach((c) => c.setMap(null));
      ticketCirclesRef.current = [];
    };
  }, [ticketsWithQuery, geocoded, radiusKm]);

  // Render the HQ radius polygon separately so changing radius doesn't rebuild
  // every marker. This is the only clipped polygon on the map.
  const hqPolyRef = useRef(null);
  useEffect(() => {
    if (!mapInstance.current || !window.google || !landReady) return;
    if (hqPolyRef.current) {
      hqPolyRef.current.setMap(null);
      hqPolyRef.current = null;
    }
    const hqPaths = createCirclePolygonPaths({ lat: HQ.lat, lng: HQ.lng }, radiusKm);
    if (hqPaths && hqPaths.length) {
      hqPolyRef.current = new window.google.maps.Polygon({
        map: mapInstance.current,
        paths: hqPaths,
        strokeColor: "#ec4899",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: "#ec4899",
        fillOpacity: 0.2,
        clickable: false,
      });
    }
  }, [radiusKm, landReady, loading]);

  // Auto-fit bounds as soon as any geocoded positions are available — runs
  // independently of polygon/land-mask rendering so the map zooms in quickly.
  useEffect(() => {
    if (!mapInstance.current || !window.google || hasAutoFitRef.current) return;
    const positions = ticketsWithQuery
      .map(({ query }) => geocoded[query])
      .filter(Boolean);
    if (positions.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    if (hqMarkerRef.current) bounds.extend(hqMarkerRef.current.getPosition());
    positions.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    if (bounds.isEmpty()) return;

    mapInstance.current.fitBounds(bounds, 60);
    const listener = window.google.maps.event.addListenerOnce(
      mapInstance.current,
      "bounds_changed",
      () => {
        if (mapInstance.current.getZoom() > 10) mapInstance.current.setZoom(10);
      }
    );
    hasAutoFitRef.current = true;
    return () => window.google.maps.event.removeListener(listener);
  }, [ticketsWithQuery, geocoded, loading]);

  const mappedCount = ticketsWithQuery.filter((x) => geocoded[x.query]).length;
  const missingCount = ticketsWithQuery.length - mappedCount;
  const noLocationCount = (tickets?.length || 0) - ticketsWithQuery.length;

  // Group tickets by status — ordered to match the Inbox view side rail
  // (Step 1 → Step 2 → Other). Falls back to the board's natural status order
  // for non-franchise boards.
  const ticketsByStatus = useMemo(() => {
    const groups = {};
    ticketsWithQuery.forEach(({ ticket }) => {
      const status = ticket.status || "unknown";
      if (!groups[status]) groups[status] = [];
      groups[status].push(ticket);
    });
    const inboxOrder = statusOrderFor("franchise");
    const orderSource = inboxOrder.length ? inboxOrder : (statusOrder || []);
    const ordered = [];
    orderSource.forEach((s) => {
      if (groups[s]) ordered.push([s, groups[s]]);
    });
    Object.keys(groups).forEach((s) => {
      if (!orderSource.includes(s)) ordered.push([s, groups[s]]);
    });
    return ordered;
  }, [ticketsWithQuery, statusOrder]);

  // Collapsed sections — default: all expanded
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (status) =>
    setCollapsedSections((prev) => ({ ...prev, [status]: !prev[status] }));

  // Sidebar collapse state — defaults to collapsed on mobile/tablet (< lg).
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  return (
    <div className="flex-1 lg:min-h-0 mt-2 flex flex-col lg:flex-row gap-3">
      {/* Sidebar: Requests grouped by status (LEFT) */}
      {sidebarCollapsed ? (
        <div className="hidden lg:flex flex-col items-center bg-white rounded-xl border border-slate-200 shadow-lg px-2 py-3">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            title="Expand panel"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs tracking-widest uppercase font-semibold text-slate-600">Requests by Status</p>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse panel"
              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
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
                        <div
                          key={ticket.id}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors border-l-4 ${
                            selectedSidebarTicket === ticket.id
                              ? "bg-slate-100"
                              : "hover:bg-slate-50 border-transparent"
                          }`}
                          style={selectedSidebarTicket === ticket.id ? { borderLeftColor: c.hex } : {}}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSidebarTicket(ticket.id);
                              const entry = markersByTicketRef.current[ticket.id];
                              if (entry && mapInstance.current) {
                                mapInstance.current.panTo(entry.position);
                                if (mapInstance.current.getZoom() < 10) {
                                  mapInstance.current.setZoom(11);
                                }
                                if (window.google?.maps?.event) {
                                  window.google.maps.event.trigger(entry.marker, "mouseover");
                                  setTimeout(() => {
                                    window.google.maps.event.trigger(entry.marker, "mouseout");
                                  }, 2500);
                                }
                              }
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="font-medium text-slate-900 truncate">{ticket._display_name || ticket.email}</div>
                            <div className="text-slate-500 truncate">{ticket.email}</div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTicketClick(ticket);
                            }}
                            title="Open details"
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              {cappedOut > 0 && (
                <span className="text-xs text-slate-400 ml-2">· {cappedOut} older hidden (showing {MAX_MAP_PINS} most recent)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    title="Color legend"
                    className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
                  >
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <span className="flex items-center -space-x-1">
                      {ticketsByStatus.slice(0, 5).map(([status]) => (
                        <span
                          key={status}
                          className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                          style={{ background: getStatusColor(status).hex }}
                        />
                      ))}
                    </span>
                    <span className="hidden sm:inline">Legend</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1 pb-1.5">
                    Marker colors
                  </div>
                  {ticketsByStatus.length === 0 ? (
                    <div className="text-xs text-slate-500 px-1 py-1">No applications mapped</div>
                  ) : (
                    <div className="space-y-0.5">
                      {ticketsByStatus.map(([status, statusTickets]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between gap-2 px-1 py-1 rounded text-xs"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: getStatusColor(status).hex }}
                            />
                            <span className="capitalize text-slate-700 truncate">
                              {status === "closed" || status === "declined"
                                ? "Not Interested"
                                : status === "fdd" || status === "nda"
                                ? status.toUpperCase()
                                : String(status).replace(/_/g, " ")}
                            </span>
                          </span>
                          <span className="text-slate-400 tabular-nums shrink-0">
                            {statusTickets.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
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
              <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 p-6 text-center z-10">
                {error}
              </div>
            ) : loading ? (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : null}
            <div ref={mapRef} className="absolute inset-0" />
            {!loading && !error && geocoding && ticketsWithQuery.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-20 pointer-events-none animate-in fade-in duration-200">
                <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-white/90 shadow-xl border border-slate-200">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-4 border-slate-200" />
                    <div
                      className="w-10 h-10 rounded-full border-4 border-transparent absolute inset-0 animate-spin"
                      style={{ borderTopColor: accentColor }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-slate-800">Mapping applications</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {mappedCount} of {ticketsWithQuery.length} located
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}