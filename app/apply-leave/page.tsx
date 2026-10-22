import type { Metadata } from "next";
import { LeaveApplicationFormClient } from "./form-client";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apply for Leave — VRD Exports",
  description: "Submit a leave application.",
};

export default function ApplyLeavePage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              VRD Exports
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-sm text-gray-500">Leave Application</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Home
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Apply for Leave
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete the form below. You&apos;ll receive a reference number to track your application.
          </p>
        </div>
        <LeaveApplicationFormClient />
      </div>
    </div>
  );
}
