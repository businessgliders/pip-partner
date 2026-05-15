import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Read params from JSON body (how base44.functions.invoke sends them)
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const q = body.q;
    const width = String(body.w || 640);
    const height = String(body.h || 180);
    const zoom = String(body.z || 12);

    if (!q) {
      return Response.json({ error: 'Missing q' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'GOOGLE_MAPS_API_KEY not set' }, { status: 500 });
    }

    const params = new URLSearchParams({
      center: q,
      zoom,
      size: `${width}x${height}`,
      scale: '2',
      maptype: 'roadmap',
      markers: `color:0xec4899|${q}`,
      key: apiKey,
    });

    const mapsUrl = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
    const resp = await fetch(mapsUrl);

    if (!resp.ok) {
      const text = await resp.text();
      return Response.json({ error: 'Maps API error', detail: text }, { status: resp.status });
    }

    const buf = await resp.arrayBuffer();
    // Return as base64 data URL so frontend can render directly without blob handling
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return Response.json({ dataUrl: `data:image/png;base64,${base64}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});