// Shared reply-extraction helpers.
//
// Incoming emails arrive with the entire prior thread quoted underneath the
// newly-written reply. These helpers deterministically split an email body into
// {replyHtml, quotedHtml, quotedCount} using the standard quote containers and
// "On ... wrote:" markers — no LLM involved.

import { decodeEntities } from "@/lib/textPreview";

const QUOTE_SELECTORS = [
  ".gmail_quote",
  ".gmail_extra",
  "blockquote",
  "#divRplyFwdMsg",
  ".OutlookMessageHeader",
  "div[id^='appendonly']",
  "div[id^='mail-editor-reference-message-container']",
  "div.yahoo_quoted",
  "div.moz-cite-prefix",
];

// "On Mon, Jan 1, 2026 at 9:00 AM Jane <jane@x.com> wrote:" and localized-ish
// variants, plus the "-----Original Message-----" separator.
const WROTE_MARKER = /(?:<[a-z][^>]*>\s*)*(?:On\s[\s\S]{0,300}?wrote:|-{2,}\s*Original Message\s*-{2,}|_{10,})/i;

function countQuoted(html) {
  const wrote = (html.match(/wrote:/gi) || []).length;
  const orig = (html.match(/Original Message/gi) || []).length;
  return Math.max(1, wrote + orig);
}

/**
 * Split an email HTML body into the new reply portion and the quoted history.
 */
export function splitEmailHtml(html) {
  const source = String(html || "");
  if (!source.trim()) return { replyHtml: "", quotedHtml: "", quotedCount: 0 };

  let replyHtml = source;
  const quotedParts = [];

  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(source, "text/html");
      QUOTE_SELECTORS.forEach((sel) => {
        doc.body.querySelectorAll(sel).forEach((el) => {
          if (!el.parentNode) return;
          quotedParts.push(el.outerHTML);
          el.remove();
        });
      });
      replyHtml = doc.body.innerHTML;
    } catch {
      replyHtml = source;
    }
  }

  // Anything after an "On ... wrote:" marker is quoted history too.
  const match = replyHtml.match(WROTE_MARKER);
  if (match && match.index !== undefined) {
    quotedParts.unshift(replyHtml.slice(match.index));
    replyHtml = replyHtml.slice(0, match.index);
  }

  const quotedHtml = quotedParts.join("\n");
  const cleaned = replyHtml.replace(/(?:\s|<br\s*\/?>|&nbsp;|<div>\s*<\/div>|<p>\s*<\/p>)+$/gi, "").trim();

  // If stripping left nothing meaningful, fall back to the original body so a
  // bubble never renders empty.
  if (!cleaned.replace(/<[^>]+>/g, "").trim()) {
    return { replyHtml: source, quotedHtml: "", quotedCount: 0 };
  }

  return {
    replyHtml: cleaned,
    quotedHtml,
    quotedCount: quotedHtml ? countQuoted(quotedHtml) : 0,
  };
}

/** Plain-text preview of the reply-only portion of an email body. */
export function replyPreviewText(html) {
  const { replyHtml } = splitEmailHtml(html);
  const text = replyHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text).replace(/\n{2,}/g, "\n").trim();
}