// =============================================================================
// API: /api/email-preview
// Renders live email templates and fetches Resend DNS verification status
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  submissionConfirmationEmail,
  managerNotificationEmail,
  handoverNotificationEmail,
  approvalNotificationEmail,
  rejectionNotificationEmail,
  statusUpdateManagerEmail,
} from "@/lib/email-templates";

export const dynamic = "force-dynamic";

function getSampleData() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vrd-leave-management-g8ad.vercel.app";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 3);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 5);

  return {
    referenceNumber: "VRD-20261018-0OBWQV",
    employeeName: "Karan Sharma",
    employeeEmail: "karan@vrdexports.in",
    leaveType: "Casual Leave",
    startDate,
    endDate,
    totalDays: 3,
    reason: "Urgent personal work and family obligation out of station",
    status: "PENDING",
    appUrl,
    adminUrl: `${appUrl}/admin/applications`,
    handoverPersonName: "Pooja Verma",
    handoverPersonEmail: "pooja@vrdexports.in",
    reportingManagerName: "Ankur Sir",
    reportingManagerEmail: "ankur@vrdexports.in",
  };
}

export async function GET(request: NextRequest) {
  const sample = getSampleData();
  const searchParams = request.nextUrl.searchParams;
  const rawHtml = searchParams.get("raw") === "true";
  const templateKey = searchParams.get("template");

  const templates: Record<
    string,
    {
      key: string;
      title: string;
      category: string;
      targetAudience: string;
      recipientsDescription: string;
      trigger: string;
      subject: string;
      html: string;
    }
  > = {
    submission_confirmation: {
      key: "submission_confirmation",
      title: "1. Employee Submission Confirmation",
      category: "Employee Notifications",
      targetAudience: "Applicant Employee",
      recipientsDescription: "Sent exclusively to the employee who filled and submitted the leave form",
      trigger: "Immediately upon form submission (/apply-leave)",
      ...submissionConfirmationEmail(sample),
    },
    manager_review: {
      key: "manager_review",
      title: "2. Approvers & Management Review Alert",
      category: "Approver Notifications",
      targetAudience: "Managers, HR, EA, Owners, Leave Admin & 10+ Approvers",
      recipientsDescription:
        "Sent to: Reporting Manager, HR (hr@vrdexports.in), EA (ea@vrdexports.in), Owners (vatsal@vrdexports.in), Admin, Designated 10+ Approvers, and active Admin accounts",
      trigger: "Immediately upon new leave application submission",
      ...managerNotificationEmail(sample),
    },
    handover_assignment: {
      key: "handover_assignment",
      title: "3. Handover / Colleague Coverage Notice",
      category: "Colleague Notifications",
      targetAudience: "Assigned Handover Person",
      recipientsDescription:
        "Sent to the colleague nominated in 'Handover / Work Assigned Person' field",
      trigger: "Immediately upon submission when a handover colleague is designated",
      ...handoverNotificationEmail({
        handoverPersonName: sample.handoverPersonName,
        employeeName: sample.employeeName,
        leaveType: sample.leaveType,
        startDate: sample.startDate,
        endDate: sample.endDate,
        totalDays: sample.totalDays,
        referenceNumber: sample.referenceNumber,
        appUrl: sample.appUrl,
      }),
    },
    approval_notice: {
      key: "approval_notice",
      title: "4. Leave Approved Notice",
      category: "Employee Notifications",
      targetAudience: "Applicant Employee",
      recipientsDescription: "Sent to the employee informing them that their leave has been approved",
      trigger: "When HR/Admin or Manager clicks 'Approve' in Admin Applications",
      ...approvalNotificationEmail({
        ...sample,
        status: "APPROVED",
        remarks: "Approved. Please ensure all urgent client files are handed over before departure.",
      }),
    },
    rejection_notice: {
      key: "rejection_notice",
      title: "5. Leave Declined Notice",
      category: "Employee Notifications",
      targetAudience: "Applicant Employee",
      recipientsDescription: "Sent to the employee informing them of rejection with specific remarks",
      trigger: "When HR/Admin or Manager clicks 'Decline' in Admin Applications",
      ...rejectionNotificationEmail({
        ...sample,
        status: "DECLINED",
        remarks: "Peak shipment week scheduled. Please reschedule for the following week if feasible.",
      }),
    },
    status_update_management: {
      key: "status_update_management",
      title: "6. Stakeholders Decision Synchronization",
      category: "Management Notifications",
      targetAudience: "Reporting Manager, HR, EA, Owners, Approvers",
      recipientsDescription:
        "Keeps all 10+ approvers, owners, EA, and HR updated on the final approval/decline decision",
      trigger: "Whenever a leave application status changes to Approved or Declined",
      ...statusUpdateManagerEmail({
        ...sample,
        status: "APPROVED",
        updatedBy: "HR Admin (Neha Sharma)",
        remarks: "Approved as per department schedule.",
      }),
    },
  };

  if (rawHtml && templateKey && templates[templateKey]) {
    return new NextResponse(templates[templateKey].html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Fetch Resend domain status if API key is present
  let domainInfo: {
    status: string;
    domain: string;
    records?: Array<{ record: string; name: string; type: string; value: string; status: string; priority?: number }>;
  } = {
    status: "unknown",
    domain: "vrdexports.in",
  };

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const domainList = await resend.domains.list();
      const domainObj = domainList.data?.data?.find((d) => d.name === "vrdexports.in");
      if (domainObj) {
        const domainDetails = await resend.domains.get(domainObj.id);
        domainInfo = {
          status: domainDetails.data?.status || domainObj.status,
          domain: domainObj.name,
          records: domainDetails.data?.records?.map((r) => ({
            record: r.record,
            name: r.name,
            type: r.type,
            value: r.value,
            status: r.status,
            priority: (r as { priority?: number }).priority,
          })),
        };
      }
    } catch (e) {
      console.error("[Email Preview] Failed to fetch domain info:", e);
    }
  }

  return NextResponse.json({
    templates: Object.values(templates),
    domainInfo,
    senderEmail: process.env.RESEND_FROM_EMAIL || "notifications@vrdexports.in",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateKey, testEmail } = body;

    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      return NextResponse.json({ error: "Please enter a valid destination email address" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY is not set in environment" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const sample = getSampleData();

    let emailData: { subject: string; html: string };
    switch (templateKey) {
      case "submission_confirmation":
        emailData = submissionConfirmationEmail(sample);
        break;
      case "manager_review":
        emailData = managerNotificationEmail(sample);
        break;
      case "handover_assignment":
        emailData = handoverNotificationEmail({
          handoverPersonName: sample.handoverPersonName,
          employeeName: sample.employeeName,
          leaveType: sample.leaveType,
          startDate: sample.startDate,
          endDate: sample.endDate,
          totalDays: sample.totalDays,
          referenceNumber: sample.referenceNumber,
          appUrl: sample.appUrl,
        });
        break;
      case "approval_notice":
        emailData = approvalNotificationEmail({
          ...sample,
          status: "APPROVED",
          remarks: "Approved as requested.",
        });
        break;
      case "rejection_notice":
        emailData = rejectionNotificationEmail({
          ...sample,
          status: "DECLINED",
          remarks: "Unable to approve due to team schedule overlap.",
        });
        break;
      case "status_update_management":
      default:
        emailData = statusUpdateManagerEmail({
          ...sample,
          status: "APPROVED",
          updatedBy: "HR Admin",
          remarks: "Approved.",
        });
        break;
    }

    const from = `${process.env.RESEND_FROM_NAME || "VRD Exports Leave Management"} <${process.env.RESEND_FROM_EMAIL || "notifications@vrdexports.in"}>`;

    const result = await resend.emails.send({
      from,
      to: [testEmail],
      subject: `[TEST PREVIEW] ${emailData.subject}`,
      html: emailData.html,
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message || "Resend failed to send email",
        resendError: result.error,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      message: `Test email successfully dispatched to ${testEmail}!`,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to send test email",
    }, { status: 500 });
  }
}
