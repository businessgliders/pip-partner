import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAFF_DOMAINS = ['pilatesinpinkstudio.com', 'pilatesinpink.ca'];

const ENTITY_NAMES = {
  FranchiseInquiry: 'FranchiseInquiry',
  InfluencerApplication: 'InfluencerApplication',
  InstructorApplication: 'InstructorApplication',
  FrontAdminApplication: 'FrontAdminApplication',
};

const STYLE_GUIDE = `Tone: warm, friendly, professional. Pilates in Pink™ is a premium, feminine pilates studio franchise built around community, wellness, and elegant movement.
- Keep replies concise (2-4 short paragraphs max).
- Address the client by their first name when known.
- Sign off as the staff member writing (signature added separately).
- Never invent facts about pricing, schedules, or terms — defer to confirming details if unsure.
- Use plain HTML with <p> tags only. No headers, no inline styles.`;

function isStaffEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return STAFF_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

function htmlToText(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function clientName(ticket) {
  if (ticket?.full_name) return ticket.full_name;
  const fn = ticket?.first_name || '';
  const ln = ticket?.last_name || '';
  return `${fn} ${ln}`.trim() || 'the client';
}

// ---- Rate limiting (per-user, in-memory, per warm instance) ----
// Cold starts reset counters, which is acceptable as a defensive cost-control.
const RATE_WINDOW_MS = 60 * 60 * 1000;     // 1 hour
const RATE_MAX_PER_USER = 30;              // max LLM calls/user/hour
const TICKET_COOLDOWN_MS = 10 * 1000;      // 10s between calls on the same ticket
const userCallLog = new Map();             // email -> [timestamps]
const ticketLastCall = new Map();          // ticket_id -> timestamp

function checkRateLimits(userEmail, ticket_id) {
  const now = Date.now();
  // Per-ticket cooldown
  const lastTicket = ticketLastCall.get(ticket_id) || 0;
  if (now - lastTicket < TICKET_COOLDOWN_MS) {
    return { ok: false, reason: 'Please wait a moment before requesting AI assistance again.' };
  }
  // Per-user hourly limit
  const log = (userCallLog.get(userEmail) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (log.length >= RATE_MAX_PER_USER) {
    return { ok: false, reason: 'Hourly AI assistance limit reached. Try again later.' };
  }
  log.push(now);
  userCallLog.set(userEmail, log);
  ticketLastCall.set(ticket_id, now);
  return { ok: true };
}

async function buildThreadTranscript(base44, ticket_id, ticket_type) {
  const messages = await base44.asServiceRole.entities.EmailMessage.filter(
    { ticket_id, ticket_type },
    'created_date',
    200
  );
  return messages
    .map((m) => {
      const who =
        m.direction === 'inbound'
          ? `Client (${m.from_name || m.from_email})`
          : `Staff (${m.sent_by || 'unknown'})`;
      const body = m.body_text || htmlToText(m.body_html);
      return `${who} — Subject: ${m.subject}\n${body}`;
    })
    .join('\n\n---\n\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !isStaffEmail(user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { mode, ticket_id, ticket_type, description, draft, force_refresh } = await req.json();

    if (!mode || !ticket_id || !ticket_type) {
      return Response.json({ error: 'Missing mode, ticket_id or ticket_type' }, { status: 400 });
    }

    // Bound input sizes — protects against abusively large prompts driving up LLM cost
    if (description && String(description).length > 4000) {
      return Response.json({ error: 'Description too long (max 4000 chars).' }, { status: 400 });
    }
    if (draft && String(draft).length > 20000) {
      return Response.json({ error: 'Draft too long (max 20000 chars).' }, { status: 400 });
    }

    // Rate-limit cached "suggest" calls don't need to be limited; only LLM-bound calls do.
    // We check before LLM invocation below (after the cache check for suggest mode).

    const entityName = ENTITY_NAMES[ticket_type];
    if (!entityName) {
      return Response.json({ error: 'Unknown ticket_type' }, { status: 400 });
    }

    const ticket = await base44.asServiceRole.entities[entityName].get(ticket_id);
    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const messages = await base44.asServiceRole.entities.EmailMessage.filter(
      { ticket_id, ticket_type },
      'created_date',
      200
    );
    const messageCount = messages.length;
    const transcript = await buildThreadTranscript(base44, ticket_id, ticket_type);
    const contextHeader = `Program: ${ticket_type}\nClient name: ${clientName(ticket)}\nClient email: ${ticket.email || ''}\n\nThread so far:\n${transcript || '(no messages yet)'}`;

    if (mode === 'suggest') {
      // Cache check
      if (
        !force_refresh &&
        Array.isArray(ticket.ai_suggestions) &&
        ticket.ai_suggestions.length > 0 &&
        ticket.ai_suggestions_message_count === messageCount
      ) {
        return Response.json({
          cached: true,
          generated_at: ticket.ai_suggestions_generated_at,
          suggestions: ticket.ai_suggestions,
        });
      }

      const rl = checkRateLimits(user.email, ticket_id);
      if (!rl.ok) return Response.json({ error: rl.reason }, { status: 429 });

      const prompt = `${STYLE_GUIDE}\n\n${contextHeader}\n\nGenerate exactly 3 distinct reply suggestions for the staff member. Each must take a DIFFERENT angle:\n1. Direct & quick — short, gets to the point\n2. Detailed & thorough — answers anticipated questions\n3. Warm & relational — leads with empathy/connection\n\nReturn HTML body using only <p> tags. No greeting line beyond "Hi [first name]," and no signature (added separately).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  body_html: { type: 'string' },
                },
                required: ['label', 'body_html'],
              },
            },
          },
          required: ['suggestions'],
        },
      });

      const suggestions = result?.suggestions || [];

      await base44.asServiceRole.entities[entityName].update(ticket_id, {
        ai_suggestions: suggestions,
        ai_suggestions_generated_at: new Date().toISOString(),
        ai_suggestions_message_count: messageCount,
      });

      return Response.json({
        cached: false,
        generated_at: new Date().toISOString(),
        suggestions,
      });
    }

    if (mode === 'compose') {
      if (!description) {
        return Response.json({ error: 'Missing description' }, { status: 400 });
      }
      const rl = checkRateLimits(user.email, ticket_id);
      if (!rl.ok) return Response.json({ error: rl.reason }, { status: 429 });

      const prompt = `${STYLE_GUIDE}\n\n${contextHeader}\n\nThe staff member wants to convey this: "${description}"\n\nWrite the full email body in HTML using only <p> tags. Start with "Hi [first name]," and do not include a signature.`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { body_html: { type: 'string' } },
          required: ['body_html'],
        },
      });
      return Response.json({ body_html: result?.body_html || '' });
    }

    if (mode === 'polish') {
      if (!draft) {
        return Response.json({ error: 'Missing draft' }, { status: 400 });
      }
      const rl = checkRateLimits(user.email, ticket_id);
      if (!rl.ok) return Response.json({ error: rl.reason }, { status: 429 });

      const prompt = `${STYLE_GUIDE}\n\n${contextHeader}\n\nPolish this draft for grammar, tone, and flow while preserving the writer's intent. Keep it in HTML using only <p> tags. Do not add or remove core content.\n\nDraft:\n${draft}`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: { body_html: { type: 'string' } },
          required: ['body_html'],
        },
      });
      return Response.json({ body_html: result?.body_html || '' });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error('aiEmailAssist error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});