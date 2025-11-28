import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection and check if tables exist
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    `;

    const tablesExist = Array.isArray(result) && result.length > 0;

    if (tablesExist) {
      return NextResponse.json({
        success: true,
        message: "Database tables already exist. Migrations have been run.",
        tablesExist: true,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Database tables do not exist. Migrations need to run during deployment.",
      tablesExist: false,
      instructions: "Please redeploy your app. Migrations will run automatically during the build process if DATABASE_URL is set.",
    });
  } catch (error: any) {
    // If we get an error, it likely means tables don't exist
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Database connection issue",
        message: "Database tables do not exist. Please ensure:",
        steps: [
          "1. DATABASE_URL is set in Vercel environment variables",
          "2. Redeploy your app (migrations run automatically during build)",
          "3. Check build logs to verify migrations completed",
        ],
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

