"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Edit2,
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

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          annualAllowance: formData.annualAllowance ? parseInt(formData.annualAllowance, 10) : null,
          isPaid: formData.isPaid,
          allowHalfDay: formData.allowHalfDay,
          trackBalance: formData.trackBalance,
          isActive: formData.isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save leave category");
      }

      setIsModalOpen(false);
      await fetchLeaveTypes();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
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
        setLeaveTypes((prev) =>
          prev.map((t) => (t.id === lt.id ? { ...t, isActive: !t.isActive } : t))
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Leave Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quotas, policy rules, and permissions
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Leave Type
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leave types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
          />
        </div>

        <button
          onClick={fetchLeaveTypes}
          title="Refresh"
          className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
          Loading leave policies…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          No leave categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lt) => (
            <div
              key={lt.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between hover:border-gray-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{lt.name}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      lt.isActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {lt.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-3">
                  {lt.description || "No description provided."}
                </p>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                    {lt.isPaid ? "Paid" : "Unpaid"}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                    {lt.annualAllowance !== null ? `${lt.annualAllowance}d/yr` : "No fixed cap"}
                  </span>
                  {lt.allowHalfDay && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                      Half-day
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenEdit(lt)}
                  title="Edit"
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleStatus(lt)}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {lt.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">
                {editingType ? "Edit Leave Type" : "Add Leave Type"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Annual Leave"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Annual Allowance (days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.annualAllowance}
                  onChange={(e) => setFormData({ ...formData, annualAllowance: e.target.value })}
                  placeholder="e.g. 12"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Policy rules..."
                  className="form-input text-xs resize-none"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="rounded text-gray-900 focus:ring-gray-900"
                  />
                  <span>Paid leave</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.allowHalfDay}
                    onChange={(e) => setFormData({ ...formData, allowHalfDay: e.target.checked })}
                    className="rounded text-gray-900 focus:ring-gray-900"
                  />
                  <span>Allow half-day</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.trackBalance}
                    onChange={(e) => setFormData({ ...formData, trackBalance: e.target.checked })}
                    className="rounded text-gray-900 focus:ring-gray-900"
                  />
                  <span>Track balance</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
