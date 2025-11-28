import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST() {
  try {
    // Run Prisma migrations
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
    });

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully!",
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run migrations",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

