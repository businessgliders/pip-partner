// Admin-only: lists the Cal.com event types for the configured account so the
// hub can offer per-call-type settings (e.g. which team members join as guests).
// Returns [{ id, title, length, group }] where group is 'franchise' | 'hiring' | null.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('CAL_API_KEY');
    const username = Deno.env.get('CAL_USERNAME');
    if (!apiKey) return Response.json({ error: 'Cal.com is not configured' }, { status: 500 });

    const url = new URL('https://api.cal.com/v2/event-types');
    if (username) url.searchParams.set('username', username);

    const resp = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'cal-api-version': '2024-06-14' },
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('Cal.com event types error', resp.status, data);
      return Response.json({ error: 'Failed to fetch event types', details: data }, { status: resp.status });
    }

    // Normalize: data.data can be a flat array of event types or grouped.
    const raw = data?.data;
    let items = [];
    if (Array.isArray(raw)) items = raw;
    else if (Array.isArray(raw?.eventTypeGroups)) {
      for (const g of raw.eventTypeGroups) items.push(...(g?.eventTypes || []));
    }

    const FR_IDS = new Set([
      String(Deno.env.get('CAL_EVENT_TYPE_ID_FRANCHISE') || ''),
      '5595622', '6052661',
    ]);
    const HIRE_ID = String(Deno.env.get('CAL_EVENT_TYPE_ID_HIRING') || '');

    const eventTypes = items
      .filter((t) => t?.id)
      .map((t) => {
        const id = String(t.id);
        return {
          id,
          title: t.title || t.slug || `Event ${id}`,
          length: t.lengthInMinutes || t.length || null,
          group: FR_IDS.has(id) ? 'franchise' : id === HIRE_ID ? 'hiring' : null,
        };
      });

    return Response.json({ eventTypes });
  } catch (error) {
    console.error('getCalEventTypes error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}