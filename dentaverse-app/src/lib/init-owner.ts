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
      // Create default admin account
      const adminEmail = "admin@dentaverse.com".toLowerCase().trim();
      const adminPassword = "admin123";
      
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingUser) {
        console.log("✅ Owner account (admin) already exists");
        return; // Account already exists, nothing to do
      }

      // Create the account
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          role: "OWNER",
          hashedPassword: hashedPassword,
          plainPassword: adminPassword,
        },
      });

      console.log("✅ Owner account (admin) created successfully with ID:", newUser.id);
    } catch (error: any) {
      console.error("❌ Error creating owner account:", error?.message || error);
      // Don't throw - we don't want to break the app if this fails
    }
  })();

  return initializationPromise;
}

