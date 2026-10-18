-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'HR_VIEWER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_CONFIRMATION', 'MANAGER_NOTIFICATION', 'HR_NOTIFICATION', 'ADMIN_NOTIFICATION', 'HANDOVER_NOTIFICATION', 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION', 'STATUS_UPDATE_MANAGER', 'STATUS_UPDATE_HR');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "annualAllowance" INTEGER,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "allowHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "trackBalance" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departmentId" TEXT,
    "managerName" TEXT,
    "managerEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_applications" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeEmail" TEXT NOT NULL,
    "employeeIdNumber" TEXT,
    "departmentId" TEXT,
    "leaveTypeId" TEXT,
    "departmentSnapshot" TEXT NOT NULL,
    "leaveTypeSnapshot" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "halfDayPeriod" TEXT,
    "reason" TEXT NOT NULL,
    "reportingManagerName" TEXT NOT NULL,
    "reportingManagerEmail" TEXT NOT NULL,
    "handoverPersonName" TEXT,
    "handoverPersonEmail" TEXT,
    "contactDuringLeave" TEXT,
    "additionalNotes" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT,

    CONSTRAINT "leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_history" (
    "id" TEXT NOT NULL,
    "leaveApplicationId" TEXT NOT NULL,
    "fromStatus" "LeaveStatus",
    "toStatus" "LeaveStatus" NOT NULL,
    "remarks" TEXT,
    "performedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "performedByName" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'HR_VIEWER',
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authProviderSub" TEXT,
    "authProviderType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "leaveApplicationId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "resendMessageId" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_isActive_idx" ON "departments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE INDEX "leave_types_isActive_idx" ON "leave_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_employeeId_idx" ON "employees"("employeeId");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_isActive_idx" ON "employees"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "leave_applications_referenceNumber_key" ON "leave_applications"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "leave_applications_idempotencyKey_key" ON "leave_applications"("idempotencyKey");

-- CreateIndex
CREATE INDEX "leave_applications_referenceNumber_idx" ON "leave_applications"("referenceNumber");

-- CreateIndex
CREATE INDEX "leave_applications_status_idx" ON "leave_applications"("status");

-- CreateIndex
CREATE INDEX "leave_applications_employeeEmail_idx" ON "leave_applications"("employeeEmail");

-- CreateIndex
CREATE INDEX "leave_applications_employeeIdNumber_idx" ON "leave_applications"("employeeIdNumber");

-- CreateIndex
CREATE INDEX "leave_applications_departmentId_idx" ON "leave_applications"("departmentId");

-- CreateIndex
CREATE INDEX "leave_applications_leaveTypeId_idx" ON "leave_applications"("leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_applications_submittedAt_idx" ON "leave_applications"("submittedAt");

-- CreateIndex
CREATE INDEX "leave_applications_startDate_endDate_idx" ON "leave_applications"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "approval_history_leaveApplicationId_idx" ON "approval_history"("leaveApplicationId");

-- CreateIndex
CREATE INDEX "approval_history_performedAt_idx" ON "approval_history"("performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_role_idx" ON "admin_users"("role");

-- CreateIndex
CREATE INDEX "admin_users_isActive_idx" ON "admin_users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_key_key" ON "company_settings"("key");

-- CreateIndex
CREATE INDEX "holidays_date_idx" ON "holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_idempotencyKey_key" ON "notification_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notification_logs_leaveApplicationId_idx" ON "notification_logs"("leaveApplicationId");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "notification_logs_recipientEmail_idx" ON "notification_logs"("recipientEmail");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_leaveApplicationId_fkey" FOREIGN KEY ("leaveApplicationId") REFERENCES "leave_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_leaveApplicationId_fkey" FOREIGN KEY ("leaveApplicationId") REFERENCES "leave_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
