import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { ensureOwnerAccount } from "@/lib/init-owner";

// Ensure owner account exists on app startup
ensureOwnerAccount().catch(console.error);

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

