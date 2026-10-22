"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusLookupSchema, type StatusLookupInput } from "@/lib/validations";
import { StatusBadge } from "@/components/status-badge";
import { formatDateLong, formatDateTime } from "@/lib/utils";
import { Search, Loader2, AlertCircle } from "lucide-react";

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
        setError("Too many lookups. Please wait a few minutes.");
      } else {
        setError(
          json.error ||
            "No application found. Check your reference number and email."
        );
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Lookup Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <form onSubmit={handleSubmit(onLookup)} noValidate>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reference Number <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register("employeeEmail")}
                type="email"
                placeholder="you@vrdexports.com"
                className={`form-input ${errors.employeeEmail ? "error" : ""}`}
              />
              {errors.employeeEmail && (
                <p className="form-error">{errors.employeeEmail.message}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                The email you used when submitting the application.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Looking up…
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
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Application</p>
              <p className="text-sm font-semibold text-gray-900 font-mono">
                {result.referenceNumber}
              </p>
            </div>
            <StatusBadge status={result.status} className="text-xs px-3 py-1" />
          </div>

          {/* Details grid */}
          <div className="px-6 py-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <DetailRow label="Employee" value={result.employeeName} />
              <DetailRow label="Leave Type" value={result.leaveType} />
              <DetailRow label="From" value={formatDateLong(result.startDate)} />
              <DetailRow label="To" value={formatDateLong(result.endDate)} />
              <DetailRow
                label="Duration"
                value={`${result.totalDays} day${result.totalDays !== 1 ? "s" : ""}${result.isHalfDay ? " (half-day)" : ""}`}
              />
              <DetailRow label="Submitted" value={formatDateTime(result.submittedAt)} />
            </div>

            {result.latestRemarks && (
              <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Remarks</p>
                <p className="text-sm text-gray-700">{result.latestRemarks}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              Last updated: {formatDateTime(result.lastUpdatedAt)}
            </p>
          </div>

          {/* Footer guidance */}
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {result.status === "PENDING" &&
                "Your application is under review. You'll be notified by email once a decision is made."}
              {result.status === "APPROVED" &&
                "Your leave has been approved. Please complete handover arrangements."}
              {result.status === "DECLINED" &&
                "Your application was not approved. Contact your manager or HR for details."}
              {result.status === "CANCELLED" &&
                "This application has been cancelled."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
  );
}
