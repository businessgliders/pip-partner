// Renders the same welcome HTML used by sendWelcomeEmail — used for the
// synthetic in-thread welcome bubble preview.
export function buildWelcomeHtml({ clientName, programLabel, ticketShortId }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fbe0e2;font-family:'Helvetica Neue',Arial,sans-serif;color:#3a2a23;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff8f4;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <img src="https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink" style="height:48px;"/>
  </div>
  <h2 style="color:#b67651;font-weight:500;font-size:22px;margin:0 0 12px;">Hi ${clientName},</h2>
  <p style="line-height:1.6;font-size:15px;">Thank you for submitting your ${programLabel} to <strong>Pilates in Pink™</strong>. We've received it and a member of our team will be in touch personally within 1-2 business days.</p>
  <p style="line-height:1.6;font-size:15px;">In the meantime, feel free to reply to this email with any questions — we read every message.</p>
  <p style="line-height:1.6;font-size:15px;color:#b67651;font-style:italic;">Pretty. Powerful. Pilates.</p>
  <hr style="border:none;border-top:1px solid #f7b1bd;margin:24px 0;"/>
  <p style="font-size:11px;color:#a08778;text-align:center;">Reference: Ticket #${ticketShortId}</p>
</div></body></html>`;
}