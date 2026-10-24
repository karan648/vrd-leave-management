-- Add the approving admin account and a username snapshot to each leave application.
ALTER TABLE "leave_applications"
ADD COLUMN "approvedById" TEXT,
ADD COLUMN "approvedByUsername" TEXT;

CREATE INDEX "leave_applications_approvedById_idx"
ON "leave_applications"("approvedById");

ALTER TABLE "leave_applications"
ADD CONSTRAINT "leave_applications_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "admin_users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
