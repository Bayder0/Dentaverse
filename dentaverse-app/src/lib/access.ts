import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "./auth";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    redirect("/login");
  }
  const userRole = session.user.role || "SELLER";
  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard");
  }
  return session.user;
}

export async function getCurrentUser() {
  const session = await getServerSession(authConfig);
  return session?.user;
}



