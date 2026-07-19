import { displayName } from "@/components/board/boardConfig";

// Lead groups that can hold contracts, plus the Drive folder label per group.
export const CONTRACT_GROUPS = [
  { key: "franchise", label: "Franchising", groupLabel: "Franchise", entity: "FranchiseInquiry" },
  { key: "instructor", label: "Instructor", groupLabel: "Instructor", entity: "InstructorApplication" },
  { key: "frontadmin", label: "Front Desk", groupLabel: "Front Desk", entity: "FrontAdminApplication" },
];

// Default statuses that make a lead contract-eligible (editable in settings).
export const DEFAULT_CONTRACT_STAGES = {
  franchise: ["nda", "fdd"],
  instructor: ["shortlisted"],
  frontadmin: ["shortlisted"],
};

export const CONTRACT_STATUSES = [
  { key: "draft", label: "Draft", color: "#94a3b8" },
  { key: "sent", label: "Sent", color: "#f59e0b" },
  { key: "signed", label: "Signed", color: "#10b981" },
];

// Drive folder name for a lead: "Jane Doe (#1042)"
export function leadFolderName(t) {
  const name = displayName(t);
  const num = t?.display_ticket_number || t?.app_number;
  return num ? `${name} (#${num})` : name;
}