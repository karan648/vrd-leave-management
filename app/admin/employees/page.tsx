import { Metadata } from "next";
import { EmployeesClient } from "./employees-client";

export const metadata: Metadata = {
  title: "Employee Directory",
  description: "Manage employee records and organizational directory",
};

export default function EmployeesPage() {
  return <EmployeesClient />;
}
