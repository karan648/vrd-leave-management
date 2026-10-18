"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDateShort, formatDateLong } from "@/lib/utils";
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
  ShieldAlert,
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

export function ApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal state
  const [actionModal, setActionModal] = useState<"APPROVE" | "DECLINE" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Notification retry state
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
      setApp(data);
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
          performedBy: "ADMIN_DASHBOARD",
          performedByName: "HR Administrator",
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

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Application Not Found</h2>
        <p className="text-sm text-slate-500">{error || "The requested leave application could not be located."}</p>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/applications"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Back to applications"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">
                {app.referenceNumber}
              </h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted on {formatDateLong(app.submittedAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons for Pending */}
        {app.status === "PENDING" && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActionModal("DECLINE");
                setRemarks("");
                setActionError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-rose-700 border border-rose-200 rounded-lg text-sm font-semibold hover:bg-rose-50 transition"
            >
              <XCircle className="w-4 h-4" /> Decline
            </button>
            <button
              onClick={() => {
                setActionModal("APPROVE");
                setRemarks("");
                setActionError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve Leave
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Details (Left 2 cols) & Sidebar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Application Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Schedule Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Leave Schedule & Duration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Start Date</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatDateLong(app.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">End Date</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatDateLong(app.endDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Duration</p>
                <p className="text-base font-extrabold text-blue-600 mt-0.5">
                  {app.totalDays} day{app.totalDays !== 1 ? "s" : ""}
                  {app.isHalfDay && (
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      ({app.halfDayPeriod || "Half Day"})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Leave Type
              </p>
              <p className="text-sm font-medium text-slate-800">
                {app.leaveTypeSnapshot}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Reason for Leave
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
                {app.reason}
              </div>
            </div>

            {app.additionalNotes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Additional Notes
                </p>
                <p className="text-sm text-slate-600 italic">
                  {app.additionalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Audit History & Workflow Log
            </h2>

            {app.approvalHistory.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-2">
                No status changes recorded yet. Application is in initial submission state.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {app.approvalHistory.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-100" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Status updated to {item.toStatus}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateShort(item.performedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By: <span className="font-medium text-slate-700">{item.performedByName || item.performedBy}</span>
                      </p>
                      {item.remarks && (
                        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
                          <strong>Remarks:</strong> {item.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Delivery Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" /> Email Notifications Log
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {app.notifications.length} logged
              </span>
            </div>

            {app.notifications.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-2">
                No notification attempts recorded for this application.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Attempts</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {app.notifications.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {n.type.replace(/_/g, " ")}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {n.recipientEmail}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              n.status === "SENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : n.status === "FAILED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {n.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {n.attemptCount}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {n.status === "FAILED" && (
                            <button
                              onClick={() => handleRetryNotification(n.id)}
                              disabled={retryingId === n.id}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
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
        </div>

        {/* Right Column: Employee, Manager, Handover Info */}
        <div className="space-y-6">
          {/* Employee Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Employee Profile
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-base font-bold text-slate-900">{app.employeeName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.employeeEmail}
                </p>
              </div>

              {app.employeeIdNumber && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Employee ID</span>
                  <p className="text-xs font-mono font-bold text-slate-700">{app.employeeIdNumber}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Department</span>
                <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {app.departmentSnapshot}
                </p>
              </div>

              {app.contactDuringLeave && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Emergency Contact</span>
                  <p className="text-xs text-slate-700 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {app.contactDuringLeave}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reporting Manager Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Reporting Manager
            </h2>
            <div>
              <p className="text-sm font-bold text-slate-800">{app.reportingManagerName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.reportingManagerEmail}
              </p>
            </div>
          </div>

          {/* Handover / Assigned Person Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Work Handover / Assigned Person
            </h2>
            {app.handoverPersonName ? (
              <div>
                <p className="text-sm font-bold text-slate-800">{app.handoverPersonName}</p>
                {app.handoverPersonEmail && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.handoverPersonEmail}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">None specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionModal === "APPROVE" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                }`}
              >
                {actionModal === "APPROVE" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {actionModal === "APPROVE" ? "Approve Leave Application" : "Decline Leave Application"}
                </h3>
                <p className="text-xs text-slate-500">
                  Reference: <span className="font-mono font-bold">{app.referenceNumber}</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to mark this application as{" "}
              <strong>{actionModal === "APPROVE" ? "APPROVED" : "DECLINED"}</strong>? An email notification will be automatically triggered to the employee and manager.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks / Reason (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionModal === "APPROVE" ? "e.g., Approved as per discussion" : "e.g., Operational requirements during peak export cycle"}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            {actionError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                {actionError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={processing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={processing}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5 ${
                  actionModal === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {processing && <RefreshCw className="w-3 h-3 animate-spin" />}
                Confirm {actionModal === "APPROVE" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
