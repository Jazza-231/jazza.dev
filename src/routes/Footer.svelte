<script lang="ts">
   import { page } from "$app/stores";

   const icons = [
      {
         name: "svelte",
         link: "https://svelte.dev/",
         icon: "devicon-svelte-plain",
      },
      {
         name: "cloudflare",
         link: "https://www.cloudflare.com/",
         icon: "devicon-cloudflare-plain",
      },
      {
         name: "github",
         link: "https://github.com/",
         icon: "devicon-github-original",
      },
      {
         name: "vscode",
         link: "https://code.visualstudio.com/",
         icon: "devicon-vscode-plain",
      },
      {
         name: "typescript",
         link: "https://www.typescriptlang.org/",
         icon: "devicon-typescript-plain",
      },
      {
         name: "eslint",
         link: "https://eslint.org/",
         icon: "devicon-eslint-plain",
      },
      {
         name: "vite",
         link: "https://vitejs.dev/",
         icon: "devicon-vite-original",
      },
      {
         name: "devicon",
         link: "https://devicon.dev/",
         icon: "devicon-devicon-plain",
      },
      {
         name: "three",
         link: "https://threejs.org/",
         icon: "devicon-threejs-original",
      },
      {
         name: "blender",
         link: "https://www.blender.org/",
         icon: "devicon-blender-original",
      },
   ];

   function toTitleCase(str: string) {
      return str.replace(
         /\w\S*/g,
         (text) =>
            text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
      );
   }

   function makeLabel(name: string) {
      const upperName = toTitleCase(name);

      return `${upperName} Icon linking to the ${upperName} website`;
   }
</script>

<svelte:head>
   <link
      rel="stylesheet"
      type="text/css"
      href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
   />
</svelte:head>

<footer>
   <div class="footer-container">
      <div class="copy">
         {#if $page.error}
            &copy; 2024 Made with immense pain by Jazza
         {:else}
            &copy; 2024 Made with ❤️❤️ by Jazza
         {/if}
      </div>

      <div class="icons">
         {#each icons as icon}
            <div class={icon.name}>
               <a
                  href={icon.link}
                  target="_blank"
                  aria-label={makeLabel(icon.name)}
               >
                  <i class={icon.icon}></i>
               </a>
            </div>
         {/each}
      </div>
      <div class="contact">
         Contact me at <a href="mailto:admin@jazza.dev" class="secondary"
            >admin@jazza.dev</a
         >
      </div>
   </div>
</footer>

<style>
   footer {
      display: flex;
      justify-content: center;

      .footer-container {
         display: flex;
         justify-content: center;
         flex-direction: column;
         align-items: center;
         margin-top: auto;
         width: fit-content;
         padding: 1rem 1rem 0 1rem;
         background-color: var(--background-100);
         border-radius: 1rem 1rem 0 0;
         box-shadow: rgba(0, 0, 0, 0.7) 0 0 10rem;

         & > div {
            padding: 0.3rem;

            &:last-child {
               margin-bottom: 1rem;
            }
         }

         .icons {
            display: flex;
            gap: 0.7rem;

            div {
               cursor: pointer;

               a,
               & {
                  color: var(--text);
                  transition: color 200ms;
                  text-decoration: none;

                  &:hover {
                     color: var(--text-800);
                  }
               }
            }
         }
      }
   }
</style>
