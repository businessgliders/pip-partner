import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, List, Link as LinkIcon,
  Sparkles, Lightbulb, Wand2, Trash2, Send, X, Loader2
} from "lucide-react";
import TemplatePicker from "./TemplatePicker";
import AiAssistBar from "./AiAssistBar";

function isEmpty(html) {
  return !(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
}

export default function EmailComposer({ ticket, ticketType, currentUser, onSent, onCancel }) {
  const editorRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [showDescribe, setShowDescribe] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const ticketEmail = ticket?.email || "";
  const ticketName =
    ticket?.full_name ||
    `${ticket?.first_name || ""} ${ticket?.last_name || ""}`.trim() ||
    ticketEmail;
  const firstName = ticket?.first_name || (ticket?.full_name || "").split(" ")[0] || "";

  const vars = {
    client_name: ticketName,
    client_first_name: firstName,
    client_email: ticketEmail,
    client_phone: ticket?.phone || "",
    inquiry_type: ticketType,
    ticket_id: ticket?.id || "",
    staff_name: currentUser?.full_name || "",
    staff_first_name: (currentUser?.full_name || "").split(" ")[0] || "",
    staff_email: currentUser?.email || "",
  };

  const setHtml = (html) => {
    if (editorRef.current) editorRef.current.innerHTML = html;
  };
  const getHtml = () => editorRef.current?.innerHTML || "";

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleInsertLink = () => {
    const url = window.prompt("Enter URL");
    if (url) exec("createLink", url);
  };

  const handleSend = async () => {
    const html = getHtml();
    if (isEmpty(html) || sending) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendTicketEmail", {
        ticket_id: ticket.id,
        ticket_type: ticketType,
        body_html: html,
      });
      setHtml("");
      onSent?.();
    } catch (e) {
      console.error(e);
      alert("Failed to send: " + (e?.response?.data?.error || e.message));
    } finally {
      setSending(false);
    }
  };

  const handlePolish = async () => {
    const html = getHtml();
    if (isEmpty(html) || polishing) return;
    setPolishing(true);
    try {
      const res = await base44.functions.invoke("aiEmailAssist", {
        mode: "polish",
        ticket_id: ticket.id,
        ticket_type: ticketType,
        draft: html,
      });
      setHtml(res.data.body_html || html);
    } catch (e) {
      console.error(e);
    } finally {
      setPolishing(false);
    }
  };

  const handleClear = () => setHtml("");

  const handleTemplate = ({ body_html }) => setHtml(body_html);
  const handleApply = (html) => {
    setHtml(html);
    setShowDescribe(false);
    setShowSuggest(false);
  };

  return (
    <div className="border-t bg-white p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div>
          <span className="font-medium">To:</span> {ticketEmail || "—"}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={showDescribe ? "default" : "outline"}
          className={showDescribe ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-700 border-purple-200 hover:bg-purple-50"}
          onClick={() => { setShowDescribe((v) => !v); setShowSuggest(false); }}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Describe in simple words
        </Button>
        <Button
          size="sm"
          variant={showSuggest ? "default" : "outline"}
          className={showSuggest ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-700 border-purple-200 hover:bg-purple-50"}
          onClick={() => { setShowSuggest((v) => !v); setShowDescribe(false); }}
        >
          <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
          Suggest Replies
        </Button>
        <TemplatePicker vars={vars} onSelect={handleTemplate} />
      </div>

      <AiAssistBar
        ticketId={ticket.id}
        ticketType={ticketType}
        onApply={handleApply}
        showDescribe={showDescribe}
        showSuggest={showSuggest}
      />

      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-1 border-b bg-gray-50 px-2 py-1">
          <button type="button" onClick={() => exec("bold")} className="p-1.5 hover:bg-gray-200 rounded">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => exec("italic")} className="p-1.5 hover:bg-gray-200 rounded">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => exec("insertUnorderedList")} className="p-1.5 hover:bg-gray-200 rounded">
            <List className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={handleInsertLink} className="p-1.5 hover:bg-gray-200 rounded">
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          data-placeholder="Write your reply..."
          className="prose prose-sm max-w-none p-3 min-h-32 max-h-80 overflow-y-auto focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
          suppressContentEditableWarning
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handlePolish} disabled={polishing}>
            {polishing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
            Polish
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
        <Button size="sm" onClick={handleSend} disabled={sending} className="bg-pink-600 hover:bg-pink-700 text-white">
          {sending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
          Send Reply
        </Button>
      </div>
    </div>
  );
}