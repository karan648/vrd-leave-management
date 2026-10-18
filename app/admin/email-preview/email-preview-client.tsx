"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Eye,
  Code,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Users,
  UserCheck,
  RefreshCw,
  Info,
} from "lucide-react";

interface DnsRecord {
  record: string;
  name: string;
  type: string;
  value: string;
  status: string;
  priority?: number;
}

interface DomainInfo {
  status: string;
  domain: string;
  records?: DnsRecord[];
}

interface TemplateMeta {
  key: string;
  title: string;
  category: string;
  targetAudience: string;
  recipientsDescription: string;
  trigger: string;
  subject: string;
  html: string;
}

export function EmailPreviewClient() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [senderEmail, setSenderEmail] = useState("notifications@vrdexports.in");
  const [selectedKey, setSelectedKey] = useState<string>("submission_confirmation");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "code">("desktop");
  const [loading, setLoading] = useState(true);

  // Test email sender state
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendResult, setSendResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Copy state for DNS records
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/email-preview");
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
      if (data.domainInfo) {
        setDomainInfo(data.domainInfo);
      }
      if (data.senderEmail) {
        setSenderEmail(data.senderEmail);
      }
    } catch (e) {
      console.error("Failed to load templates:", e);
    } finally {
      setLoading(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.key === selectedKey) || templates[0];

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleSendTest() {
    if (!testEmail || !testEmail.includes("@")) {
      setSendResult({ error: "Please enter a valid destination email address" });
      return;
    }
    setSendingTest(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedKey,
          testEmail: testEmail.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({ success: true, message: `Email dispatched! Message ID: ${data.messageId}` });
      } else {
        setSendResult({
          error: data.error || "Failed to send email. Ensure the sender domain is verified in Resend.",
        });
      }
    } catch {
      setSendResult({ error: "Network error sending test email" });
    } finally {
      setSendingTest(false);
    }
  }

  const isDomainPending = domainInfo?.status !== "verified";

  return (
    <div className="space-y-6">
      {/* Top Banner: Domain Status & Resend DNS Records */}
      {domainInfo && (
        <div
          className={`rounded-xl border p-5 transition-all shadow-sm ${
            isDomainPending
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
          }`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  isDomainPending ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {isDomainPending ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Sender Domain: <span className="font-mono text-blue-300">{domainInfo.domain}</span>
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isDomainPending
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    Status: {domainInfo.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {isDomainPending
                    ? `Emails from "${senderEmail}" cannot reach external inboxes until DNS records are verified in your domain host (Cloudflare, GoDaddy, Hostinger, etc.). Add the 3 DNS records below to verify ${domainInfo.domain}.`
                    : `Domain verified! Automated emails from "${senderEmail}" will deliver seamlessly to employees, managers, and all 10 approvers.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchTemplates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Status
              </button>
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-sm"
              >
                Resend Domains
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* DNS Records Table */}
          {domainInfo.records && domainInfo.records.length > 0 && isDomainPending && (
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Required DNS Records for {domainInfo.domain}
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/80">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Name / Host</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2">Value / Content</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {domainInfo.records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-bold text-blue-400">{r.type}</td>
                        <td className="px-3 py-2 text-amber-200">{r.name}</td>
                        <td className="px-3 py-2 text-slate-400">{r.priority ?? "—"}</td>
                        <td className="px-3 py-2 max-w-md truncate text-slate-300" title={r.value}>
                          {r.value}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => copyToClipboard(r.value, `rec-${idx}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition-all font-sans"
                          >
                            {copiedKey === `rec-${idx}` ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedKey === `rec-${idx}` ? "Copied" : "Copy Value"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Template Selector List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              All 6 Notification Templates
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              6 Active
            </span>
          </div>

          <div className="space-y-2">
            {templates.map((tpl) => {
              const active = tpl.key === selectedKey;
              return (
                <button
                  key={tpl.key}
                  onClick={() => {
                    setSelectedKey(tpl.key);
                    setSendResult(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    active
                      ? "bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-900/20"
                      : "bg-[#1e2738]/60 border-slate-800 hover:bg-[#1e2738] hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        tpl.key.includes("approval")
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : tpl.key.includes("rejection")
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : tpl.key.includes("manager") || tpl.key.includes("status_update")
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {tpl.targetAudience}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tpl.key.includes("confirmation") || tpl.key.includes("handover")
                        ? "Trigger: Submission"
                        : tpl.key.includes("review")
                        ? "Trigger: Submission"
                        : "Trigger: Decision"}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold ${active ? "text-white" : "text-slate-200"}`}>
                    {tpl.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-mono">
                    Subject: {tpl.subject}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Recipient Distribution Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#161f30] text-xs text-slate-300 space-y-2 mt-4">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Recipient Flow Summary
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400 leading-relaxed">
              <li>
                <strong className="text-slate-200">Applicant:</strong> Receives confirmation upon submission & approval/decline notifications.
              </li>
              <li>
                <strong className="text-slate-200">10+ Approvers & Owners:</strong> Receive alert on new submission with direct link to review and decision updates.
              </li>
              <li>
                <strong className="text-slate-200">Handover Person:</strong> Receives work coverage assignment detailing leave dates.
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Live Preview & Testing Area */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTemplate && (
            <div className="rounded-xl border border-slate-800 bg-[#131b2a] overflow-hidden flex flex-col shadow-lg">
              {/* Header Bar */}
              <div className="p-4 border-b border-slate-800 bg-[#161f30] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white truncate">
                      {selectedTemplate.title}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <strong>Recipients:</strong> {selectedTemplate.recipientsDescription}
                  </p>
                </div>

                {/* View Mode Controls */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 flex-shrink-0">
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      viewMode === "desktop"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      viewMode === "mobile"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      viewMode === "code"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    HTML
                  </button>
                </div>
              </div>

              {/* Subject Bar */}
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs flex items-center justify-between text-slate-300 font-mono">
                <div className="truncate">
                  <span className="text-slate-500">Subject: </span>
                  <span className="text-white font-semibold">{selectedTemplate.subject}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedTemplate.html, "html")}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-sans ml-2 flex-shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === "html" ? "Copied" : "Copy HTML"}
                </button>
              </div>

              {/* Email Content Frame */}
              <div className="p-6 bg-slate-950/60 flex items-center justify-center min-h-[560px] overflow-auto">
                {viewMode === "code" ? (
                  <pre className="w-full text-xs font-mono text-slate-300 bg-slate-900 p-4 rounded-lg overflow-x-auto border border-slate-800 max-h-[560px]">
                    {selectedTemplate.html}
                  </pre>
                ) : (
                  <div
                    className={`transition-all bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300 ${
                      viewMode === "mobile" ? "w-[375px]" : "w-[640px] max-w-full"
                    }`}
                  >
                    <iframe
                      title={selectedTemplate.title}
                      srcDoc={selectedTemplate.html}
                      className="w-full h-[620px] border-none"
                    />
                  </div>
                )}
              </div>

              {/* Test Email Dispatcher */}
              <div className="p-4 bg-[#161f30] border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter destination email for live test..."
                      className="w-full pl-3 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-sm flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingTest ? "Dispatching..." : "Send Test to Inbox"}
                  </button>
                </div>

                {sendResult && (
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg border flex-shrink-0 ${
                      sendResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {sendResult.success ? sendResult.message : sendResult.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
