import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function createOwner() {
  try {
    const ownerEmail = "owner@dentaverse.com".toLowerCase().trim();
    const ownerPassword = "dentaverse2024";
    
    // Check if owner already exists
    const existingOwner = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingOwner) {
      return NextResponse.json({
        success: true,
        message: "Owner user already exists",
        email: ownerEmail,
        password: existingOwner.plainPassword || ownerPassword,
      });
    }

    // Create owner user
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        name: "DentaVerse Owner",
        role: "OWNER",
        hashedPassword: hashedPassword,
        plainPassword: ownerPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Owner user created successfully!",
      email: ownerEmail,
      password: ownerPassword,
    });
  } catch (error: any) {
    console.error("Error creating owner:", error);
    return {
      success: false,
      error: error.message || "Failed to create owner user",
      details: error.toString(),
    };
  }
}

export async function GET() {
  const result = await createOwner();
  if (result.success) {
    return NextResponse.json(result);
  }
  return NextResponse.json(result, { status: 500 });
}

export async function POST() {
  const result = await createOwner();
  if (result.success) {
    return NextResponse.json(result);
  }
  return NextResponse.json(result, { status: 500 });
}

