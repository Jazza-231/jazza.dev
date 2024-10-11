import sharp from "sharp";
import fs from "fs";
import path from "path";

const deleteAndRecreateOutputDir = async (outDir: string) => {
   if (fs.existsSync(outDir)) {
      try {
         fs.rmSync(outDir, { recursive: true });
      } catch (error) {
         console.error(`Failed to remove directory ${outDir}:`, error);
      }
   }
   fs.mkdirSync(outDir, { recursive: true });
};

const processImagesRecursively = (dir: string, outDir: string) => {
   const items = fs.readdirSync(dir);

   for (const item of items) {
      const fullPath = path.join(dir, item);
      const outputFilePath = path.join(outDir, item); // Directly using item

      if (fs.statSync(fullPath).isDirectory()) {
         // Recursively process subdirectories
         const newOutDir = path.join(outDir, item); // Create a new output directory
         if (!fs.existsSync(newOutDir)) {
            fs.mkdirSync(newOutDir, { recursive: true });
         }
         processImagesRecursively(fullPath, newOutDir); // Pass the new output directory
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

async function cropImages(inputDir: string, outputDir: string) {
   const files = fs.readdirSync(inputDir);

   for (const file of files) {
      const inputFilePath = path.join(inputDir, file);
      const outputFilePath = path.join(outputDir, file);

      if (fs.statSync(inputFilePath).isFile()) {
         try {
            const image = sharp(inputFilePath);
            const { data, info } = await image
               .raw()
               .toBuffer({ resolveWithObject: true });

            const { width, height, channels } = info;

            const isBlack = (
               r: number,
               g: number,
               b: number,
               threshold: number = 10,
            ) => {
               return r < threshold && g < threshold && b < threshold;
            };

            let top = 0,
               bottom = height - 1,
               left = 0,
               right = width - 1;

            // Find top
            for (let y = 0; y < height; y++) {
               let rowIsBlack = true;
               for (let x = 0; x < width; x++) {
                  const idx = (y * width + x) * channels;
                  if (!isBlack(data[idx], data[idx + 1], data[idx + 2])) {
                     rowIsBlack = false;
                     break;
                  }
               }
               if (!rowIsBlack) {
                  top = y;
                  break;
               }
            }

            // Find bottom
            for (let y = height - 1; y >= 0; y--) {
               let rowIsBlack = true;
               for (let x = 0; x < width; x++) {
                  const idx = (y * width + x) * channels;
                  if (!isBlack(data[idx], data[idx + 1], data[idx + 2])) {
                     rowIsBlack = false;
                     break;
                  }
               }
               if (!rowIsBlack) {
                  bottom = y;
                  break;
               }
            }

            // Find left
            for (let x = 0; x < width; x++) {
               let colIsBlack = true;
               for (let y = 0; y < height; y++) {
                  const idx = (y * width + x) * channels;
                  if (!isBlack(data[idx], data[idx + 1], data[idx + 2])) {
                     colIsBlack = false;
                     break;
                  }
               }
               if (!colIsBlack) {
                  left = x;
                  break;
               }
            }

            // Find right
            for (let x = width - 1; x >= 0; x--) {
               let colIsBlack = true;
               for (let y = 0; y < height; y++) {
                  const idx = (y * width + x) * channels;
                  if (!isBlack(data[idx], data[idx + 1], data[idx + 2])) {
                     colIsBlack = false;
                     break;
                  }
               }
               if (!colIsBlack) {
                  right = x;
                  break;
               }
            }

            const croppedImage = sharp(inputFilePath).extract({
               left,
               top,
               width: right - left + 1,
               height: bottom - top + 1,
            });

            await croppedImage.toFile(outputFilePath);
         } catch (err) {
            console.error(`Failed to process image: ${file}`, err);
         }
      }
   }
}

const imageCropper = async () => {
   const inputDir = path.resolve("src/lib/images/screenshots/");
   const outputDir = path.resolve("src/lib/images/screenshots/cropped/");

   await deleteAndRecreateOutputDir(outputDir);
   await cropImages(inputDir, outputDir);
   console.log("Image cropping complete.");
};

const imageSizer = async () => {
   let inputDir = path.resolve("static/images/");
   let outputDir = path.resolve("static/low-res/");

   await deleteAndRecreateOutputDir(outputDir);
   await processImagesRecursively(inputDir, outputDir);

   inputDir = path.resolve("src/lib/images/screenshots/cropped/");
   outputDir = path.resolve("src/lib/low-res/screenshots/cropped/");

   await deleteAndRecreateOutputDir(outputDir);
   await processImagesRecursively(inputDir, outputDir);

   console.log("Image sizing complete.");
};

// Vite plugin
export default function imageProcessingPlugin() {
   return {
      name: "vite-image-processing-plugin",
      async buildStart() {
         await imageCropper();
         await imageSizer();
      },
   };
}
