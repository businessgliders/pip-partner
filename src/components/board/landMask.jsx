// Lazy-loads a Canada land polygon (GeoJSON) and exposes a helper to clip a
// turf circle against the land boundary so radius polygons never spill into
// oceans/lakes.
import * as turf from "@turf/turf";

const CANADA_GEOJSON_URL =
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson";

let landPromise = null;
let landUnion = null; // turf Feature<Polygon|MultiPolygon> for all of Canada

export async function getCanadaLand() {
  if (landUnion) return landUnion;
  if (landPromise) return landPromise;

  landPromise = fetch(CANADA_GEOJSON_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Canada GeoJSON HTTP ${r.status}`);
      return r.json();
    })
    .then((fc) => {
      const features = (fc.features || []).filter(
        (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
      );
      if (!features.length) {
        console.warn("[landMask] no polygon features in Canada GeoJSON");
        return null;
      }
      // turf v7 union takes a FeatureCollection; v6 takes (a, b)
      let merged = null;
      try {
        merged = turf.union(turf.featureCollection(features));
      } catch (e) {
        console.warn("[landMask] union(FC) failed, falling back to pairwise", e?.message);
        merged = features[0];
        for (let i = 1; i < features.length; i++) {
          try {
            merged = turf.union(merged, features[i]) || merged;
          } catch {
            /* skip bad geometry */
          }
        }
      }
      // Buffer the land outward slightly so clipped circles spill a bit into
      // water rather than cutting away coastal land due to low-res coastlines.
      let buffered = merged;
      try {
        const b = turf.buffer(merged, 1.5, { units: "kilometers" });
        if (b) buffered = b;
      } catch (e) {
        console.warn("[landMask] buffer failed, using unbuffered land", e?.message);
      }
      landUnion = buffered;
      console.log("[landMask] Canada land mask loaded:", buffered?.geometry?.type);
      return buffered;
    })
    .catch((e) => {
      console.warn("[landMask] failed to load Canada GeoJSON:", e?.message);
      return null;
    });

  return landPromise;
}

// Returns an array of Google Maps path-arrays ({lat,lng}[]) representing the
// intersection of a turf circle with the Canada land mass. Falls back to the
// full circle if the land mask isn't available yet.
export function clipCircleToLand(centerLng, centerLat, radiusKm) {
  const circle = turf.circle([centerLng, centerLat], radiusKm, {
    units: "kilometers",
    steps: 96,
  });

  if (!landUnion) {
    const ring = circle.geometry.coordinates[0];
    return [ring.map(([lng, lat]) => ({ lat, lng }))];
  }

  let clipped = null;
  // turf v7 intersect takes a FeatureCollection; v6 takes (a, b)
  try {
    clipped = turf.intersect(turf.featureCollection([circle, landUnion]));
  } catch {
    try {
      clipped = turf.intersect(circle, landUnion);
    } catch {
      clipped = null;
    }
  }
  if (!clipped) {
    // No overlap with land — return empty so no polygon is drawn over water
    return [];
  }

  const geom = clipped.geometry;
  const paths = [];
  if (geom.type === "Polygon") {
    geom.coordinates.forEach((ring) =>
      paths.push(ring.map(([lng, lat]) => ({ lat, lng })))
    );
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly) =>
      poly.forEach((ring) =>
        paths.push(ring.map(([lng, lat]) => ({ lat, lng })))
      )
    );
  }
  return paths;
}