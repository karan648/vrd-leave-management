import type { Metadata } from "next";
import { AdminDashboardClient } from "./dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  return <AdminDashboardClient />;
}
