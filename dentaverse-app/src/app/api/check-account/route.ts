import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bayderEmail = "baydershghl@gmail.com".toLowerCase().trim();
    
    const user = await prisma.user.findUnique({
      where: { email: bayderEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hashedPassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: "Account does not exist. Visit /api/seed-database to create it.",
      });
    }

    return NextResponse.json({
      exists: true,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.hashedPassword,
      userId: user.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        exists: false,
        error: error.message || "Error checking account",
      },
      { status: 500 }
    );
  }
}

