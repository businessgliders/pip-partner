import React, { useMemo } from "react";

// Client-side mirror of the branded email shell used by sendTicketEmail,
// rendered in a sandboxed iframe so the preview closely matches the sent email.
const BRAND_ROSE = "#b67651";
const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png";

const SAMPLE_VARS = {
  client_name: "Jane Doe",
  client_first_name: "Jane",
  client_last_name: "Doe",
  client_email: "jane@example.com",
  staff_name: "Pilates in Pink Team",
};

function fillVars(html) {
  return (html || "").replace(/{{\s*([\w.]+)\s*}}/g, (m, k) => SAMPLE_VARS[k] ?? m);
}

function brandedShell(innerHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#fbe0e2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#5a3a28;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#f1889b 0%,#f7b1bd 40%,#fbe0e2 100%);padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(182,118,81,0.15);">
        <tr><td style="padding:32px 32px 20px;text-align:center;background:linear-gradient(180deg,#fbe0e2 0%,#ffffff 100%);">
          <img src="${LOGO_URL}" alt="Pilates in Pink" width="64" style="width:64px;height:64px;display:block;margin:0 auto 16px;"/>
          <div style="font-size:11px;letter-spacing:3px;color:${BRAND_ROSE};font-weight:600;">PILATES IN PINK&trade;</div>
        </td></tr>
        <tr><td style="padding:20px 32px 32px;">${innerHtml}</td></tr>
        <tr><td style="padding:20px 32px;background:#2a1a1f;color:rgba(255,255,255,0.7);text-align:center;font-size:12px;">
          <div style="letter-spacing:2px;color:#f7b1bd;font-size:10px;margin-bottom:8px;">PRETTY &middot; POWERFUL &middot; PILATES</div>
          <div>6161 Mayfield Road, Unit #105 &middot; Brampton, ON</div>
          <div style="margin-top:8px;color:rgba(255,255,255,0.4);">&copy; ${new Date().getFullYear()} Pilates in Pink&trade;</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default function CrmEmailShellPreview({ bodyHtml, signatureHtml, height = 420 }) {
  const doc = useMemo(() => {
    let inner = fillVars(bodyHtml) || `<p style="color:#94a3b8;"><em>Nothing to preview yet.</em></p>`;
    if (signatureHtml) inner += `<br/><br/>${fillVars(signatureHtml)}`;
    return brandedShell(inner);
  }, [bodyHtml, signatureHtml]);

  return (
    <iframe
      title="Email preview"
      srcDoc={doc}
      sandbox=""
      className="w-full rounded-xl"
      style={{ height, border: "1px solid rgba(182,118,81,0.15)", background: "#fbe0e2" }}
    />
  );
}