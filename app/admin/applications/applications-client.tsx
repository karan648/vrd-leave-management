"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateIndia, formatDateTime } from "@/lib/utils";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronDown,
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
  reportingManagerName: string;
  handoverPersonName?: string | null;
  submittedAt: string;
  approvalHistory: Array<{
    remarks?: string | null;
    toStatus: string;
    performedAt: string;
    performedByName?: string | null;
  }>;
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

// Approval dialog
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
  const router = useRouter();

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

  // Load filter options
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
      setError("Failed to load applications. Check your database connection.");
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
          performedBy: "ADMIN",
          performedByName: "Admin User",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDialog((d) => ({ ...d, loading: false, error: json.error || "Action failed" }));
        return;
      }
      // Success
      setDialog({ open: false, applicationId: "", action: null, remarks: "", loading: false, error: null });
      await fetchApplications();
    } catch {
      setDialog((d) => ({ ...d, loading: false, error: "Network error. Please try again." }));
    }
  }

  const latestRemark = (app: Application) => app.approvalHistory[0]?.remarks;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Leave Applications</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {pagination.total} total application{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            placeholder="Search name, email, ID, reference..."
            className="form-input pl-9 text-sm"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
          className="form-input text-sm w-auto min-w-36"
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
          className="form-input text-sm w-auto min-w-40"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={filters.leaveTypeId}
          onChange={(e) => { setFilters((f) => ({ ...f, leaveTypeId: e.target.value })); setPage(1); }}
          className="form-input text-sm w-auto min-w-40"
        >
          <option value="">All Leave Types</option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>{lt.name}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-[#cbd5e1] mx-auto mb-4" />
            <p className="text-[#64748b] font-medium">No applications found</p>
            <p className="text-sm text-[#94a3b8] mt-1">
              {filters.search || filters.status || filters.departmentId || filters.leaveTypeId
                ? "Try adjusting your filters"
                : "Applications will appear here once employees submit them"}
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
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-[#2563eb] hover:underline font-mono text-xs font-semibold"
                      >
                        {app.referenceNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-[#0f172a] text-sm">{app.employeeName}</p>
                        <p className="text-xs text-[#64748b]">{app.employeeEmail}</p>
                        {app.employeeIdNumber && (
                          <p className="text-xs text-[#94a3b8]">{app.employeeIdNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-[#374151] whitespace-nowrap">
                      {app.departmentSnapshot}
                    </td>
                    <td className="text-sm text-[#374151] whitespace-nowrap">
                      {app.leaveTypeSnapshot}
                    </td>
                    <td className="whitespace-nowrap">
                      <p className="text-xs text-[#374151]">
                        {formatDateIndia(app.startDate)}
                      </p>
                      <p className="text-xs text-[#94a3b8]">
                        to {formatDateIndia(app.endDate)}
                      </p>
                    </td>
                    <td className="text-sm font-semibold text-[#374151] text-center">
                      {app.totalDays}
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                      {latestRemark(app) && (
                        <p className="text-xs text-[#94a3b8] mt-1 max-w-[120px] truncate">
                          {latestRemark(app)}
                        </p>
                      )}
                    </td>
                    <td className="text-xs text-[#64748b] whitespace-nowrap">
                      {formatDateTime(app.submittedAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="p-1.5 text-[#64748b] hover:text-[#2563eb] hover:bg-blue-50 rounded-md transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {app.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => openDialog(app.id, "APPROVED")}
                              className="p-1.5 text-[#64748b] hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDialog(app.id, "DECLINED")}
                              className="p-1.5 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#64748b]">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-[#e2e8f0] rounded-lg disabled:opacity-40 hover:bg-[#f8fafc] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[#374151] px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 border border-[#e2e8f0] rounded-lg disabled:opacity-40 hover:bg-[#f8fafc] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-[#0f172a] mb-2">
              {dialog.action === "APPROVED" ? "Approve Application" :
               dialog.action === "DECLINED" ? "Decline Application" :
               "Cancel Application"}
            </h2>
            <p className="text-sm text-[#64748b] mb-5">
              {dialog.action === "APPROVED"
                ? "This will approve the leave application and notify the employee."
                : dialog.action === "DECLINED"
                ? "This will decline the leave application. Please add a reason."
                : "This will cancel the approved leave application."}
            </p>

            {dialog.error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{dialog.error}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="form-label">
                Remarks / Notes
                {dialog.action === "DECLINED" && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={dialog.remarks}
                onChange={(e) => setDialog((d) => ({ ...d, remarks: e.target.value }))}
                rows={3}
                placeholder={
                  dialog.action === "DECLINED"
                    ? "Reason for declining (required)"
                    : "Optional remarks for the employee"
                }
                className="form-input resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDialog({ open: false, applicationId: "", action: null, remarks: "", loading: false, error: null })
                }
                disabled={dialog.loading}
                className="flex-1 py-2.5 text-sm font-semibold border border-[#e2e8f0] text-[#374151] rounded-lg hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                disabled={dialog.loading || (dialog.action === "DECLINED" && !dialog.remarks.trim())}
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  dialog.action === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : dialog.action === "DECLINED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                {dialog.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  dialog.action === "APPROVED" ? "Approve" :
                  dialog.action === "DECLINED" ? "Decline" : "Cancel Application"
                )}
              </button>
            </div>

            <p className="text-[10px] text-[#94a3b8] text-center mt-3">
              ⚠️ Dev note: Approval endpoints are not authenticated in this version.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
