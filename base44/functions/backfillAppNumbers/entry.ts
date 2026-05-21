// One-time admin utility — assigns sequential `app_number` AND
// `display_ticket_number` to any record missing them across all 4 application
// entities. Orders by created_date ASC so older submissions get lower numbers.
// Existing app_numbers are preserved; display_ticket_number is computed from
// the (possibly pre-existing) app_number.
//
// Usage (admin only):
//   await base44.functions.invoke('backfillAppNumbers', {})
//   await base44.functions.invoke('backfillAppNumbers', { entity_name: 'FranchiseInquiry' })

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITIES = [
  'FranchiseInquiry',
  'InfluencerApplication',
  'InstructorApplication',
  'FrontAdminApplication',
];

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

async function backfillEntity(base44, entityName) {
  const all = await base44.asServiceRole.entities[entityName].list('created_date', 5000);
  let maxNumber = 0;
  for (const r of all) {
    if (typeof r.app_number === 'number' && r.app_number > maxNumber) {
      maxNumber = r.app_number;
    }
  }

  let assignedApp = 0;
  let assignedDisplay = 0;

  for (const record of all) {
    const update = {};

    // Assign app_number if missing
    let appNum = record.app_number;
    if (!appNum) {
      maxNumber += 1;
      appNum = maxNumber;
      update.app_number = appNum;
      assignedApp += 1;
    }

    // Compute display_ticket_number if missing
    if (!record.display_ticket_number) {
      const display = computeDisplayNumber(entityName, appNum);
      if (display) {
        update.display_ticket_number = display;
        assignedDisplay += 1;
      }
    }

    if (Object.keys(update).length > 0) {
      await base44.asServiceRole.entities[entityName].update(record.id, update);
    }
  }

  return { entity: entityName, total: all.length, assigned_app: assignedApp, assigned_display: assignedDisplay, highest: maxNumber };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targets = body?.entity_name ? [body.entity_name] : ENTITIES;

    const results = [];
    for (const entityName of targets) {
      if (!ENTITIES.includes(entityName)) {
        results.push({ entity: entityName, error: 'unknown entity' });
        continue;
      }
      const r = await backfillEntity(base44, entityName);
      results.push(r);
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('backfillAppNumbers error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});