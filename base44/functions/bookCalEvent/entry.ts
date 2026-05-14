// Books a meeting on Cal.com using the v2 API.
// Payload: {
//   start: "ISO datetime",
//   timeZone: "America/Toronto",
//   name: "Full name",
//   email: "x@y.com",
//   phone?: "...",
//   notes?: "..."
// }
// Returns the Cal.com booking object on success.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiKey = Deno.env.get('CAL_API_KEY');
    const eventTypeId = Deno.env.get('CAL_EVENT_TYPE_ID');

    if (!apiKey || !eventTypeId) {
      return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { start, timeZone = 'America/Toronto', name, email, phone, notes, inquiryId } = body || {};

    if (!start || !name || !email) {
      return Response.json({ error: 'Missing required fields: start, name, email' }, { status: 400 });
    }

    // Auth: same model as getCalAvailability — require a real inquiryId
    // readable under user-scoped RLS, so anonymous applicants can book but
    // random callers can't create bookings on the studio's Cal.com.
    if (!inquiryId) {
      return Response.json({ error: 'Missing inquiryId' }, { status: 400 });
    }
    try {
      const inquiry = await base44.entities.FranchiseInquiry.get(inquiryId);
      if (!inquiry) return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (_) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = {
      start,
      eventTypeId: Number(eventTypeId),
      attendee: {
        name,
        email,
        timeZone,
        language: 'en',
      },
      ...(phone ? { bookingFieldsResponses: { phone } } : {}),
      ...(notes ? { metadata: { notes: String(notes).slice(0, 500) } } : {}),
    };

    const resp = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!resp.ok) {
      console.error('Cal.com booking error', resp.status, data);
      return Response.json(
        { error: 'Failed to create booking', details: data },
        { status: resp.status }
      );
    }

    return Response.json({ success: true, booking: data?.data || data });
  } catch (error) {
    console.error('bookCalEvent error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});