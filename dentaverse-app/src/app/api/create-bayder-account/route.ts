import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const email = "baydershghl@gmail.com".toLowerCase().trim();
    const password = "bayder2025";
    
    console.log("🔍 Checking if account exists...");
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hashedPassword: true,
      },
    });

    if (existingUser) {
      console.log("✅ Account exists, verifying password...");
      
      // Verify the password works
      const isValid = await bcrypt.compare(password, existingUser.hashedPassword || "");
      
      if (isValid) {
        return NextResponse.json({
          success: true,
          message: "Account exists and password is correct!",
          account: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
          },
          canLogin: true,
        });
      } else {
        console.log("❌ Password doesn't match, updating password...");
        // Update password
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: {
            hashedPassword: newHash,
            plainPassword: password,
          },
        });
        
        return NextResponse.json({
          success: true,
          message: "Account exists but password was wrong. Password has been updated!",
          account: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
          },
          canLogin: true,
        });
      }
    }

    console.log("📝 Account doesn't exist, creating new account...");
    
    // Create new account
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: "bayder",
        role: "OWNER",
        hashedPassword: hashedPassword,
        plainPassword: password,
      },
    });

    console.log("✅ Account created successfully:", newUser.id);
    
    // Verify it was created correctly
    const verifyUser = await prisma.user.findUnique({
      where: { email },
    });
    
    const passwordCheck = await bcrypt.compare(password, verifyUser?.hashedPassword || "");
    
    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      account: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      verification: {
        accountExists: !!verifyUser,
        passwordMatches: passwordCheck,
      },
      canLogin: true,
      credentials: {
        email: email,
        password: password,
      },
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create/verify account",
        details: error.toString(),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

