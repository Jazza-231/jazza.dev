import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { enhancedImages } from "@sveltejs/enhanced-img";
import imageProcessingPlugin from "./image-processor";

export default defineConfig({
   plugins: [enhancedImages(), sveltekit(), imageProcessingPlugin()],
   test: {
      include: ["src/**/*.{test,spec}.{js,ts}"],
   },
});
