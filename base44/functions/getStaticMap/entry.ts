import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const width = url.searchParams.get('w') || '640';
    const height = url.searchParams.get('h') || '180';
    const zoom = url.searchParams.get('z') || '12';

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
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});