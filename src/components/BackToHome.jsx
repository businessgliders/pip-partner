import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackToHome({ className = "", color = "#b67651", to = "/", label = "Home" }) {
  return (
    <Link
      to={to}
      className={`fixed top-5 left-5 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all text-xs font-medium tracking-wide ${className}`}
      style={{ color }}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}