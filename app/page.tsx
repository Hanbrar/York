"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import UploadZone from "@/components/UploadZone";

type Stage = "idle" | "analyzing" | "animating" | "done" | "error";

interface VideoClip {
  taskId: string;
  videoUrl?: string;
  status: string;
}

const POLL_INTERVAL_MS = 4000;
const NUM_CLIPS = 3;

export default function Home() {
  const [productImage, setProductImage] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [model1Image, setModel1Image] = useState<File | null>(null);
  const [model2Image, setModel2Image] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");

  const [stage, setStage] = useState<Stage>("idle");
  const [statusText, setStatusText] = useState("");
  const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Stored after generate for use in all 3 video requests
  const modelRefs = useRef<{ imageBase64: string; model1B64: string; model2B64: string } | null>(null);

  const isReady = productImage && sceneImage && model1Image && model2Image && prompt.trim();
  const isGenerating = stage !== "idle" && stage !== "error" && stage !== "done";

  async function startVideoClip(clipIndex: number): Promise<string> {
    const refs = modelRefs.current!;
    const res = await fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: refs.imageBase64,
        model1B64: refs.model1B64,
        model2B64: refs.model2B64,
        userPrompt: prompt,
        clipIndex,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.taskId;
  }

  async function pollVideoClip(taskId: string): Promise<string> {
    while (true) {
      await sleep(POLL_INTERVAL_MS);
      const res = await fetch(`/api/video/status?id=${taskId}`);
      const data = await res.json();
      if (data.status === "succeed" && data.videoUrl) return data.videoUrl;
      if (data.status === "failed") throw new Error("Video generation failed");
    }
  }

  async function handleGenerate() {
    if (!isReady) return;

    setStage("analyzing");
    setStatusText("Analyzing images and composing your scene...");
    setClips([]);
    setComposedImageUrl(null);
    setErrorMsg("");
    modelRefs.current = null;

    try {
      const formData = new FormData();
      formData.append("productImage", productImage!);
      formData.append("sceneImage", sceneImage!);
      formData.append("model1Image", model1Image!);
      formData.append("model2Image", model2Image!);
      formData.append("prompt", prompt);

      const genRes = await fetch("/api/generate", { method: "POST", body: formData });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error);

      const { imageBase64, model1B64, model2B64 } = genData;

      // Store model refs for video requests
      modelRefs.current = { imageBase64, model1B64, model2B64 };
      setComposedImageUrl(`data:image/png;base64,${imageBase64}`);

      setStage("animating");
      const clipStates: VideoClip[] = Array.from({ length: NUM_CLIPS }, () => ({
        taskId: "",
        status: "pending",
      }));
      setClips([...clipStates]);

      for (let i = 0; i < NUM_CLIPS; i++) {
        setStatusText(`Animating clip ${i + 1} of ${NUM_CLIPS} with Kling Omni...`);
        const taskId = await startVideoClip(i);
        clipStates[i] = { taskId, status: "processing" };
        setClips([...clipStates]);

        const videoUrl = await pollVideoClip(taskId);
        clipStates[i] = { taskId, status: "succeed", videoUrl };
        setClips([...clipStates]);
      }

      setStage("done");
      setStatusText("Your ad is ready.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStage("error");
      setErrorMsg(msg);
    }
  }

  const stageSteps = ["analyzing", "animating", "done"];
  const stageLabels = ["Analyzing & Composing", "Animating", "Done"];
  const currentStepIdx = stageSteps.indexOf(stage);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <Image src="/logo.png" alt="York" width={36} height={36} className="rounded-lg" priority />
        <span className="ml-2.5 text-sm font-semibold text-zinc-800 tracking-tight">York</span>
      </header>

      {/* Main */}
      <main className="pt-24 pb-20 px-4 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl sm:text-6xl font-bold text-zinc-900 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Generate ads as simple
            <br />
            <em className="italic text-zinc-500">as a prompt.</em>
          </h1>
          <p className="mt-4 text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Upload your product, set the scene, add your models — watch AI turn it into a
            polished 30-second video ad.
          </p>
        </div>

        {/* Upload grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <UploadZone label="Product" sublabel="What you're selling" file={productImage} onFileChange={setProductImage} />
          <UploadZone label="Scene" sublabel="The environment" file={sceneImage} onFileChange={setSceneImage} />
          <UploadZone label="Model 1" sublabel="Reference photo" file={model1Image} onFileChange={setModel1Image} />
          <UploadZone label="Model 2" sublabel="Reference photo" file={model2Image} onFileChange={setModel2Image} />
        </div>

        {/* Prompt */}
        <div className="mb-5">
          <textarea
            className="w-full rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur-sm px-5 py-4 text-sm text-zinc-800 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition-all"
            rows={3}
            placeholder="Describe the ad you want. e.g. 'A couple enjoying morning coffee, warm and intimate, Coca-Cola on the table...'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!isReady || isGenerating}
          className="w-full py-4 rounded-2xl bg-zinc-900 text-white text-sm font-semibold tracking-wide hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          {isGenerating ? "Generating..." : "Generate Ad"}
        </button>

        {/* Progress */}
        {stage !== "idle" && stage !== "error" && (
          <div className="mt-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              {stageLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      i < currentStepIdx
                        ? "bg-zinc-900 text-white"
                        : i === currentStepIdx
                        ? "bg-zinc-900 text-white animate-pulse"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {i < currentStepIdx ? "✓ " : ""}{label}
                  </div>
                  {i < stageLabels.length - 1 && (
                    <div className={`h-px w-4 ${i < currentStepIdx ? "bg-zinc-900" : "bg-zinc-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-zinc-400">{statusText}</p>
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Composed image */}
        {composedImageUrl && (
          <div className="mt-8">
            <p className="text-xs text-zinc-400 mb-2 text-center">Composed scene</p>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={composedImageUrl} alt="Composed scene" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Video clips */}
        {clips.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-xs text-zinc-400 text-center">
              {stage === "done" ? "Your 30-second ad — 3 clips" : "Generating video clips..."}
            </p>
            {clips.map((clip, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-zinc-100 shadow-sm bg-white">
                <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600">Clip {i + 1} — 10s</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      clip.status === "succeed"
                        ? "bg-green-50 text-green-600"
                        : clip.status === "processing"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {clip.status === "succeed" ? "Ready" : clip.status === "processing" ? "Generating..." : "Waiting"}
                  </span>
                </div>
                {clip.videoUrl ? (
                  <video src={clip.videoUrl} controls className="w-full aspect-video" playsInline />
                ) : (
                  <div className="aspect-video bg-zinc-50 flex items-center justify-center">
                    <span className="text-xs text-zinc-300">
                      {clip.status === "processing" ? "Generating..." : "Waiting"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
