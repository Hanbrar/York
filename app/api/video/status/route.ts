import { NextRequest, NextResponse } from "next/server";
import { getKlingVideoStatus } from "@/lib/kling";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing task id" }, { status: 400 });
  }

  try {
    const result = await getKlingVideoStatus(id);

    return NextResponse.json({
      status: result.taskStatus,
      videoUrl: result.videoUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
