import React, { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, AlertTriangle, Maximize2 } from "lucide-react";
import UnreadMessageMarker from "./UnreadMessageMarker";

function stripHtml(html) {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripQuotedReply(text) {
  if (!text) return "";
  // Strip "On <date> ... wrote:" and leading ">" lines
  const cutMatch = text.match(/^On .+?wrote:/m);
  let result = cutMatch ? text.slice(0, cutMatch.index) : text;
  result = result
    .split("\n")
    .filter((line) => !line.trim().startsWith(">"))
    .join("\n")
    .trim();
  return result;
}

export default function EmailMessageItem({ message, isHighlighted, isUnread = false, onMarkRead, staffNameByEmail = {} }) {
  const [open, setOpen] = useState(false);

  const isInbound = message.direction === "inbound";
  const isFailed = message.send_status === "failed";
  const isWelcome = message.is_welcome;
  const isInternal = message.is_internal;
  // Outbound emails sent from a saved template render the same compact
  // "Auto-reply sent" bubble as the welcome email, with the template name
  // surfaced so reviewers know which template fired.
  const isTemplateReply =
    !isInbound &&
    !isWelcome &&
    !isInternal &&
    !isFailed &&
    typeof message.template_name === "string" &&
    message.template_name.trim().length > 0;

  const resolveName = (email) => {
    if (!email) return "";
    return staffNameByEmail[email.toLowerCase()] || email;
  };
  const fromDisplay = isInternal ? resolveName(message.from_email) : message.from_email;
  const toDisplay = isInternal ? resolveName(message.to_email) : message.to_email;

  const cleanText = stripQuotedReply(stripHtml(message.body_html || message.body_text || ""));
  // Bubble is truncated to a single line, so surface the "tap to expand" icon
  // whenever the preview likely overflows that one line.
  const isLong = cleanText.length > 60;
  const senderName = isInbound
    ? message.from_name || message.from_email
    : message.sent_by || "Staff";
  const time = message.sent_at || message.created_date;

  // Welcome / template compact bubble — same visual treatment.
  if (isWelcome || isTemplateReply) {
    const label = isWelcome
      ? "Auto-reply welcome sent"
      : `Auto-reply sent: ${message.template_name}`;
    return (
      <>
        <div className="flex justify-end mb-3" id={`msg-${message.id}`}>
          <div
            className={`max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2 bg-pink-100 border border-pink-200 cursor-pointer transition-all ${
              isHighlighted ? "ring-4 ring-yellow-300 ring-offset-2" : ""
            }`}
            onClick={() => setOpen(true)}
          >
            <div className="flex items-center gap-1.5 text-xs text-pink-700 font-medium">
              <Sparkles className="w-3 h-3" />
              <span className="truncate">{label}</span>
            </div>
            <div className="text-xs text-pink-600/80 mt-0.5">
              {time ? format(new Date(time), "MMM d, h:mm a") : "Tap to view"}
            </div>
          </div>
        </div>
        <MessageDialog open={open} onOpenChange={setOpen} message={message} />
      </>
    );
  }

  const bubble = (
    <>
      <div
        className={`flex flex-col ${isInbound ? "items-start" : "items-end"} mb-3`}
        id={`msg-${message.id}`}
      >
        {isInternal && !isInbound && (
          <div className="text-[10px] text-amber-700 mb-1 mr-1 font-semibold tracking-wider uppercase">
            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300">
              Internal
            </span>
          </div>
        )}
        <div
          className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 cursor-pointer transition-all ${
            isInbound
              ? "bg-white border border-gray-200 rounded-bl-sm"
              : isFailed
              ? "bg-red-50 border border-red-300 rounded-br-sm"
              : isInternal
              ? "bg-amber-50 border border-amber-200 rounded-br-sm"
              : "bg-pink-100 rounded-br-sm"
          } ${isHighlighted ? "ring-4 ring-yellow-300 ring-offset-2" : ""} ${message.is_ai_summary ? "pr-9" : ""}`}
          onClick={() => setOpen(true)}
        >
          {message.is_ai_summary && (
            <div className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mb-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI Summary
            </div>
          )}
          {(isInbound || isFailed) && !message.is_ai_summary && (
            <div className="lg:text-xs text-[10px] font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              {isFailed && <AlertTriangle className="w-3 h-3 text-red-600" />}
              {isFailed && <span className="text-red-700">⚠️ FAILED TO SEND</span>}
              {!isFailed && <span className="hidden lg:inline">{senderName}</span>}
            </div>
          )}
          {/* Inbound bubbles show "From: email" only (no To row); outbound
              continues to display the recipient address. The intake AI
              summary bubble suppresses both. */}
          {!message.is_ai_summary && (
            isInbound ? (
              message.from_email && (
                <div className="text-[10px] text-gray-500 mb-1.5 leading-tight pb-1.5 border-b border-gray-200/70">
                  <div className="truncate">
                    <span className="text-gray-400">From:</span>{" "}
                    <span className="font-medium text-pink-700">{message.from_email}</span>
                  </div>
                </div>
              )
            ) : (
              message.to_email && (
                <div className="text-[10px] text-gray-500 mb-1.5 leading-tight pb-1.5 border-b border-gray-200/70">
                  <div className="truncate">
                    <span className="text-gray-400">To:</span>{" "}
                    <span className="font-medium text-gray-700">{toDisplay}</span>
                  </div>
                </div>
              )
            )
          )}
          {message.is_ai_summary ? (
           <div
             className="lg:text-sm text-xs text-gray-800 break-words [&_p]:!m-0 [&_p:not(:last-child)]:!mb-1 mb-5"
             dangerouslySetInnerHTML={{ __html: message.body_html }}
           />
          ) : (
           <div className="lg:text-sm text-xs text-gray-800 truncate line-clamp-1">
             {cleanText || "(empty)"}
           </div>
          )}
          <div className={`text-[10px] text-gray-500 mt-1 flex items-center gap-1 ${message.is_ai_summary ? "justify-end" : ""}`}>
            <span>{time ? format(new Date(time), "MMM d, h:mm a") : ""}</span>
            {isLong && !message.is_ai_summary && (
              <Maximize2 className="w-3 h-3 text-gray-400" title="Tap to view full message" />
            )}
          </div>
        </div>
      </div>
      <MessageDialog open={open} onOpenChange={setOpen} message={message} />
    </>
  );

  if (isUnread && onMarkRead) {
    return (
      <UnreadMessageMarker enabled={isUnread} onVisible={onMarkRead}>
        {bubble}
      </UnreadMessageMarker>
    );
  }
  return bubble;
}

function MessageDialog({ open, onOpenChange, message }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{message.subject}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-gray-500 space-y-1 border-b pb-3">
          <div>
            <strong>From:</strong> {message.from_name ? `${message.from_name} ` : ""}
            &lt;{message.from_email}&gt;
          </div>
          <div>
            <strong>To:</strong> {message.to_email}
          </div>
          <div>
            <strong>Date:</strong>{" "}
            {message.sent_at ? format(new Date(message.sent_at), "PPpp") : ""}
          </div>
        </div>
        {message.send_error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            <strong>Error:</strong> {message.send_error}
          </div>
        )}
        {/* Render the email HTML "as sent" — no prose reset, no table-fixed,
            no width overrides. We only:
              • isolate styles so the surrounding modal CSS doesn't leak in
              • allow wide tables to scroll horizontally instead of being
                squished/truncated
              • force links to open in a new tab for safety
        */}
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
            dangerouslySetInnerHTML={{
              __html:
                message.full_body_html ||
                message.body_html ||
                `<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;">${message.body_text || ""}</pre>`,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}