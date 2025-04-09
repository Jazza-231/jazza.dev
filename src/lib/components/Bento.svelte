<script lang="ts">
	const props = $props();
	const { header, short, content, href, area, children, image, metadata } = props;

	const bentoClass = header.toLowerCase().replaceAll(" ", "-");
</script>

<div class={`bento bento-${bentoClass}`} style={`grid-area: ${area};`}>
	<a {href} aria-label="{header} project page" class:short>
		<div class="text">
			<h3 class="header">{header}</h3>
			<p>{content}</p>
			{#if children}
				<div class="children">
					{@render children()}
				</div>
			{/if}
		</div>
		<div class="image-container">
			<img src={image} alt={header} width={metadata.width} height={metadata.height} />
		</div>
	</a>
</div>

<style>
	.bento a {
		display: flex;
		flex-direction: column;
		padding: 2rem;
		border-radius: 0.5rem;
		backdrop-filter: blur(0.1rem);
		gap: 1rem;
		border: var(--secondary-400) solid 0.2rem;
		box-shadow: var(--secondary-200) 0 0 7rem;
		transition:
			box-shadow 400ms,
			border 400ms;
		text-decoration: none;
		outline: none;

		&:focus {
			outline: none;
		}

		&:hover,
		&:focus {
			border: var(--primary) solid 0.2rem;
			box-shadow: var(--primary-200) 0 0 7rem;

			.header {
				color: var(--text-800);
				text-decoration-color: var(--primary);
			}

			:global(img) {
				transform: scale(1.05);
			}
		}

		.text {
			display: flex;
			flex-direction: column;
		}

		.header {
			font-size: 1.5rem;
			margin-bottom: 0.5rem;
			min-height: 2rem;
			color: var(--primary);
			transition:
				color 200ms,
				text-decoration-color 200ms;
			width: fit-content;
			text-decoration: underline 0.2rem transparent;
			text-underline-offset: 0.2rem;
		}

		.text :not(:first-child) {
			color: var(--text);
			text-decoration: none;
		}

		.image-container:has(:global(img)) {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 15rem;
			margin: auto;
		}

		:global(img) {
			width: 100%;
			height: auto;
			object-fit: contain;
			border-radius: 0.5rem;
			box-shadow: 0 0 0.5rem var(--primary);
			transition: all 0.2s ease-in-out;
		}

		&:global(.short img) {
			max-height: 10rem;
			height: auto;
			position: relative;
		}

		width: auto;
		height: 20rem;
		justify-content: center;
		align-items: center;

		&:not(:global(.short)) {
			flex-direction: row;
			align-items: start;
		}
	}
</style>
