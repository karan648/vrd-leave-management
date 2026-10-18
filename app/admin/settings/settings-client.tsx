"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Building2,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";

export function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    company_name: "VRD Exports",
    hr_notification_email: "hr@vrdexports.com",
    admin_notification_email: "admin@vrdexports.com",
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update company settings");
      }

      setSuccessMessage("Company settings have been updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System & Leave Settings</h1>
            <p className="text-sm text-slate-500">
              Configure global company policies, automated email recipients, and approval rules
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          title="Refresh"
          className="p-2 self-start sm:self-auto text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Organization Profile</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Official Company Name
            </label>
            <input
              type="text"
              required
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="w-full sm:w-96 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Appears on email notifications, employee application headers, and confirmation slips.
            </p>
          </div>
        </div>

        {/* Email Notification Channels */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Email Notification Routing</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                HR Department Notification Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={settings.hr_notification_email}
                  onChange={(e) =>
                    setSettings({ ...settings, hr_notification_email: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Receives automated alerts whenever an employee applies for leave.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Admin Alert / Escalation Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={settings.admin_notification_email}
                  onChange={(e) =>
                    setSettings({ ...settings, admin_notification_email: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Receives escalation notices and system health summaries.
              </p>
            </div>
          </div>
        </div>

        {/* Global Policy Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Leave Calculation & Policy Rules</h2>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Count Weekends in Leave Duration
                </p>
                <p className="text-xs text-slate-500">
                  When enabled, Saturdays and Sundays falling within the leave range count towards total leave days.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.count_weekends}
                onChange={(e) => setSettings({ ...settings, count_weekends: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Allow Half-Day Applications
                </p>
                <p className="text-xs text-slate-500">
                  Enables the half-day selection toggle for eligible leave categories on the public form.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_half_day}
                onChange={(e) => setSettings({ ...settings, allow_half_day: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Require Manager Review Before Final Sign-Off
                </p>
                <p className="text-xs text-slate-500">
                  Notifies reporting manager first and tags applications with departmental review status.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.require_manager_approval_first}
                onChange={(e) =>
                  setSettings({ ...settings, require_manager_approval_first: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving Changes..." : "Save Company Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
