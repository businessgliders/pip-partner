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
    .then((r) => r.json())
    .then((fc) => {
      // Union all province polygons into a single multipolygon
      const features = (fc.features || []).filter(
        (f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
      );
      if (!features.length) return null;
      let merged = features[0];
      for (let i = 1; i < features.length; i++) {
        try {
          merged = turf.union(merged, features[i]) || merged;
        } catch {
          // skip bad geometry
        }
      }
      landUnion = merged;
      return merged;
    })
    .catch(() => null);

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

  let clipped;
  try {
    clipped = turf.intersect(circle, landUnion);
  } catch {
    clipped = null;
  }
  if (!clipped) {
    const ring = circle.geometry.coordinates[0];
    return [ring.map(([lng, lat]) => ({ lat, lng }))];
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