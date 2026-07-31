import React from "react";

// Fallback pill shown when a lead has no Cal.com booking — Cal.com branded
// (black pill, Cal.com wordmark) and links straight to the Cal.com bookings app.
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
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-black text-white hover:bg-neutral-800 transition"
    >
      <img
        src="https://cal.com/logo.svg"
        alt=""
        className="h-3 w-auto invert"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <span>Cal.com</span>
    </a>
  );
}