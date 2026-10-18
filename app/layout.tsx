import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VRD Exports — Leave Management System",
    template: "%s | VRD Exports LMS",
  },
  description:
    "VRD Exports Leave Management System — Apply for leave, track status, and manage approvals.",
  robots: { index: false, follow: false }, // Keep internal HR tool off search engines
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f8fafc] antialiased">{children}</body>
    </html>
  );
}
