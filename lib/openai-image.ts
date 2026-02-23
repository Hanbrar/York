import OpenAI, { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateComposedImage(
  productB64: string,
  sceneB64: string,
  model1B64: string,
  model2B64: string,
  compositionPrompt: string
): Promise<{ imageBase64: string }> {
  const toImageFile = async (b64: string, name: string) => {
    const buffer = Buffer.from(b64, "base64");
    return toFile(buffer, name, { type: "image/jpeg" });
  };

  const [productFile, sceneFile, model1File, model2File] = await Promise.all([
    toImageFile(productB64, "product.jpg"),
    toImageFile(sceneB64, "scene.jpg"),
    toImageFile(model1B64, "model1.jpg"),
    toImageFile(model2B64, "model2.jpg"),
  ]);

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: [productFile, sceneFile, model1File, model2File],
    prompt: compositionPrompt,
    size: "1536x1024",
    n: 1,
  });

  const imageBase64 = response.data[0].b64_json!;
  return { imageBase64 };
}
