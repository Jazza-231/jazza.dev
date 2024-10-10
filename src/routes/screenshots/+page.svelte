<script lang="ts">
   import Image from "$lib/Image.svelte";
   const images = import.meta.glob("$lib/images/screenshots/*.{png,jpg}", {
      eager: true,
   });

   let urls: string[] = [];
   let names: string[] = [];

   for (const image in images) {
      if (Object.prototype.hasOwnProperty.call(images, image)) {
         let url = (images[image] as { default: string }).default;
         urls.push(url);
      }
   }

   urls.forEach((url) => {
      const split = url.split("/");
      names.push(split[split.length - 1]);
   });

   console.log(names);
</script>

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid">
      {#each names as name, index}
         <a href={`/screenshots/${index + 1}`}>
            <Image
               imagePath="src/lib/images/screenshots/cropped/"
               lowResPath="src/lib/images/screenshots/low-res/"
               imageName={name}
               header="Test"
            />
         </a>
      {/each}
   </div>
</div>

<style>
   .screenshots {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
      width: 65rem;

      .grid {
         display: grid;
         grid-template-columns: repeat(3, 1fr);
         gap: 1rem;
         width: 100%;

         :global(img) {
            width: 100%;
            height: auto;
            object-fit: contain;
            opacity: 1;
            transition: filter 500ms;
         }
      }
   }
</style>
