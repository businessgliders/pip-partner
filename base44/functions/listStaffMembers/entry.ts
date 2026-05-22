// Returns the list of staff team members (users with a staff-domain email).
// Uses service role so that non-admin staff users can also see their colleagues
// in the email composer "+ Add" picker — the built-in User entity RLS only
// lets admins list other users, so a service-role call is required here.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseStaffDomains() {
  const raw = Deno.env.get('STAFF_EMAIL_DOMAINS') || '';
  const list = raw
    .split(/[,\s]+/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (list.length > 0) return list;
  return ['pilatesinpinkstudio.com', 'pilatesinpink.ca'];
}

function isStaffEmail(email, domains) {
  if (!email) return false;
  const lower = String(email).toLowerCase();
  return domains.some((d) => lower.endsWith('@' + d));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch(() => null);
    if (!me?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domains = parseStaffDomains();
    // Only staff users may see the team roster.
    if (!isStaffEmail(me.email, domains)) {
      return Response.json({ members: [] });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const members = (users || [])
      .filter((u) => isStaffEmail(u.email, domains))
      .map((u) => ({ id: u.id, email: u.email, full_name: u.full_name || '' }));

    return Response.json({ members });
  } catch (error) {
    console.error('listStaffMembers error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});