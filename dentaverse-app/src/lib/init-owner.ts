import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

let initializationPromise: Promise<void> | null = null;

export async function ensureOwnerAccount() {
  // Only run once, even if called multiple times
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const bayderEmail = "baydershghl@gmail.com";
      
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: bayderEmail },
      });

      if (existingUser) {
        return; // Account already exists, nothing to do
      }

      // Create the account
      const bayderPassword = "bayder2025";
      const hashedPassword = await bcrypt.hash(bayderPassword, 10);

      await prisma.user.create({
        data: {
          email: bayderEmail,
          name: "bayder",
          role: "OWNER",
          hashedPassword: hashedPassword,
          plainPassword: bayderPassword,
        },
      });

      console.log("✅ Owner account (bayder) created successfully");
    } catch (error) {
      console.error("Error creating owner account:", error);
      // Don't throw - we don't want to break the app if this fails
    }
  })();

  return initializationPromise;
}

