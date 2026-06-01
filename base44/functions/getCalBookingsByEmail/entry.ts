// Admin-only: fetches all Cal.com bookings (past + upcoming) for a single
// attendee email. Used by the submission detail modal to show all calls this
// person has booked with us.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json().catch(() => ({}));
    const target = (email || '').toLowerCase().trim();
    if (!target) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('CAL_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });
    }

    // Use Cal v2 attendeeEmail filter to fetch directly by email.
    const bookings = [];
    let skip = 0;
    const take = 100;
    const MAX_PAGES = 5;

    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL('https://api.cal.com/v2/bookings');
      url.searchParams.set('attendeeEmail', target);
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

      const page_bookings = Array.isArray(data?.data) ? data.data : [];
      if (page_bookings.length === 0) break;

      for (const b of page_bookings) {
        const start = b?.start || b?.startTime;
        if (!start) continue;
        bookings.push({
          start,
          end: b?.end || b?.endTime || null,
          title: b?.title || null,
          status: b?.status || null,
          uid: b?.uid || null,
          bookingId: b?.id || b?.uid || null,
          meetingUrl: b?.meetingUrl || b?.location || null,
          eventTypeId: b?.eventTypeId || b?.eventType?.id || null,
        });
      }

      if (page_bookings.length < take) break;
      skip += take;
    }

    // Sort soonest upcoming first, then past most-recent first
    const now = Date.now();
    bookings.sort((a, b) => {
      const ta = new Date(a.start).getTime();
      const tb = new Date(b.start).getTime();
      const aUp = ta >= now;
      const bUp = tb >= now;
      if (aUp && bUp) return ta - tb;
      if (!aUp && !bUp) return tb - ta;
      return aUp ? -1 : 1;
    });

    return Response.json({ bookings, count: bookings.length });
  } catch (error) {
    console.error('getCalBookingsByEmail error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});