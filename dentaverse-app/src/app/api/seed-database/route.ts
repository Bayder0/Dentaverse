import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Create bayder owner account - normalize email to lowercase
    const bayderEmail = "baydershghl@gmail.com".toLowerCase().trim();
    const bayderPassword = "bayder2025";
    
    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { email: bayderEmail },
    });

    if (existingUser) {
      // Update password in case it changed
      const hashedPassword = await bcrypt.hash(bayderPassword, 10);
      const updated = await prisma.user.update({
        where: { email: bayderEmail },
        data: {
          hashedPassword: hashedPassword,
          plainPassword: bayderPassword,
          role: "OWNER",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Owner account already existed - password updated!",
        email: bayderEmail,
        password: bayderPassword,
        userId: updated.id,
        action: "updated",
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(bayderPassword, 10);
    const bayder = await prisma.user.create({
      data: {
        email: bayderEmail,
        name: "bayder",
        role: "OWNER",
        hashedPassword: hashedPassword,
        plainPassword: bayderPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Owner account created successfully!",
      email: bayderEmail,
      password: bayderPassword,
      userId: bayder.id,
      action: "created",
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

