import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Auth: Missing email or password");
          return null;
        }

        // Normalize email: trim whitespace and convert to lowercase
        const normalizedEmail = credentials.email.trim().toLowerCase();
        
        if (!normalizedEmail) {
          console.log("❌ Auth: Empty email after normalization");
          return null;
        }

        console.log("🔍 Auth: Looking for user with email:", normalizedEmail);
        
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          console.log("❌ Auth: User not found with email:", normalizedEmail);
          return null;
        }

        if (!user?.hashedPassword) {
          console.log("❌ Auth: User found but no hashed password");
          return null;
        }

        console.log("🔍 Auth: Comparing password...");
        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        
        if (!isValid) {
          console.log("❌ Auth: Password doesn't match");
          return null;
        }

        console.log("✅ Auth: Login successful for:", normalizedEmail);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as string) || "SELLER";
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: User | null }): Promise<JWT> {
      if (user) {
        token.role = (user as { role?: string })?.role ?? "SELLER";
      }
      return token;
    },
  },
};

