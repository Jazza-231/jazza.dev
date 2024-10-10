<script lang="ts">
   import Image from "./Image.svelte";
   const props = $props();
   const {
      header,
      imagePath,
      short,
      content,
      href,
      area,
      children,
      lowResPath,
      imageName,
   } = props;

   const bentoClass = header.toLowerCase().replaceAll(" ", "-");
</script>

<div class={`bento bento-${bentoClass}`} style={`grid-area: ${area};`}>
   <a {href} aria-label="Link to {header} project page." class:short>
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
         <Image {header} {imagePath} {lowResPath} {imageName} />
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
      text-decoration: none;

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
            transform 200ms;
         width: fit-content;
         transform-origin: left;
         text-decoration: underline;

         &:hover {
            color: var(--text-800);
            transform: scale(1.1);
         }
      }

      .text :not(:first-child) {
         color: var(--text);
         text-decoration: none;
      }

      .image-container:has(img) {
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

         &:hover {
            transform: scale(1.05);
         }
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

      &:not(.short) {
         flex-direction: row;
         align-items: start;
      }
   }
</style>
