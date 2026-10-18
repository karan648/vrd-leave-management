import { AdminSidebar } from "@/components/admin-sidebar";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Admin — VRD Exports LMS",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser().catch(() => null);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between bg-[#1e2840] px-4 py-3 border-b border-[#2d3754]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">VRD</span>
            </div>
            <p className="text-sm font-bold text-white">Leave Management — Admin</p>
          </div>
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
