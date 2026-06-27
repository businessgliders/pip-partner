// toggleFollowUp — admin endpoint called from the inbox UI to start, stop,
// or restart the automated follow-up sequence on a ticket.
//
// Body: { ticket_id, ticket_type, action: 'start' | 'stop', max_steps?: number, first_delay_days?: number }
//
// On "start": resets follow_up state, sets enabled=true, schedules the first
// send for `first_delay_days` (default 2). The scheduled processor picks it
// up on the next cycle.
// On "stop": sets enabled=false with paused_reason='stopped'. History is kept.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STAFF_DOMAINS = ['pilatesinpinkstudio.com', 'pilatesinpink.ca'];
const ENTITY_NAMES = new Set(['FranchiseInquiry', 'InfluencerApplication', 'InstructorApplication', 'FrontAdminApplication']);

function isStaffEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return STAFF_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

function addDays(iso, days) {
  const d = iso ? new Date(iso) : new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isStaffEmail(user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticket_id, ticket_type, action, max_steps, first_delay_days } = await req.json();
    if (!ticket_id || !ticket_type || !ENTITY_NAMES.has(ticket_type)) {
      return Response.json({ error: 'ticket_id and valid ticket_type required' }, { status: 400 });
    }
    if (!['start', 'stop'].includes(action)) {
      return Response.json({ error: "action must be 'start' or 'stop'" }, { status: 400 });
    }

    const ticket = await base44.asServiceRole.entities[ticket_type].get(ticket_id);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });

    const existing = ticket.follow_up || {};

    if (action === 'stop') {
      const patched = { ...existing, enabled: false, paused_reason: 'stopped' };
      await base44.asServiceRole.entities[ticket_type].update(ticket_id, { follow_up: patched });
      return Response.json({ success: true, follow_up: patched });
    }

    // action === 'start': reset and schedule.
    const cap = Math.max(1, Math.min(10, Number.isFinite(max_steps) ? max_steps : (existing.max_steps || 5)));
    const delay = Math.max(0, Math.min(14, Number.isFinite(first_delay_days) ? first_delay_days : 2));
    const nowIso = new Date().toISOString();
    const patched = {
      enabled: true,
      step: 0,
      max_steps: cap,
      next_send_at: addDays(nowIso, delay),
      last_sent_at: '',
      enabled_at: nowIso,
      enabled_by: user.email,
      paused_reason: '',
      history: [],
    };
    await base44.asServiceRole.entities[ticket_type].update(ticket_id, { follow_up: patched });
    return Response.json({ success: true, follow_up: patched });
  } catch (error) {
    console.error('toggleFollowUp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});