import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

/**
 * Admin padlock badge shown in the top-right of public application pages.
 *
 * @param {string} [to="/ApplicationBoard"] - Internal route OR external URL.
 *   External URLs (starting with http:// or https://) open in a new tab.
 */
export default function AdminPadlock({ to = "/ApplicationBoard" }) {
  const isExternal = /^https?:\/\//i.test(to);
  const classes =
    "inline-flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white shadow-lg transition-colors";

  return (
    <div className="absolute top-4 right-4 z-20">
      {isExternal ? (
        <a
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Admin"
          className={classes}
        >
          <Lock className="w-4 h-4" />
        </a>
      ) : (
        <Link to={to} aria-label="Admin" className={classes}>
          <Lock className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}