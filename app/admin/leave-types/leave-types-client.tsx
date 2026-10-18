"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Edit2,
  Check,
  CheckCircle,
} from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  annualAllowance: number | null;
  isPaid: boolean;
  allowHalfDay: boolean;
  trackBalance: boolean;
  isActive: boolean;
  createdAt: string;
}

export function LeaveTypesClient() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    annualAllowance: "12",
    isPaid: true,
    allowHalfDay: true,
    trackBalance: true,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchLeaveTypes() {
    try {
      setLoading(true);
      const res = await fetch("/api/leave-types?includeInactive=true");
      const data = await res.json();
      if (res.ok && data.data) {
        setLeaveTypes(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  function handleOpenCreate() {
    setEditingType(null);
    setFormData({
      name: "",
      description: "",
      annualAllowance: "12",
      isPaid: true,
      allowHalfDay: true,
      trackBalance: true,
      isActive: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(lt: LeaveType) {
    setEditingType(lt);
    setFormData({
      name: lt.name,
      description: lt.description || "",
      annualAllowance: lt.annualAllowance !== null ? String(lt.annualAllowance) : "",
      isPaid: lt.isPaid,
      allowHalfDay: lt.allowHalfDay,
      trackBalance: lt.trackBalance,
      isActive: lt.isActive,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const url = editingType ? `/api/leave-types/${editingType.id}` : "/api/leave-types";
    const method = editingType ? "PATCH" : "POST";

    const allowance = formData.annualAllowance.trim() === "" ? null : Number(formData.annualAllowance);

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          annualAllowance: allowance,
          isPaid: formData.isPaid,
          allowHalfDay: formData.allowHalfDay,
          trackBalance: formData.trackBalance,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save leave category");
      }

      setIsModalOpen(false);
      fetchLeaveTypes();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(lt: LeaveType) {
    try {
      const res = await fetch(`/api/leave-types/${lt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !lt.isActive }),
      });
      if (res.ok) {
        setLeaveTypes(
          leaveTypes.map((t) => (t.id === lt.id ? { ...t, isActive: !t.isActive } : t))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = leaveTypes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leave Categories & Policies</h1>
            <p className="text-sm text-slate-500">
              Configure employee leave quotas, paid leave policies, and half-day permissions
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Leave Type
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leave types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={fetchLeaveTypes}
          title="Refresh"
          className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid of Leave Types */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          Loading leave policies...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          No leave categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((lt) => (
            <div
              key={lt.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{lt.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                      lt.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        lt.isActive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {lt.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                  {lt.description || "No description provided."}
                </p>

                {/* Policy badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`px-2.5 py-1 rounded-md font-medium border ${
                      lt.isPaid
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {lt.isPaid ? "Paid Leave" : "Unpaid Leave"}
                  </span>

                  <span className="px-2.5 py-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    {lt.annualAllowance !== null ? `${lt.annualAllowance} days/yr` : "No fixed cap"}
                  </span>

                  {lt.allowHalfDay && (
                    <span className="px-2.5 py-1 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Half-Day Allowed
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenEdit(lt)}
                  title="Edit Policy"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleStatus(lt)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors border ${
                    lt.isActive
                      ? "text-slate-500 border-slate-200 hover:bg-slate-100"
                      : "text-emerald-700 border-emerald-200 bg-emerald-50"
                  }`}
                >
                  {lt.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingType ? "Edit Leave Category" : "Add Leave Category"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Leave Type Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bereavement Leave"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Annual Allowance (days, leave blank if unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.annualAllowance}
                  onChange={(e) => setFormData({ ...formData, annualAllowance: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Policy rules and eligibility criteria..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Is Paid Leave (employee receives full wage)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.allowHalfDay}
                    onChange={(e) => setFormData({ ...formData, allowHalfDay: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow Half-Day Applications</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.trackBalance}
                    onChange={(e) => setFormData({ ...formData, trackBalance: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Track Annual Balance / Quotas</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
                >
                  {isSubmitting ? "Saving..." : editingType ? "Update Policy" : "Save Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
