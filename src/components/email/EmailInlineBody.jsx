import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { splitEmailHtml } from "@/lib/emailReply";

// Hardens links inside rendered email HTML and isolates styles so the
// surrounding CRM CSS doesn't leak in.
function SafeHtml({ html }) {
  return (
    <div className="overflow-x-auto">
      <div
        style={{ isolation: "isolate", all: "revert" }}
        ref={(el) => {
          if (!el) return;
          el.querySelectorAll("a").forEach((a) => {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
          });
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/**
 * The expanded content of a message — rendered INSIDE the message bubble so the
 * bubble morphs in place (no duplicated second card). Shows headers, the
 * reply-only body, and a tappable trimmed preview of any quoted history.
 * The header block doubles as a secondary collapse target.
 */
export default function EmailInlineBody({ message, subColor, inkColor, onCollapse }) {
  const [showQuoted, setShowQuoted] = useState(false);

  const raw =
    message.full_body_html ||
    message.body_html ||
    (message.body_text
      ? `<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;">${message.body_text}</pre>`
      : "");

  const { replyHtml, quotedHtml, quotedCount } = useMemo(
    () => (message.is_ai_summary ? { replyHtml: raw, quotedHtml: "", quotedCount: 0 } : splitEmailHtml(raw)),
    [raw, message.is_ai_summary]
  );

  const sub = subColor || "var(--crm-sub)";
  const borderColor = subColor ? "rgba(255,255,255,0.3)" : "rgba(182,118,81,0.15)";

  return (
    <div className="pip-fade-in" onClick={(e) => e.stopPropagation()}>
      <div
        className={onCollapse ? "cursor-pointer" : undefined}
        onClick={onCollapse ? () => onCollapse() : undefined}
        title={onCollapse ? "Collapse" : undefined}
      >
        <div className="text-[13px] font-semibold mb-2" style={{ color: inkColor || "var(--crm-ink)" }}>
          {message.subject}
        </div>
        <div className="text-[11px] space-y-0.5 border-b pb-2 mb-3" style={{ color: sub, borderColor }}>
          <div className="break-all">
            <span className="opacity-70">From:</span>{" "}
            {message.from_name ? `${message.from_name} ` : ""}
            {message.from_email ? `<${message.from_email}>` : ""}
          </div>
          {message.to_email && (
            <div className="break-all">
              <span className="opacity-70">To:</span> {message.to_email}
            </div>
          )}
          {message.sent_at && (
            <div>
              <span className="opacity-70">Date:</span> {format(new Date(message.sent_at), "PPpp")}
            </div>
          )}
        </div>
      </div>

      {message.send_error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-3">
          <strong>Error:</strong> {message.send_error}
        </div>
      )}

      <SafeHtml html={replyHtml} />

      {quotedCount > 0 && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowQuoted((v) => !v);
            }}
            className="flex items-center gap-1 text-[11px] hover:underline"
            style={{ color: sub }}
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showQuoted ? "rotate-180" : ""}`} />
            {showQuoted
              ? "Hide quoted history"
              : `…${quotedCount} earlier message${quotedCount === 1 ? "" : "s"} quoted`}
          </button>
          {showQuoted && (
            <div className="mt-2 opacity-60 pip-fade-in">
              <SafeHtml html={quotedHtml} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}