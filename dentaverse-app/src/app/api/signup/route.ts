import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["SELLER", "OWNER"];
    const userRole = validRoles.includes(role) ? role : "SELLER";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        role: userRole,
        hashedPassword: hashedPassword,
        plainPassword: password, // Store plain password for owner view (if needed)
      },
    });

    // If role is SELLER, create seller profile
    if (userRole === "SELLER") {
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          level: 1,
          salesThisMonth: 0,
          currentCommission: 0.15,
          monthKey: "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Error creating account:", error);
    
    // Check if it's a database table missing error
    if (error.message?.includes("does not exist") || error.message?.includes("table")) {
      return NextResponse.json(
        {
          error: "Database not initialized. Please run database migrations first. Contact the administrator.",
          details: "The database tables have not been created yet. Migrations need to run.",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: error.message || "Failed to create account",
        details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
      },
      { status: 500 }
    );
  }
}

