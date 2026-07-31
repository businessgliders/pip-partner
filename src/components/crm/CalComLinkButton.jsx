import React from "react";

// Pill shown when a lead has no Cal.com booking — opens the booking popover.
const CalComLinkButton = React.forwardRef(function CalComLinkButton(props, ref) {
  return (
    <button
      ref={ref}
      type="button"
      title="No meeting booked — book on Cal.com"
      className="inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-slate-600 text-white hover:bg-slate-700 transition"
      {...props}
    >
      Cal.com
    </button>
  );
});

export default CalComLinkButton;