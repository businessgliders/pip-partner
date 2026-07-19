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

    // Note: getCalBookings fetches Cal bookings across both event types.
    // By default, only upcoming bookings are returned (used by the board UI for
    // ticket cards). Pass ?range=all (or POST body { range: 'all' }) to also
    // include past bookings — used by the Calendar view to plot meeting history.
    let range = 'upcoming';
    try {
      const url = new URL(req.url);
      const q = url.searchParams.get('range');
      if (q) range = q;
      if (!q && req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        if (body?.range) range = body.range;
      }
    } catch (_) {}
    const statuses = range === 'all' ? ['upcoming', 'past'] : ['upcoming'];

    // Classify each booking as franchise vs hiring based on its Cal event type.
    const FR_EVENT_ID = String(Deno.env.get('CAL_EVENT_TYPE_ID_FRANCHISE') || '');
    const HIRE_EVENT_ID = String(Deno.env.get('CAL_EVENT_TYPE_ID_HIRING') || '');

    // Map: email -> earliest UPCOMING booking (preserves existing consumer contract).
    // List: full booking list (both upcoming + past when range=all), used by
    // Calendar view to plot every meeting on its actual date.
    const map = {};
    const list = [];
    const seenIds = new Set();
    const take = 100;
    const MAX_PAGES = 10;

    for (const status of statuses) {
      let skip = 0;
      for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL('https://api.cal.com/v2/bookings');
        url.searchParams.set('status', status);
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
          const bId = b?.id || b?.uid;
          if (bId && seenIds.has(bId)) continue;
          if (bId) seenIds.add(bId);

          const attendees = Array.isArray(b?.attendees) ? b.attendees : [];
          const emails = attendees
            .map((a) => (a?.email || '').toLowerCase().trim())
            .filter(Boolean);

          const evId = String(b?.eventTypeId ?? b?.eventType?.id ?? '');
          const source = evId && evId === HIRE_EVENT_ID ? 'hiring'
            : evId && evId === FR_EVENT_ID ? 'franchise'
            : null;

          const entry = {
            start,
            eventTypeId: evId || null,
            source,
            end: b?.end || b?.endTime || null,
            title: b?.title || null,
            status: b?.status || null,
            bookingId: b?.id || b?.uid || null,
            uid: b?.uid || null,
            meetingUrl: b?.meetingUrl || b?.location || null,
            emails,
          };
          list.push(entry);

          if (status === 'upcoming') {
            for (const email of emails) {
              const existing = map[email];
              // Keep the earliest upcoming booking per email.
              if (!existing || new Date(start) < new Date(existing.start)) {
                map[email] = { ...entry };
              }
            }
          }
        }

        if (bookings.length < take) break;
        skip += take;
      }
    }

    return Response.json({ bookings: map, bookingsList: list, count: Object.keys(map).length });
  } catch (error) {
    console.error('getCalBookings error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});