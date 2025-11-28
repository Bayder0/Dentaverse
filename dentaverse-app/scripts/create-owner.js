const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createOwner() {
  try {
    const ownerEmail = "owner@dentaverse.com";
    const ownerPassword = "dentaverse2024";
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    const user = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {
        name: "DentaVerse Owner",
        role: "OWNER",
        hashedPassword: hashedPassword,
        plainPassword: ownerPassword,
      },
      create: {
        email: ownerEmail,
        name: "DentaVerse Owner",
        role: "OWNER",
        hashedPassword: hashedPassword,
        plainPassword: ownerPassword,
      },
    });

    console.log("✅ Owner user created/updated successfully!");
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${ownerPassword}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error("❌ Error creating owner user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createOwner();

