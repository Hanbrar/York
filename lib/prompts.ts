import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCompositionPrompt(
  productImageBase64: string,
  sceneImageBase64: string,
  model1ImageBase64: string,
  model2ImageBase64: string,
  userIntent: string
): Promise<string> {
  const systemPrompt = `You are an expert commercial ad director and image generation prompt engineer.
Your job is to analyze reference images and create precise, cinematic image generation prompts.
Always write prompts in the style of professional commercial photography:
- Wide cinematic ratio (2.39:1)
- Soft, flattering commercial lighting (key light + gentle fill)
- Creamy, warm color grade
- Natural depth of field
- Product prominently featured but not forced
Return ONLY the generation prompt. No explanation. No preamble. Max 280 words.`;

  const userMessage = `Analyze these reference images and create a Flux image generation prompt:

USER INTENT: "${userIntent}"

Your prompt must:
1. Place BOTH models naturally in the scene with authentic interaction
2. Feature the product prominently and naturally (held, displayed, or contextually placed)
3. Use cinematic commercial language: "Soft key light rakes across...", "Warm fill reduces shadows..."
4. Specify exact framing: "Wide two-shot", "Medium close-up", etc.
5. End with: "Creamy commercial color grade. No edge lighting. Photorealistic."`;

  const imageContent: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: "text", text: userMessage },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${productImageBase64}`,
        detail: "low",
      },
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${sceneImageBase64}`,
        detail: "low",
      },
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${model1ImageBase64}`,
        detail: "low",
      },
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${model2ImageBase64}`,
        detail: "low",
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: imageContent },
    ],
    max_tokens: 400,
    temperature: 0.7,
  });

  return response.choices[0].message.content?.trim() || userIntent;
}

export async function generateMotionPrompt(
  composedSceneDescription: string,
  userIntent: string
): Promise<string> {
  const systemPrompt = `You are an expert video director specializing in commercial ad production.
Your motion prompts describe subtle, cinematic movement for AI video generation (Kling AI).
Style: slow, purposeful, commercial. Never jarring. Emotionally resonant.
Return ONLY the motion prompt. Max 180 words.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create a Kling AI video motion prompt for a commercial ad.

Scene: ${composedSceneDescription}
Product/intent: "${userIntent}"

Describe:
1. Camera: slow push-in OR gentle pan OR static locked shot with breathing room
2. Characters: subtle natural movement — slight smile, product interaction, eye contact
3. Environment: soft ambient motion (light shift, curtain breath, dust motes)
4. Pacing: deliberate, unhurried — this is a 10-second premium ad clip
5. Emotion: warm, authentic, human connection with the product

End with the emotional feel: "The overall mood is [X]."`,
      },
    ],
    max_tokens: 250,
    temperature: 0.8,
  });

  return response.choices[0].message.content?.trim() || userIntent;
}
