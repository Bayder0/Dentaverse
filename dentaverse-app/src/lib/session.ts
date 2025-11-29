/**
 * Get session - authentication disabled, returns default user
 */
export async function getSession(): Promise<{ user: { id: string; role: string; email: string; name: string | null } }> {
  // Authentication disabled - always return default owner user
  return {
    user: {
      id: "default",
      role: "OWNER",
      email: "",
      name: "User",
    },
  };
}

