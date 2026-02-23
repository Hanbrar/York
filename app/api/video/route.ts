import { NextRequest, NextResponse } from "next/server";
import { generateMotionPrompt } from "@/lib/prompts";
import { createKlingVideo } from "@/lib/kling";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, model1B64, model2B64, userPrompt, clipIndex } = await req.json();

    if (!imageBase64 || !model1B64 || !model2B64) {
      return NextResponse.json(
        { error: "imageBase64, model1B64, and model2B64 are required" },
        { status: 400 }
      );
    }

    // GPT-4o-mini generates cinematic motion description for this clip
    const motionPrompt = await generateMotionPrompt(
      `A composed commercial ad scene featuring: ${userPrompt || "a product advertisement"}`,
      userPrompt || "commercial ad"
    );

    const task = await createKlingVideo(
      imageBase64,
      model1B64,
      model2B64,
      motionPrompt,
      clipIndex ?? 0
    );

    return NextResponse.json({
      taskId: task.taskId,
      motionPrompt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/video]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
