import { getSession } from "./session";

// Authentication disabled - return default user for compatibility
export async function requireRole(allowedRoles: string[]) {
  // Return a default user object to maintain compatibility with existing code
  return {
    id: "default",
    role: "OWNER" as const,
    email: "",
    name: "User",
  };
}

export async function getCurrentUser() {
  // Return default user since authentication is disabled
  return {
    id: "default",
    role: "OWNER" as const,
    email: "",
    name: "User",
  };
}



