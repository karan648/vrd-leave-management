"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatDateLong } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  role: "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "HR_VIEWER";
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  MANAGER: "Manager",
  HR_VIEWER: "HR Viewer",
};

function generateRandomPassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    username: "",
    role: "HR_ADMIN",
    password: "",
  });
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    fullName: string;
    password?: string;
  } | null>(null);

  const [resetModalUser, setResetModalUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin-users");
      const data = await res.json();
      if (res.ok && data.data) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const generatedPwd = createForm.password.trim() || generateRandomPassword();

    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: createForm.fullName.trim(),
          email: createForm.email.trim().toLowerCase(),
          username: createForm.username.trim() || undefined,
          role: createForm.role,
          password: generatedPwd,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create account");
      }

      setIsCreateOpen(false);
      setCreatedCredentials({
        fullName: createForm.fullName,
        email: createForm.email,
        password: generatedPwd,
      });

      setCreateForm({
        fullName: "",
        email: "",
        username: "",
        role: "HR_ADMIN",
        password: "",
      });

      await fetchUsers();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating user");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetModalUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin-users/${resetModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to reset password");
      }

      setResetSuccess(newPassword);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error resetting password");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(user: AdminUser) {
    try {
      const res = await fetch(`/api/admin-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCopyCredentials() {
    if (!createdCredentials) return;
    const text = `VRD Exports Admin Login:\nURL: ${window.location.origin}/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Admin Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage administrative access and roles
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Total Admins</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Super Admins</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {users.filter((u) => u.role === "SUPER_ADMIN").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">HR Admins</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {users.filter((u) => u.role === "HR_ADMIN").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {users.filter((u) => u.isActive).length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 border border-gray-200 rounded-xl flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_ADMIN">HR Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="HR_VIEWER">HR Viewer</option>
          </select>

          <button
            onClick={fetchUsers}
            title="Refresh"
            className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin User</th>
                <th>Role</th>
                <th>Username</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading admin accounts…
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <p className="font-medium text-gray-900 text-sm">{user.fullName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-500">
                      {user.username || "—"}
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          user.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateLong(user.createdAt)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setResetModalUser(user);
                            setNewPassword(generateRandomPassword());
                            setResetSuccess(null);
                          }}
                          title="Reset Password"
                          className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleStatus(user)}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
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

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Add Admin Account</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
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

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Full Name"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="admin@vrdexports.in"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                  className="form-input text-xs"
                >
                  <option value="HR_ADMIN">HR Admin (Full access)</option>
                  <option value="SUPER_ADMIN">Super Admin (All access)</option>
                  <option value="MANAGER">Manager (Department review)</option>
                  <option value="HR_VIEWER">HR Viewer (Read only)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm({ ...createForm, password: generateRandomPassword() })
                    }
                    className="text-[11px] text-gray-500 hover:text-gray-900"
                  >
                    Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="form-input font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? "Saving…" : "Save Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Popup */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-gray-200 shadow-xl text-center">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <h3 className="text-base font-semibold text-gray-900">Admin Account Created</h3>
            <p className="text-xs text-gray-500 mt-1">
              Share these credentials with {createdCredentials.fullName}.
            </p>

            <div className="my-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-left space-y-2 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Email</span>
                <span className="font-mono text-gray-900 font-medium">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Password</span>
                <span className="font-mono text-gray-900 font-medium">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-lg text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Details"}
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-3 py-2 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Reset Password</h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="space-y-3">
                <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                  Password updated for {resetModalUser.fullName}.
                </p>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <span className="text-[10px] text-gray-400 uppercase block">New Password</span>
                  <span className="font-mono text-sm font-semibold text-gray-900">{resetSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="w-full bg-gray-900 text-white font-medium py-2 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-gray-500">
                  Enter new password for <span className="font-medium text-gray-800">{resetModalUser.fullName}</span>.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-[11px] text-gray-500 hover:text-gray-900"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input font-mono text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    {isSubmitting ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
