import sharp from "sharp";
import fs from "fs";
import path from "path";

const deleteAndRecreateOutputDir = (outDir: string) => {
   if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true });
   }
   fs.mkdirSync(outDir, { recursive: true });
};

const processImagesRecursively = (dir: string, outDir: string) => {
   const items = fs.readdirSync(dir);

   for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(dir, fullPath); // Get relative path to mirror folder structure
      const outputFilePath = path.join(outDir, relativePath);

      if (fs.statSync(fullPath).isDirectory()) {
         // Recursively process subdirectories
         if (!fs.existsSync(outputFilePath)) {
            fs.mkdirSync(outputFilePath, { recursive: true });
         }
         processImagesRecursively(fullPath, outputFilePath);
      } else if (item.endsWith(".jpg") || item.endsWith(".png")) {
         sharp(fullPath)
            .resize(100)
            .toFile(outputFilePath, (err) => {
               if (err) {
                  console.error(`Error processing ${item}:`, err);
               }
            });
      }
   }
};

const imagePreprocessor = async () => {
   const inputDir = path.resolve("static/images");
   const outputDir = path.resolve("static/low-res");

   deleteAndRecreateOutputDir(outputDir); // Clear and recreate output directory
   processImagesRecursively(inputDir, outputDir); // Start processing
   console.log("Image preprocessing complete.");
};

// Vite plugin
export default function imageProcessingPlugin() {
   return {
      name: "vite-image-processing-plugin",
      buildStart() {
         imagePreprocessor();
      },
   };
}
