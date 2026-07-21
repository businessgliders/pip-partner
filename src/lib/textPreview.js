// Shared helpers for rendering plain-text previews of email content.

// Decodes ALL HTML entities (named + numeric, e.g. &#39; &amp; &eacute;)
// using the browser's own parser.
export function decodeEntities(str) {
  if (!str) return "";
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

// Strips HTML tags and decodes entities into a clean one-line preview string.
export function stripHtmlToText(html) {
  if (!html) return "";
  const text = String(html).replace(/<[^>]+>/g, " ");
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}