import React, { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, AlertTriangle } from "lucide-react";
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

export default function EmailMessageItem({ message, isHighlighted, isUnread = false, onMarkRead }) {
  const [open, setOpen] = useState(false);

  const isInbound = message.direction === "inbound";
  const isFailed = message.send_status === "failed";
  const isWelcome = message.is_welcome;
  const isInternal = message.is_internal;

  const cleanText = stripQuotedReply(stripHtml(message.body_html || message.body_text || ""));
  const isLong = cleanText.length > 180;
  const senderName = isInbound
    ? message.from_name || message.from_email
    : message.sent_by || "Staff";
  const time = message.sent_at || message.created_date;

  // Welcome compact bubble
  if (isWelcome) {
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
              <span>Auto-reply welcome sent</span>
            </div>
            <div className="text-xs text-pink-600/80 mt-0.5">Tap to view</div>
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
          {(isInbound || isFailed) && (
            <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              {isFailed && <AlertTriangle className="w-3 h-3 text-red-600" />}
              {isFailed && <span className="text-red-700">⚠️ FAILED TO SEND</span>}
              {!isFailed && <span>{senderName}</span>}
            </div>
          )}
          {(message.from_email || message.to_email) && (
            <div className="text-[10px] text-gray-500 mb-1.5 leading-tight pb-1.5 border-b border-gray-200/70">
              {message.from_email && (
                <div className="truncate">
                  <span className="text-gray-400">From:</span>{" "}
                  <span className={`font-medium ${isInbound ? "text-gray-700" : "text-pink-700"}`}>
                    {message.from_email}
                  </span>
                </div>
              )}
              {message.to_email && (
                <div className="truncate">
                  <span className="text-gray-400">To:</span>{" "}
                  <span className={`font-medium ${isInbound ? "text-pink-700" : "text-gray-700"}`}>
                    {message.to_email}
                  </span>
                </div>
              )}
            </div>
          )}
          {message.is_ai_summary ? (
            <div
              className="text-sm text-gray-800 break-words [&_p]:!m-0 [&_p:not(:last-child)]:!mb-1"
              dangerouslySetInnerHTML={{ __html: message.body_html }}
            />
          ) : (
            <div className="text-sm text-gray-800 whitespace-pre-wrap break-words line-clamp-2">
              {cleanText || "(empty)"}
            </div>
          )}
          {isLong && !message.is_ai_summary && (
            <div className="text-xs text-gray-500 mt-1 italic">Tap to view full message</div>
          )}
          <div className="text-[10px] text-gray-500 mt-1">
            {time ? format(new Date(time), "MMM d, h:mm a") : ""}
          </div>
          {message.is_ai_summary && (
            <div
              title="AI Summary"
              className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
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
        <div
          className="prose prose-sm max-w-none break-words [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_td]:whitespace-normal [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
          dangerouslySetInnerHTML={{
            __html: message.full_body_html || message.body_html || `<pre>${message.body_text || ""}</pre>`,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}