// Assigns an auto-incrementing `app_number` to a newly created application record.
// Triggered by entity automations on create for: FranchiseInquiry, InfluencerApplication,
// InstructorApplication, FrontAdminApplication.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_ENTITIES = new Set([
  'FranchiseInquiry',
  'InfluencerApplication',
  'InstructorApplication',
  'FrontAdminApplication',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const entityName = body?.event?.entity_name;
    const entityId = body?.event?.entity_id;

    if (!entityName || !entityId || !VALID_ENTITIES.has(entityName)) {
      return Response.json({ skipped: true, reason: 'invalid event' });
    }

    const current = await base44.asServiceRole.entities[entityName].get(entityId);
    if (current?.app_number) {
      return Response.json({ skipped: true, reason: 'already numbered', app_number: current.app_number });
    }

    // Find the current max app_number for this entity
    const recent = await base44.asServiceRole.entities[entityName].list('-app_number', 1);
    const maxNumber = recent?.[0]?.app_number || 0;
    const nextNumber = maxNumber + 1;

    await base44.asServiceRole.entities[entityName].update(entityId, { app_number: nextNumber });
    return Response.json({ success: true, app_number: nextNumber });
  } catch (error) {
    console.error('assignAppNumber error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});