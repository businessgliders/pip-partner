// Handles incoming Cal.com booking webhooks (BOOKING_CREATED event).
// Reconciles FranchiseInquiry records that were missing scheduled_call_time
// due to browser-side failures after Cal.com booking succeeded.
//
// Webhook POST payload structure:
// {
//   "triggerEvent": "BOOKING_CREATED",
//   "createdAt": "2026-05-21T02:45:00.000Z",
//   "data": {
//     "uid": "...",
//     "eventTypeId": 123,
//     "attendees": [{ "email": "..." }],
//     "startTime": "2026-05-24T19:00:00.000Z",
//     "endTime": "2026-05-24T20:00:00.000Z",
//     "title": "...",
//     ...
//   }
// }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function verifySignature(req, secret) {
  if (!secret) return true; // Skip verification if no secret configured
  try {
    const signature = req.headers.get('x-cal-signature');
    if (!signature) return false;

    const rawBody = await req.text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const computed = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedSig = Array.from(new Uint8Array(computed))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const expectedSig = signature.replace('sha256=', '');
    return computedSig === expectedSig;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    // Verify webhook signature (optional if secret not set)
    const secret = Deno.env.get('CAL_WEBHOOK_SECRET') || '';
    const isValid = await verifySignature(req, secret);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Only process BOOKING_CREATED events
    if (body.triggerEvent !== 'BOOKING_CREATED' || !body.data) {
      return Response.json({ skipped: true, reason: 'Not a BOOKING_CREATED event' });
    }

    const booking = body.data;
    const attendeeEmail = booking.attendees?.[0]?.email;
    const startTime = booking.startTime;
    const uid = booking.uid;

    if (!attendeeEmail || !startTime || !uid) {
      return Response.json({ skipped: true, reason: 'Missing booking details' });
    }

    // Find matching FranchiseInquiry by email
    const inquiries = await base44.asServiceRole.entities.FranchiseInquiry.filter(
      { email: attendeeEmail },
      '-created_date',
      5
    );

    if (inquiries.length === 0) {
      return Response.json({ skipped: true, reason: 'No matching FranchiseInquiry' });
    }

    // Find the most recent inquiry that hasn't been reconciled yet
    const inquiry = inquiries.find((q) => !q.scheduled_call_time);

    if (!inquiry) {
      return Response.json({ skipped: true, reason: 'Inquiry already has scheduled_call_time' });
    }

    // Format friendly time (assuming America/Toronto for now, matches OwnAStudio behavior)
    const d = new Date(startTime);
    const friendlyTime = d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    });

    // Update inquiry: set scheduled_call_time + status + _cal_booking metadata
    await base44.asServiceRole.entities.FranchiseInquiry.update(inquiry.id, {
      scheduled_call_time: friendlyTime,
      status: 'scheduled',
      _cal_booking: {
        uid,
        bookingId: booking.id,
        start: startTime,
        meetingUrl: booking.meetingUrl || null,
      },
    });

    // Send the "call booked" emails (owner notification + delayed submitter confirmation)
    // Fire-and-forget — backend delays submitter confirmation so it lands after welcome
    base44.functions.invoke('sendFranchiseInquiryEmail', {
      inquiryId: inquiry.id,
      inquiryData: {
        first_name: inquiry.first_name,
        last_name: inquiry.last_name,
        email: inquiry.email,
        phone: inquiry.phone,
        available_capital: inquiry.available_capital,
        preferred_location: inquiry.preferred_location,
      },
      scheduledTime: friendlyTime,
    });

    return Response.json({
      success: true,
      reconciled: {
        inquiryId: inquiry.id,
        email: attendeeEmail,
        scheduledTime: friendlyTime,
      },
    });
  } catch (error) {
    console.error('calBookingWebhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});