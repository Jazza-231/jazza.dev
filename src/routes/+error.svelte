<script>
	import { page } from "$app/stores";
</script>

<div class="center">
	{#if $page.error?.message === "Not Found"}
		<h1>Error {$page.status}: 404 page not found. Please try again later.</h1>
		<h3>And while you're at it...try to find error page 403 and 405, I lost those too</h3>
	{:else}
		<h1>Error {$page.status}: {$page.error?.message}</h1>
		<h3>
			There was initially a joke about not finding the 404 page but I realised this could also be a
			different error sooo.... you get this instead
		</h3>
	{/if}
	<h4>Take me <a href="/">Home</a></h4>
</div>

<style>
	.center {
		text-align: center;

		h3 {
			color: var(--primary);
		}

		h4 {
			height: 2rem;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 0.2rem;
		}

		a {
			text-decoration: none;
			transition: font-size 200ms;
			color: inherit;

			&:hover {
				font-size: larger;
			}
		}
	}
</style>
