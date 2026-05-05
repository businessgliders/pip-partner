// Fetches available slots from Cal.com for the configured event type.
// Uses Cal.com API v2 (/v2/slots) which returns slots grouped by date.
// Payload (optional): { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", timeZone: "America/Toronto" }
// Defaults to the next 14 days starting tomorrow, in America/Toronto.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('CAL_API_KEY');
    const eventTypeId = Deno.env.get('CAL_EVENT_TYPE_ID');
    const username = Deno.env.get('CAL_USERNAME');

    if (!apiKey || !eventTypeId) {
      return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) { body = {}; }

    const timeZone = body.timeZone || 'America/Toronto';

    // Default range: tomorrow → +14 days
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 1);
    const end = new Date(today);
    end.setDate(end.getDate() + 15);

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