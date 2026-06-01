import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BoardAccessGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | unauthenticated | ok
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setUser(me);
        setStatus("ok");
      } catch (_e) {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (status === "checking") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-slate-700" />
          </div>
          <h2 className="text-xl font-light text-slate-900 mb-1">Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in with Google to continue.</p>
          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full h-11 rounded-xl"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return typeof children === "function" ? children(user) : children;
}