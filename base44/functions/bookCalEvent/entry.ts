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

    if (!apiKey) {
      return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { start, timeZone = 'America/Toronto', name, email, phone, notes, inquiryId, friendlyTime, boardKey = 'hiring' } = body || {};

    // Determine event type based on boardKey: 'franchise' or 'hiring' (default)
    const eventTypeId = boardKey === 'franchise'
      ? Deno.env.get('CAL_EVENT_TYPE_ID_FRANCHISE')
      : Deno.env.get('CAL_EVENT_TYPE_ID_HIRING');

    if (!eventTypeId) {
      return Response.json({ error: `Cal.com event type for '${boardKey}' is not configured` }, { status: 500 });
    }

    if (!start || !name || !email) {
      return Response.json({ error: 'Missing required fields: start, name, email' }, { status: 400 });
    }

    // Auth: same model as getCalAvailability.
    // 1) Public franchise funnel — requires an unguessable inquiryId (24-char hex).
    // 2) Authenticated admin — staff booking on behalf of a ticket, bypasses inquiryId.
    let isAdmin = false;
    try {
      const me = await base44.auth.me();
      isAdmin = me?.role === 'admin';
    } catch (_) {}

    let existingInquiry = null;
    if (!isAdmin) {
      if (!inquiryId || !/^[a-f0-9]{24}$/i.test(String(inquiryId))) {
        return Response.json({ error: 'Missing or invalid inquiryId' }, { status: 400 });
      }
      for (let i = 0; i < 5; i++) {
        try {
          const rec = await base44.asServiceRole.entities.FranchiseInquiry.get(inquiryId);
          if (rec) { existingInquiry = rec; break; }
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!existingInquiry) return Response.json({ error: 'Inquiry not found' }, { status: 404 });
    } else if (inquiryId && /^[a-f0-9]{24}$/i.test(String(inquiryId))) {
      try {
        existingInquiry = await base44.asServiceRole.entities.FranchiseInquiry.get(inquiryId);
      } catch (_) {}
    }

    // Idempotency guard: if this inquiry already has a scheduled call, do not
    // create another Cal.com booking. Returning success keeps the client flow
    // happy (it transitions to "done") while preventing duplicates from
    // double-clicks, page refreshes, or resumed sessions.
    if (existingInquiry?.scheduled_call_time && !isAdmin) {
      return Response.json({
        success: true,
        alreadyBooked: true,
        scheduledCallTime: existingInquiry.scheduled_call_time,
      });
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

    // Persist the booking on the inquiry record server-side. The applicant is
    // not authenticated in the public funnel, so they cannot update the entity
    // from the browser (RLS blocks it). Doing it here — with service role —
    // makes the flow reliable and prevents the misleading "couldn't book that
    // slot" error after Cal.com has already created the booking.
    if (inquiryId && /^[a-f0-9]{24}$/i.test(String(inquiryId)) && existingInquiry && !existingInquiry.scheduled_call_time) {
      try {
        await base44.asServiceRole.entities.FranchiseInquiry.update(inquiryId, {
          scheduled_call_time: friendlyTime || start,
          status: 'scheduled',
        });
      } catch (updateErr) {
        // Log but don't fail the request — the Cal.com booking already exists,
        // and the calBookingWebhook will reconcile the inquiry record shortly.
        console.error('bookCalEvent: failed to update inquiry record', updateErr);
      }
    }

    return Response.json({ success: true, booking: data?.data || data });
  } catch (error) {
    console.error('bookCalEvent error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});