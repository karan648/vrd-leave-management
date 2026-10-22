import { AdminSidebar } from "@/components/admin-sidebar";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Admin — VRD Exports",
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
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between bg-[#111827] px-4 py-3">
          <p className="text-sm font-semibold text-white">VRD Exports — Admin</p>
        </div>

        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
