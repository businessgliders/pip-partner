// Small MIME helpers for sending raw Gmail messages.

// Encode a UTF-8 string to base64url (Gmail `raw` payload format).
export function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Encode a header value as RFC 2047 base64 when it contains non-ASCII chars.
export function rfc2047(str) {
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return `=?UTF-8?B?${b64}?=`;
}

// Plain base64 of a UTF-8 string (for Content-Transfer-Encoding: base64 bodies).
export function base64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// Wrap a base64 body into RFC-compliant 76-char lines.
export function wrapBase64Lines(b64) {
  return (b64.match(/.{1,76}/g) || []).join('\r\n');
}