// Fetches available slots from Cal.com for the configured event type.
// Uses Cal.com API v2 (/v2/slots) which returns slots grouped by date.
// Payload (optional): { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", timeZone: "America/Toronto" }
// Defaults to the next 30 days starting tomorrow, in America/Toronto.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiKey = Deno.env.get('CAL_API_KEY');
    const username = Deno.env.get('CAL_USERNAME');

    if (!apiKey) {
      return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) { body = {}; }

    // Determine event type based on boardKey: 'franchise' or 'hiring' (default).
    // Franchise supports two whitelisted sub-types (Discovery, Prospectus) that
    // can be selected per-booking by admin staff via the BookCallPopover.
    const boardKey = body.boardKey || 'hiring';
    const FRANCHISE_ALLOWED_EVENT_TYPES = ['5595622', '6052661'];
    let eventTypeId;
    if (boardKey === 'franchise') {
      const requested = body.eventTypeId ? String(body.eventTypeId) : null;
      if (requested && FRANCHISE_ALLOWED_EVENT_TYPES.includes(requested)) {
        eventTypeId = requested;
      } else {
        eventTypeId = Deno.env.get('CAL_EVENT_TYPE_ID_FRANCHISE');
      }
    } else {
      eventTypeId = Deno.env.get('CAL_EVENT_TYPE_ID_HIRING');
    }

    if (!eventTypeId) {
      return Response.json({ error: `Cal.com event type for '${boardKey}' is not configured` }, { status: 500 });
    }

    // Auth: two paths supported.
    // 1) Public franchise funnel — applicants aren't logged in, so we require
    //    an unguessable inquiryId (24-char Mongo-style hex) that resolves to a
    //    real FranchiseInquiry. Service role + short retry handles read-replica
    //    lag right after creation.
    // 2) Authenticated admin — staff booking on behalf of a ticket from the
    //    admin board. We skip the inquiryId check entirely.
    let isAdmin = false;
    try {
      const me = await base44.auth.me();
      isAdmin = me?.role === 'admin';
    } catch (_) {}

    if (!isAdmin) {
      const { inquiryId } = body || {};
      if (!inquiryId || !/^[a-f0-9]{24}$/i.test(String(inquiryId))) {
        return Response.json({ error: 'Missing or invalid inquiryId' }, { status: 400 });
      }
      let found = false;
      for (let i = 0; i < 5; i++) {
        try {
          const rec = await base44.asServiceRole.entities.FranchiseInquiry.get(inquiryId);
          if (rec) { found = true; break; }
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!found) return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const timeZone = body.timeZone || 'America/Toronto';

    // Default range: tomorrow → +30 days
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 1);
    const end = new Date(today);
    end.setDate(end.getDate() + 31);

    const startDate = body.startDate || start.toISOString().slice(0, 10);
    const endDate = body.endDate || end.toISOString().slice(0, 10);

    const params = new URLSearchParams({
      eventTypeId: String(eventTypeId),
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.999Z`,
      timeZone,
    });
    // Note: Cal.com v2 doesn't accept username alongside eventTypeId.
    void username;

    const url = `https://api.cal.com/v2/slots?${params.toString()}`;

    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-09-04',
      },
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!resp.ok) {
      console.error('Cal.com slots error', resp.status, data);
      return Response.json(
        { error: 'Failed to fetch availability', details: data },
        { status: 500 }
      );
    }

    // Cal.com v2 returns { status, data: { "YYYY-MM-DD": [{ start: "ISO" }, ...] } }
    const slots = data?.data || {};
    return Response.json({ slots, timeZone, startDate, endDate });
  } catch (error) {
    console.error('getCalAvailability error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});