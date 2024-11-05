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
      await fs.promises.mkdir(
         path.dirname(path.join(outputDir, relativeImagePath)),
         { recursive: true },
      );

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

      // Set output path
      const outputPath = path.join(
         outputDir,
         relativeImagePath.replace(
            path.extname(relativeImagePath),
            `.${omitOptimized ? "" : "optimized."}${format || path.extname(relativeImagePath).slice(1)}`,
         ),
      );

      // Save processed image
      if (format) {
         await processedImage
            // @ts-expect-error - Sharp allows strings here
            .toFormat(format, { quality })
            .toFile(outputPath);
      } else {
         await processedImage.toFile(outputPath);
      }

      // Get final metadata
      const finalMetadata = await sharp(outputPath).metadata();
      const originalSize = (await fs.promises.stat(imagePath)).size;
      const optimizedSize = (await fs.promises.stat(outputPath)).size;

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
      parentPort?.postMessage({ success: false });
   }
}

processImage();
