"use client";

import Link from "next/link";
import { ArrowRight, FileText, Search, LogIn } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              VRD Exports
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-sm text-gray-500">Leave Management</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/leave-status"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors"
            >
              Track Status
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/apply-leave"
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-lg transition-colors"
            >
              Apply for Leave
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — simple, no gradients */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="text-sm font-medium text-gray-500 mb-4">
            VRD Exports — Employee Self-Service
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-5">
            Leave Management
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Submit leave requests, track approvals, and let HR manage
            everything through one simple system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/apply-leave"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Apply for Leave
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/leave-status"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Check Application Status
            </Link>
          </div>
        </div>
      </section>

      {/* Steps — flat cards */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Submit your application",
                desc: "Fill in your details, select dates, provide a reason and handover contact.",
              },
              {
                step: "2",
                title: "Review by management",
                desc: "Your manager and HR are automatically notified. Track progress with your reference number.",
              },
              {
                step: "3",
                title: "Get notified",
                desc: "Receive an email when your leave is approved or declined, with any remarks from HR.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-column features */}
      <section className="bg-white border-y border-gray-200 py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-5">
              For Employees
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                "Submit leave applications in under 2 minutes",
                "Instant reference number for tracking",
                "Check status anytime with reference + email",
                "Automated email confirmations and updates",
                "Half-day leave support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/apply-leave"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 mt-6 hover:underline underline-offset-4"
            >
              Apply for Leave <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-5">
              For HR & Managers
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                "Centralised dashboard with live application data",
                "Filter and search by department, type, or status",
                "One-click approve or decline with remarks",
                "Full audit trail for every decision",
                "Manage employees, departments, and leave types",
                "Configurable email notification routing",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 mt-6 hover:underline underline-offset-4"
            >
              Admin Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer — quiet */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} VRD Exports</span>
          <div className="flex items-center gap-6">
            <Link href="/apply-leave" className="hover:text-gray-600 transition-colors">
              Apply
            </Link>
            <Link href="/leave-status" className="hover:text-gray-600 transition-colors">
              Track
            </Link>
            <Link href="/admin" className="hover:text-gray-600 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
