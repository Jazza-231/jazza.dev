<script lang="ts">
   import { dev } from "$app/environment";
   const links = {
      Github: "https://github.com/jazza-231",
      "Website Repo": "https://github.com/jazza-231/new-website",
      "Pronouns Page": "https://en.pronouns.page/@Jazza",
      Scratch: "https://scratch.mit.edu/users/greeny--231",
      YouTube: "https://www.youtube.com/@jazza231",
   };

   const data = [
      {
         x: 182.5,
         y: 48,
         scale: 2,
      },
      {
         x: -69.5,
         y: 176,
         scale: 1.3,
      },
      {
         x: -71.5,
         y: 273,
         scale: 0.9,
      },
      {
         x: -129.5,
         y: 115,
         scale: 1.4,
      },
      {
         x: -45.5,
         y: 219,
         scale: 1.1,
      },
   ];
</script>

<h1>Links</h1>

<div class="links">
   {#each Object.entries(links) as [text, href], index}
      <a
         class="external-link float"
         {href}
         target="_blank"
         style="position: relative; top: {data[index]?.y || 100}px; left: {data[
            index
         ]?.x || 200}px; --scale: {data[index]?.scale}; --delay: {-index *
            0.4}s"
         ondrag={(e: MouseEvent) => {
            if (!dev) return;
            if (!data[index]) {
               data[index] = { x: 0, y: 0, scale: 1 };
            }

            if (e.clientX !== 0) {
               data[index].x = e.clientX - window.window.innerWidth / 2;
               data[index].y = e.clientY - window.window.innerHeight / 2;
            }
         }}>{text}</a
      >
   {/each}
</div>

<style>
   h1 {
      text-align: center;
   }

   .links {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      flex-wrap: wrap;
      max-width: 40rem;

      a {
         text-decoration: none;
         font-size: 1.25rem;
         transform: scale(var(--scale, 1));
         transition: transform 200ms;
         height: fit-content;

         &:hover {
            transform: scale(calc(var(--scale, 1) + 0.2));
         }
      }
   }

   @keyframes float {
      0% {
         translate: 0px 0px;
      }
      50% {
         translate: 0px -20px;
      }
      100% {
         translate: 0px 0px;
      }
   }

   .float {
      animation: float 4s ease-in-out var(--delay, 0s) infinite;
   }
</style>
