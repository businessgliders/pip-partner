import { useEffect } from "react";

/**
 * Lightweight per-page SEO. Sets the document title and upserts the most
 * common meta tags (description, canonical, Open Graph, Twitter, robots) on
 * mount, and restores the previous values on unmount.
 *
 * Usage:
 *   <Seo
 *     title="Own a Pilates Studio — Pilates in Pink™"
 *     description="Become a Pilates in Pink™ franchise partner..."
 *     path="/OwnAStudio"
 *     image="https://.../og-cover.jpg"
 *   />
 */
const DEFAULT_IMAGE =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png";
const SITE_NAME = "Pilates in Pink™";

function upsertMeta({ selector, attr, name, content }) {
  if (!content) return null;
  let el = document.head.querySelector(selector);
  let created = false;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  return { el, prev, created };
}

function upsertLink({ rel, href }) {
  if (!href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  let created = false;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute("href");
  el.setAttribute("href", href);
  return { el, prev, created };
}

export default function Seo({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
}) {
  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = path ? `${origin}${path}` : origin;

    const prevTitle = document.title;
    if (title) document.title = title;

    const handles = [
      upsertMeta({
        selector: 'meta[name="description"]',
        attr: "name",
        name: "description",
        content: description,
      }),
      upsertLink({ rel: "canonical", href: url }),
      // Open Graph
      upsertMeta({
        selector: 'meta[property="og:title"]',
        attr: "property",
        name: "og:title",
        content: title,
      }),
      upsertMeta({
        selector: 'meta[property="og:description"]',
        attr: "property",
        name: "og:description",
        content: description,
      }),
      upsertMeta({
        selector: 'meta[property="og:type"]',
        attr: "property",
        name: "og:type",
        content: type,
      }),
      upsertMeta({
        selector: 'meta[property="og:url"]',
        attr: "property",
        name: "og:url",
        content: url,
      }),
      upsertMeta({
        selector: 'meta[property="og:image"]',
        attr: "property",
        name: "og:image",
        content: image,
      }),
      upsertMeta({
        selector: 'meta[property="og:site_name"]',
        attr: "property",
        name: "og:site_name",
        content: SITE_NAME,
      }),
      // Twitter
      upsertMeta({
        selector: 'meta[name="twitter:card"]',
        attr: "name",
        name: "twitter:card",
        content: "summary_large_image",
      }),
      upsertMeta({
        selector: 'meta[name="twitter:title"]',
        attr: "name",
        name: "twitter:title",
        content: title,
      }),
      upsertMeta({
        selector: 'meta[name="twitter:description"]',
        attr: "name",
        name: "twitter:description",
        content: description,
      }),
      upsertMeta({
        selector: 'meta[name="twitter:image"]',
        attr: "name",
        name: "twitter:image",
        content: image,
      }),
      upsertMeta({
        selector: 'meta[name="robots"]',
        attr: "name",
        name: "robots",
        content: noindex ? "noindex,nofollow" : "index,follow",
      }),
    ].filter(Boolean);

    return () => {
      document.title = prevTitle;
      handles.forEach((h) => {
        if (!h) return;
        if (h.created) h.el.remove();
        else if (h.prev != null) {
          const attr = h.el.tagName === "LINK" ? "href" : "content";
          h.el.setAttribute(attr, h.prev);
        }
      });
    };
  }, [title, description, path, image, type, noindex]);

  return null;
}