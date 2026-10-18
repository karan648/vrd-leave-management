import type { Metadata } from "next";
import { LeaveStatusClient } from "./status-client";

export const metadata: Metadata = {
  title: "Check Leave Status — VRD Exports",
  description: "Track the status of your leave application using your reference number and email.",
};

export default function LeaveStatusPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#1e2840] text-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#2563eb] rounded flex items-center justify-center">
              <span className="text-[10px] font-bold">VRD</span>
            </div>
            <span className="text-sm font-semibold">VRD Exports — Leave Management</span>
          </div>
          <a href="/" className="text-xs text-[#94a3b8] hover:text-white transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f172a]">Track Application Status</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Enter your reference number and registered email to check the current status of your
            leave application.
          </p>
        </div>
        <LeaveStatusClient />
      </div>
    </div>
  );
}
