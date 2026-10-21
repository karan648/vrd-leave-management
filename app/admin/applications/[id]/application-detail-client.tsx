"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDateShort, formatDateLong, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Building2,
  FileText,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Briefcase,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  BadgeAlert,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface ApplicationDetail {
  id: string;
  referenceNumber: string;
  employeeName: string;
  employeeEmail: string;
  employeeIdNumber?: string | null;
  departmentSnapshot: string;
  leaveTypeSnapshot: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: string | null;
  reason: string;
  reportingManagerName: string;
  reportingManagerEmail: string;
  handoverPersonName?: string | null;
  handoverPersonEmail?: string | null;
  contactDuringLeave?: string | null;
  additionalNotes?: string | null;
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  submittedAt: string;
  approvalHistory: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    remarks?: string | null;
    performedByName?: string | null;
    performedBy: string;
    performedAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    recipientEmail: string;
    recipientName?: string | null;
    subject: string;
    status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
    errorMessage?: string | null;
    sentAt?: string | null;
    lastAttemptAt?: string | null;
    attemptCount: number;
  }>;
}

const APPROVE_PRESETS = [
  "Approved. Handover confirmed with assigned colleague.",
  "Approved as per department roster & requirements.",
  "Approved. Please ensure pending tasks are handed over.",
  "Approved. Enjoy your time off!",
];

const DECLINE_PRESETS = [
  "Peak operational export cycle during requested dates. Please reschedule.",
  "Staffing constraints & critical deadlines in department.",
  "Overlapping leave with key team members on these dates.",
  "Insufficient leave balance available for this duration.",
];

export function ApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current session user for approval logging
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: string; email: string } | null>(null);

  // Approval modal state
  const [actionModal, setActionModal] = useState<"APPROVED" | "DECLINED" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Copy feedback state
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Notification retry state
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Active tab inside detailed view
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "notifications">("overview");

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

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leave-applications/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Leave application not found.");
        throw new Error("Failed to load application details.");
      }
      const data = await res.json();
      const appData = data.data || data;
      setApp(appData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleActionSubmit() {
    if (!actionModal) return;
    setProcessing(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/leave-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal,
          remarks: remarks.trim() || undefined,
          performedBy: currentUser?.role || "ADMIN_DASHBOARD",
          performedByName: currentUser?.fullName || "HR Administrator",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${actionModal.toLowerCase()} application`);
      }

      setActionModal(null);
      setRemarks("");
      await fetchDetail();
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRetryNotification(notifId: string) {
    setRetryingId(notifId);
    try {
      const res = await fetch(`/api/notifications/${notifId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Retry failed");
      } else {
        await fetchDetail();
      }
    } catch {
      alert("Network error while retrying notification.");
    } finally {
      setRetryingId(null);
    }
  }

  function handleCopyReference() {
    if (!app) return;
    navigator.clipboard.writeText(app.referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  function handleCopyPageLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handlePrintSlip() {
    window.print();
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-12 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Application Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {error || "The leave application with this ID could not be located in the database."}
        </p>
        <div className="pt-2">
          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Applications List
          </Link>
        </div>
      </div>
    );
  }

  const latestApproval = app.approvalHistory[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 print:bg-white print:p-0">
      {/* =========================================================================
          PRINT ONLY VOUCHER (Clean official leave sanction slip)
         ========================================================================= */}
      <div className="hidden print:block p-8 font-sans text-black">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">VRD EXPORTS</h1>
            <p className="text-xs uppercase tracking-widest text-slate-600">Leave Management System — Official Sanction Slip</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p><strong>REF:</strong> {app.referenceNumber}</p>
            <p><strong>DATE:</strong> {formatDateShort(app.submittedAt)}</p>
            <p><strong>STATUS:</strong> {app.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-6 border border-slate-300 p-4 rounded">
          <div>
            <p><strong>Employee Name:</strong> {app.employeeName}</p>
            <p><strong>Employee ID:</strong> {app.employeeIdNumber || "N/A"}</p>
            <p><strong>Email:</strong> {app.employeeEmail}</p>
            <p><strong>Department:</strong> {app.departmentSnapshot}</p>
          </div>
          <div>
            <p><strong>Leave Type:</strong> {app.leaveTypeSnapshot}</p>
            <p><strong>Period:</strong> {formatDateShort(app.startDate)} to {formatDateShort(app.endDate)}</p>
            <p><strong>Total Duration:</strong> {app.totalDays} Day(s) {app.isHalfDay ? `(${app.halfDayPeriod || "Half Day"})` : ""}</p>
            <p><strong>Reporting Manager:</strong> {app.reportingManagerName}</p>
          </div>
        </div>

        <div className="border border-slate-300 p-4 rounded mb-6 text-xs">
          <p className="font-bold mb-1">Reason for Leave:</p>
          <p className="whitespace-pre-wrap text-slate-700">{app.reason}</p>
        </div>

        {app.handoverPersonName && (
          <div className="border border-slate-300 p-4 rounded mb-6 text-xs">
            <p className="font-bold mb-1">Work Handover Designated Person:</p>
            <p>{app.handoverPersonName} ({app.handoverPersonEmail || "No email"})</p>
          </div>
        )}

        {latestApproval && latestApproval.remarks && (
          <div className="border border-slate-300 p-4 rounded mb-6 text-xs">
            <p className="font-bold mb-1">Management Remarks:</p>
            <p className="italic">{latestApproval.remarks}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 pt-16 text-center text-xs border-t border-slate-300 mt-12">
          <div>
            <div className="border-t border-slate-500 pt-2 font-semibold">Employee Signature</div>
          </div>
          <div>
            <div className="border-t border-slate-500 pt-2 font-semibold">Reporting Manager</div>
          </div>
          <div>
            <div className="border-t border-slate-500 pt-2 font-semibold">HR / Managing Director</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SCREEN VIEW: INTERACTIVE APPLICATION DETAIL CONSOLE
         ========================================================================= */}
      <div className="print:hidden p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Control Bar & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/applications"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
              title="Return to Applications list"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Link href="/admin" className="hover:text-blue-600 transition">Admin</Link>
                <span>/</span>
                <Link href="/admin/applications" className="hover:text-blue-600 transition">Applications</Link>
                <span>/</span>
                <span className="text-slate-600 font-mono">{app.referenceNumber}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {app.referenceNumber}
                </h1>
                <button
                  onClick={handleCopyReference}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Copy Reference Number"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <StatusBadge status={app.status} className="text-xs px-3 py-1 shadow-xs font-bold" />
              </div>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyPageLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
              {copiedLink ? "Link Copied" : "Share URL"}
            </button>

            <button
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Voucher
            </button>

            <button
              onClick={fetchDetail}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition"
              title="Refresh application data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            EXECUTIVE DECISION HERO BANNER
           ========================================================================= */}
        {app.status === "PENDING" && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border border-amber-200/80 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Approval Review Required
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200/60 border border-amber-300 text-amber-900 text-[11px] font-bold uppercase tracking-wider">
                      Pending Action
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    This request from <strong className="text-slate-900">{app.employeeName}</strong> for{" "}
                    <strong className="text-blue-700">{app.totalDays} day{app.totalDays !== 1 ? "s" : ""}</strong> of{" "}
                    <strong>{app.leaveTypeSnapshot}</strong> requires a decision. Automated email updates will be dispatched immediately to all stakeholders upon action.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setActionModal("DECLINED");
                    setRemarks("");
                    setActionError(null);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-rose-700 border border-rose-300/80 rounded-xl text-sm font-bold hover:bg-rose-50 shadow-sm hover:shadow transition-all"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Decline Request
                </button>

                <button
                  onClick={() => {
                    setActionModal("APPROVED");
                    setRemarks("");
                    setActionError(null);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Leave
                </button>
              </div>
            </div>
          </div>
        )}

        {app.status === "APPROVED" && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Leave Sanctioned & Approved
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 uppercase">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {latestApproval?.performedByName ? (
                      <>Authorized by <strong className="text-slate-900">{latestApproval.performedByName}</strong> on {formatDateTime(latestApproval.performedAt)}</>
                    ) : (
                      <>Approval recorded on {formatDateLong(app.submittedAt)}</>
                    )}
                  </p>
                </div>
              </div>

              {latestApproval?.remarks && (
                <div className="bg-white/80 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-900 max-w-md">
                  <span className="font-semibold text-emerald-800">Approver Remarks:</span> &ldquo;{latestApproval.remarks}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        {app.status === "DECLINED" && (
          <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-red-50 to-rose-100/50 border border-rose-200 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Leave Request Declined
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 uppercase">
                      Declined
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {latestApproval?.performedByName ? (
                      <>Declined by <strong className="text-slate-900">{latestApproval.performedByName}</strong> on {formatDateTime(latestApproval.performedAt)}</>
                    ) : (
                      <>Status updated to declined</>
                    )}
                  </p>
                </div>
              </div>

              {latestApproval?.remarks && (
                <div className="bg-white/80 border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-rose-900 max-w-md">
                  <span className="font-semibold text-rose-800">Reason for Decline:</span> &ldquo;{latestApproval.remarks}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            KEY METRICS STRIP
           ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Duration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Leave Duration
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-black text-blue-600 tracking-tight">
                {app.totalDays}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {app.totalDays === 1 ? "Day" : "Days"}
              </span>
              {app.isHalfDay && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold">
                  {app.halfDayPeriod || "Half Day"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {formatDateShort(app.startDate)} ➔ {formatDateShort(app.endDate)}
            </p>
          </div>

          {/* Card 2: Leave Type */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Leave Category
            </span>
            <div className="mt-1.5">
              <span className="text-base font-bold text-slate-900 block truncate">
                {app.leaveTypeSnapshot}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" />
              Standard Quota Policy
            </p>
          </div>

          {/* Card 3: Department */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Department
            </span>
            <div className="mt-1.5">
              <span className="text-base font-bold text-slate-900 block truncate">
                {app.departmentSnapshot}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              VRD Workforce
            </p>
          </div>

          {/* Card 4: Work Handover */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Work Handover
            </span>
            <div className="mt-1.5">
              <span className="text-base font-bold text-slate-900 block truncate">
                {app.handoverPersonName || "Not Nominated"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-slate-400" />
              {app.handoverPersonEmail ? "Contact Assigned" : "Direct Coverage"}
            </p>
          </div>
        </div>

        {/* =========================================================================
            MAIN TWO-COLUMN WORKBENCH
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: DETAILED BREAKDOWN & TIMELINES */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab navigation for section switching */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 w-fit">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "overview"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Schedule & Details
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "timeline"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Audit Trail
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {app.approvalHistory.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "notifications"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Email Logs
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {app.notifications.length}
                </span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & SCHEDULE */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Leave Schedule Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Sanctioned Schedule & Date Breakdown
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Calculated working days
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Start Date</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {formatDateLong(app.startDate)}
                      </p>
                      <p className="text-[11px] text-slate-500">Day 1 of leave period</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">End Date</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {formatDateLong(app.endDate)}
                      </p>
                      <p className="text-[11px] text-slate-500">Last day of leave</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Duration</p>
                      <p className="text-base font-black text-blue-600 mt-1">
                        {app.totalDays} Working Day{app.totalDays !== 1 ? "s" : ""}
                      </p>
                      {app.isHalfDay && (
                        <p className="text-[11px] text-blue-600 font-semibold">
                          Half-day period: {app.halfDayPeriod || "First Half"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reason for Leave */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      Employee Statement / Reason for Leave
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 border border-slate-200/60 leading-relaxed whitespace-pre-wrap font-sans">
                      &ldquo;{app.reason}&rdquo;
                    </div>
                  </div>

                  {/* Additional Notes if present */}
                  {app.additionalNotes && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Additional Information & Notes
                      </h4>
                      <p className="text-xs text-slate-600 italic bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        {app.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Handover & Work Continuity Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Handover & Operational Coverage Plan
                  </h3>

                  {app.handoverPersonName ? (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {getInitials(app.handoverPersonName)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900">
                          {app.handoverPersonName}
                        </h4>
                        {app.handoverPersonEmail && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {app.handoverPersonEmail}
                          </p>
                        )}
                        <p className="text-xs text-indigo-800 font-medium mt-2">
                          ✓ Handover coverage assignment notification dispatched to this colleague upon application submission.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 italic">
                      No colleague designated for handover in this application. Regular department coverage applies.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT TRAIL & ACTIVITY WORKFLOW */}
            {activeTab === "timeline" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Audit Trail & Approval Lifecycle
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    System Generated Logs
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Current or Initial Submission Event */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-100" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Leave Application Submitted
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTime(app.submittedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submitted by <strong className="text-slate-700">{app.employeeName}</strong> via Employee Portal
                      </p>
                    </div>
                  </div>

                  {/* Recorded Workflow Steps */}
                  {app.approvalHistory.map((item) => (
                    <div key={item.id} className="relative">
                      <div
                        className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                          item.toStatus === "APPROVED"
                            ? "bg-emerald-600 ring-emerald-100"
                            : item.toStatus === "DECLINED"
                            ? "bg-rose-600 ring-rose-100"
                            : "bg-blue-600 ring-blue-100"
                        }`}
                      />
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Status changed to {item.toStatus}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(item.performedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Action By:{" "}
                          <strong className="text-slate-800">
                            {item.performedByName || item.performedBy}
                          </strong>
                        </p>
                        {item.remarks && (
                          <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                            <strong>Remarks:</strong> &ldquo;{item.remarks}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: EMAIL NOTIFICATIONS DELIVERY LOG */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-600" />
                      Email Notification Delivery Logs
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All transactional emails dispatched via Resend integration
                    </p>
                  </div>
                  <Link
                    href="/admin/email-preview"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    View Templates
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {app.notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-6 text-center">
                    No notification attempts recorded for this application yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Recipient</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Attempts</th>
                          <th className="py-2.5 px-3">Sent At</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {app.notifications.map((n) => (
                          <tr key={n.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {n.type.replace(/_/g, " ")}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <span className="font-mono text-slate-800">{n.recipientEmail}</span>
                              {n.recipientName && (
                                <span className="block text-[10px] text-slate-400">{n.recipientName}</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  n.status === "SENT"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : n.status === "FAILED"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {n.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono">
                              {n.attemptCount}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono">
                              {n.sentAt ? formatDateShort(n.sentAt) : "—"}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {n.status === "FAILED" && (
                                <button
                                  onClick={() => handleRetryNotification(n.id)}
                                  disabled={retryingId === n.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold transition disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3 h-3 ${retryingId === n.id ? "animate-spin" : ""}`} />
                                  Retry
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT 4 COLUMNS: STAKEHOLDER PROFILE & HIERARCHY */}
          <div className="lg:col-span-4 space-y-6">
            {/* Employee Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Employee Profile
              </h3>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {getInitials(app.employeeName)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    {app.employeeName}
                  </h4>
                  <a
                    href={`mailto:${app.employeeEmail}`}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                  >
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {app.employeeEmail}
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Employee ID</span>
                  <span className="font-mono font-bold text-slate-800">{app.employeeIdNumber || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Department</span>
                  <span className="font-semibold text-slate-800">{app.departmentSnapshot}</span>
                </div>

                {app.contactDuringLeave && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Emergency Phone</span>
                    <a
                      href={`tel:${app.contactDuringLeave}`}
                      className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      {app.contactDuringLeave}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Reporting Manager Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Reporting Manager
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {getInitials(app.reportingManagerName)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {app.reportingManagerName}
                  </h4>
                  <a
                    href={`mailto:${app.reportingManagerEmail}`}
                    className="text-xs text-slate-500 hover:text-blue-600 truncate flex items-center gap-1 mt-0.5"
                  >
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {app.reportingManagerEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Company Approvers Routing Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Notification Stakeholders
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Automated status notifications for this application are routed to company management inboxes:
              </p>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-medium">HR Department</span>
                  <span className="font-mono text-slate-400 text-[11px]">hr@vrdexports.in</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-medium">Executive Assistant</span>
                  <span className="font-mono text-slate-400 text-[11px]">ea@vrdexports.in</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="font-medium">Managing Directors</span>
                  <span className="font-mono text-slate-400 text-[11px]">vatsal@vrdexports.in</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium">Designated Approvers</span>
                  <span className="font-mono text-blue-600 text-[11px]">10 Inboxes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE APPROVAL / DECLINE MODAL
         ========================================================================= */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  actionModal === "APPROVED"
                    ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                    : "bg-rose-100 text-rose-600 border border-rose-200"
                }`}
              >
                {actionModal === "APPROVED" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {actionModal === "APPROVED" ? "Approve Leave Request" : "Decline Leave Request"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reference: <span className="font-mono font-bold text-slate-800">{app.referenceNumber}</span> •{" "}
                  {app.employeeName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to mark this leave application as{" "}
              <strong className={actionModal === "APPROVED" ? "text-emerald-700" : "text-rose-700"}>
                {actionModal}
              </strong>
              . Transactional emails will be sent out immediately to the employee, reporting manager, HR, EA, and company owners.
            </p>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Preset Remarks
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(actionModal === "APPROVED" ? APPROVE_PRESETS : DECLINE_PRESETS).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRemarks(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Custom Remarks / Justification (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionModal === "APPROVED"
                    ? "Add any handover reminders or approval notes..."
                    : "State the operational reason for declining this request..."
                }
                className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 bg-slate-50/50"
              />
            </div>

            {actionError && (
              <p className="text-xs text-rose-700 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
                {actionError}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={processing}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={processing}
                className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl transition shadow-md flex items-center gap-2 ${
                  actionModal === "APPROVED"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25"
                    : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25"
                }`}
              >
                {processing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm {actionModal === "APPROVED" ? "Approval" : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
