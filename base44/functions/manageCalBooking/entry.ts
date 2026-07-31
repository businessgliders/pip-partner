// Admin-only: manage a Cal.com booking via API v2.
// Payload: { action: 'details' | 'reschedule' | 'cancel', uid, start?, reason? }
//   - details:    GET  /v2/bookings/{uid}
//   - reschedule: POST /v2/bookings/{uid}/reschedule  { start, reschedulingReason? }
//   - cancel:     POST /v2/bookings/{uid}/cancel      { cancellationReason? }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
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

    const body = await req.json().catch(() => ({}));
    const { action, uid, start, reason } = body || {};

    if (!uid || typeof uid !== 'string') {
      return Response.json({ error: 'Missing booking uid' }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    };

    let resp;
    if (action === 'details') {
      resp = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}`, { headers });
    } else if (action === 'reschedule') {
      if (!start) return Response.json({ error: 'Missing new start time' }, { status: 400 });
      resp = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}/reschedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          start,
          ...(reason ? { reschedulingReason: String(reason).slice(0, 500) } : {}),
          rescheduledBy: me.email,
        }),
      });
    } else if (action === 'cancel') {
      resp = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cancellationReason: reason ? String(reason).slice(0, 500) : 'Cancelled by Pilates in Pink staff',
        }),
      });
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

    if (!resp.ok) {
      console.error('manageCalBooking error', action, resp.status, data);
      return Response.json(
        { error: data?.error?.message || data?.message || `Cal.com ${action} failed`, details: data },
        { status: resp.status }
      );
    }

    return Response.json({ success: true, booking: data?.data || data });
  } catch (error) {
    console.error('manageCalBooking error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}