<script lang="ts">
	const { children } = $props();

	import "./vars.css";
	import "./global.css";
	import Header from "./Header.svelte";
	import Footer from "./Footer.svelte";
	import { page } from "$app/stores";
	import { toTitleCase } from "$lib";

	let name = "jazza.dev";
	let title = $derived([name, $page.url.pathname.split("/")[1]].filter(Boolean).join(" - "));

	const widerPaths = ["/screenshots", "/example"];
</script>

<svelte:head>
	<title>{toTitleCase(title)}</title>
</svelte:head>

<Header></Header>

<main class:wide={widerPaths.includes($page.url.pathname)}>
	{@render children()}
</main>

<Footer></Footer>

<style>
	main {
		max-width: 65rem;
		margin: auto;
		margin-top: 2rem;
		padding: 0 2rem;
		z-index: 1;

		&.wide {
			max-width: 90rem;
		}
	}
</style>
