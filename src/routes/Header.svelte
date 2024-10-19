<script lang="ts">
   import { page } from "$app/stores";
</script>

{#snippet link(href: string, text: string)}
   {@const path = $page.url.pathname.split("/")[1]}
   {@const selected = path === href.split("/")[1]}

   <li>
      <a {href} class:selected>{text}</a>
   </li>
{/snippet}

<header>
   <ul>
      {@render link("/", "Home")}
      {@render link("/projects", "Projects")}
      {@render link("/links", "Links")}
      {@render link("/posts", "Posts")}
      {#if $page.url.pathname === "/secret/onlyfans"}
         {@render link("/secret/onlyfans", "Only Fans")}
      {/if}
   </ul>
</header>

<style>
   header {
      position: sticky;
      top: 0;
      -webkit-backdrop-filter: blur(1rem);
      backdrop-filter: blur(1rem);
      background: linear-gradient(180deg, black, transparent);
      border-bottom: 1px solid var(--background-100);
      z-index: 100;
   }

   ul {
      list-style-type: none;
      padding: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: row;
      justify-content: center;
      min-height: 3rem;
      align-items: center;
      margin: 0;

      a {
         text-decoration: none;
         padding: 1rem;
         margin: 0.3rem;
         transition:
            color 200ms,
            transform 200ms;
         font-size: 1.5rem;
         transform: scale(1);
         display: inline-block;

         &:hover {
            color: var(--text-800);
            transform: scale(1.1);
         }

         &.selected {
            color: var(--text);
            transform: scale(1.3);
         }
      }
   }
</style>
