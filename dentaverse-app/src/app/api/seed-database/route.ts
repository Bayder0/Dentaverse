import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Create bayder owner account
    const bayderEmail = "baydershghl@gmail.com";
    const bayderPassword = "bayder2025";
    const hashedBayderPassword = await bcrypt.hash(bayderPassword, 10);

    const bayder = await prisma.user.upsert({
      where: { email: bayderEmail },
      update: {
        name: "bayder",
        role: "OWNER",
        hashedPassword: hashedBayderPassword,
        plainPassword: bayderPassword,
      },
      create: {
        email: bayderEmail,
        name: "bayder",
        role: "OWNER",
        hashedPassword: hashedBayderPassword,
        plainPassword: bayderPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Owner account created successfully!",
      email: bayderEmail,
      password: bayderPassword,
      userId: bayder.id,
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

