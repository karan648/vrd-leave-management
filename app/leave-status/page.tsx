import type { Metadata } from "next";
import { LeaveStatusClient } from "./status-client";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check Leave Status — VRD Exports",
  description: "Track the status of your leave application using your reference number and email.",
};

export default function LeaveStatusPage() {
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
            <span className="text-sm text-gray-500">Track Status</span>
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
            Track Application Status
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your reference number and registered email to check the status of your leave application.
          </p>
        </div>
        <LeaveStatusClient />
      </div>
    </div>
  );
}
