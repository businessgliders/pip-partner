// One-off admin tool: adds the franchise team (gurpreen, rashmeen, sahil) as
// guests on every UPCOMING Cal.com booking under the franchise event types.
//
// Uses Cal.com v2 PATCH /bookings/{uid} with the `guests` field. Existing
// guests are merged (de-duped, case-insensitive) so re-running is safe.
//
// Auth: admin-only (uses the caller's base44 session).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FRANCHISE_TEAM_GUESTS = [
  'gurpreen@pilatesinpinkstudio.com',
  'rashmeen@pilatesinpinkstudio.com',
  'sahil@pilatesinpinkstudio.com',
];

const CAL_API = 'https://api.cal.com/v2';
const CAL_VERSION = '2024-08-13';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('CAL_API_KEY');
    if (!apiKey) return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });

    const franchiseEventTypeIds = [
      Deno.env.get('CAL_EVENT_TYPE_ID_FRANCHISE'),
      '5595622',
      '6052661',
    ].filter(Boolean).map(String);

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': CAL_VERSION,
      'Content-Type': 'application/json',
    };

    // Fetch upcoming bookings (Cal.com paginates; loop until exhausted).
    const upcoming = [];
    let skip = 0;
    const take = 100;
    for (let i = 0; i < 20; i++) {
      const url = `${CAL_API}/bookings?status=upcoming&take=${take}&skip=${skip}`;
      const resp = await fetch(url, { headers });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
      if (!resp.ok) {
        return Response.json({ error: 'Failed to list bookings', details: data }, { status: resp.status });
      }
      const page = data?.data || [];
      upcoming.push(...page);
      if (page.length < take) break;
      skip += take;
    }

    // Filter to franchise event types only.
    const franchiseBookings = upcoming.filter((b) => {
      const id = String(b?.eventTypeId ?? b?.eventType?.id ?? '');
      return franchiseEventTypeIds.includes(id);
    });

    const results = [];
    for (const b of franchiseBookings) {
      const uid = b?.uid || b?.id;
      if (!uid) continue;

      const attendeeEmail = String(b?.attendees?.[0]?.email || '').toLowerCase();
      const existingGuests = Array.isArray(b?.guests)
        ? b.guests.map((g) => (typeof g === 'string' ? g : g?.email)).filter(Boolean)
        : [];
      const existingLower = new Set(existingGuests.map((e) => String(e).toLowerCase()));

      // Which team members still need to be added (skip attendee + already-present).
      const toAdd = FRANCHISE_TEAM_GUESTS.filter(
        (e) => e.toLowerCase() !== attendeeEmail && !existingLower.has(e.toLowerCase())
      );

      if (toAdd.length === 0) {
        results.push({ uid, status: 'already-invited', attendee: attendeeEmail });
        continue;
      }

      const guestsPayload = toAdd.map((email) => ({
        email,
        name: email.split('@')[0],
      }));

      const resp = await fetch(`${CAL_API}/bookings/${uid}/guests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guests: guestsPayload }),
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }

      if (!resp.ok) {
        console.error('Add guests failed', uid, resp.status, data);
        results.push({ uid, status: 'failed', error: data, attendee: attendeeEmail });
      } else {
        results.push({ uid, status: 'updated', added: toAdd, attendee: attendeeEmail });
      }
    }

    const summary = {
      total_upcoming: upcoming.length,
      franchise_upcoming: franchiseBookings.length,
      updated: results.filter((r) => r.status === 'updated').length,
      already_invited: results.filter((r) => r.status === 'already-invited').length,
      failed: results.filter((r) => r.status === 'failed').length,
    };

    return Response.json({ success: true, summary, results });
  } catch (error) {
    console.error('backfillFranchiseGuests error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});