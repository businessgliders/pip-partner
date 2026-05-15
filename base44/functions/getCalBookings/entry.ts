// Admin-only: fetches upcoming Cal.com bookings and returns a map of
// { [lowercased attendee email]: { start, end, title, status, bookingId } }
// Used by the board to show meeting time on cards.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('CAL_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });
    }

    // Pull upcoming bookings (Cal v2 supports filtering by status).
    // We page through results until we have everything or hit a safety cap.
    const map = {};
    const seen = new Set();
    let skip = 0;
    const take = 100;
    const MAX_PAGES = 10;

    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL('https://api.cal.com/v2/bookings');
      url.searchParams.set('status', 'upcoming');
      url.searchParams.set('take', String(take));
      url.searchParams.set('skip', String(skip));

      const resp = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'cal-api-version': '2024-08-13',
        },
      });

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

      if (!resp.ok) {
        console.error('Cal.com bookings error', resp.status, data);
        return Response.json({ error: 'Failed to fetch bookings', details: data }, { status: resp.status });
      }

      const bookings = Array.isArray(data?.data) ? data.data : [];
      if (bookings.length === 0) break;

      for (const b of bookings) {
        if (b?.status && String(b.status).toLowerCase() === 'cancelled') continue;
        const start = b?.start || b?.startTime;
        if (!start) continue;
        const attendees = Array.isArray(b?.attendees) ? b.attendees : [];
        for (const a of attendees) {
          const email = (a?.email || '').toLowerCase().trim();
          if (!email) continue;
          const existing = map[email];
          // Keep the earliest upcoming booking per email.
          if (!existing || new Date(start) < new Date(existing.start)) {
            map[email] = {
              start,
              end: b?.end || b?.endTime || null,
              title: b?.title || null,
              status: b?.status || null,
              bookingId: b?.id || b?.uid || null,
            };
          }
        }
        seen.add(b?.id || b?.uid);
      }

      if (bookings.length < take) break;
      skip += take;
    }

    return Response.json({ bookings: map, count: Object.keys(map).length });
  } catch (error) {
    console.error('getCalBookings error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});