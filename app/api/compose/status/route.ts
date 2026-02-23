import { NextResponse } from "next/server";

// This route is no longer used — image composition is now synchronous via gpt-image-1
export async function GET() {
  return NextResponse.json({ error: "Deprecated" }, { status: 410 });
}
