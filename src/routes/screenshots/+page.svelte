<script lang="ts">
	import imageMetaData from "$lib/images/screenshots/metadata.json";
	import moreMetaData from "./more-data.json";
	import { browser, dev } from "$app/environment";

	const imageURLs = Object.entries(
		import.meta.glob("$lib/images/screenshots/**/*.avif", {
			eager: true,
			query: "?url",
			import: "default",
		}),
	).map(([key, value]) => ({
		original: key,
		vite: value,
	}));

	const thumbnailURLs = Object.values(
		import.meta.glob("$lib/images/thumbnails/**/*.avif", {
			eager: true,
			query: "?url",
			import: "default",
		}),
	);

	// Create a flat array of all metadata entries with their game info
	const allMetadata = Object.entries(imageMetaData).flatMap(([game, entries]) =>
		entries.map((entry) => ({
			...entry,
			game,
		})),
	);

	const gameToName = {
		cyberpunk: "Cyberpunk 2077",
		forza: "Forza Horizon 5",
		rdr2: "Red Dead Redemption 2",
		rdr: "Red Dead Redemption",
		tmw: "Tell Me Why",
	};

	interface ImageMetadata {
		path: string;
		alt?: string;
		width: number;
		height: number;
		nsfw?: "gore" | "nudity";
		old?: boolean;
		game?: string;
		first?: boolean;
		imageName: string;
	}

	interface Image {
		path: string;
		url: string;
		thumbnail: string;
		metadata: ImageMetadata;
	}

	let images: Image[] = $state([]);
	let seen: string[] = [];

	imageURLs.forEach((_, index) => {
		const path = imageURLs[index].original;
		const metadata = allMetadata.find((meta) => meta.path === path);
		let saw;
		if (!seen.includes(metadata!.game)) {
			saw = true;
			seen.push(metadata!.game);
		}

		const regex = /(?<=screenshots\/[^\/]+\/).*?(?=\.optimized)/;
		const imageName = regex.exec(path)![0];

		const image = {
			path,
			url: imageURLs[index].vite,
			thumbnail: thumbnailURLs[index],
			metadata: {
				...metadata,
				// @ts-ignore
				...moreMetaData[imageName],
				first: saw,
				imageName,
			},
		};

		if (image.metadata.old && !dev) {
			return;
		}

		images.push(image as Image);
	});

	const numOfImages = imageURLs.length;
	const numOfMetadata = allMetadata.length;
	const numOfMoreMetadata = Object.entries(moreMetaData).length;

	if (dev) {
		console.log(
			`Found ${numOfImages} images for ${numOfMetadata} pieces of processed metadata and ${numOfMoreMetadata} captions/nsfw ratings`,
		);

		console.log(images.filter((image) => !image.metadata.alt));
	}

	if (new Set([numOfImages, numOfMetadata, numOfMoreMetadata]).size !== 1) {
		console.error("Number of images, metadata, and moreMetadata must be equal");
	}

	let dialog: HTMLDialogElement = $state()!;
	let loader1: HTMLImageElement;
	let loader2: HTMLImageElement;
	let containers: HTMLDivElement[] = $state([]);
	let selected: number = $state(0);
	let columns = $state(1);
	let games = images.length;
	// svelte-ignore non_reactive_update
	let ro: ResizeObserver;
	$inspect(selected);

	if (browser) {
		ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			columns = getComputedStyle(entry.target)
				.getPropertyValue("grid-template-columns")
				.split(" ").length;
		});

		document.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && containers.includes(e.target as HTMLDivElement)) {
				dialog.showModal();
			}

			if (e.key.includes("Arrow")) {
				e.preventDefault();

				if (dialog.open) keysPressedSinceModalOpened = true;
			} else return;

			if (e.key === "ArrowLeft") {
				selected = (selected - 1 + games) % games;
			} else if (e.key === "ArrowRight") {
				selected = (selected + 1) % games;
			} else if (!dialog.open) {
				if (e.key === "ArrowUp") {
					selected = (selected - columns + games) % games;
				} else if (e.key === "ArrowDown") {
					selected = (selected + columns) % games;
				}
			}

			containers[selected].focus();
			containers[selected].scrollIntoView({ block: "start" });
		});
	}

	function scrollTo(node: HTMLElement) {
		if (location.hash === `#${node.id}`) {
			node.scrollIntoView();
		}
	}

	function openDialog(index: number) {
		selected = index;
		dialog.showModal();
		isDialogOpen = true;
	}

	function transformImageMetadata(images: any[]) {
		return images.reduce((acc, image) => {
			const { nsfw, alt, old } = image.metadata;
			acc[image.metadata.imageName] = { nsfw, alt, old };
			return acc;
		}, {});
	}

	function imageClick(e: MouseEvent, index: number) {
		const nsfwStatus = images[index].metadata.nsfw;
		const oldStatus = images[index].metadata.old;
		const imageName = images[index].metadata.imageName;
		console.log("🚀 ~ imageClick ~ imageName:", imageName);

		// Ctrl + Click for gore, Shift + Click for nudity, Alt + Click for alt text, Ctrl + Shift for "Old"
		if (e.ctrlKey && e.shiftKey && dev) {
			e.preventDefault();
			images[index].metadata.old = !oldStatus;
			if (images[index].metadata.nsfw === undefined) delete images[index].metadata.nsfw;

			console.log("old");

			console.log(transformImageMetadata(images));
			return;
		}

		if (e.ctrlKey && dev) {
			e.preventDefault();
			images[index].metadata.nsfw = nsfwStatus === "gore" ? undefined : "gore";
			if (images[index].metadata.nsfw === undefined) delete images[index].metadata.nsfw;
			console.log(transformImageMetadata(images));
		} else if (e.shiftKey && dev) {
			e.preventDefault();
			images[index].metadata.nsfw = nsfwStatus === "nudity" ? undefined : "nudity";
			if (images[index].metadata.nsfw === undefined) delete images[index].metadata.nsfw;
			console.log(transformImageMetadata(images));
		} else if (e.altKey && dev) {
			e.preventDefault();

			const alt = images[index].metadata.alt;
			const newAlt = prompt("Enter alt text, previous is: " + alt, alt);

			if (newAlt) images[index].metadata.alt = newAlt;
			console.log(transformImageMetadata(images));
		} else openDialog(index);
	}

	let isDialogOpen = $state(false);

	$effect(() => {
		document.body.style.overflow = isDialogOpen ? "hidden" : "auto";
	});

	let keysPressedSinceModalOpened = $state(false);
</script>

<svelte:head>
	<link rel="preconnect" href="https://jazza.dev" />
</svelte:head>

<!-- svelte-ignore a11y_missing_attribute -->
<img hidden bind:this={loader1} />
<!-- svelte-ignore a11y_missing_attribute -->
<img hidden bind:this={loader2} />

<h1>Screenshots</h1>
<h3>SPOILERS!!!</h3>

<ul>
	{#each images as image}
		{#if image.metadata.first}
			<li>
				<a
					class="internal-link"
					href="#{image.metadata.game}"
					onfocus={(e: FocusEvent) => {
						const target = e.target as HTMLAnchorElement;
						target.scrollIntoView();
					}}
					onmousedown={(e) => {
						e.preventDefault();
					}}>{gameToName[image.metadata.game as keyof typeof gameToName]}</a
				>
			</li>
		{/if}
	{/each}
</ul>

<div class="grid" use:ro.observe>
	{#each images as image, index}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="image-container"
			tabindex={0}
			bind:this={containers[index]}
			onfocus={() => {
				loader1.src = image.url;
				if (!keysPressedSinceModalOpened) selected = index;
			}}
		>
			<img
				loading="lazy"
				src={image.thumbnail}
				alt={image.metadata.alt}
				width={image.metadata.width}
				height={image.metadata.height}
				data-nsfw={image.metadata.nsfw}
				id={image.metadata.first ? image.metadata.game : undefined}
				class:blur={image.metadata.nsfw}
				style:opacity={image.metadata.old ? 0.25 : 1}
				onclick={(e) => {
					imageClick(e, index);
				}}
				onmouseenter={() => {
					loader1.src = image.url;
				}}
				use:scrollTo
			/>
		</div>
	{/each}
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclick={() => {
		dialog.close();
	}}
	onclose={() => {
		containers[selected].focus();
		isDialogOpen = false;
		keysPressedSinceModalOpened = false;
	}}
>
	<img
		src={images[selected].url}
		alt={images[selected].metadata.alt}
		width={images[selected].metadata.width}
		height={images[selected].metadata.height}
		onload={() => {
			loader1.src = images[(selected + 1) % games].url;
			loader2.src = images[(selected - 1 + games) % games].url;
		}}
	/>
</dialog>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	h1,
	h3 {
		text-align: center;

		&:is(h3) {
			font-size: 0.9rem;
			margin-block-start: -1rem;
		}
	}

	ul {
		list-style-type: none;
		margin-block-start: 0;
		padding-inline-start: 0;
		margin: 2rem;
		line-height: 1.4rem;

		li {
			margin-top: 0.5rem;

			a {
				scroll-margin: 10rem;
				padding: 0.2rem;
			}
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 1rem;
		width: 100%;
		align-items: center;

		.image-container {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 0;
			background: none;
			height: fit-content;
			outline: transparent 2px solid;
			scroll-margin: 6.2rem;
			cursor: pointer;
			border-radius: 0.75rem;

			&:focus-visible {
				outline-color: var(--secondary);
			}

			:global(img) {
				max-width: 100%;
				height: auto;
				object-fit: contain;
				opacity: 1;
				transition:
					filter 500ms,
					opacity 500ms;
				border-radius: 0.75rem;
				scroll-margin: 10rem;
				opacity: 1;

				&.blur {
					filter: blur(1rem);
					clip-path: inset(0 0 0 0 round 0.75rem);
				}
			}
		}
	}

	dialog {
		border: none;
		background-color: var(--background);
		border-radius: 1.7rem;
		display: flex;
		align-items: center;
		justify-content: center;
		display: none;
		outline: none;
		cursor: pointer;

		&[open] {
			display: initial;
		}
		&::backdrop {
			backdrop-filter: blur(0.75rem);
		}

		img {
			max-width: 95vw;
			max-height: 85vh;
			height: auto;
			width: auto;
			object-fit: contain;
			border-radius: 1rem;
		}
	}
</style>
