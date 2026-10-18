"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LeaveApplicationSchema,
  type LeaveApplicationInput,
  type LeaveApplicationFormValues,
} from "@/lib/validations";
import { calculateLeaveDays, formatDateLong } from "@/lib/utils";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Calendar,
  User,
  Mail,
  Building2,
  FileText,
  Phone,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

interface Department { id: string; name: string; code?: string | null; }
interface LeaveType { id: string; name: string; allowHalfDay: boolean; }

interface SubmissionResult {
  referenceNumber: string;
  id: string;
  status: string;
  totalDays: number;
  submittedAt: string;
}

function FormField({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[#94a3b8] mt-1">{hint}</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function InputEl(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`form-input ${hasError ? "error" : ""} ${className || ""}`}
    />
  );
}

function SelectEl(props: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  const { hasError, className, ...rest } = props;
  return (
    <div className="relative">
      <select
        {...rest}
        className={`form-input appearance-none pr-8 ${hasError ? "error" : ""} ${className || ""}`}
      />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
    </div>
  );
}

function TextareaEl(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
) {
  const { hasError, className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`form-input resize-none ${hasError ? "error" : ""} ${className || ""}`}
    />
  );
}

export function LeaveApplicationFormClient() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmissionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [leaveDays, setLeaveDays] = useState(0);
  const [copied, setCopied] = useState(false);

  // Idempotency key — generated once per form session
  const idempotencyKey = useRef(
    `${Date.now()}-${Math.random().toString(36).substring(2)}`
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<LeaveApplicationFormValues, unknown, LeaveApplicationInput>({
    resolver: zodResolver(LeaveApplicationSchema),
    defaultValues: {
      isHalfDay: false,
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const isHalfDay = watch("isHalfDay");
  const selectedLeaveTypeId = watch("leaveTypeId");

  const selectedLeaveType = leaveTypes.find((lt) => lt.id === selectedLeaveTypeId);

  // Load departments and leave types
  useEffect(() => {
    async function load() {
      setLoadingDepts(true);
      try {
        const [dRes, ltRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/leave-types"),
        ]);
        const [dJson, ltJson] = await Promise.all([dRes.json(), ltRes.json()]);
        setDepartments(dJson.data ?? []);
        setLeaveTypes(ltJson.data ?? []);
      } catch {
        // Non-fatal; dropdowns will be empty
      } finally {
        setLoadingDepts(false);
      }
    }
    load();
  }, []);

  // Recalculate leave days
  const recalcDays = useCallback(() => {
    if (!startDate || !endDate) {
      setLeaveDays(0);
      return;
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
      setLeaveDays(0);
      return;
    }
    const days = calculateLeaveDays(s, e, { isHalfDay });
    setLeaveDays(days);
  }, [startDate, endDate, isHalfDay]);

  useEffect(() => {
    recalcDays();
  }, [recalcDays]);

  // If half-day is unchecked when leave type doesn't support it
  useEffect(() => {
    if (selectedLeaveType && !selectedLeaveType.allowHalfDay) {
      setValue("isHalfDay", false);
      setValue("halfDayPeriod", undefined);
    }
  }, [selectedLeaveTypeId, selectedLeaveType, setValue]);

  async function onSubmit(data: LeaveApplicationInput) {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/leave-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const json = await res.json();

      if (res.ok || res.status === 200) {
        setSubmitted({
          referenceNumber: json.referenceNumber,
          id: json.id,
          status: json.status,
          totalDays: json.totalDays,
          submittedAt: json.submittedAt ?? new Date().toISOString(),
        });
      } else {
        setServerError(
          json.error ||
            "An unexpected error occurred. Please try again."
        );
      }
    } catch {
      setServerError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRef() {
    if (!submitted) return;
    await navigator.clipboard.writeText(submitted.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // -------------------------------------------------------------------------
  // Success State
  // -------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-[#0f172a] mb-2">
          Application Submitted!
        </h2>
        <p className="text-[#64748b] text-sm mb-8">
          Your leave application has been received and is pending review.
        </p>

        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 mb-6 text-left">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-4">
            Submission Details
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748b]">Reference Number</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#0f172a] font-mono">
                  {submitted.referenceNumber}
                </span>
                <button
                  onClick={copyRef}
                  className="text-[#2563eb] hover:text-[#1d4ed8] p-1 rounded transition-colors"
                  title="Copy reference number"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748b]">Status</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                Pending Review
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748b]">Total Days</span>
              <span className="text-sm font-semibold text-[#0f172a]">
                {submitted.totalDays} day{submitted.totalDays !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800 text-left">
          <strong>Next steps:</strong> You will receive a confirmation email at your registered
          address. Keep your reference number <strong>{submitted.referenceNumber}</strong> to
          track your application status.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/leave-status"
            className="inline-flex items-center justify-center gap-2 bg-[#2563eb] text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
          >
            Track Application Status
          </Link>
          <button
            onClick={() => {
              setSubmitted(null);
              setServerError(null);
              idempotencyKey.current = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
            }}
            className="inline-flex items-center justify-center gap-2 border border-[#e2e8f0] text-[#374151] font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[#f8fafc] transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Server Error */}
      {serverError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Leave days preview */}
      {leaveDays > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
          <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>{leaveDays} day{leaveDays !== 1 ? "s" : ""}</strong> of leave calculated
            {isHalfDay && " (half-day)"}
          </p>
        </div>
      )}

      {/* ================================================================
          Section 1: Employee Details
      ================================================================ */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm mb-5">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <User className="w-4 h-4 text-[#64748b]" />
          <h2 className="font-semibold text-[#0f172a] text-sm">Employee Information</h2>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <FormField label="Full Name" required error={errors.employeeName?.message}>
              <InputEl
                {...register("employeeName")}
                placeholder="Your full name as per records"
                hasError={!!errors.employeeName}
              />
            </FormField>
          </div>

          <FormField label="Work Email" required error={errors.employeeEmail?.message}>
            <InputEl
              {...register("employeeEmail")}
              type="email"
              placeholder="your.name@vrdexports.com"
              hasError={!!errors.employeeEmail}
            />
          </FormField>

          <FormField
            label="Employee ID"
            error={errors.employeeIdNumber?.message}
            hint="Optional — as assigned by HR"
          >
            <InputEl
              {...register("employeeIdNumber")}
              placeholder="e.g., VRD-001"
              hasError={!!errors.employeeIdNumber}
            />
          </FormField>

          <FormField label="Department" required error={errors.departmentId?.message}>
            <SelectEl
              {...register("departmentId")}
              hasError={!!errors.departmentId}
              disabled={loadingDepts}
            >
              <option value="">
                {loadingDepts ? "Loading departments..." : "Select department"}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.code ? ` (${d.code})` : ""}
                </option>
              ))}
            </SelectEl>
          </FormField>

          <FormField label="Leave Type" required error={errors.leaveTypeId?.message}>
            <SelectEl
              {...register("leaveTypeId")}
              hasError={!!errors.leaveTypeId}
              disabled={loadingDepts}
            >
              <option value="">
                {loadingDepts ? "Loading leave types..." : "Select leave type"}
              </option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </SelectEl>
          </FormField>
        </div>
      </div>

      {/* ================================================================
          Section 2: Leave Dates
      ================================================================ */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm mb-5">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <Calendar className="w-4 h-4 text-[#64748b]" />
          <h2 className="font-semibold text-[#0f172a] text-sm">Leave Dates</h2>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <FormField label="Start Date" required error={errors.startDate?.message}>
            <InputEl
              {...register("startDate")}
              type="date"
              hasError={!!errors.startDate}
            />
          </FormField>

          <FormField label="End Date" required error={errors.endDate?.message}>
            <InputEl
              {...register("endDate")}
              type="date"
              hasError={!!errors.endDate}
            />
          </FormField>

          {selectedLeaveType?.allowHalfDay && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  {...register("isHalfDay")}
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#cbd5e1] text-[#2563eb] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-[#374151]">Half-day leave</span>
                  <p className="text-xs text-[#64748b]">Apply for half a day on the start date</p>
                </div>
              </label>
            </div>
          )}

          {isHalfDay && selectedLeaveType?.allowHalfDay && (
            <div className="sm:col-span-2">
              <FormField label="Half-day Period" required error={errors.halfDayPeriod?.message}>
                <SelectEl {...register("halfDayPeriod")} hasError={!!errors.halfDayPeriod}>
                  <option value="">Select period</option>
                  <option value="MORNING">Morning (First half)</option>
                  <option value="AFTERNOON">Afternoon (Second half)</option>
                </SelectEl>
              </FormField>
            </div>
          )}

          <div className="sm:col-span-2">
            <FormField label="Reason for Leave" required error={errors.reason?.message}>
              <TextareaEl
                {...register("reason")}
                rows={4}
                placeholder="Briefly explain the reason for your leave request (minimum 10 characters)"
                hasError={!!errors.reason}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* ================================================================
          Section 3: Manager & Handover
      ================================================================ */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm mb-5">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <Building2 className="w-4 h-4 text-[#64748b]" />
          <h2 className="font-semibold text-[#0f172a] text-sm">Manager & Handover</h2>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <FormField
            label="Reporting Manager Name"
            required
            error={errors.reportingManagerName?.message}
          >
            <InputEl
              {...register("reportingManagerName")}
              placeholder="Full name of your reporting manager"
              hasError={!!errors.reportingManagerName}
            />
          </FormField>

          <FormField
            label="Reporting Manager Email"
            required
            error={errors.reportingManagerEmail?.message}
          >
            <InputEl
              {...register("reportingManagerEmail")}
              type="email"
              placeholder="manager@vrdexports.com"
              hasError={!!errors.reportingManagerEmail}
            />
          </FormField>

          <FormField
            label="Handover Person Name"
            error={errors.handoverPersonName?.message}
            hint="Person handling your responsibilities during leave"
          >
            <InputEl
              {...register("handoverPersonName")}
              placeholder="Colleague's full name (optional)"
              hasError={!!errors.handoverPersonName}
            />
          </FormField>

          <FormField
            label="Handover Person Email"
            error={errors.handoverPersonEmail?.message}
          >
            <InputEl
              {...register("handoverPersonEmail")}
              type="email"
              placeholder="colleague@vrdexports.com (optional)"
              hasError={!!errors.handoverPersonEmail}
            />
          </FormField>
        </div>
      </div>

      {/* ================================================================
          Section 4: Additional Info
      ================================================================ */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm mb-6">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <FileText className="w-4 h-4 text-[#64748b]" />
          <h2 className="font-semibold text-[#0f172a] text-sm">Additional Information</h2>
          <span className="text-xs text-[#94a3b8] ml-1">(Optional)</span>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <FormField
            label="Contact During Leave"
            error={errors.contactDuringLeave?.message}
            hint="Phone number or alternate contact method"
          >
            <InputEl
              {...register("contactDuringLeave")}
              placeholder="e.g., +91 98765 43210"
              hasError={!!errors.contactDuringLeave}
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField
              label="Additional Notes"
              error={errors.additionalNotes?.message}
            >
              <TextareaEl
                {...register("additionalNotes")}
                rows={3}
                placeholder="Any additional information for HR or your manager"
                hasError={!!errors.additionalNotes}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <p className="text-sm font-medium text-[#374151]">Ready to submit?</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              All required fields must be filled. You will receive a confirmation email.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {leaveDays > 0 && (
              <div className="text-right">
                <p className="text-xs text-[#64748b]">Leave days</p>
                <p className="text-lg font-bold text-[#0f172a]">{leaveDays}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-[#2563eb] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm min-w-[160px] justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
