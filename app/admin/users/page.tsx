import { Metadata } from "next";
import { UsersClient } from "./users-client";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "Manage admin console users, roles, and credentials",
};

export default function AdminUsersPage() {
  return <UsersClient />;
}
