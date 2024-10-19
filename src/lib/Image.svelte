<script lang="ts">
   import { browser } from "$app/environment";

   const props = $props();
   const { header, imagePath, lowResPath, imageName = "" } = props;

   let loaded: () => void = $state(() => {});
   let srcLoader: HTMLImageElement;
   let image: HTMLImageElement;

   if (browser) {
      loaded = () => {
         image.src = srcLoader.src;
         image.classList.remove("blur");
         srcLoader.remove();
      };
   }
</script>

<figure>
   <img
      src={lowResPath + imageName}
      alt="Image for {header}"
      class="blur"
      bind:this={image}
   />
   <img
      src={imagePath + imageName}
      alt="Image for {header}"
      class="hidden"
      onload={loaded}
      bind:this={srcLoader}
   />
</figure>

<style>
   figure {
      margin: 0;
      width: 100%;
      img {
         opacity: 1;
         transition: blur 500ms;
      }
   }

   .blur {
      filter: blur(0.5rem);
   }

   .hidden {
      display: none;
   }
</style>
