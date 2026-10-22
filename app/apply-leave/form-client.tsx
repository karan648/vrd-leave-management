"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LeaveApplicationSchema,
  type LeaveApplicationInput,
  type LeaveApplicationFormValues,
} from "@/lib/validations";
import { calculateLeaveDays } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
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
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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

  const idempotencyKey = useRef(
    `${Date.now()}-${Math.random().toString(36).substring(2)}`
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
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
        // Non-fatal
      } finally {
        setLoadingDepts(false);
      }
    }
    load();
  }, []);

  const recalcDays = useCallback(() => {
    if (!startDate || !endDate) {
      setLeaveDays(0);
      return;
    }
    const days = calculateLeaveDays(new Date(startDate), new Date(endDate), {
      isHalfDay: !!isHalfDay,
    });
    setLeaveDays(days);
  }, [startDate, endDate, isHalfDay]);

  useEffect(() => {
    recalcDays();
  }, [recalcDays]);

  async function onSubmit(data: LeaveApplicationInput) {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/leave-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify(data),
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

  // Success State
  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              Application Submitted
            </h2>
            <p className="text-sm text-gray-500">
              Your leave request is under review.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Reference Number</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {submitted.referenceNumber}
              </span>
              <button
                onClick={copyRef}
                className="text-gray-400 hover:text-gray-700 p-1 transition-colors"
                title="Copy reference number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Pending Review
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Duration</span>
            <span className="text-sm font-medium text-gray-900">
              {submitted.totalDays} day{submitted.totalDays !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          A confirmation email has been sent to your registered address. You can check the status anytime using your reference number.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/leave-status"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Track Status
          </Link>
          <button
            onClick={() => {
              setSubmitted(null);
              setServerError(null);
              idempotencyKey.current = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
            }}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  // Form
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Section 1: Employee */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          Employee Details
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Full Name" required error={errors.employeeName?.message}>
              <InputEl
                {...register("employeeName")}
                placeholder="Full name as per official records"
                hasError={!!errors.employeeName}
              />
            </FormField>
          </div>

          <FormField label="Work Email" required error={errors.employeeEmail?.message}>
            <InputEl
              {...register("employeeEmail")}
              type="email"
              placeholder="you@vrdexports.com"
              hasError={!!errors.employeeEmail}
            />
          </FormField>

          <FormField
            label="Employee ID"
            error={errors.employeeIdNumber?.message}
            hint="Optional"
          >
            <InputEl
              {...register("employeeIdNumber")}
              placeholder="e.g. VRD-001"
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
                {loadingDepts ? "Loading..." : "Select department"}
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
                {loadingDepts ? "Loading..." : "Select leave type"}
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

      {/* Section 2: Dates & Reason */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">
            Dates & Reason
          </h2>
          {leaveDays > 0 && (
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">
              {leaveDays} day{leaveDays !== 1 ? "s" : ""}{isHalfDay ? " (half-day)" : ""}
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
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
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  {...register("isHalfDay")}
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm text-gray-700">Apply for half-day</span>
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
                rows={3}
                placeholder="State the reason for your leave"
                hasError={!!errors.reason}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Section 3: Manager & Handover */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          Manager & Handover
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            label="Reporting Manager Name"
            required
            error={errors.reportingManagerName?.message}
          >
            <InputEl
              {...register("reportingManagerName")}
              placeholder="Manager full name"
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
            hint="Optional"
          >
            <InputEl
              {...register("handoverPersonName")}
              placeholder="Colleague handling tasks"
              hasError={!!errors.handoverPersonName}
            />
          </FormField>

          <FormField
            label="Handover Person Email"
            error={errors.handoverPersonEmail?.message}
            hint="Optional"
          >
            <InputEl
              {...register("handoverPersonEmail")}
              type="email"
              placeholder="colleague@vrdexports.com"
              hasError={!!errors.handoverPersonEmail}
            />
          </FormField>
        </div>
      </div>

      {/* Section 4: Contact & Notes */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          Additional Details <span className="text-xs font-normal text-gray-400">(Optional)</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField
              label="Contact During Leave"
              error={errors.contactDuringLeave?.message}
              hint="Phone number or alternate email"
            >
              <InputEl
                {...register("contactDuringLeave")}
                placeholder="e.g. +91 98765 43210"
                hasError={!!errors.contactDuringLeave}
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField
              label="Additional Notes"
              error={errors.additionalNotes?.message}
            >
              <TextareaEl
                {...register("additionalNotes")}
                rows={2}
                placeholder="Any special remarks or instructions"
                hasError={!!errors.additionalNotes}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Submission CTA */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">
          Required fields are marked with <span className="text-red-500">*</span>
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </div>
    </form>
  );
}
