import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// In-memory cache (lives for the lifetime of the function instance)
const cache = new Map();

async function geocodeOne(query, apiKey) {
  if (!query) return null;
  const key = query.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data.status !== 'OK' || !data.results?.length) {
    cache.set(key, null);
    return null;
  }
  const loc = data.results[0].geometry.location;
  const result = { lat: loc.lat, lng: loc.lng, formatted: data.results[0].formatted_address };
  cache.set(key, result);
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const queries = Array.isArray(body.queries) ? body.queries : [];
    if (!queries.length) {
      return Response.json({ results: {} });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GOOGLE_MAPS_API_KEY not set' }, { status: 500 });
    }

    const results = {};
    // Sequential to keep within rate limits and respect cache
    for (const q of queries) {
      if (!q || typeof q !== 'string') continue;
      results[q] = await geocodeOne(q, apiKey);
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});