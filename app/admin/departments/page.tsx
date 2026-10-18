import { Metadata } from "next";
import { DepartmentsClient } from "./departments-client";

export const metadata: Metadata = {
  title: "Departments",
  description: "Manage company departments and business units",
};

export default function DepartmentsPage() {
  return <DepartmentsClient />;
}
