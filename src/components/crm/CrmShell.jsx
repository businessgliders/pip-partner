import React, { useState } from "react";
import { Menu, X, Users } from "lucide-react";

const SOURCE_LABELS = { franchise: "Franchising", instructor: "Instructor", frontadmin: "Front Desk" };
import CrmSidebar from "./CrmSidebar";
import CrmUserMenu from "./CrmUserMenu";
import CrmNotificationBell from "./CrmNotificationBell";
import { CRM } from "./crmTheme";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

export default function CrmShell({ page, source, onNavigate, title, user, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useLockBodyScroll(mobileNavOpen);
  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navigate = (p, s) => {
    setMobileNavOpen(false);
    onNavigate(p, s);
  };

  return (
    <div className="crm-root h-screen flex overflow-hidden" style={{ background: CRM.pageBg }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <CrmSidebar page={page} source={source} onNavigate={navigate} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 pip-fade-in" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 h-full pip-slide-in-left">
            <CrmSidebar page={page} source={source} onNavigate={navigate} />
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white shadow"
          >
            <X className="w-4 h-4" style={{ color: CRM.ink }} />
          </button>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center justify-between px-5 lg:px-8 shrink-0"
          style={{
            height: "calc(64px + env(safe-area-inset-top, 0px))",
            paddingTop: "env(safe-area-inset-top, 0px)",
            borderBottom: "1px solid rgba(182,118,81,0.10)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-full hover:bg-white/70"
            >
              <Menu className="w-5 h-5" style={{ color: CRM.ink }} />
            </button>
            {page === "leads" ? (
              <>
                {/* Mobile/tablet: icon + lead type only */}
                <h1 className="lg:hidden flex items-center gap-2 text-xl font-semibold truncate" style={{ color: CRM.ink }}>
                  <Users className="w-5 h-5 shrink-0" style={{ color: CRM.accent }} />
                  <span className="truncate">{SOURCE_LABELS[source] || "Franchising"}</span>
                </h1>
                <h1 className="hidden lg:block text-2xl font-semibold truncate" style={{ color: CRM.ink }}>
                  {title}
                </h1>
              </>
            ) : (
              <h1 className="text-xl lg:text-2xl font-semibold truncate" style={{ color: CRM.ink }}>
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <CrmNotificationBell currentUser={user} />
            <CrmUserMenu user={user} initials={initials} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 lg:px-8 py-6 pip-view-in">
          {children}
        </main>

        <footer
          className="flex items-center justify-center lg:justify-end gap-3 px-5 lg:px-8 py-1.5 shrink-0 text-[10px]"
          style={{ color: CRM.sub, borderTop: "1px solid rgba(182,118,81,0.08)", paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <a href="/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
            Public View
          </a>
          <span>© Pilates in Pink™ Studio Inc.</span>
        </footer>
      </div>
    </div>
  );
}