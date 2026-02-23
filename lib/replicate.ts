import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
}

export async function createComposePrediction(
  sceneImageBase64: string,
  compositionPrompt: string
): Promise<{ predictionId: string }> {
  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-kontext-pro",
    input: {
      prompt: compositionPrompt,
      input_image: `data:image/jpeg;base64,${sceneImageBase64}`,
      output_format: "jpg",
      output_quality: 95,
      safety_tolerance: 2,
      aspect_ratio: "16:9",
    },
  });

  return { predictionId: prediction.id };
}

export async function getComposePrediction(
  predictionId: string
): Promise<ReplicatePrediction> {
  const prediction = await replicate.predictions.get(predictionId);

  return {
    id: prediction.id,
    status: prediction.status as ReplicatePrediction["status"],
    output: prediction.output as string | string[] | undefined,
    error: prediction.error as string | undefined,
  };
}
