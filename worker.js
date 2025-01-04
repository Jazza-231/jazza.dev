// worker.ts
import { workerData, parentPort } from "worker_threads";
import sharp from "sharp";
import fs from "fs";
import path from "path";

async function processImage() {
   const { imagePath, options, outputDir, relativeImagePath } = workerData;
   const {
      width,
      quality,
      format,
      blur,
      grayscale,
      keepAspect,
      crop,
      trimBlackBorders,
      trimThreshold,
      omitOptimized,
   } = options;

   try {
      // Verify input file exists
      if (!fs.existsSync(imagePath)) {
         throw new Error(`Input file does not exist: ${imagePath}`);
      }

      // Create output directory
      const outputPath = path.join(
         outputDir,
         relativeImagePath.replace(
            path.extname(relativeImagePath),
            `.${omitOptimized ? "" : "optimized."}${format || path.extname(relativeImagePath).slice(1)}`,
         ),
      );

      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

      // Get original metadata and size
      const originalImage = sharp(imagePath);
      const metadata = await originalImage.metadata();

      if (!metadata.width || !metadata.height) {
         throw new Error("Could not get image dimensions");
      }

      // Calculate new dimensions
      let newWidth = width || metadata.width;
      let newHeight = metadata.height;

      if (width && keepAspect) {
         newHeight = Math.round((width / metadata.width) * metadata.height);
      } else if (!width && !keepAspect) {
         newWidth = metadata.width;
         newHeight = metadata.height;
      }

      // Process image
      let processedImage = originalImage.resize(newWidth, newHeight, {
         fit: crop ? "cover" : keepAspect ? "contain" : "fill",
         withoutEnlargement: true,
         position: "center",
      });

      if (trimBlackBorders) {
         processedImage = processedImage.trim({
            background: "black",
            threshold: trimThreshold,
         });
      }

      if (blur) {
         processedImage = processedImage.blur(blur);
      }

      if (grayscale) {
         processedImage = processedImage.grayscale();
      }

      // Save processed image with retries
      const maxRetries = 3;
      let retryCount = 0;
      let savedSuccessfully = false;

      while (retryCount < maxRetries && !savedSuccessfully) {
         try {
            if (format) {
               await processedImage
                  // @ts-expect-error - Sharp allows strings here
                  .toFormat(format, { quality })
                  .toFile(outputPath);
            } else {
               await processedImage.toFile(outputPath);
            }
            savedSuccessfully = true;
         } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
               throw error;
            }
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1_000));
         }
      }

      // Verify output file exists and has size
      const outputStats = await fs.promises.stat(outputPath);
      if (outputStats.size === 0) {
         throw new Error("Output file was created but is empty");
      }

      // Get final metadata
      const finalMetadata = await sharp(outputPath).metadata();
      const originalSize = (await fs.promises.stat(imagePath)).size;
      const optimizedSize = outputStats.size;

      // Send result back to main thread
      parentPort?.postMessage({
         success: true,
         metadata: {
            width: finalMetadata.width || newWidth,
            height: finalMetadata.height || newHeight,
            originalFormat: metadata.format,
            originalResolution: `${metadata.width}x${metadata.height}`,
         },
         stats: {
            originalSize,
            optimizedSize,
            format: format || metadata.format,
         },
      });
   } catch (error) {
      console.error(`Worker error processing ${imagePath}:`, error);
      parentPort?.postMessage({
         success: false,
         error: error instanceof Error ? error.message : "Unknown error",
      });
   }
}

processImage();
