import { getServerSession } from "next-auth";
import { authConfig } from "./auth";
import type { Session } from "next-auth";

/**
 * Get the current server session with proper typing
 */
export async function getSession(): Promise<Session | null> {
  return await getServerSession(authConfig);
}

