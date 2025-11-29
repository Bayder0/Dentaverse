import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function createTestUser() {
  try {
    const testEmail = "a@a.com";
    const testPassword = "123456";
    
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Test user already exists",
        email: testEmail,
        password: testPassword,
      });
    }

    // Create test user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test User",
        role: "SELLER",
        hashedPassword: hashedPassword,
        plainPassword: testPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test user created successfully!",
      email: testEmail,
      password: testPassword,
    });
  } catch (error: any) {
    console.error("Error creating test user:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create test user",
      details: error.toString(),
    }, { status: 500 });
  }
}

export async function GET() {
  return await createTestUser();
}

export async function POST() {
  return await createTestUser();
}


