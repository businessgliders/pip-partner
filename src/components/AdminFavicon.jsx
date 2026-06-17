import { useEffect } from "react";

const ADMIN_FAVICON = "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/cd66b9522_c51835c8a_PiPPartner.png";
const DEFAULT_FAVICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png";

// Swaps the document favicon (and optional title) to the Pilates in Pink™
// admin mark while admin/backend pages are mounted, then restores the
// original on unmount.
export default function AdminFavicon({ title }) {
  useEffect(() => {
    const head = document.head;
    const existing = Array.from(head.querySelectorAll('link[rel*="icon"]'));
    const prevHrefs = existing.map((l) => ({ el: l, href: l.getAttribute("href") }));
    existing.forEach((l) => l.setAttribute("href", ADMIN_FAVICON));

    if (existing.length === 0) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = ADMIN_FAVICON;
      link.dataset.adminFavicon = "true";
      head.appendChild(link);
    }

    const prevTitle = document.title;
    if (title) document.title = title;

    return () => {
      prevHrefs.forEach(({ el, href }) => {
        if (href) el.setAttribute("href", href);
        else el.setAttribute("href", DEFAULT_FAVICON);
      });
      const injected = head.querySelector('link[data-admin-favicon="true"]');
      if (injected) injected.remove();
      if (title) document.title = prevTitle;
    };
  }, [title]);

  return null;
}