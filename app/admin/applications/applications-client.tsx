"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateIndia, formatDateTime } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";

interface Application {
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
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  approvedByUsername?: string | null;
  reportingManagerName: string;
  handoverPersonName?: string | null;
  submittedAt: string;
  approvalHistory: Array<{
    remarks?: string | null;
    toStatus: string;
    performedAt: string;
    performedBy?: string;
    performedByName?: string | null;
  }>;
}

function getDecisionBy(application: Application): string | null {
  const decision = application.approvalHistory[0];
  return application.approvedByUsername || decision?.performedByName || decision?.performedBy || null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface FilterState {
  search: string;
  status: string;
  departmentId: string;
  leaveTypeId: string;
}

interface Department { id: string; name: string; }
interface LeaveType { id: string; name: string; }

interface ApprovalDialogState {
  open: boolean;
  applicationId: string;
  action: "APPROVED" | "DECLINED" | "CANCELLED" | null;
  remarks: string;
  loading: boolean;
  error: string | null;
}

export function ApplicationsClient() {
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, pageSize: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    departmentId: searchParams.get("departmentId") || "",
    leaveTypeId: searchParams.get("leaveTypeId") || "",
  });

  const [page, setPage] = useState(Number(searchParams.get("page") || "1"));

  const [dialog, setDialog] = useState<ApprovalDialogState>({
    open: false,
    applicationId: "",
    action: null,
    remarks: "",
    loading: false,
    error: null,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/departments?includeInactive=false"),
      fetch("/api/leave-types?includeInactive=false"),
    ]).then(async ([dRes, ltRes]) => {
      const [dJson, ltJson] = await Promise.all([dRes.json(), ltRes.json()]);
      setDepartments(dJson.data ?? []);
      setLeaveTypes(ltJson.data ?? []);
    });
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(filters.leaveTypeId && { leaveTypeId: filters.leaveTypeId }),
      sortBy: "submittedAt",
      sortDir: "desc",
    });

    try {
      const res = await fetch(`/api/leave-applications/list?${params}`);
      if (!res.ok) throw new Error("Failed to load applications");
      const json = await res.json();
      setApplications(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 });
    } catch {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  function openDialog(id: string, action: "APPROVED" | "DECLINED" | "CANCELLED") {
    setDialog({
      open: true,
      applicationId: id,
      action,
      remarks: "",
      loading: false,
      error: null,
    });
  }

  async function submitApproval() {
    if (!dialog.action) return;
    setDialog((d) => ({ ...d, loading: true, error: null }));

    try {
      const res = await fetch(`/api/leave-applications/${dialog.applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: dialog.action,
          remarks: dialog.remarks,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDialog((d) => ({ ...d, loading: false, error: json.error || "Action failed" }));
        return;
      }
      setDialog({ open: false, applicationId: "", action: null, remarks: "", loading: false, error: null });
      await fetchApplications();
    } catch {
      setDialog((d) => ({ ...d, loading: false, error: "Network error. Please try again." }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total} total application{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 mb-5 flex flex-wrap gap-2.5">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            placeholder="Search name, email, reference..."
            className="form-input pl-9 text-sm"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
          className="form-input text-sm w-auto min-w-[130px]"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="DECLINED">Declined</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={filters.departmentId}
          onChange={(e) => { setFilters((f) => ({ ...f, departmentId: e.target.value })); setPage(1); }}
          className="form-input text-sm w-auto min-w-[150px]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={filters.leaveTypeId}
          onChange={(e) => { setFilters((f) => ({ ...f, leaveTypeId: e.target.value })); setPage(1); }}
          className="form-input text-sm w-auto min-w-[140px]"
        >
          <option value="">All Types</option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>{lt.name}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3.5 mb-5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading applications…</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No applications found</p>
            <p className="text-xs text-gray-500 mt-1">
              {filters.search || filters.status || filters.departmentId || filters.leaveTypeId
                ? "Try adjusting your search filters"
                : "Applications will appear here once submitted"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Decision By</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="font-mono text-xs font-medium text-gray-900 hover:underline"
                      >
                        {app.referenceNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{app.employeeName}</p>
                        <p className="text-xs text-gray-400">{app.employeeEmail}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600 whitespace-nowrap">
                      {app.departmentSnapshot}
                    </td>
                    <td className="text-sm text-gray-600 whitespace-nowrap">
                      {app.leaveTypeSnapshot}
                    </td>
                    <td className="whitespace-nowrap">
                      <p className="text-xs text-gray-700 font-medium">
                        {formatDateIndia(app.startDate)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        to {formatDateIndia(app.endDate)}
                      </p>
                    </td>
                    <td className="text-sm font-medium text-gray-700 text-center">
                      {app.totalDays}
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="text-sm text-gray-600 whitespace-nowrap">
                      {getDecisionBy(app) || "—"}
                    </td>
                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(app.submittedAt)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {app.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => openDialog(app.id, "APPROVED")}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDialog(app.id, "DECLINED")}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Decline"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-gray-600 px-2 font-medium">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 border border-gray-200 rounded-md disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-sm w-full p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {dialog.action === "APPROVED" ? "Approve Application" :
               dialog.action === "DECLINED" ? "Decline Application" :
               "Cancel Application"}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {dialog.action === "APPROVED"
                ? "This will approve the leave and notify the employee."
                : dialog.action === "DECLINED"
                ? "Please provide remarks explaining why the leave was declined."
                : "This will cancel the application."}
            </p>

            {dialog.error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-2.5 mb-3">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{dialog.error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Remarks
                {dialog.action === "DECLINED" && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <textarea
                value={dialog.remarks}
                onChange={(e) => setDialog((d) => ({ ...d, remarks: e.target.value }))}
                rows={3}
                placeholder={
                  dialog.action === "DECLINED"
                    ? "Reason for declining (required)"
                    : "Optional remarks"
                }
                className="form-input text-xs resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setDialog({ open: false, applicationId: "", action: null, remarks: "", loading: false, error: null })
                }
                disabled={dialog.loading}
                className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                disabled={dialog.loading || (dialog.action === "DECLINED" && !dialog.remarks.trim())}
                className={`flex-1 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                  dialog.action === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : dialog.action === "DECLINED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-800 hover:bg-gray-900"
                }`}
              >
                {dialog.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  dialog.action === "APPROVED" ? "Approve" :
                  dialog.action === "DECLINED" ? "Decline" : "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
