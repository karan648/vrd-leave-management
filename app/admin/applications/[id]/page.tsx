import type { Metadata } from "next";
import { ApplicationDetailClient } from "./application-detail-client";

export const metadata: Metadata = {
  title: "Application Details",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationDetailClient id={id} />;
}
