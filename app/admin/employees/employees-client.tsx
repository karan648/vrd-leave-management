"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Edit2,
  Mail,
} from "lucide-react";
import { formatDateLong } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  departmentId: string | null;
  department: Department | null;
  managerName: string | null;
  managerEmail: string | null;
  isActive: boolean;
  createdAt: string;
}

export function EmployeesClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    departmentId: "",
    managerName: "",
    managerEmail: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/departments"),
      ]);
      const [empData, deptData] = await Promise.all([empRes.json(), deptRes.json()]);

      if (empRes.ok && empData.data) setEmployees(empData.data);
      if (deptRes.ok && deptData.data) setDepartments(deptData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleOpenCreate() {
    setEditingEmployee(null);
    setFormData({
      employeeId: "",
      fullName: "",
      email: "",
      departmentId: "",
      managerName: "",
      managerEmail: "",
      isActive: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(emp: Employee) {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      departmentId: emp.departmentId || "",
      managerName: emp.managerName || "",
      managerEmail: emp.managerEmail || "",
      isActive: emp.isActive,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
    const method = editingEmployee ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: formData.employeeId.trim(),
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          departmentId: formData.departmentId || null,
          managerName: formData.managerName.trim() || null,
          managerEmail: formData.managerEmail.trim().toLowerCase() || null,
          isActive: formData.isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save employee");
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(emp: Employee) {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !emp.isActive }),
      });
      if (res.ok) {
        setEmployees(employees.map((e) => (e.id === emp.id ? { ...e, isActive: !e.isActive } : e)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchesSearch =
      emp.fullName.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      (emp.managerName && emp.managerName.toLowerCase().includes(q));

    const matchesDept = deptFilter === "ALL" || emp.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Personnel directory and management
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Total Personnel</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{employees.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Active Staff</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {employees.filter((e) => e.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Departments</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{departments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Inactive</p>
          <p className="text-2xl font-semibold text-gray-500 mt-1">
            {employees.filter((e) => !e.isActive).length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            title="Refresh"
            className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Emp ID</th>
                <th>Department</th>
                <th>Reporting Manager</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading employees…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <p className="font-medium text-gray-900 text-sm">{emp.fullName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {emp.email}
                      </p>
                    </td>
                    <td className="font-mono text-xs font-medium text-gray-700">
                      {emp.employeeId}
                    </td>
                    <td className="text-sm text-gray-600">
                      {emp.department?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td>
                      {emp.managerName ? (
                        <div>
                          <p className="text-xs font-medium text-gray-900">{emp.managerName}</p>
                          {emp.managerEmail && (
                            <p className="text-[11px] text-gray-400">{emp.managerEmail}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          emp.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateLong(emp.createdAt)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Edit"
                          className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleStatus(emp)}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {emp.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="VRD-1001"
                    className="form-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="form-input text-xs"
                  >
                    <option value="">Select</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@vrdexports.com"
                  className="form-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="Manager Name"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    placeholder="manager@vrdexports.com"
                    className="form-input text-xs"
                  />
                </div>
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
