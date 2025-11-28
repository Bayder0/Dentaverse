import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireRole(allowedRoles: string[]) {
  const session = await getSession();
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
  const session = await getSession();
  return session?.user;
}



