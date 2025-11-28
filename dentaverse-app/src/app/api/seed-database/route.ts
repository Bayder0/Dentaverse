import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Create owner account
    const ownerEmail = "owner@dentaverse.com";
    const ownerPassword = "dentaverse2024";
    const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 10);

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {
        name: "DentaVerse Owner",
        role: "OWNER",
        hashedPassword: hashedOwnerPassword,
        plainPassword: ownerPassword,
      },
      create: {
        email: ownerEmail,
        name: "DentaVerse Owner",
        role: "OWNER",
        hashedPassword: hashedOwnerPassword,
        plainPassword: ownerPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Owner account created successfully!",
      email: ownerEmail,
      password: ownerPassword,
      ownerId: owner.id,
    });
  } catch (error: any) {
    console.error("Error creating owner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create owner account",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

