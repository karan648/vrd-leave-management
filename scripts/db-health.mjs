// =============================================================================
// VRD Exports Leave Management — Database Health Check Script
// =============================================================================
// Checks database connectivity without exposing connection secrets or passwords.
// Run with: npm run db:health
// =============================================================================

import { PrismaClient } from "@prisma/client";

async function checkHealth() {
  console.log("🔍 Checking VRD Exports Database Health...\n");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("USER:PASSWORD@HOST")) {
    console.warn("⚠️  DATABASE_URL appears to be unconfigured or using placeholders.");
    console.log("   Please set a valid PostgreSQL / Neon connection string in your .env file.\n");
  } else {
    // Sanitize URL to print only host and db
    try {
      const parsed = new URL(dbUrl);
      console.log(`📡 Connecting to host: ${parsed.host}, database: ${parsed.pathname.slice(1)}`);
    } catch {
      console.log("📡 DATABASE_URL provided (masked for security)");
    }
  }

  const prisma = new PrismaClient();
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const latency = Date.now() - startTime;
    console.log(`✅ Database connection successful! Query response time: ${latency}ms`);

    // Check key table counts
    const [depts, leaveTypes, apps] = await Promise.all([
      prisma.department.count(),
      prisma.leaveType.count(),
      prisma.leaveApplication.count(),
    ]);

    console.log("\n📊 Current Database Statistics:");
    console.log(`   • Departments:         ${depts}`);
    console.log(`   • Leave Types:         ${leaveTypes}`);
    console.log(`   • Leave Applications:  ${apps}`);
    console.log("\n✅ Health check PASSED.");
    process.exit(0);
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`\n❌ Database connection FAILED (${latency}ms)`);
    console.error(`   Error: ${error.message || error}`);
    console.log("\n💡 Troubleshooting tips:");
    console.log("   1. Verify your DATABASE_URL in .env (Neon connection string)");
    console.log("   2. Ensure ?sslmode=require is appended");
    console.log("   3. Run 'npm run db:generate' and 'npm run db:migrate'");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkHealth();
