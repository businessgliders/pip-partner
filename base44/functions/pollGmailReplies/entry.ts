import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' +
        encodeURIComponent('newer_than:1h -in:sent in:inbox') +
        '&maxResults=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      return Response.json({ error: 'Gmail list failed', details: errText }, { status: 502 });
    }

    const list = await listRes.json();
    const messages = list.messages || [];

    if (messages.length === 0) {
      return Response.json({ found: 0, new: 0 });
    }

    // Filter out IDs we already have
    const newIds = [];
    for (const m of messages) {
      const existing = await base44.asServiceRole.entities.EmailMessage.filter(
        { gmail_message_id: m.id },
        '-created_date',
        1
      );
      if (existing.length === 0) newIds.push(m.id);
    }

    if (newIds.length === 0) {
      return Response.json({ found: messages.length, new: 0 });
    }

    const ingestRes = await base44.asServiceRole.functions.invoke('ingestGmailReply', {
      message_ids: newIds,
    });

    return Response.json({
      found: messages.length,
      new: newIds.length,
      ingest: ingestRes,
    });
  } catch (error) {
    console.error('pollGmailReplies error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});