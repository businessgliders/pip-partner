// Verifies the 6-digit PIN that was emailed to an existing franchise inquirer
// so they can resume booking a discovery call. Returns the inquiryId (unguessable
// 24-char Mongo hex) and a small set of sanitized inquiry fields needed by the
// frontend on success. Limits attempts to 5 per PIN to prevent brute force.
//
// Payload: { email: string, pin: string }
// Response: { ok: boolean, error?: string, inquiry?: {...} }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_ATTEMPTS = 5;

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const { email, pin } = await req.json();
    if (!isValidEmail(email) || !/^\d{6}$/.test(String(pin || ''))) {
      return Response.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const normalized = email.trim().toLowerCase();

    const matches = await base44.asServiceRole.entities.FranchiseInquiry.filter(
      { email: normalized },
      '-created_date',
      20
    );
    const candidate = (matches || []).find(
      (r) => !r.archived && r.resume_pin_hash
    );

    if (!candidate) {
      return Response.json({ ok: false, error: 'No pending application found' }, { status: 404 });
    }

    // Expiry check
    if (candidate.resume_pin_expires_at && new Date(candidate.resume_pin_expires_at).getTime() < Date.now()) {
      return Response.json({ ok: false, error: 'Code expired — please request a new one' }, { status: 410 });
    }

    // Attempt limit
    const attempts = candidate.resume_pin_attempts || 0;
    if (attempts >= MAX_ATTEMPTS) {
      return Response.json({ ok: false, error: 'Too many attempts — please request a new code' }, { status: 429 });
    }

    const submittedHash = await sha256Hex(String(pin));
    if (submittedHash !== candidate.resume_pin_hash) {
      await base44.asServiceRole.entities.FranchiseInquiry.update(candidate.id, {
        resume_pin_attempts: attempts + 1,
      });
      return Response.json({ ok: false, error: 'Incorrect code' }, { status: 401 });
    }

    // Success — invalidate the PIN so it can't be reused
    await base44.asServiceRole.entities.FranchiseInquiry.update(candidate.id, {
      resume_pin_hash: null,
      resume_pin_expires_at: null,
      resume_pin_attempts: 0,
    });

    return Response.json({
      ok: true,
      inquiry: {
        id: candidate.id,
        first_name: candidate.first_name || '',
        last_name: candidate.last_name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        preferred_location: candidate.preferred_location || '',
        available_capital: candidate.available_capital || '',
        status: candidate.status || 'new',
        scheduled_call_time: candidate.scheduled_call_time || '',
      },
    });
  } catch (error) {
    console.error('verifyInquiryPin error', error);
    return Response.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
});