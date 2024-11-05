import fs from "fs";
import path from "path";
import sharp from "sharp";

type ImageFormat =
   | "jpeg"
   | "jpg"
   | "png"
   | "webp"
   | "gif"
   | "tiff"
   | "tif"
   | "avif"
   | "bmp"
   | "heif"
   | "heic";

interface ImageOptimizationOptions {
   width?: number;
   quality?: number;
   format?: ImageFormat;
   blur?: number;
   keepAspect?: boolean;
   crop?: boolean;
   outputPath?: string;
   grayscale?: boolean;
   trimBlackBorders?: boolean;
   trimThreshold?: number;
   omitOptimized?: boolean;
}

let imagesProcessed = 0;
let imagesFailed = 0;
let startTime: number;
let overallOriginalSize = 0;
let overallOptimizedSize = 0;

async function optimizeImages(
   folderPaths: string[],
   options: ImageOptimizationOptions,
): Promise<void> {
   startTime = Date.now();

   const outputDir = path.resolve(process.cwd(), options.outputPath || ".");
   console.log(`Output directory: ${outputDir}`);

   fs.rmSync(outputDir, { recursive: true, force: true });

   for (const folderPath of folderPaths) {
      console.log(`Processing folder: ${folderPath}`);
      await optimizeImagesInFolder(folderPath, options, outputDir, folderPath);
   }

   const elapsedTime = Date.now() - startTime;
   console.log(
      `Processed ${imagesProcessed} images, failed ${imagesFailed} images in ${elapsedTime / 1000}s`,
   );
   console.log(
      `Original size: ${(overallOriginalSize / 1024).toFixed(2)} MB, optimized size: ${(
         overallOptimizedSize / 1024
      ).toFixed(2)} MB`,
   );
}

async function optimizeImagesInFolder(
   folderPath: string,
   options: ImageOptimizationOptions,
   outputDir: string,
   baseInputPath: string,
): Promise<void> {
   const files = await fs.promises.readdir(folderPath);

   for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
         await optimizeImagesInFolder(
            filePath,
            options,
            outputDir,
            baseInputPath,
         );
      } else if (isImageFile(file)) {
         const relativeImagePath = path.relative(baseInputPath, filePath);
         await optimizeImage(filePath, options, outputDir, relativeImagePath);
      }
   }
}

async function optimizeImage(
   imagePath: string,
   options: ImageOptimizationOptions,
   outputDir: string,
   relativeImagePath: string,
): Promise<void> {
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
   const outputPath = path.join(outputDir, relativeImagePath);

   try {
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

      // Get original metadata and size for logging
      const originalImage = sharp(imagePath);
      const metadata = await originalImage.metadata();
      if (!(metadata.width && metadata.height)) {
         console.error(
            `Error optimizing image: ${imagePath}, could not get dimensions`,
         );
         return;
      }

      const originalResolution = `${metadata.width}x${metadata.height}`;
      const originalFormat = metadata.format;

      // Get original file size in KB using fs.stat
      const originalFileSizeKB =
         (await fs.promises.stat(imagePath)).size / 1024;
      overallOriginalSize += originalFileSizeKB;

      // Set the new dimensions based on the aspect ratio
      let newWidth = width || metadata.width;
      let newHeight = metadata.height; // Default to original height

      if (width && keepAspect) {
         // Calculate the new height to maintain the aspect ratio
         newHeight = Math.round((width / metadata.width) * metadata.height);
      } else if (!width && !keepAspect) {
         // If no width and not keeping aspect, use original dimensions
         newWidth = metadata.width;
         newHeight = metadata.height;
      }

      // Process image with options
      const resizedImage = originalImage.resize(newWidth, newHeight, {
         fit: crop ? "cover" : keepAspect ? "contain" : "fill",
         withoutEnlargement: true,
         position: "center",
      });

      if (trimBlackBorders) {
         resizedImage.trim({ background: "black", threshold: trimThreshold });
      }

      // Set format and output file path
      const outputFilePath = outputPath.replace(
         path.extname(outputPath),
         `.${omitOptimized ? "" : "optimized."}${format || path.extname(outputPath).slice(1)}`,
      );

      if (blur) {
         resizedImage.blur(blur);
      }

      if (grayscale) {
         resizedImage.grayscale();
      }

      // Apply the selected format to the resized image
      if (format) {
         await resizedImage
            // @ts-expect-error - Sharp allows strings here
            .toFormat(format, { quality })
            .toFile(outputFilePath);
      } else {
         await resizedImage.toFile(outputFilePath);
      }

      // Get optimized file size
      const optimizedFileSizeKB =
         (await fs.promises.stat(outputFilePath)).size / 1024;
      overallOptimizedSize += optimizedFileSizeKB;

      // Calculate the percentage change
      const sizeDifferencePercent =
         ((optimizedFileSizeKB - originalFileSizeKB) / originalFileSizeKB) *
         100;
      const sizeDifferenceLabel =
         sizeDifferencePercent >= 0 ? "increase" : "reduction";

      // Calculate estimated load time on slow 4G (1.5 Mbps = 0.1875 MB/s)
      const slow4GSpeed = 0.1875; // MB/s
      const originalLoadTime = originalFileSizeKB / 1024 / slow4GSpeed; // Convert KB to MB
      const optimizedLoadTime = optimizedFileSizeKB / 1024 / slow4GSpeed; // Convert KB to MB

      console.log(`Optimized image: ${imagePath}`);
      console.log(
         `  Resolution: ${originalResolution} -> ${newWidth}x${newHeight}`,
      );
      console.log(`  Format: ${originalFormat} -> ${format || originalFormat}`);
      console.log(
         `  Size: ${originalFileSizeKB.toFixed(2)} KB -> ${optimizedFileSizeKB.toFixed(2)} KB ` +
            `(${Math.abs(sizeDifferencePercent).toFixed(2)}% ${sizeDifferenceLabel})`,
      );
      console.log(
         `  Estimated load time: ${originalLoadTime.toFixed(2)}s -> ${optimizedLoadTime.toFixed(2)}s on slow 4G`,
      );
      console.log(`  ${blur ? `Applied blur of ${blur}px` : ""}`);
      console.log("");
      imagesProcessed++;
   } catch (error) {
      console.error(`Error optimizing image: ${imagePath}`, error);
      imagesFailed++;
   }
}

function isImageFile(fileName: string): boolean {
   const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".svg",
      ".webp",
      ".avif",
   ];
   return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
}

optimizeImages(["images/screenshots/"], {
   quality: 70,
   format: "avif",
   keepAspect: true,
   crop: true,
   outputPath: "src/lib/images/screenshots/",
   trimBlackBorders: true,
   trimThreshold: 10,
});

optimizeImages(["images/bento/"], {
   quality: 70,
   width: 750,
   format: "avif",
   keepAspect: true,
   crop: true,
   outputPath: "src/lib/images/bento/",
   trimBlackBorders: true,
   trimThreshold: 10,
   omitOptimized: true,
});

optimizeImages(["images/screenshots/"], {
   quality: 50,
   width: 750,
   format: "avif",
   keepAspect: true,
   crop: true,
   outputPath: "src/lib/images/thumbnails/",
   trimBlackBorders: true,
   trimThreshold: 10,
});
