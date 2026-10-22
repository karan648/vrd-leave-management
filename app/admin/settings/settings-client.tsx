"use client";

import { useState, useEffect } from "react";
import {
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    company_name: "VRD Exports",
    hr_notification_email: "hr@vrdexports.in",
    admin_notification_email: "admin@vrdexports.in",
    ea_notification_email: "ea@vrdexports.in",
    owner_notification_email: "owner@vrdexports.in",
    approver_notification_emails: "",
    additional_notification_emails: "",
    count_weekends: false,
    allow_half_day: true,
    require_manager_approval_first: true,
  });

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok && data.data) {
        setSettings((prev) => ({
          ...prev,
          company_name: (data.data.company_name as string) ?? prev.company_name,
          hr_notification_email:
            (data.data.hr_notification_email as string) ?? prev.hr_notification_email,
          admin_notification_email:
            (data.data.admin_notification_email as string) ??
            (data.data.leave_notification_email as string) ??
            prev.admin_notification_email,
          ea_notification_email:
            (data.data.ea_notification_email as string) ?? prev.ea_notification_email,
          owner_notification_email:
            (data.data.owner_notification_email as string) ?? prev.owner_notification_email,
          approver_notification_emails:
            (data.data.approver_notification_emails as string) ??
            prev.approver_notification_emails,
          additional_notification_emails:
            (data.data.additional_notification_emails as string) ??
            prev.additional_notification_emails,
          count_weekends: (data.data.count_weekends as boolean) ?? prev.count_weekends,
          allow_half_day: (data.data.allow_half_day as boolean) ?? prev.allow_half_day,
          require_manager_approval_first:
            (data.data.require_manager_approval_first as boolean) ??
            prev.require_manager_approval_first,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getApproverList(): string[] {
    if (!settings.approver_notification_emails) return [];
    return settings.approver_notification_emails
      .split(/[,;\n\r]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  }

  function handleFill10Approvers() {
    const default10 = [
      "director@vrdexports.in",
      "operations.head@vrdexports.in",
      "hr.head@vrdexports.in",
      "hr.executive@vrdexports.in",
      "ea@vrdexports.in",
      "merch.manager@vrdexports.in",
      "prod.manager@vrdexports.in",
      "qa.manager@vrdexports.in",
      "finance.head@vrdexports.in",
      "admin@vrdexports.in",
    ].join(",\n");
    setSettings((prev) => ({ ...prev, approver_notification_emails: default10 }));
  }

  function removeApprover(emailToRemove: string) {
    const current = getApproverList().filter((e) => e !== emailToRemove);
    setSettings((prev) => ({
      ...prev,
      approver_notification_emails: current.join(",\n"),
    }));
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update settings");
      }

      setSuccessMessage("Settings saved successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            System configuration and notification routing
          </p>
        </div>

        <button
          onClick={fetchSettings}
          title="Refresh"
          className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Organization</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="form-input max-w-sm"
            />
          </div>
        </div>

        {/* Email Notification Channels */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Notification Routing</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Email addresses for automated status updates and leave reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                HR Department
              </label>
              <input
                type="text"
                required
                value={settings.hr_notification_email}
                onChange={(e) =>
                  setSettings({ ...settings, hr_notification_email: e.target.value })
                }
                className="form-input text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">HR reviews and approval sign-off.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Executive Assistant (EA)
              </label>
              <input
                type="text"
                value={settings.ea_notification_email}
                onChange={(e) =>
                  setSettings({ ...settings, ea_notification_email: e.target.value })
                }
                placeholder="ea@vrdexports.in"
                className="form-input text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">Executive calendar routing.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company Owners / Directors
              </label>
              <input
                type="text"
                value={settings.owner_notification_email}
                onChange={(e) =>
                  setSettings({ ...settings, owner_notification_email: e.target.value })
                }
                placeholder="owner@vrdexports.in"
                className="form-input text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">Top management visibility.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional CC Inboxes
              </label>
              <input
                type="text"
                value={settings.additional_notification_emails}
                onChange={(e) =>
                  setSettings({ ...settings, additional_notification_emails: e.target.value })
                }
                placeholder="your.email@vrdexports.in"
                className="form-input text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">Copied on submissions and decisions.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin Escalation Email
              </label>
              <input
                type="text"
                required
                value={settings.admin_notification_email}
                onChange={(e) =>
                  setSettings({ ...settings, admin_notification_email: e.target.value })
                }
                className="form-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Approver Inboxes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                Designated Approver Inboxes ({getApproverList().length})
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Every listed address receives instant review links for each leave request.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFill10Approvers}
              className="text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors"
            >
              Pre-fill 10 Approvers
            </button>
          </div>

          <div>
            <textarea
              rows={4}
              value={settings.approver_notification_emails}
              onChange={(e) =>
                setSettings({ ...settings, approver_notification_emails: e.target.value })
              }
              placeholder="director@vrdexports.in, hr.head@vrdexports.in..."
              className="form-input font-mono text-xs"
            />
          </div>

          {getApproverList().length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {getApproverList().map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  <span className="font-mono text-[11px]">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeApprover(email)}
                    className="text-gray-400 hover:text-red-500 font-bold text-xs"
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Global Policy Rules */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Policy Rules</h2>

          <div className="space-y-3 text-sm divide-y divide-gray-100">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-xs">Count Weekends in Leave Duration</p>
                <p className="text-xs text-gray-400">
                  Include Saturdays and Sundays in calculated days.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.count_weekends}
                onChange={(e) => setSettings({ ...settings, count_weekends: e.target.checked })}
                className="rounded text-gray-900 focus:ring-gray-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-xs">Allow Half-Day Applications</p>
                <p className="text-xs text-gray-400">
                  Enable half-day toggle on public application form.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_half_day}
                onChange={(e) => setSettings({ ...settings, allow_half_day: e.target.checked })}
                className="rounded text-gray-900 focus:ring-gray-900"
              />
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-xs">Require Manager Review</p>
                <p className="text-xs text-gray-400">
                  Notify reporting manager first for departmental review.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.require_manager_approval_first}
                onChange={(e) =>
                  setSettings({ ...settings, require_manager_approval_first: e.target.checked })
                }
                className="rounded text-gray-900 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
