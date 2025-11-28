// Simple password-based authentication
const MASTER_PASSWORD = "dentaverse2022";

export function verifyPassword(password: string): boolean {
  return password === MASTER_PASSWORD;
}

export function createSession(): string {
  // Create a simple session token
  return Buffer.from(`authenticated_${Date.now()}`).toString('base64');
}

export function isValidSession(session: string | null): boolean {
  if (!session) return false;
  try {
    const decoded = Buffer.from(session, 'base64').toString('utf-8');
    return decoded.startsWith('authenticated_');
  } catch {
    return false;
  }
}

