<script lang="ts">
	import NewLaptop from "$lib/components/NewLaptop.svelte";
</script>

<div class="title">
	<h1 class="rig">My Rig</h1>
</div>

<div class="loading">
	<!-- From Uiverse.io by bociKond -->
	<div class="spinner">
		<div></div>
		<div></div>
		<div></div>
		<div></div>
		<div></div>
		<div></div>
	</div>
</div>

<div class="laptop">
	<NewLaptop />
</div>

<style>
	.title,
	.loading {
		text-align: center;
		opacity: 1;
		transition: opacity 500ms;
		display: flex;
		justify-content: center;
		position: relative;
		z-index: -1;
	}

	.loading {
		padding-top: 2.5rem;
	}

	.rig {
		margin: 0;
	}

	.laptop {
		height: 1000px;
		position: relative;
		opacity: 0;
		transition: opacity 1000ms;
		margin-block-start: -10rem;
	}

	:global(.laptop.done) {
		opacity: 1;
	}

	:global(.loading.done) {
		opacity: 0;
	}

	/* From Uiverse.io by bociKond */
	.spinner {
		width: 70.4px;
		height: 70.4px;
		--clr: rgb(247, 197, 159);
		--clr-alpha: rgb(247, 197, 159, 0.1);
		animation: spinner 2s infinite ease;
		transform-style: preserve-3d;
	}

	.spinner > div {
		background-color: var(--clr-alpha);
		height: 100%;
		position: absolute;
		width: 100%;
		border: 3.5px solid var(--clr);
	}

	.spinner div:nth-of-type(1) {
		transform: translateZ(-35.2px) rotateY(180deg);
	}

	.spinner div:nth-of-type(2) {
		transform: rotateY(-270deg) translateX(50%);
		transform-origin: top right;
	}

	.spinner div:nth-of-type(3) {
		transform: rotateY(270deg) translateX(-50%);
		transform-origin: center left;
	}

	.spinner div:nth-of-type(4) {
		transform: rotateX(90deg) translateY(-50%);
		transform-origin: top center;
	}

	.spinner div:nth-of-type(5) {
		transform: rotateX(-90deg) translateY(50%);
		transform-origin: bottom center;
	}

	.spinner div:nth-of-type(6) {
		transform: translateZ(35.2px);
	}

	@keyframes spinner {
		0% {
			transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
		}

		50% {
			transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
		}

		100% {
			transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
		}
	}
</style>
