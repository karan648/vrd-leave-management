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
  Briefcase,
  UserCheck,
  ExternalLink,
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
  approvedByUsername?: string | null;
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
  "Approved. Handover confirmed.",
  "Approved as per department schedule.",
  "Approved. Please complete handover before leave.",
  "Approved.",
];

const DECLINE_PRESETS = [
  "Operational export cycle during requested dates. Please reschedule.",
  "Staffing constraints in department for this period.",
  "Overlapping leave with team members.",
  "Insufficient leave balance.",
];

export function ApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionModal, setActionModal] = useState<"APPROVED" | "DECLINED" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "notifications">("overview");

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

  async function handleCopyReference() {
    if (!app) return;
    await navigator.clipboard.writeText(app.referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  async function handleCopyPageLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handlePrintSlip() {
    window.print();
  }

  async function handleActionSubmit() {
    if (!actionModal || !app) return;
    setProcessing(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/leave-applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal,
          remarks: remarks.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Failed to update status to ${actionModal}`);
      }

      setActionModal(null);
      setRemarks("");
      await fetchDetail();
      router.refresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to record decision.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRetryNotification(notificationId: string) {
    setRetryingId(notificationId);
    try {
      const res = await fetch(`/api/notifications/${notificationId}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDetail();
      }
    } catch {
      // Non-fatal
    } finally {
      setRetryingId(null);
    }
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
      <div className="max-w-5xl mx-auto py-16 text-center">
        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading application details…</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-red-900">Application Error</h2>
            <p className="text-sm text-red-700 mt-1">{error || "Application not found."}</p>
            <div className="mt-4">
              <Link
                href="/admin/applications"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const latestApproval = app.approvalHistory?.[0];
  const approvedHistoryEntry = app.approvalHistory?.find((item) => item.toStatus === "APPROVED");
  const approvedBy = app.approvedByUsername || approvedHistoryEntry?.performedByName || approvedHistoryEntry?.performedBy;
  const latestDecisionBy = latestApproval?.performedByName || latestApproval?.performedBy;

  return (
    <div>
      {/* =========================================================================
          PRINT VIEW: Formal Leave Slip Voucher
         ========================================================================= */}
      <div className="hidden print:block p-8 bg-white text-black font-sans max-w-2xl mx-auto text-xs leading-relaxed">
        <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider">VRD Exports</h1>
            <p className="text-[11px] text-gray-600">Employee Leave Voucher</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-sm">{app.referenceNumber}</p>
            <p className="text-[10px] text-gray-500">Date: {formatDateShort(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 border-b border-gray-300 pb-3">
          <div><span className="font-semibold">Employee:</span> {app.employeeName}</div>
          <div><span className="font-semibold">Employee ID:</span> {app.employeeIdNumber || "N/A"}</div>
          <div><span className="font-semibold">Department:</span> {app.departmentSnapshot}</div>
          <div><span className="font-semibold">Leave Category:</span> {app.leaveTypeSnapshot}</div>
          <div><span className="font-semibold">Start Date:</span> {formatDateLong(app.startDate)}</div>
          <div><span className="font-semibold">End Date:</span> {formatDateLong(app.endDate)}</div>
          <div><span className="font-semibold">Duration:</span> {app.totalDays} day{app.totalDays !== 1 ? "s" : ""} {app.isHalfDay ? `(${app.halfDayPeriod || "Half Day"})` : ""}</div>
          <div><span className="font-semibold">Decision:</span> {app.status}</div>
        </div>

        <div className="mb-4">
          <p className="font-semibold mb-1">Reason for Leave:</p>
          <p className="italic text-gray-700 bg-gray-50 p-2 border border-gray-200 rounded">{app.reason}</p>
        </div>

        {app.handoverPersonName && (
          <div className="mb-4">
            <span className="font-semibold">Nominated Handover:</span> {app.handoverPersonName} ({app.handoverPersonEmail || "No email"})
          </div>
        )}

        <div className="mt-8 pt-8 grid grid-cols-3 gap-6 text-center text-[10px]">
          <div><div className="border-t border-black pt-1">Employee Signature</div></div>
          <div><div className="border-t border-black pt-1">Reporting Manager</div></div>
          <div><div className="border-t border-black pt-1">HR / Managing Director</div></div>
        </div>
      </div>

      {/* =========================================================================
          SCREEN VIEW: Clean Minimal Application Workbench
         ========================================================================= */}
      <div className="print:hidden max-w-6xl mx-auto space-y-6">
        {/* Top Control Bar & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/applications"
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Return to applications"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Link href="/admin" className="hover:text-gray-600 transition">Admin</Link>
                <span>/</span>
                <Link href="/admin/applications" className="hover:text-gray-600 transition">Applications</Link>
                <span>/</span>
                <span className="text-gray-700 font-mono">{app.referenceNumber}</span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight font-mono">
                  {app.referenceNumber}
                </h1>
                <button
                  onClick={handleCopyReference}
                  className="p-1 text-gray-400 hover:text-gray-600 transition"
                  title="Copy Reference"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <StatusBadge status={app.status} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPageLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <ExternalLink className="w-3.5 h-3.5 text-gray-400" />}
              {copiedLink ? "Copied" : "Share"}
            </button>

            <button
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-gray-400" />
              Print
            </button>

            <button
              onClick={fetchDetail}
              className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* DECISION ACTION BAR (IF PENDING) */}
        {app.status === "PENDING" && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-950">Review required</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {app.employeeName} requested {app.totalDays} day{app.totalDays !== 1 ? "s" : ""} of {app.leaveTypeSnapshot}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setActionModal("DECLINED");
                  setRemarks("");
                  setActionError(null);
                }}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setActionModal("APPROVED");
                  setRemarks("");
                  setActionError(null);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                Approve Leave
              </button>
            </div>
          </div>
        )}

        {app.status === "APPROVED" && (
          <div className="bg-green-50/60 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-950">Approved</p>
                <p className="text-xs text-green-700 mt-0.5">
                  {approvedBy
                    ? `Sanctioned by ${approvedBy} on ${formatDateTime(approvedHistoryEntry?.performedAt || app.submittedAt)}`
                    : `Approved on ${formatDateLong(app.submittedAt)}`}
                  {latestApproval?.remarks && ` — "${latestApproval.remarks}"`}
                </p>
              </div>
            </div>
          </div>
        )}

        {app.status === "DECLINED" && (
          <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-950">Declined</p>
                <p className="text-xs text-red-700 mt-0.5">
                  {latestDecisionBy
                    ? `Declined by ${latestDecisionBy} on ${formatDateTime(latestApproval.performedAt)}`
                    : "Application declined"}
                  {latestApproval?.remarks && ` — "${latestApproval.remarks}"`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">Duration</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {app.totalDays} <span className="text-xs font-normal text-gray-500">day{app.totalDays !== 1 ? "s" : ""}</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {formatDateShort(app.startDate)} – {formatDateShort(app.endDate)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">Leave Type</p>
            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
              {app.leaveTypeSnapshot}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {app.isHalfDay ? `Half-day (${app.halfDayPeriod || "First half"})` : "Full day"}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">Department</p>
            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
              {app.departmentSnapshot}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">VRD Workforce</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400">Handover</p>
            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
              {app.handoverPersonName || "None"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 truncate">
              {app.handoverPersonEmail || "Regular coverage"}
            </p>
          </div>
        </div>

        {/* MAIN WORKBENCH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "overview"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "timeline"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Audit Trail ({app.approvalHistory.length})
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "notifications"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Notifications ({app.notifications.length})
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Schedule Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Schedule Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                    <div>
                      <p className="text-[11px] text-gray-400">Start Date</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {formatDateLong(app.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">End Date</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {formatDateLong(app.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Duration</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {app.totalDays} day{app.totalDays !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Reason for leave</p>
                    <div className="bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-100 whitespace-pre-wrap leading-relaxed">
                      {app.reason}
                    </div>
                  </div>

                  {app.additionalNotes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Additional notes</p>
                      <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {app.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Handover Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Operational Handover
                  </h3>
                  {app.handoverPersonName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {getInitials(app.handoverPersonName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{app.handoverPersonName}</p>
                        {app.handoverPersonEmail && (
                          <p className="text-xs text-gray-400">{app.handoverPersonEmail}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No handover colleague designated.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === "timeline" && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Lifecycle History
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Application Submitted</p>
                      <p className="text-[11px] text-gray-400">
                        {formatDateTime(app.submittedAt)} by {app.employeeName}
                      </p>
                    </div>
                  </div>

                  {app.approvalHistory.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-gray-900 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-900">
                            Status changed to {item.toStatus}
                          </p>
                          <span className="text-[11px] text-gray-400">
                            {formatDateTime(item.performedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Action by: {item.performedByName || item.performedBy}
                        </p>
                        {item.remarks && (
                          <p className="text-xs text-gray-700 mt-2 bg-white p-2 rounded border border-gray-200">
                            &ldquo;{item.remarks}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Transactional Emails
                  </h3>
                  <Link
                    href="/admin/email-preview"
                    className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
                  >
                    View Templates <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {app.notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No notifications logged.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                          <th className="py-2 px-3 font-medium">Type</th>
                          <th className="py-2 px-3 font-medium">Recipient</th>
                          <th className="py-2 px-3 font-medium">Status</th>
                          <th className="py-2 px-3 font-medium">Date</th>
                          <th className="py-2 px-3 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {app.notifications.map((n) => (
                          <tr key={n.id}>
                            <td className="py-2.5 px-3 font-medium text-gray-800">
                              {n.type.replace(/_/g, " ")}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">
                              {n.recipientEmail}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                  n.status === "SENT"
                                    ? "bg-green-50 text-green-700"
                                    : n.status === "FAILED"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {n.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                              {n.sentAt ? formatDateShort(n.sentAt) : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {n.status === "FAILED" && (
                                <button
                                  onClick={() => handleRetryNotification(n.id)}
                                  disabled={retryingId === n.id}
                                  className="text-[11px] text-gray-700 hover:underline"
                                >
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

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Employee Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Employee
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {getInitials(app.employeeName)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{app.employeeName}</p>
                  <p className="text-xs text-gray-400 truncate">{app.employeeEmail}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Employee ID</span>
                  <span className="font-mono text-gray-700">{app.employeeIdNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Department</span>
                  <span className="text-gray-700">{app.departmentSnapshot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Approved By</span>
                  <span className="text-gray-700">{approvedBy || "—"}</span>
                </div>
                {app.contactDuringLeave && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emergency Phone</span>
                    <span className="font-mono text-gray-700">{app.contactDuringLeave}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Manager Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Reporting Manager
              </h3>
              <p className="text-sm font-medium text-gray-900">{app.reportingManagerName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{app.reportingManagerEmail}</p>
            </div>

            {/* Approvers Routing Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-xs">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
                Approver Routing
              </h3>
              <p className="text-gray-500 mb-3 text-[11px]">
                Status notifications are routed automatically:
              </p>
              <div className="space-y-1.5 text-gray-600">
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span>HR Department</span>
                  <span className="font-mono text-gray-400 text-[11px]">hr@vrdexports.in</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-gray-50">
                  <span>Executive Assistant</span>
                  <span className="font-mono text-gray-400 text-[11px]">ea@vrdexports.in</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Approvers</span>
                  <span className="font-mono text-gray-400 text-[11px]">10 inboxes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {actionModal === "APPROVED" ? "Approve Leave Request" : "Decline Leave Request"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Reference: <span className="font-mono font-medium">{app.referenceNumber}</span> • {app.employeeName}
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">Preset remarks</p>
              <div className="flex flex-wrap gap-1.5">
                {(actionModal === "APPROVED" ? APPROVE_PRESETS : DECLINE_PRESETS).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRemarks(p)}
                    className="text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks Input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Remarks {actionModal === "DECLINED" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder={
                  actionModal === "APPROVED"
                    ? "Optional handover or approval notes"
                    : "Reason for declining (required)"
                }
                className="form-input text-xs resize-none"
              />
            </div>

            {actionError && (
              <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {actionError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={processing}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={processing || (actionModal === "DECLINED" && !remarks.trim())}
                className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 ${
                  actionModal === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
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
