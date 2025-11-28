import { cookies } from "next/headers";
import { isValidSession } from "./simple-auth";

/**
 * Check if user is authenticated with simple password system
 */
export async function getSession(): Promise<{ authenticated: boolean } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session')?.value;
  
  if (isValidSession(session)) {
    return { authenticated: true };
  }
  
  return null;
}

