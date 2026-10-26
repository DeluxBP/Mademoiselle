import { config as loadEnv } from "dotenv";
import { fal } from "@fal-ai/client";

loadEnv({ path: ".env.local", quiet: true });

if (!process.env.FAL_KEY?.includes(":")) {
  console.error("FAL_KEY is missing or not in key-id:key-secret format (set it in .env.local).");
  process.exit(1);
}

fal.config({ credentials: process.env.FAL_KEY });

try {
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: "A cinematic scene at sunset",
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
    },
    logs: false,
  });

  const flagged = result.data.has_nsfw_concepts?.some(Boolean);
  const url = result.data.images?.[0]?.url;
  if (flagged) {
    console.error(`Request ${result.requestId} was flagged by the safety checker. No image generated.`);
    process.exit(1);
  }
  if (!url) {
    console.error(`Request ${result.requestId} completed but returned no image URL.`);
    process.exit(1);
  }
  console.log(url);
} catch (err) {
  console.error(`Generation error: ${err instanceof Error ? `${err.name}: ${err.message}` : "unknown error"}`);
  process.exit(1);
}
