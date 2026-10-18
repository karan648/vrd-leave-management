// =============================================================================
// API: GET /api/dashboard/stats — Admin dashboard statistics
// Real database queries only. No hardcoded values.
// =============================================================================

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    total,
    pending,
    approved,
    declined,
    thisMonth,
    upcomingApproved,
    recentApplications,
    departmentStats,
    leaveTypeStats,
  ] = await Promise.all([
    prisma.leaveApplication.count(),
    prisma.leaveApplication.count({ where: { status: "PENDING" } }),
    prisma.leaveApplication.count({ where: { status: "APPROVED" } }),
    prisma.leaveApplication.count({ where: { status: "DECLINED" } }),
    prisma.leaveApplication.count({
      where: {
        submittedAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.leaveApplication.count({
      where: {
        status: "APPROVED",
        startDate: { gt: now },
      },
    }),
    prisma.leaveApplication.findMany({
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: {
        id: true,
        referenceNumber: true,
        employeeName: true,
        leaveTypeSnapshot: true,
        departmentSnapshot: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        status: true,
        submittedAt: true,
      },
    }),
    // Department-wise stats
    prisma.leaveApplication.groupBy({
      by: ["departmentSnapshot"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Leave-type stats
    prisma.leaveApplication.groupBy({
      by: ["leaveTypeSnapshot"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  // Monthly trend (last 6 months)
  const monthlyTrend = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await prisma.leaveApplication.count({
        where: { submittedAt: { gte: start, lte: end } },
      });
      return {
        month: start.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        count,
      };
    })
  );

  return Response.json({
    data: {
      summary: {
        total,
        pending,
        approved,
        declined,
        cancelled: total - pending - approved - declined,
        thisMonth,
        upcomingApproved,
      },
      recentApplications,
      departmentStats: departmentStats.map((d) => ({
        department: d.departmentSnapshot,
        count: d._count.id,
      })),
      leaveTypeStats: leaveTypeStats.map((l) => ({
        leaveType: l.leaveTypeSnapshot,
        count: l._count.id,
      })),
      monthlyTrend: monthlyTrend.reverse(),
    },
  });
}
