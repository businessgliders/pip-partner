// One-time admin utility — assigns sequential `app_number` to any record
// missing one across all 4 application entities. Orders by created_date ASC
// so older submissions get lower numbers. Existing app_numbers are preserved.
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

async function backfillEntity(base44, entityName) {
  const all = await base44.asServiceRole.entities[entityName].list('created_date', 5000);
  let maxNumber = 0;
  for (const r of all) {
    if (typeof r.app_number === 'number' && r.app_number > maxNumber) {
      maxNumber = r.app_number;
    }
  }

  const missing = all.filter((r) => !r.app_number);
  let assigned = 0;
  for (const record of missing) {
    maxNumber += 1;
    await base44.asServiceRole.entities[entityName].update(record.id, { app_number: maxNumber });
    assigned += 1;
  }

  return { entity: entityName, total: all.length, assigned, highest: maxNumber };
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