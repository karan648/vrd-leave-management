"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusLookupSchema, type StatusLookupInput } from "@/lib/validations";
import { StatusBadge } from "@/components/status-badge";
import { formatDateLong, formatDateTime } from "@/lib/utils";
import { Search, Loader2, AlertCircle, Calendar, Clock, FileText } from "lucide-react";

interface StatusResult {
  referenceNumber: string;
  employeeName: string;
  leaveType: string;
  department: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  submittedAt: string;
  latestRemarks: string | null;
  lastUpdatedAt: string;
}

export function LeaveStatusClient() {
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusLookupInput>({
    resolver: zodResolver(StatusLookupSchema),
  });

  async function onLookup(data: StatusLookupInput) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/leave-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json.data) {
        setResult(json.data);
      } else if (res.status === 429) {
        setError("Too many lookups. Please wait a few minutes before trying again.");
      } else {
        setError(
          json.error ||
            "No application found. Please check your reference number and email."
        );
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Lookup Form */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
        <form onSubmit={handleSubmit(onLookup)} noValidate>
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Application Reference Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("referenceNumber")}
                placeholder="e.g., VRD-20261018-ABCDEF"
                className={`form-input uppercase ${errors.referenceNumber ? "error" : ""}`}
              />
              {errors.referenceNumber && (
                <p className="form-error">{errors.referenceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Registered Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("employeeEmail")}
                type="email"
                placeholder="your.email@vrdexports.com"
                className={`form-input ${errors.employeeEmail ? "error" : ""}`}
              />
              {errors.employeeEmail && (
                <p className="form-error">{errors.employeeEmail.message}</p>
              )}
              <p className="text-xs text-[#94a3b8] mt-1">
                Enter the email address you used when submitting the application.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#2563eb] text-white font-semibold py-3 rounded-lg hover:bg-[#1d4ed8] disabled:opacity-60 transition-colors text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Status Header */}
          <div
            className={`px-6 py-5 border-b border-[#f1f5f9] ${
              result.status === "APPROVED"
                ? "bg-green-50"
                : result.status === "DECLINED"
                ? "bg-red-50"
                : result.status === "CANCELLED"
                ? "bg-slate-50"
                : "bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-1">
                  Application Status
                </p>
                <p className="text-lg font-bold text-[#0f172a] font-mono">
                  {result.referenceNumber}
                </p>
              </div>
              <StatusBadge status={result.status} className="text-sm px-4 py-1.5" />
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow
                icon={<FileText className="w-4 h-4" />}
                label="Employee"
                value={result.employeeName}
              />
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Leave Type"
                value={result.leaveType}
              />
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="From"
                value={formatDateLong(result.startDate)}
              />
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="To"
                value={formatDateLong(result.endDate)}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Total Days"
                value={`${result.totalDays} day${result.totalDays !== 1 ? "s" : ""}${result.isHalfDay ? " (half-day)" : ""}`}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Submitted At"
                value={formatDateTime(result.submittedAt)}
              />
            </div>

            {result.latestRemarks && (
              <div className="mt-5 p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                  Remarks
                </p>
                <p className="text-sm text-[#374151]">{result.latestRemarks}</p>
              </div>
            )}

            <p className="text-xs text-[#94a3b8] mt-5">
              Last updated: {formatDateTime(result.lastUpdatedAt)}
            </p>
          </div>

          {/* Guidance based on status */}
          <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#f1f5f9]">
            <p className="text-xs text-[#64748b]">
              {result.status === "PENDING" &&
                "Your application is under review. You will be notified by email once a decision is made."}
              {result.status === "APPROVED" &&
                "Your leave has been approved. Please ensure handover arrangements are complete."}
              {result.status === "DECLINED" &&
                "Your leave application was not approved. Please contact your manager or HR for details."}
              {result.status === "CANCELLED" &&
                "This application has been cancelled."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#64748b] flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#94a3b8] font-medium">{label}</p>
        <p className="text-sm text-[#0f172a] font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}
