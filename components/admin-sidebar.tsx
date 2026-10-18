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
  ChevronRight,
  LogOut,
  Shield,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/admin/applications",
    icon: FileText,
    label: "Applications",
  },
  {
    href: "/admin/employees",
    icon: Users,
    label: "Employees",
  },
  {
    href: "/admin/departments",
    icon: Building2,
    label: "Departments",
  },
  {
    href: "/admin/leave-types",
    icon: Calendar,
    label: "Leave Types",
  },
  {
    href: "/admin/users",
    icon: UserCog,
    label: "Admin Users",
  },
  {
    href: "/admin/email-preview",
    icon: Mail,
    label: "Email Templates",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Settings",
  },
];

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    <aside className="w-64 min-h-screen flex flex-col sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#2d3754]">
        <div className="w-9 h-9 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#60a5fa] tracking-widest uppercase">
            VRD Exports
          </p>
          <p className="text-sm font-bold text-white leading-tight">
            Leave Management
          </p>
        </div>
      </div>

      {/* Auth / Admin Badge */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div className="truncate">
              <p className="text-[11px] text-white font-semibold truncate">
                {currentUser ? currentUser.fullName : "Admin Console"}
              </p>
              <p className="text-[9px] text-blue-300 font-mono uppercase tracking-wider">
                {currentUser ? currentUser.role : "Authenticated"}
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "sidebar-item active"
                  : "sidebar-item"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Links */}
      <div className="px-3 py-4 border-t border-[#2d3754] space-y-1">
        <Link
          href="/apply-leave"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#273352] transition-all"
          target="_blank"
        >
          <FileText className="w-4 h-4" />
          Employee Portal
        </Link>
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
