import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";
import { cpus } from "os";

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

interface ImageMetadata {
   width: number;
   height: number;
   game: string;
   path: string;
}

interface GameMetadata {
   [game: string]: ImageMetadata[];
}

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
   outputMetadata?: boolean;
}

interface WorkerData {
   imagePath: string;
   options: ImageOptimizationOptions;
   outputDir: string;
   relativeImagePath: string;
}

interface WorkerResult {
   success: boolean;
   metadata?: {
      width: number;
      height: number;
      originalFormat: string;
      originalResolution: string;
   };
   stats?: {
      originalSize: number;
      optimizedSize: number;
      format: string;
   };
}

class WorkerPool {
   private workers: Worker[] = [];
   private queue: WorkerData[] = [];
   private activeWorkers = 0;
   private results: Map<string, WorkerResult> = new Map();
   private resolvePromise?: (value: Map<string, WorkerResult>) => void;

   constructor(private numWorkers: number) {}

   private async logResult(task: WorkerData, result: WorkerResult) {
      if (result.success && result.metadata && result.stats) {
         const { originalResolution } = result.metadata;
         const { originalSize, optimizedSize, format } = result.stats;

         // Convert bytes to KB
         const originalSizeKB = originalSize / 1024;
         const optimizedSizeKB = optimizedSize / 1024;

         // Calculate size difference percentage
         const sizeDifferencePercent =
            ((optimizedSizeKB - originalSizeKB) / originalSizeKB) * 100;
         const sizeDifferenceLabel =
            sizeDifferencePercent >= 0 ? "increase" : "reduction";

         // Calculate load times (1.5 Mbps = 0.1875 MB/s)
         const slow4GSpeed = 0.1875; // MB/s
         const originalLoadTime = originalSizeKB / 1024 / slow4GSpeed;
         const optimizedLoadTime = optimizedSizeKB / 1024 / slow4GSpeed;

         console.log(`Optimized image: ${task.imagePath}`);
         console.log(
            `  Resolution: ${originalResolution} -> ${result.metadata.width}x${result.metadata.height}`,
         );
         console.log(
            `  Format: ${result.metadata.originalFormat} -> ${format}`,
         );
         console.log(
            `  Size: ${originalSizeKB.toFixed(2)} KB -> ${optimizedSizeKB.toFixed(2)} KB ` +
               `(${Math.abs(sizeDifferencePercent).toFixed(2)}% ${sizeDifferenceLabel})`,
         );
         console.log(
            `  Estimated load time: ${originalLoadTime.toFixed(2)}s -> ${optimizedLoadTime.toFixed(2)}s on slow 4G`,
         );
         console.log(
            `  ${task.options.blur ? `Applied blur of ${task.options.blur}px` : ""}`,
         );
         console.log("");
      }
   }

   async process(tasks: WorkerData[]): Promise<Map<string, WorkerResult>> {
      this.queue.push(...tasks);

      return new Promise((resolve) => {
         this.resolvePromise = resolve;
         for (let i = 0; i < this.numWorkers; i++) {
            this.createWorker();
         }
      });
   }

   private createWorker() {
      if (this.queue.length === 0 && this.activeWorkers === 0) {
         if (this.resolvePromise) {
            this.resolvePromise(this.results);
         }
         return;
      }

      if (this.queue.length === 0) return;

      const task = this.queue.shift()!;
      const worker = new Worker("./worker.js", {
         workerData: task,
      });

      this.activeWorkers++;

      worker.on("message", async (result: WorkerResult) => {
         this.results.set(task.imagePath, result);
         await this.logResult(task, result);
      });

      worker.on("error", (error) => {
         console.error(`Worker error processing ${task.imagePath}:`, error);
         this.results.set(task.imagePath, { success: false });
      });

      worker.on("exit", () => {
         this.activeWorkers--;
         this.createWorker();
      });
   }
}

async function optimizeImages(
   folderPaths: string[],
   options: ImageOptimizationOptions,
): Promise<void> {
   const startTime = Date.now();
   const metadata: GameMetadata = {};
   let imagesProcessed = 0;
   let imagesFailed = 0;
   let overallOriginalSize = 0;
   let overallOptimizedSize = 0;

   const outputDir = path.resolve(process.cwd(), options.outputPath || ".");
   console.log(`Output directory: ${outputDir}`);

   fs.rmSync(outputDir, { recursive: true, force: true });

   // Collect all image tasks
   const tasks: WorkerData[] = [];
   for (const folderPath of folderPaths) {
      await collectImageTasks(
         folderPath,
         options,
         outputDir,
         folderPath,
         tasks,
      );
   }

   // Process images
   const workerPool = new WorkerPool(NUM_WORKERS);
   console.log(
      `Processing with ${USE_MULTITHREADING ? "multithreading enabled" : "single thread"} (${NUM_WORKERS} worker${NUM_WORKERS > 1 ? "s" : ""})`,
   );
   const results = await workerPool.process(tasks);

   // Process results
   for (const [imagePath, result] of results) {
      if (result.success && result.metadata && result.stats) {
         imagesProcessed++;
         overallOriginalSize += result.stats.originalSize;
         overallOptimizedSize += result.stats.optimizedSize;

         // Update metadata with filename
         const game =
            path
               .relative(folderPaths[0], path.dirname(imagePath))
               .split(path.sep)[0] || "default";

         const baseFilename = path.basename(imagePath, path.extname(imagePath));
         const outputFormat =
            options.format || path.extname(imagePath).slice(1);
         const outputFilename = options.omitOptimized
            ? `${baseFilename}.${outputFormat}`
            : `${baseFilename}.optimized.${outputFormat}`;

         if (!metadata[game]) {
            metadata[game] = [];
         }
         metadata[game].push({
            width: result.metadata.width,
            height: result.metadata.height,
            game,
            path: `/${options.outputPath}${game}/${outputFilename}`, // Updated path
         });
      } else {
         imagesFailed++;
      }
   }

   // Save metadata
   if (options.outputMetadata) {
      const metadataPath = path.join(outputDir, "screenshots-metadata.json");
      await fs.promises.writeFile(
         metadataPath,
         JSON.stringify(metadata, null, 2),
      );
   }

   const elapsedTime = Date.now() - startTime;
   const originalSizeMB = overallOriginalSize / (1024 * 1024);
   const optimizedSizeMB = overallOptimizedSize / (1024 * 1024);

   console.log(
      `Processed ${imagesProcessed} images, failed ${imagesFailed} images in ${elapsedTime / 1000}s`,
   );
   console.log(
      `Original size: ${originalSizeMB.toFixed(2)} MB, optimized size: ${optimizedSizeMB.toFixed(2)} MB`,
   );
}

async function collectImageTasks(
   folderPath: string,
   options: ImageOptimizationOptions,
   outputDir: string,
   baseInputPath: string,
   tasks: WorkerData[],
): Promise<void> {
   const files = await fs.promises.readdir(folderPath);

   for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
         await collectImageTasks(
            filePath,
            options,
            outputDir,
            baseInputPath,
            tasks,
         );
      } else if (isImageFile(file)) {
         const relativeImagePath = path.relative(baseInputPath, filePath);
         tasks.push({
            imagePath: filePath,
            options,
            outputDir,
            relativeImagePath,
         });
      }
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

// Add configuration constant at the top level
const USE_MULTITHREADING = true; // Set to false to disable multithreading
const NUM_WORKERS = USE_MULTITHREADING ? cpus().length : 1;

// Main execution
console.log("\n=== Starting Image Optimization ===");
console.log(
   `Mode: ${USE_MULTITHREADING ? "Multithreading" : "Single thread"} (${NUM_WORKERS} worker${NUM_WORKERS > 1 ? "s" : ""})`,
);
const totalStart = Date.now();

await optimizeImages(["images/screenshots/"], {
   quality: 70,
   format: "avif",
   keepAspect: true,
   crop: true,
   outputPath: "src/lib/images/screenshots/",
   trimBlackBorders: true,
   trimThreshold: 10,
   outputMetadata: true,
});

await optimizeImages(["images/bento/"], {
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

await optimizeImages(["images/screenshots/"], {
   quality: 50,
   width: 750,
   format: "avif",
   keepAspect: true,
   crop: true,
   outputPath: "src/lib/images/thumbnails/",
   trimBlackBorders: true,
   trimThreshold: 10,
});

console.log(
   `\n=== Image Optimization Complete (${((Date.now() - totalStart) / 1000).toFixed(2)}s) ===`,
);
