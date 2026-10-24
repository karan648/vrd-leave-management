// =============================================================================
// Zod Validation Schemas — Leave Application
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Leave Application Form Schema
// ---------------------------------------------------------------------------

export const LeaveApplicationSchema = z
  .object({
    employeeName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name too long")
      .trim(),

    employeeEmail: z
      .string()
      .email("Invalid email address")
      .max(255, "Email too long")
      .trim()
      .toLowerCase(),

    employeeIdNumber: z
      .string()
      .max(50, "Employee ID too long")
      .trim()
      .optional()
      .or(z.literal("")),

    departmentId: z
      .string()
      .min(1, "Please select a department")
      .trim(),

    leaveTypeId: z
      .string()
      .min(1, "Please select a leave type")
      .trim(),

    startDate: z
      .string()
      .min(1, "Start date is required")
      .refine((v) => !isNaN(Date.parse(v)), "Invalid start date"),

    endDate: z
      .string()
      .min(1, "End date is required")
      .refine((v) => !isNaN(Date.parse(v)), "Invalid end date"),

    isHalfDay: z.boolean().default(false),

    halfDayPeriod: z
      .enum(["MORNING", "AFTERNOON"])
      .optional(),

    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason is too long (max 1000 characters)")
      .trim(),

    reportingManagerName: z
      .string()
      .min(2, "Manager name must be at least 2 characters")
      .max(100, "Manager name too long")
      .trim(),

    reportingManagerEmail: z
      .string()
      .email("Invalid manager email address")
      .max(255, "Email too long")
      .trim()
      .toLowerCase(),

    handoverPersonName: z
      .string()
      .max(100, "Name too long")
      .trim()
      .optional()
      .or(z.literal("")),

    handoverPersonEmail: z
      .string()
      .max(255, "Email too long")
      .trim()
      .toLowerCase()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || z.string().email().safeParse(v).success,
        "Invalid handover person email"
      ),

    contactDuringLeave: z
      .string()
      .max(200, "Contact details too long")
      .trim()
      .optional()
      .or(z.literal("")),

    additionalNotes: z
      .string()
      .max(500, "Notes too long")
      .trim()
      .optional()
      .or(z.literal("")),

    idempotencyKey: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      // Prevent applications dated in the past (beyond 1 day grace)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return start >= yesterday;
    },
    {
      message: "Start date cannot be in the past",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      if (data.isHalfDay && !data.halfDayPeriod) {
        return false;
      }
      return true;
    },
    {
      message: "Please select half-day period (Morning or Afternoon)",
      path: ["halfDayPeriod"],
    }
  );

export type LeaveApplicationInput = z.infer<typeof LeaveApplicationSchema>;
export type LeaveApplicationFormValues = z.input<typeof LeaveApplicationSchema>;

// ---------------------------------------------------------------------------
// Status Lookup Schema
// ---------------------------------------------------------------------------

export const StatusLookupSchema = z.object({
  referenceNumber: z
    .string()
    .min(1, "Reference number is required")
    .max(50, "Invalid reference number")
    .trim()
    .toUpperCase(),

  employeeEmail: z
    .string()
    .email("Invalid email address")
    .max(255)
    .trim()
    .toLowerCase(),
});

export type StatusLookupInput = z.infer<typeof StatusLookupSchema>;

// ---------------------------------------------------------------------------
// Approval Action Schema
// ---------------------------------------------------------------------------

export const ApprovalActionSchema = z.object({
  applicationId: z.string().min(1, "Application ID required"),
  action: z.enum(["APPROVED", "DECLINED", "CANCELLED"]),
  remarks: z
    .string()
    .max(1000, "Remarks too long")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type ApprovalActionInput = z.infer<typeof ApprovalActionSchema>;

// ---------------------------------------------------------------------------
// Department Schema
// ---------------------------------------------------------------------------

export const DepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),

  code: z
    .string()
    .max(20, "Code too long")
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .max(500, "Description too long")
    .trim()
    .optional()
    .or(z.literal("")),

  isActive: z.boolean().default(true),
});

export type DepartmentInput = z.infer<typeof DepartmentSchema>;

// ---------------------------------------------------------------------------
// Leave Type Schema
// ---------------------------------------------------------------------------

export const LeaveTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Leave type name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),

  description: z
    .string()
    .max(500, "Description too long")
    .trim()
    .optional()
    .or(z.literal("")),

  isActive: z.boolean().default(true),
  isPaid: z.boolean().default(true),
  allowHalfDay: z.boolean().default(false),
  trackBalance: z.boolean().default(false),

  annualAllowance: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(365, "Cannot exceed 365 days")
    .optional()
    .nullable(),

  eligibilityRules: z.string().max(1000).optional().or(z.literal("")),
});

export type LeaveTypeInput = z.infer<typeof LeaveTypeSchema>;

// ---------------------------------------------------------------------------
// Employee Schema
// ---------------------------------------------------------------------------

export const EmployeeSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID too long")
    .trim(),

  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email too long")
    .trim()
    .toLowerCase(),

  departmentId: z.string().optional().or(z.literal("")),

  managerName: z
    .string()
    .max(100, "Name too long")
    .trim()
    .optional()
    .or(z.literal("")),

  managerEmail: z
    .string()
    .max(255, "Email too long")
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Invalid manager email"
    ),

  isActive: z.boolean().default(true),
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;

// ---------------------------------------------------------------------------
// Admin User Schema
// ---------------------------------------------------------------------------

export const AdminUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email too long")
    .trim()
    .toLowerCase(),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long")
    .regex(/^[a-z0-9_.-]+$/, "Username can only contain lowercase letters, numbers, underscore, dot, or hyphen")
    .trim()
    .optional()
    .or(z.literal("")),

  role: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "HR_VIEWER"]).default("HR_VIEWER"),

  departmentId: z.string().optional().or(z.literal("")),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),

  isActive: z.boolean().default(true),
});

export type AdminUserInput = z.infer<typeof AdminUserSchema>;

// ---------------------------------------------------------------------------
// Company Setting Schema
// ---------------------------------------------------------------------------

export const CompanySettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(10000),
  description: z.string().max(500).optional(),
});

export type CompanySettingInput = z.infer<typeof CompanySettingSchema>;

// ---------------------------------------------------------------------------
// List Query Params
// ---------------------------------------------------------------------------

export const ApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).trim().optional(),
  status: z.enum(["PENDING", "APPROVED", "DECLINED", "CANCELLED", "ALL"]).optional(),
  departmentId: z.string().optional(),
  leaveTypeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["submittedAt", "startDate", "endDate", "status"]).default("submittedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type ApplicationsQuery = z.infer<typeof ApplicationsQuerySchema>;
