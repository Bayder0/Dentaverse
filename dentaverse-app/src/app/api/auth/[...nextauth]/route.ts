import { NextResponse } from "next/server";

// NextAuth disabled - return empty responses
export async function GET() {
  return NextResponse.json({ message: "Authentication disabled" }, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ message: "Authentication disabled" }, { status: 200 });
}

