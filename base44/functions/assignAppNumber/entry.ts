// Assigns an auto-incremented `app_number` to a newly created record.
// Triggered by entity automations on create for the 4 application entities.
// Idempotent: skips if the record already has app_number set.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ENTITIES = new Set([
  'FranchiseInquiry',
  'InfluencerApplication',
  'InstructorApplication',
  'FrontAdminApplication',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const entityName = payload?.event?.entity_name;
    const entityId = payload?.event?.entity_id;

    if (!entityName || !entityId || !ALLOWED_ENTITIES.has(entityName)) {
      return Response.json({ skipped: true, reason: 'Invalid entity' });
    }

    const current = await base44.asServiceRole.entities[entityName].get(entityId);
    if (!current) {
      return Response.json({ skipped: true, reason: 'Not found' });
    }
    if (current.app_number) {
      return Response.json({ skipped: true, reason: 'Already numbered', app_number: current.app_number });
    }

    // Find max existing app_number for this entity
    const all = await base44.asServiceRole.entities[entityName].list('-app_number', 1);
    const maxNum = (all && all[0] && all[0].app_number) || 0;
    const nextNum = maxNum + 1;

    await base44.asServiceRole.entities[entityName].update(entityId, { app_number: nextNum });
    return Response.json({ success: true, app_number: nextNum });
  } catch (error) {
    console.error('assignAppNumber error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});