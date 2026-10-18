import { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "System & Leave Settings",
  description: "Configure leave policies and notification parameters",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
