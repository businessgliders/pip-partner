import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminFavicon from "@/components/AdminFavicon";
import CrmShell from "@/components/crm/CrmShell";
import CrmDashboard from "@/components/crm/CrmDashboard";
import CrmLeads from "@/components/crm/CrmLeads";
import CrmBookings from "@/components/crm/CrmBookings";
import CrmTemplates from "@/components/crm/CrmTemplates";
import CrmSettings from "@/components/crm/CrmSettings";
import CrmProjects from "@/components/crm/CrmProjects";
import CrmSplash from "@/components/crm/CrmSplash";
import CrmWelcomeSplash from "@/components/crm/CrmWelcomeSplash";

const PLACEHOLDERS = { projects: "Tasks", delivery: "Build Out", financials: "Financials" };
const SOURCE_LABELS = { franchise: "Franchising", instructor: "Instructor", frontadmin: "Front Desk" };

export default function CrmBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page") || "dashboard";
  const source = searchParams.get("source") || "franchise";

  const { data: user } = useQuery({
    queryKey: ["crm-current-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const onNavigate = (p, s, extra) => {
    const params = { page: p };
    if (p === "leads") params.source = s || "franchise";
    if (extra) Object.assign(params, extra);
    setSearchParams(params);
  };

  const firstName = (user?.full_name || "").split(" ")[0] || "there";
  const title =
    page === "dashboard" ? `Hello, ${firstName}` :
    page === "leads" ? `Leads · ${SOURCE_LABELS[source] || "Franchising"}` :
    page === "bookings" ? "Meetings" :
    page === "templates" ? "Templates" :
    page === "settings" ? "Settings" :
    PLACEHOLDERS[page] || "Dashboard";

  return (
    <>
      <AdminFavicon title="PiP Partner — Application Board" />
      {user && <CrmWelcomeSplash user={user} />}
      <CrmShell page={page} source={source} onNavigate={onNavigate} title={title} user={user}>
        {page === "dashboard" && <CrmDashboard onNavigate={onNavigate} currentUser={user} />}
        {page === "leads" && <CrmLeads key={source} source={source} currentUser={user} />}
        {page === "bookings" && <CrmBookings currentUser={user} />}
        {page === "templates" && <CrmTemplates />}
        {page === "settings" && <CrmSettings onNavigate={onNavigate} />}
        {page === "projects" && <CrmProjects />}
        {page === "delivery" && <CrmSplash label="Build Out" />}
        {page === "financials" && <CrmSplash label="Financials" />}
      </CrmShell>
    </>
  );
}