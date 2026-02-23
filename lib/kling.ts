import jwt from "jsonwebtoken";

const KLING_BASE_URL = "https://api.klingai.com";

function generateKlingToken(): string {
  const apiKey = process.env.KLING_API_KEY!;
  const apiSecret = process.env.KLING_API_SECRET!;

  const payload = {
    iss: apiKey,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5,
  };

  return jwt.sign(payload, apiSecret, {
    algorithm: "HS256",
    header: { alg: "HS256", typ: "JWT" },
  });
}

export interface KlingVideoTask {
  taskId: string;
  taskStatus: string;
}

export interface KlingVideoResult {
  taskId: string;
  taskStatus: "submitted" | "processing" | "succeed" | "failed";
  videoUrl?: string;
}

// Clip variation prompts — each clip has a different camera angle/focus
const CLIP_SUFFIXES = [
  "Wide establishing shot. Slow push-in toward the models.",
  "Medium two-shot. Models interact naturally with the product. Gentle camera drift right.",
  "Close-up on the product held by <<<image_1>>>. Warm cinematic rack focus. Slow pull back to reveal both models.",
];

export async function createKlingVideo(
  imageBase64: string,   // composed scene from gpt-image-1 (PNG)
  model1B64: string,     // model 1 reference photo (JPEG)
  model2B64: string,     // model 2 reference photo (JPEG)
  motionPrompt: string,
  clipIndex: number = 0
): Promise<KlingVideoTask> {
  const token = generateKlingToken();

  const clipSuffix = CLIP_SUFFIXES[clipIndex] ?? CLIP_SUFFIXES[0];

  // <<<image_1>>> = model 1, <<<image_2>>> = model 2, <<<image_3>>> = composed scene
  const fullPrompt = `<<<image_1>>> and <<<image_2>>> appear together in a premium commercial ad. The setting is shown in <<<image_3>>>. ${motionPrompt} ${clipSuffix} Cinematic color grade. Photorealistic. No text overlays.`;

  const body = {
    model_name: "kling-video-o1",
    prompt: fullPrompt,
    image_list: [
      { image_url: model1B64 },    // image_1 — model 1 face reference
      { image_url: model2B64 },    // image_2 — model 2 face reference
      { image_url: imageBase64 },  // image_3 — composed scene
    ],
    mode: "pro",
    duration: "10",
    aspect_ratio: "16:9",
  };

  const response = await fetch(`${KLING_BASE_URL}/v1/videos/omni-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Kling API error: ${data.message}`);
  }

  return {
    taskId: data.data.task_id,
    taskStatus: data.data.task_status,
  };
}

export async function getKlingVideoStatus(
  taskId: string
): Promise<KlingVideoResult> {
  const token = generateKlingToken();

  const response = await fetch(
    `${KLING_BASE_URL}/v1/videos/omni-video/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling status error: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Kling status error: ${data.message}`);
  }

  const task = data.data;
  const result: KlingVideoResult = {
    taskId: task.task_id,
    taskStatus: task.task_status,
  };

  if (task.task_status === "succeed" && task.task_result?.videos?.length > 0) {
    result.videoUrl = task.task_result.videos[0].url;
  }

  return result;
}
