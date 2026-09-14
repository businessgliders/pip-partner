// Shared helper: send a branded internal notification email to a configurable
// staff email list (NotificationSetting rows). Never touches applicant-facing
// email flows.

import { brandedShell, htmlToText, quotedPrintable } from './emailBranding.ts';
import { base64UrlEncode, rfc2047 } from './gmailMime.ts';

const FROM = { email: 'internal@pilatesinpinkstudio.com', name: 'Pilates in Pink \u2122 Hub' };

export async function getStaffRecipients(base44, source) {
  const rows = await base44.asServiceRole.entities.NotificationSetting.filter({ source }, '-created_date', 1);
  const row = rows[0];
  if (!row || row.enabled === false) return [];
  return (row.emails || []).map((e) => String(e).trim()).filter(Boolean);
}

export async function sendStaffEmail(base44, { to, subject, innerHtml, preheader }) {
  if (!to || to.length === 0) return { sent: 0, reason: 'no recipients' };

  const conn = await base44.asServiceRole.connectors.getConnection('gmail');
  const html = brandedShell(innerHtml, preheader || '');
  const text = htmlToText(innerHtml);
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: ${rfc2047(FROM.name)} <${FROM.email}>`,
    `To: ${to.join(', ')}`,
    `Subject: ${rfc2047(String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200))}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    quotedPrintable(text),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    quotedPrintable(html),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const raw = base64UrlEncode(headers.join('\r\n') + '\r\n\r\n' + body);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`gmail send failed: ${err.slice(0, 200)}`);
  }
  return { sent: to.length };
}