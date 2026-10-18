import { Metadata } from "next";
import { LeaveTypesClient } from "./leave-types-client";

export const metadata: Metadata = {
  title: "Leave Categories & Policies",
  description: "Configure leave categories, paid status, and quotas",
};

export default function LeaveTypesPage() {
  return <LeaveTypesClient />;
}
