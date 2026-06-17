// Assigns an auto-incrementing `app_number` (raw sequential) AND a
// `display_ticket_number` (obfuscated public number) to a newly created
// application record. Triggered by entity automations on create for:
// FranchiseInquiry, InfluencerApplication, InstructorApplication, FrontAdminApplication.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_ENTITIES = new Set([
  'FranchiseInquiry',
  'InfluencerApplication',
  'InstructorApplication',
  'FrontAdminApplication',
]);

// Must match lib/appNumberDisplay.js on the frontend.
const PROGRAM_CONFIG = {
  FranchiseInquiry:      { base: 4720, stride: 17 },
  InfluencerApplication: { base: 2380, stride: 23 },
  InstructorApplication: { base: 6150, stride: 19 },
  FrontAdminApplication: { base: 3840, stride: 29 },
};

function computeDisplayNumber(entityName, rawNumber) {
  const cfg = PROGRAM_CONFIG[entityName];
  if (!cfg) return null;
  return cfg.base + Number(rawNumber) * cfg.stride;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: shared secret (for entity automations / system calls) OR admin session (for manual invocation).
    const expectedSecret = Deno.env.get('AUTOMATION_SHARED_SECRET');
    const providedSecret =
      req.headers.get('x-automation-secret') ||
      req.headers.get('X-Automation-Secret') ||
      body?.secret ||
      '';
    const secretOk = !!expectedSecret && providedSecret === expectedSecret;

    if (!secretOk) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const entityName = body?.event?.entity_name;
    const entityId = body?.event?.entity_id;

    if (!entityName || !entityId || !VALID_ENTITIES.has(entityName)) {
      return Response.json({ skipped: true, reason: 'invalid event' });
    }

    const current = await base44.asServiceRole.entities[entityName].get(entityId);
    if (current?.app_number) {
      // Backfill display_ticket_number if it's missing on an already-numbered record.
      if (!current.display_ticket_number) {
        const display = computeDisplayNumber(entityName, current.app_number);
        if (display) {
          await base44.asServiceRole.entities[entityName].update(entityId, { display_ticket_number: display });
        }
      }
      return Response.json({ skipped: true, reason: 'already numbered', app_number: current.app_number });
    }

    // Find the current max app_number for this entity
    const recent = await base44.asServiceRole.entities[entityName].list('-app_number', 1);
    const maxNumber = recent?.[0]?.app_number || 0;
    const nextNumber = maxNumber + 1;
    const displayNumber = computeDisplayNumber(entityName, nextNumber);

    await base44.asServiceRole.entities[entityName].update(entityId, {
      app_number: nextNumber,
      display_ticket_number: displayNumber,
    });
    return Response.json({ success: true, app_number: nextNumber, display_ticket_number: displayNumber });
  } catch (error) {
    console.error('assignAppNumber error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});