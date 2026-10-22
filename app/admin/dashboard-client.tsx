"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDateIndia } from "@/lib/utils";

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
  accent,
  href,
  sub,
}: {
  label: string;
  value: number | string;
  accent?: string;
  href?: string;
  sub?: string;
}) {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${accent || "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ""}`} />;
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
      setError("Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of leave applications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            All Applications
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total"
              value={stats?.summary.total ?? 0}
              href="/admin/applications"
            />
            <StatCard
              label="Pending"
              value={stats?.summary.pending ?? 0}
              accent="text-amber-600"
              href="/admin/applications?status=PENDING"
              sub="Awaiting review"
            />
            <StatCard
              label="Approved"
              value={stats?.summary.approved ?? 0}
              accent="text-green-600"
              href="/admin/applications?status=APPROVED"
            />
            <StatCard
              label="Declined"
              value={stats?.summary.declined ?? 0}
              accent="text-red-600"
              href="/admin/applications?status=DECLINED"
            />
          </>
        )}
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-7 w-10" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="This month"
              value={stats?.summary.thisMonth ?? 0}
              sub="New submissions"
            />
            <StatCard
              label="Upcoming leaves"
              value={stats?.summary.upcomingApproved ?? 0}
              sub="Approved, future dates"
            />
            <StatCard
              label="Cancelled"
              value={stats?.summary.cancelled ?? 0}
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Applications</h2>
            <Link
              href="/admin/applications"
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-36 mb-1.5" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))
            ) : stats?.recentApplications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-gray-400">No applications yet</p>
              </div>
            ) : (
              stats?.recentApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center flex-shrink-0">
                    {app.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {app.employeeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {app.leaveTypeSnapshot} · {formatDateIndia(app.startDate)} – {formatDateIndia(app.endDate)} ({app.totalDays}d)
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Department Stats */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">By Department</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-full mb-1.5" />
                    <Skeleton className="h-1.5 w-3/4" />
                  </div>
                ))
              ) : stats?.departmentStats.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No data</p>
              ) : (
                stats?.departmentStats.slice(0, 6).map((d) => {
                  const maxCount = Math.max(...stats.departmentStats.map((x) => x.count));
                  const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                  return (
                    <div key={d.department}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-700 font-medium truncate max-w-[140px]">
                          {d.department}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{d.count}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all"
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
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">By Leave Type</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))
              ) : stats?.leaveTypeStats.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No data</p>
              ) : (
                stats?.leaveTypeStats.map((l) => (
                  <div key={l.leaveType} className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-700">{l.leaveType}</span>
                    <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                      {l.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Quick Links</h2>
            </div>
            <div className="p-2">
              {[
                { href: "/admin/applications?status=PENDING", label: "Pending reviews", icon: Clock },
                { href: "/admin/departments", label: "Departments", icon: FileText },
                { href: "/admin/leave-types", label: "Leave types", icon: Calendar },
                { href: "/admin/settings", label: "Settings", icon: TrendingUp },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-gray-400" />
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
