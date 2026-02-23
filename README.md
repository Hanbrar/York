<div align="center">
  <img src="public/logo.png" alt="York" width="64" />
  <h1>York AI</h1>
  <p><strong>AI Ad Generator</strong></p>
  <p><sub>Not actively building this right now — shipped it as a proof of concept and may revisit in a week or two. This is the current build.</sub></p>
</div>

---

## Demo

https://github.com/user-attachments/assets/REPLACE_WITH_YOUR_VIDEO_ID

> To embed your demo: drag & drop the MP4 into any GitHub Issue comment box, copy the URL it generates, and replace the line above with it.

---

## What it does

Upload a **product image**, a **scene**, and **two model reference photos** + a text prompt. York composes them into a cinematic still frame and animates it into a 30-second video ad — three 10-second clips.

| Step | Model | What happens |
|---|---|---|
| Analyze | GPT-4o-mini vision | Reads all 4 images, writes a cinematic composition prompt |
| Compose | gpt-image-1 | Renders all 4 references into one 16:9 cinematic frame |
| Animate | Kling Video O1 (Omni) | Animates with face-consistent model references × 3 clips |

---

## Running locally

**Prerequisites:** Node.js 18+, API keys for OpenAI and Kling AI.

```bash
git clone https://github.com/Hanbrar/York.git
cd York
npm install
```

Copy the env example and fill in your keys:

```bash
cp .env.example .env.local
```

```env
OPENAI_API_KEY=        # platform.openai.com/api-keys
KLING_API_KEY=         # klingai.com → API section
KLING_API_SECRET=      # klingai.com → API section
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload 4 images, write a prompt, hit **Generate Ad**.
