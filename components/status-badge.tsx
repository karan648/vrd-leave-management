"use client";

import { cn } from "@/lib/utils";

type Status = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "badge-pending",
  },
  APPROVED: {
    label: "Approved",
    className: "badge-approved",
  },
  DECLINED: {
    label: "Declined",
    className: "badge-declined",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "badge-cancelled",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
