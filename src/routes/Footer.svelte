<script lang="ts">
   import { page } from "$app/stores";
   import { toTitleCase } from "$lib";

   import {
      CloudflareDev,
      GithubDev,
      SvelteDev,
      VscodeDev,
      TypescriptDev,
      EslintDev,
      ViteDev,
      ThreeDev,
      DeviconDev,
      BlenderDev,
   } from "$lib/Icons";
   const Icons = {
      CloudflareDev,
      GithubDev,
      SvelteDev,
      VscodeDev,
      TypescriptDev,
      EslintDev,
      ViteDev,
      ThreeDev,
      DeviconDev,
      BlenderDev,
   };

   const icons = [
      {
         name: "svelte",
         link: "https://svelte.dev/",
      },
      {
         name: "cloudflare",
         link: "https://www.cloudflare.com/",
      },
      {
         name: "github",
         link: "https://github.com/",
      },
      {
         name: "vscode",
         link: "https://code.visualstudio.com/",
      },
      {
         name: "typescript",
         link: "https://www.typescriptlang.org/",
      },
      {
         name: "eslint",
         link: "https://eslint.org/",
      },
      {
         name: "vite",
         link: "https://vitejs.dev/",
      },
      {
         name: "devicon",
         link: "https://devicon.dev/",
      },
      {
         name: "three",
         link: "https://threejs.org/",
      },
      {
         name: "blender",
         link: "https://www.blender.org/",
      },
   ];

   function makeLabel(name: string) {
      const upperName = toTitleCase(name);

      return `${upperName} Icon`;
   }
</script>

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
                  <svelte:component
                     this={Icons[
                        `${toTitleCase(icon.name)}Dev` as keyof typeof Icons
                     ]}
                  />
               </a>
            </div>
         {/each}
      </div>
      <div class="contact">
         Contact me at <a class="global-hover" href="mailto:admin@jazza.dev"
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
                  fill: var(--text);
                  stroke: var(--text);
                  transition:
                     fill 200ms,
                     stroke 200ms;
                  text-decoration: none;

                  &:hover,
                  &:focus {
                     fill: var(--text-800);
                     stroke: var(--text-800);
                  }
               }
            }
         }
      }
   }
</style>
