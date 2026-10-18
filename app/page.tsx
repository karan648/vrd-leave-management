"use client";

import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  Shield,
  Building2,
  Users,
  ChevronRight,
  LogIn,
  PenLine,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* ------------------------------------------------------------------ */}
      {/* Navigation */}
      {/* ------------------------------------------------------------------ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e2e8f0] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#64748b] tracking-widest uppercase leading-none">
                VRD Exports
              </p>
              <p className="text-sm font-bold text-[#0f172a] leading-tight">
                Leave Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leave-status"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0f172a] px-3 py-2 rounded-md transition-colors"
            >
              <Clock className="w-4 h-4" />
              Track Status
            </Link>
            <Link
              href="/apply-leave"
              className="inline-flex items-center gap-1.5 bg-[#2563eb] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Apply for Leave
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 border border-[#e2e8f0] text-[#374151] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#f1f5f9] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e2840] via-[#1e3a5f] to-[#1a4685] py-24 px-4">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wider uppercase">
            <Building2 className="w-3.5 h-3.5" />
            VRD Exports — Human Resources Portal
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Leave Management
            <span className="block text-blue-300 mt-1">Made Simple</span>
          </h1>

          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Apply for leave, track your application status, and let HR manage
            approvals — all through one professional, streamlined system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply-leave"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1e3a5f] font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-black/20 text-base"
            >
              <PenLine className="w-5 h-5" />
              Apply for Leave
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/leave-status"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-base"
            >
              <Clock className="w-5 h-5" />
              Check Application Status
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it Works */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-3">
              How the Leave Application Process Works
            </h2>
            <p className="text-[#64748b] text-base max-w-xl mx-auto">
              A transparent, three-step process to ensure your leave requests
              are processed promptly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <PenLine className="w-6 h-6" />,
                title: "Submit Your Application",
                description:
                  "Fill out the leave application form with your details, leave dates, reason, and handover information.",
                color: "text-blue-600 bg-blue-50 border-blue-100",
              },
              {
                step: "02",
                icon: <Clock className="w-6 h-6" />,
                title: "Pending Review",
                description:
                  "Your reporting manager and HR department are automatically notified. Track your application using your reference number.",
                color: "text-amber-600 bg-amber-50 border-amber-100",
              },
              {
                step: "03",
                icon: <CheckCircle className="w-6 h-6" />,
                title: "Decision Notification",
                description:
                  "You receive an email notification once your leave is approved or declined, with any remarks from HR.",
                color: "text-green-600 bg-green-50 border-green-100",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#94a3b8] mb-1 uppercase tracking-widest">
                      Step {item.step}
                    </div>
                    <h3 className="font-semibold text-[#0f172a] mb-2 text-base">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#64748b] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white border-y border-[#e2e8f0] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#0f172a] mb-4">
                For Employees
              </h2>
              <ul className="space-y-4">
                {[
                  "Submit leave applications quickly with pre-populated dropdowns",
                  "Get an instant reference number for your application",
                  "Track application status using reference number + email",
                  "Receive email confirmation and decision notifications",
                  "Support for half-day leave applications",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#374151]">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/apply-leave"
                className="inline-flex items-center gap-2 mt-8 bg-[#2563eb] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
              >
                Apply for Leave
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0f172a] mb-4">
                For HR & Managers
              </h2>
              <ul className="space-y-4">
                {[
                  "Centralised dashboard with real-time application overview",
                  "Filter, search, and sort applications by any field",
                  "One-click approve or decline with remarks",
                  "Full audit trail of all approval actions",
                  "Manage employees, departments, and leave types",
                  "Configurable email notification routing",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#374151]">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 mt-8 bg-[#1e3a5f] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1a4685] transition-colors text-sm"
              >
                <LogIn className="w-4 h-4" />
                Admin Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Dev Notice Banner */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-amber-50 border-y border-amber-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Development Build — Authentication Not Implemented
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              The admin dashboard is currently accessible without login. This is
              intentional for the initial development version. Authentication and
              role-based access control will be added before public deployment.
              Do not expose this system on a public network until authentication
              is implemented.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-[#1e2840] text-[#94a3b8] py-10 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">VRD Exports</p>
              <p className="text-xs">Leave Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/apply-leave" className="hover:text-white transition-colors">
              Apply for Leave
            </Link>
            <Link href="/leave-status" className="hover:text-white transition-colors">
              Track Status
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-[#2d3754] text-xs text-center">
          © {new Date().getFullYear()} VRD Exports. Internal HR System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
