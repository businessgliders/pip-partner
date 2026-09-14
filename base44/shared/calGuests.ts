// Attaches the team members configured in MeetingGuestSetting as guests on a
// Cal.com booking. Bookings made through the app's own flow already get this;
// this lets bookings that arrive straight from a Cal.com link match them.

const CAL_API = 'https://api.cal.com/v2';
const CAL_VERSION = '2024-08-13';

function emailsOf(list) {
  return (Array.isArray(list) ? list : [])
    .map((g) => String(typeof g === 'string' ? g : g?.email || '').toLowerCase())
    .filter(Boolean);
}

// booking: the Cal.com webhook payload's `data` object.
export async function attachConfiguredGuests(base44, booking) {
  const apiKey = Deno.env.get('CAL_API_KEY');
  const uid = booking?.uid || booking?.id;
  const eventTypeId = String(booking?.eventTypeId ?? booking?.eventType?.id ?? '');
  if (!apiKey || !uid || !eventTypeId) {
    return { skipped: true, reason: 'missing api key, booking uid or event type' };
  }

  const settings = await base44.asServiceRole.entities.MeetingGuestSetting.filter({
    event_type_id: eventTypeId,
  });
  const configured = settings?.[0]?.guests || [];
  if (configured.length === 0) {
    return { skipped: true, reason: 'no guests configured for this event type' };
  }

  // Never re-add someone already on the booking (attendee, guest or organizer).
  const present = new Set([
    ...emailsOf(booking.attendees),
    ...emailsOf(booking.guests),
    ...emailsOf([booking.organizer]),
  ]);
  const toAdd = configured.filter((e) => !present.has(String(e).toLowerCase()));
  if (toAdd.length === 0) return { skipped: true, reason: 'all guests already present' };

  const resp = await fetch(`${CAL_API}/bookings/${uid}/guests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': CAL_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      guests: toAdd.map((email) => ({ email, name: email.split('@')[0] })),
    }),
  });

  if (!resp.ok) {
    const details = await resp.text();
    console.error('attachConfiguredGuests failed', uid, resp.status, details);
    return { added: [], failed: true, status: resp.status, details };
  }
  return { added: toAdd };
}