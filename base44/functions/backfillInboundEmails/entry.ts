import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Backfill: scan recent Gmail inbox messages and attach any from known
 * applicants (matched by sender email) as inbound replies on their submission
 * ticket. Idempotent — relies on ingestGmailReply's existing dedupe by Gmail
 * message id + RFC Message-ID.
 *
 * Usage (admin only): POST with optional { lookback_days?: number, max?: number }.
 *   lookback_days defaults to 365 (1 year).
 *   max caps the number of messages scanned (default 500, hard ceiling 2000).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: shared secret OR admin session.
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
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }
    const lookbackDays = Math.max(1, Math.min(Number(body?.lookback_days) || 365, 1825));
    const maxMessages = Math.max(1, Math.min(Number(body?.max) || 500, 2000));

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Collect all known applicant emails across the four entities so we only
    // pull Gmail messages we have a parent for.
    const ENTITY_NAMES = [
      'FranchiseInquiry',
      'InfluencerApplication',
      'InstructorApplication',
      'FrontAdminApplication',
    ];
    const knownEmails = new Set();
    for (const entityName of ENTITY_NAMES) {
      try {
        // Paginate through all records (1000 at a time)
        let skip = 0;
        const pageSize = 1000;
        // Cap at 5 pages = 5000 records per entity to keep this bounded.
        for (let page = 0; page < 5; page++) {
          const rows = await base44.asServiceRole.entities[entityName].list('-created_date', pageSize, skip);
          if (!rows || rows.length === 0) break;
          for (const r of rows) {
            if (r.email) knownEmails.add(String(r.email).toLowerCase());
          }
          if (rows.length < pageSize) break;
          skip += pageSize;
        }
      } catch (_) {}
    }

    if (knownEmails.size === 0) {
      return Response.json({ scanned: 0, candidates: 0, results: [], message: 'No applicant emails found' });
    }

    // Build a Gmail query: only inbox messages newer than N days from any known sender.
    // Gmail's "from:" supports OR clauses with parentheses; chunk to keep the query
    // length sane (Gmail's limit is around ~2000 chars in practice).
    const emails = Array.from(knownEmails);
    const CHUNK = 25;
    const messageIds = new Set();

    for (let i = 0; i < emails.length; i += CHUNK) {
      const chunk = emails.slice(i, i + CHUNK);
      const fromClause = chunk.map((e) => `from:${e}`).join(' OR ');
      const q = `in:inbox newer_than:${lookbackDays}d (${fromClause})`;

      let pageToken = undefined;
      // Each chunk: walk up to 5 pages.
      for (let p = 0; p < 5 && messageIds.size < maxMessages; p++) {
        const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
        url.searchParams.set('q', q);
        url.searchParams.set('maxResults', '100');
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          console.error('Gmail list failed:', res.status, await res.text().catch(() => ''));
          break;
        }
        const data = await res.json();
        (data.messages || []).forEach((m) => {
          if (messageIds.size < maxMessages) messageIds.add(m.id);
        });
        pageToken = data.nextPageToken;
        if (!pageToken) break;
      }

      if (messageIds.size >= maxMessages) break;
    }

    if (messageIds.size === 0) {
      return Response.json({
        scanned: 0,
        candidates: 0,
        known_applicants: knownEmails.size,
        results: [],
      });
    }

    // Hand the candidate ids to ingestGmailReply (reuses idempotent dedupe + parent
    // lookup logic, including the new "match by sender email" fallback).
    const result = await base44.asServiceRole.functions.invoke('ingestGmailReply', {
      message_ids: Array.from(messageIds),
    });

    // Summarise
    const data = result?.data || result || {};
    const results = Array.isArray(data.results) ? data.results : [];
    const summary = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    return Response.json({
      scanned: messageIds.size,
      known_applicants: knownEmails.size,
      lookback_days: lookbackDays,
      summary,
      results,
    });
  } catch (error) {
    console.error('backfillInboundEmails error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});