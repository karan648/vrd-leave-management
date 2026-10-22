"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Code,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
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

  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendResult, setSendResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/email-preview");
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
      if (data.domainInfo) setDomainInfo(data.domainInfo);
      if (data.senderEmail) setSenderEmail(data.senderEmail);
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
          error: data.error || "Failed to send email. Ensure sender domain is verified in Resend.",
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Preview and test transactional email templates dispatched via Resend
          </p>
        </div>

        <button
          onClick={fetchTemplates}
          title="Refresh"
          className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Domain Verification Notice */}
      {domainInfo && (
        <div
          className={`rounded-xl border p-4 transition-all ${
            isDomainPending
              ? "bg-amber-50/70 border-amber-200 text-amber-950"
              : "bg-green-50/70 border-green-200 text-green-950"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {isDomainPending ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-semibold">{domainInfo.domain}:</span>{" "}
                {isDomainPending ? "DNS verification pending" : "Verified domain"}
                <span className="text-gray-500 ml-2">({senderEmail})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:underline"
              >
                Resend Domains <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* DNS Records */}
          {domainInfo.records && domainInfo.records.length > 0 && isDomainPending && (
            <div className="mt-3 pt-3 border-t border-amber-200 text-xs">
              <p className="font-medium text-amber-900 mb-2 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Required DNS records:
              </p>
              <div className="overflow-x-auto bg-white border border-amber-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 font-medium">
                    <tr>
                      <th className="px-3 py-1.5">Type</th>
                      <th className="px-3 py-1.5">Host</th>
                      <th className="px-3 py-1.5">Value</th>
                      <th className="px-3 py-1.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    {domainInfo.records.map((r, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1.5 font-semibold text-gray-900">{r.type}</td>
                        <td className="px-3 py-1.5 text-gray-700">{r.name}</td>
                        <td className="px-3 py-1.5 max-w-xs truncate text-gray-500" title={r.value}>
                          {r.value}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <button
                            onClick={() => copyToClipboard(r.value, `rec-${idx}`)}
                            className="text-[11px] font-sans text-gray-600 hover:text-gray-900"
                          >
                            {copiedKey === `rec-${idx}` ? "Copied" : "Copy"}
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

      {/* Main Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Template Selector */}
        <div className="lg:col-span-4 space-y-2">
          {templates.map((tpl) => {
            const active = tpl.key === selectedKey;
            return (
              <button
                key={tpl.key}
                onClick={() => {
                  setSelectedKey(tpl.key);
                  setSendResult(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                  active
                    ? "bg-white border-gray-900 shadow-xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    {tpl.targetAudience}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {tpl.category}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900">{tpl.title}</h3>
                <p className="text-xs text-gray-400 truncate mt-0.5 font-mono">
                  {tpl.subject}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Preview & Live Testing */}
        <div className="lg:col-span-8">
          {selectedTemplate && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Toolbar */}
              <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedTemplate.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    Recipients: {selectedTemplate.recipientsDescription}
                  </p>
                </div>

                {/* View toggles */}
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg flex-shrink-0">
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === "desktop"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === "mobile"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    Mobile
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === "code"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    HTML
                  </button>
                </div>
              </div>

              {/* Subject bar */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs flex items-center justify-between text-gray-600">
                <p className="truncate font-mono text-[11px]">
                  <span className="text-gray-400">Subject: </span>
                  {selectedTemplate.subject}
                </p>
                <button
                  onClick={() => copyToClipboard(selectedTemplate.html, "html")}
                  className="text-[11px] text-gray-500 hover:text-gray-900 ml-2 flex-shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === "html" ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Preview Body */}
              <div className="p-6 bg-gray-50 flex items-center justify-center min-h-[500px]">
                {viewMode === "code" ? (
                  <pre className="w-full text-xs font-mono text-gray-700 bg-white p-4 rounded-lg overflow-x-auto border border-gray-200 max-h-[500px]">
                    {selectedTemplate.html}
                  </pre>
                ) : (
                  <div
                    className={`transition-all bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 ${
                      viewMode === "mobile" ? "w-[375px]" : "w-[620px] max-w-full"
                    }`}
                  >
                    <iframe
                      title={selectedTemplate.title}
                      srcDoc={selectedTemplate.html}
                      className="w-full h-[580px] border-none"
                    />
                  </div>
                )}
              </div>

              {/* Test Dispatch Bar */}
              <div className="p-3.5 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex-1 flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to test live delivery…"
                    className="form-input text-xs"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-xs font-medium text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingTest ? "Sending…" : "Send Test"}
                  </button>
                </div>

                {sendResult && (
                  <div
                    className={`text-xs px-2.5 py-1.5 rounded-lg border flex-shrink-0 ${
                      sendResult.success
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
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
