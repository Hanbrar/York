import { NextRequest, NextResponse } from "next/server";
import { generateCompositionPrompt } from "@/lib/prompts";
import { generateComposedImage } from "@/lib/openai-image";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const productFile = formData.get("productImage") as File | null;
    const sceneFile = formData.get("sceneImage") as File | null;
    const model1File = formData.get("model1Image") as File | null;
    const model2File = formData.get("model2Image") as File | null;
    const userPrompt = formData.get("prompt") as string;

    if (!productFile || !sceneFile || !model1File || !model2File) {
      return NextResponse.json(
        { error: "All 4 images are required." },
        { status: 400 }
      );
    }

    if (!userPrompt?.trim()) {
      return NextResponse.json(
        { error: "A prompt describing your ad is required." },
        { status: 400 }
      );
    }

    const [productB64, sceneB64, model1B64, model2B64] = await Promise.all([
      fileToBase64(productFile),
      fileToBase64(sceneFile),
      fileToBase64(model1File),
      fileToBase64(model2File),
    ]);

    // GPT-4o-mini vision → cinematic composition prompt
    const compositionPrompt = await generateCompositionPrompt(
      productB64,
      sceneB64,
      model1B64,
      model2B64,
      userPrompt
    );

    // gpt-image-1 composes all 4 reference images into one cinematic frame
    const { imageBase64 } = await generateComposedImage(
      productB64,
      sceneB64,
      model1B64,
      model2B64,
      compositionPrompt
    );

    // Return model images so Kling Omni can use them for face consistency
    return NextResponse.json({
      imageBase64,
      model1B64,
      model2B64,
      compositionPrompt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
