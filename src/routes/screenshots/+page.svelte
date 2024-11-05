<script lang="ts">
   const imageURLs: string[] = Object.values(
      import.meta.glob("$lib/images/screenshots/**/*.avif", {
         eager: true,
         query: "?url",
         import: "default",
      }),
   );

   const thumbnailURLs = Object.values(
      import.meta.glob("$lib/images/thumbnails/**/*.avif", {
         eager: true,
         query: "?url",
         import: "default",
      }),
   );

   import imageMetaData from "$lib/images/screenshots/screenshots-metadata.json";
   import moreMetaData from "./more-data.json";

   let images: any[] = [];
   const regex = /\/src\/lib\/images\/screenshots\/([^\/]+)\//;

   imageURLs.forEach((_, index) => {
      const game = imageURLs[index].match(regex)?.[1] || "default";

      images.push({
         url: imageURLs[index],
         thumbnail: thumbnailURLs[index],
         metadata: {
            ...imageMetaData[game as keyof typeof imageMetaData][index],
            ...moreMetaData[game as keyof typeof moreMetaData]?.[index],
         },
      });
   });

   console.log(images);
</script>

<h1>Screenshots</h1>
<h3>SPOILERS!!!</h3>

<div class="grid">
   {#each images as image}
      <img
         src={image.thumbnail}
         alt={image.metadata.alt}
         width={image.metadata.width}
         height={image.metadata.height}
      />
   {/each}
</div>

<style>
   h1,
   h3 {
      text-align: center;

      &:is(h3) {
         font-size: 0.9rem;
         margin-block-start: -1rem;
      }
   }

   .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
      gap: 1rem;

      :global(img) {
         object-fit: cover;
         max-width: 100%;
         height: auto;
         align-self: center;
      }
   }
</style>
