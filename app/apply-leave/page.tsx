import type { Metadata } from "next";
import { LeaveApplicationFormClient } from "./form-client";

export const metadata: Metadata = {
  title: "Apply for Leave — VRD Exports",
  description: "Submit a leave application. Fill in your details, leave dates, and reason.",
};

export default function ApplyLeavePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <div className="bg-[#1e2840] text-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f172a]">Apply for Leave</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Fill in all required fields. You will receive a reference number upon submission.
          </p>
        </div>
        <LeaveApplicationFormClient />
      </div>
    </div>
  );
}
