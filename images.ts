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
			const originalSizeKB = originalSize / 1_024;
			const optimizedSizeKB = optimizedSize / 1_024;

			// Calculate size difference percentage
			const sizeDifferencePercent = ((optimizedSizeKB - originalSizeKB) / originalSizeKB) * 100;
			const sizeDifferenceLabel = sizeDifferencePercent >= 0 ? "increase" : "reduction";

			// Calculate load times (1.5 Mbps = 0.1_875 MB/s)
			const slow4GSpeed = 0.1_875; // MB/s
			const originalLoadTime = originalSizeKB / 1_024 / slow4GSpeed;
			const optimizedLoadTime = optimizedSizeKB / 1_024 / slow4GSpeed;

			console.log(`Optimized image: ${task.imagePath}`);
			console.log(
				`  Resolution: ${originalResolution} -> ${result.metadata.width}x${result.metadata.height}`,
			);
			console.log(`  Format: ${result.metadata.originalFormat} -> ${format}`);
			console.log(
				`  Size: ${originalSizeKB.toFixed(2)} KB -> ${optimizedSizeKB.toFixed(2)} KB ` +
					`(${Math.abs(sizeDifferencePercent).toFixed(2)}% ${sizeDifferenceLabel})`,
			);
			console.log(
				`  Estimated load time: ${originalLoadTime.toFixed(2)}s -> ${optimizedLoadTime.toFixed(2)}s on slow 4G`,
			);
			console.log(`  ${task.options.blur ? `Applied blur of ${task.options.blur}px` : ""}`);
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
	let imagesSkipped = 0;
	let overallOriginalSize = 0;
	let overallOptimizedSize = 0;

	const outputDir = path.resolve(process.cwd(), options.outputPath || ".");
	console.log(`Output directory: ${outputDir}`);

	// Only delete the output directory if we're not skipping existing images
	if (!SKIP_EXISTING) {
		fs.rmSync(outputDir, { recursive: true, force: true });
	}

	// Create output directory if it doesn't exist
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Collect all image tasks
	const tasks: WorkerData[] = [];
	for (const folderPath of folderPaths) {
		await collectImageTasks(folderPath, options, outputDir, folderPath, tasks);
	}

	// Filter out tasks for existing files if SKIP_EXISTING is true
	const filteredTasks = tasks.filter((task) => {
		if (!SKIP_EXISTING) return true;

		const baseFilename = path.basename(task.imagePath, path.extname(task.imagePath));
		const outputFormat = options.format || path.extname(task.imagePath).slice(1);
		const outputFilename = options.omitOptimized
			? `${baseFilename}.${outputFormat}`
			: `${baseFilename}.optimized.${outputFormat}`;

		const relativePath = path.dirname(task.relativeImagePath);
		const outputPath = path.join(outputDir, relativePath, outputFilename);

		if (fs.existsSync(outputPath)) {
			imagesSkipped++;
			return false;
		}
		return true;
	});

	// Process images
	const workerPool = new WorkerPool(NUM_WORKERS);
	console.log(
		`Processing with ${USE_MULTITHREADING ? "multithreading enabled" : "single thread"} (${NUM_WORKERS} worker${NUM_WORKERS > 1 ? "s" : ""})`,
	);
	const results = await workerPool.process(filteredTasks);

	// Process results
	for (const [imagePath, result] of results) {
		if (result.success && result.metadata && result.stats) {
			imagesProcessed++;
			overallOriginalSize += result.stats.originalSize;
			overallOptimizedSize += result.stats.optimizedSize;

			// Update metadata with filename
			const game =
				path.relative(folderPaths[0], path.dirname(imagePath)).split(path.sep)[0] || "default";

			const baseFilename = path.basename(imagePath, path.extname(imagePath));
			const outputFormat = options.format || path.extname(imagePath).slice(1);
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
				path: `/${options.outputPath}${game}/${outputFilename}`,
			});
		} else {
			imagesFailed++;
		}
	}

	// Save metadata
	if (options.outputMetadata) {
		const metadataPath = path.join(outputDir, "metadata.json");

		let finalMetadata: GameMetadata = {};

		if (fs.existsSync(metadataPath)) {
			// Read existing metadata
			const existingData = await fs.promises.readFile(metadataPath, "utf-8");
			finalMetadata = JSON.parse(existingData);
		}

		// Update finalMetadata with new data
		for (const [game, newEntries] of Object.entries(metadata)) {
			if (!finalMetadata[game]) {
				finalMetadata[game] = [];
			}

			// Create a map of existing paths for quick lookup
			const existingPaths = new Map(finalMetadata[game].map((entry) => [entry.path, entry]));

			for (const newEntry of newEntries) {
				// Override the existing entry if the path matches
				existingPaths.set(newEntry.path, newEntry);
			}

			// Convert the map back to an array and update the game metadata
			finalMetadata[game] = Array.from(existingPaths.values());
		}

		// Write the updated metadata to file
		await fs.promises.writeFile(metadataPath, JSON.stringify(finalMetadata, null, 2));
	}

	const elapsedTime = Date.now() - startTime;
	const originalSizeMB = overallOriginalSize / (1_024 * 1_024);
	const optimizedSizeMB = overallOptimizedSize / (1_024 * 1_024);

	console.log(
		`Processed ${imagesProcessed} images, skipped ${imagesSkipped} images, failed ${imagesFailed} images in ${elapsedTime / 1_000}s`,
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
			await collectImageTasks(filePath, options, outputDir, baseInputPath, tasks);
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
	const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif"];
	return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
}

// Add configuration constants at the top level
const USE_MULTITHREADING = true; // Set to false to disable multithreading
const SKIP_EXISTING = true; // Set to false to rebuild all images
const NUM_WORKERS = USE_MULTITHREADING ? cpus().length : 1;

// Main execution
console.log("\n=== Starting Image Optimization ===");
console.log(
	`Mode: ${USE_MULTITHREADING ? "Multithreading" : "Single thread"} (${NUM_WORKERS} worker${NUM_WORKERS > 1 ? "s" : ""})`,
);
console.log(`Skip existing: ${SKIP_EXISTING ? "enabled" : "disabled"}`);
const totalStart = Date.now();

await optimizeImages(["images/screenshots/"], {
	quality: 60,
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
	omitOptimized: true,
	outputMetadata: true,
});

await optimizeImages(["images/screenshots/"], {
	quality: 50,
	width: 600,
	format: "avif",
	keepAspect: true,
	crop: true,
	outputPath: "src/lib/images/thumbnails/",
	trimBlackBorders: true,
	trimThreshold: 10,
});

console.log(
	`\n=== Image Optimization Complete (${((Date.now() - totalStart) / 1_000).toFixed(2)}s) ===`,
);
