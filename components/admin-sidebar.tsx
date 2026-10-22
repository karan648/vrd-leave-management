"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Calendar,
  UserCog,
  Settings,
  Mail,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/applications", icon: FileText, label: "Applications" },
  { href: "/admin/employees", icon: Users, label: "Employees" },
  { href: "/admin/departments", icon: Building2, label: "Departments" },
  { href: "/admin/leave-types", icon: Calendar, label: "Leave Types" },
  { href: "/admin/users", icon: UserCog, label: "Admin Users" },
  { href: "/admin/email-preview", icon: Mail, label: "Email Templates" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col bg-[#111827] text-gray-400">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <p className="text-xs font-medium text-gray-500 tracking-wide">VRD Exports</p>
        <p className="text-sm font-semibold text-white mt-0.5">Leave Management</p>
      </div>

      {/* User badge */}
      {currentUser && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-white/[0.04]">
          <p className="text-xs text-white font-medium truncate">{currentUser.fullName}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{currentUser.role.replace(/_/g, " ")}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
        <Link
          href="/apply-leave"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:text-gray-300 transition-colors"
          target="_blank"
        >
          <ExternalLink className="w-4 h-4" />
          Employee Portal
        </Link>
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:text-red-400 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
