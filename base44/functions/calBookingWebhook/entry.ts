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
import { getStaffRecipients, sendStaffEmail } from '../../shared/staffNotify.ts';

const TZ = 'America/Toronto';

function fmtWhen(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: TZ,
  }) + ' ET';
}

// Branded internal alert — a new booking landed in "awaiting confirmation".
async function notifyStaffPending(base44, booking) {
  const to = await getStaffRecipients(base44, 'meetings');
  if (to.length === 0) return { sent: 0, reason: 'no staff recipients' };

  const start = booking.startTime || booking.start;
  const attendee = booking.attendees?.[0] || {};
  const uid = booking.uid || booking.id;
  const calUrl = uid ? `https://app.cal.com/booking/${uid}` : 'https://app.cal.com/bookings/unconfirmed';
  const row = (label, value) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#96806f;width:130px;">${label}</td><td style="padding:6px 0;font-size:14px;color:#2d2320;font-weight:600;">${value}</td></tr>`;

  const inner = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#2d2320;">A meeting needs your confirmation</h1>
<p style="margin:0 0 20px;font-size:14px;color:#96806f;">This booking was requested and is waiting to be confirmed in Cal.com.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f4;border-radius:16px;padding:16px 20px;">
${row('Meeting', booking.title || 'Meeting')}
${row('When', start ? fmtWhen(start) : '—')}
${row('Requested by', attendee.name || '—')}
${row('Email', attendee.email ? `<a href="mailto:${attendee.email}" style="color:#b67651;">${attendee.email}</a>` : '—')}
</table>
<p style="text-align:center;margin:26px 0 6px;"><a href="${calUrl}" style="display:inline-block;background:#f1889b;color:#ffffff;padding:13px 32px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none;">Confirm in Cal.com</a></p>
<p style="text-align:center;font-size:12px;color:#96806f;margin:0;">Until it's confirmed, the time slot stays pending.</p>`;

  return await sendStaffEmail(base44, {
    to,
    subject: `Awaiting confirmation — ${booking.title || 'new meeting'}${start ? ` on ${fmtWhen(start)}` : ''}`,
    innerHtml: inner,
    preheader: 'A new booking is waiting to be confirmed.',
  });
}

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

    // Booking requested (awaiting confirmation) → branded staff alert only.
    // Nothing applicant-facing is sent or changed here.
    if (body.triggerEvent === 'BOOKING_REQUESTED' && body.data) {
      const result = await notifyStaffPending(base44, body.data);
      return Response.json({ success: true, pendingNotification: result });
    }

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

    // Update inquiry: set scheduled_call_time + status + _cal_booking metadata.
    // New franchise tickets default to "new"; once they book a Cal.com call
    // they move to "discovery" (the legacy "scheduled" status was removed).
    await base44.asServiceRole.entities.FranchiseInquiry.update(inquiry.id, {
      scheduled_call_time: friendlyTime,
      status: 'discovery',
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