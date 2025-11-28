import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const email = "baydershghl@gmail.com".toLowerCase().trim();
    const password = "bayder2025";
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        email: email,
      });
    }
    
    // Check password
    if (!user.hashedPassword) {
      return NextResponse.json({
        success: false,
        message: "User has no password",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }
    
    const passwordMatches = await bcrypt.compare(password, user.hashedPassword);
    
    return NextResponse.json({
      success: true,
      message: passwordMatches ? "Password matches!" : "Password does NOT match",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.hashedPassword,
      },
      passwordMatches: passwordMatches,
      testCredentials: {
        email: email,
        password: password,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

