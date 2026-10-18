"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDateIndia, formatDateTime } from "@/lib/utils";

interface DashboardStats {
  summary: {
    total: number;
    pending: number;
    approved: number;
    declined: number;
    cancelled: number;
    thisMonth: number;
    upcomingApproved: number;
  };
  recentApplications: Array<{
    id: string;
    referenceNumber: string;
    employeeName: string;
    leaveTypeSnapshot: string;
    departmentSnapshot: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
    submittedAt: string;
  }>;
  departmentStats: Array<{ department: string; count: number }>;
  leaveTypeStats: Array<{ leaveType: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div
      className={`bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md transition-all ${href ? "cursor-pointer group" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {href && (
          <ChevronRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#64748b] transition-colors" />
        )}
      </div>
      <div className="text-3xl font-bold text-[#0f172a] mb-1">{value}</div>
      <div className="text-sm font-medium text-[#64748b]">{label}</div>
      {sub && <div className="text-xs text-[#94a3b8] mt-1">{sub}</div>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] mb-4" />
      <div className="h-8 w-16 bg-[#f1f5f9] rounded mb-2" />
      <div className="h-4 w-28 bg-[#f1f5f9] rounded" />
    </div>
  );
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json = await res.json();
      setStats(json.data);
    } catch {
      setError("Failed to load dashboard statistics. Check your database connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Dashboard</h1>
          <p className="text-sm text-[#64748b] mt-1">
            VRD Exports Leave Management — Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <FileText className="w-4 h-4" />
            View All Applications
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Dashboard Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Ensure DATABASE_URL and DIRECT_URL are configured and migrations have been run.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Applications"
              value={stats?.summary.total ?? 0}
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
              href="/admin/applications"
            />
            <StatCard
              label="Pending Review"
              value={stats?.summary.pending ?? 0}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              color="bg-amber-50"
              href="/admin/applications?status=PENDING"
              sub="Requires action"
            />
            <StatCard
              label="Approved"
              value={stats?.summary.approved ?? 0}
              icon={<CheckCircle className="w-5 h-5 text-green-600" />}
              color="bg-green-50"
              href="/admin/applications?status=APPROVED"
            />
            <StatCard
              label="Declined"
              value={stats?.summary.declined ?? 0}
              icon={<XCircle className="w-5 h-5 text-red-600" />}
              color="bg-red-50"
              href="/admin/applications?status=DECLINED"
            />
          </>
        )}
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="This Month"
              value={stats?.summary.thisMonth ?? 0}
              icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
              color="bg-purple-50"
              sub="Submissions in current month"
            />
            <StatCard
              label="Upcoming Leaves"
              value={stats?.summary.upcomingApproved ?? 0}
              icon={<Calendar className="w-5 h-5 text-teal-600" />}
              color="bg-teal-50"
              sub="Approved future leaves"
            />
            <StatCard
              label="Cancelled"
              value={stats?.summary.cancelled ?? 0}
              icon={<XCircle className="w-5 h-5 text-slate-500" />}
              color="bg-slate-50"
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
            <h2 className="font-semibold text-[#0f172a]">Recent Applications</h2>
            <Link
              href="/admin/applications"
              className="text-xs text-[#2563eb] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#f1f5f9]" />
                    <div className="flex-1">
                      <div className="h-4 bg-[#f1f5f9] rounded w-40 mb-2" />
                      <div className="h-3 bg-[#f1f5f9] rounded w-28" />
                    </div>
                    <div className="h-5 w-16 bg-[#f1f5f9] rounded-full" />
                  </div>
                </div>
              ))
            ) : stats?.recentApplications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileText className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" />
                <p className="text-sm text-[#94a3b8]">No applications yet</p>
                <p className="text-xs text-[#cbd5e1] mt-1">
                  Applications will appear here once submitted
                </p>
              </div>
            ) : (
              stats?.recentApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8fafc] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {app.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">
                      {app.employeeName}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      {app.leaveTypeSnapshot} · {formatDateIndia(app.startDate)}
                      {" "}–{" "}
                      {formatDateIndia(app.endDate)} ({app.totalDays}d)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={app.status} />
                    <ChevronRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#64748b]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Department Stats */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
              <BarChart3 className="w-4 h-4 text-[#64748b]" />
              <h2 className="font-semibold text-[#0f172a] text-sm">By Department</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-[#f1f5f9] rounded w-full mb-1" />
                    <div className="h-2 bg-[#f1f5f9] rounded w-3/4" />
                  </div>
                ))
              ) : stats?.departmentStats.length === 0 ? (
                <p className="text-xs text-[#94a3b8] text-center py-4">No data yet</p>
              ) : (
                stats?.departmentStats.slice(0, 6).map((d) => {
                  const maxCount = Math.max(
                    ...stats.departmentStats.map((x) => x.count)
                  );
                  const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                  return (
                    <div key={d.department}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#374151] font-medium truncate max-w-[140px]">
                          {d.department}
                        </span>
                        <span className="text-xs text-[#64748b] font-semibold">
                          {d.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563eb] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leave Type Stats */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
              <Calendar className="w-4 h-4 text-[#64748b]" />
              <h2 className="font-semibold text-[#0f172a] text-sm">By Leave Type</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 bg-[#f1f5f9] rounded animate-pulse" />
                ))
              ) : stats?.leaveTypeStats.length === 0 ? (
                <p className="text-xs text-[#94a3b8] text-center py-4">No data yet</p>
              ) : (
                stats?.leaveTypeStats.map((l) => (
                  <div key={l.leaveType} className="flex items-center justify-between py-1">
                    <span className="text-xs text-[#374151]">{l.leaveType}</span>
                    <span className="text-xs font-bold text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
                      {l.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#1e2840] rounded-xl p-5">
            <h2 className="font-semibold text-white text-sm mb-3">Quick Links</h2>
            <div className="space-y-2">
              {[
                { href: "/admin/applications?status=PENDING", label: "Review Pending", icon: Clock },
                { href: "/admin/departments", label: "Manage Departments", icon: Users },
                { href: "/admin/leave-types", label: "Manage Leave Types", icon: Calendar },
                { href: "/admin/settings", label: "Notification Settings", icon: FileText },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-white/10 transition-all"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
