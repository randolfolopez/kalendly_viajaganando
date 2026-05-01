import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/dashboard");
  return session;
}

export async function requireHostOrSuperAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getOptionalSession() {
  return auth();
}
