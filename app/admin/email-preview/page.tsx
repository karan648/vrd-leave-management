import { EmailPreviewClient } from "./email-preview-client";

export const metadata = {
  title: "Email Templates & Notification Engine | VRD Exports",
  description: "Preview all automated email templates and check sender deliverability",
};

export default function EmailPreviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Email Templates & Deliverability
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Preview all 6 automated email notifications, verify DNS records for @vrdexports.in, and test live inboxes.
          </p>
        </div>
      </div>

      <EmailPreviewClient />
    </div>
  );
}
