import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export default function AdminPadlock() {
  return (
    <div className="absolute top-4 right-4 z-20">
      <Link
        to="/ApplicationBoard"
        aria-label="Admin"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white shadow-lg transition-colors"
      >
        <Lock className="w-4 h-4" />
      </Link>
    </div>
  );
}