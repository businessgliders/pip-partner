import React from "react";

// Fallback pill shown when a lead has no Cal.com booking — links straight to
// the Cal.com bookings app, filtered to this lead's email.
export default function CalComLinkButton({ email }) {
  const href = email
    ? `https://app.cal.com/bookings/upcoming?q=${encodeURIComponent(email)}`
    : "https://app.cal.com/bookings/upcoming";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="No meeting booked — open Cal.com"
      className="inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-slate-600 text-white hover:bg-slate-700 transition"
    >
      Cal.com
    </a>
  );
}