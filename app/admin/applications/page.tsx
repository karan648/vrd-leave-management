import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationsClient } from "./applications-client";

export const metadata: Metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-slate-500">
          Loading applications...
        </div>
      }
    >
      <ApplicationsClient />
    </Suspense>
  );
}
