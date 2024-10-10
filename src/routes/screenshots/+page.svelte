<script lang="ts">
   const images = import.meta.glob(
      "$lib/images/screenshots/cropped/*.{png,jpg}",
      {
         eager: true,
      },
   );
   let urls: string[] = [];

   for (const image in images) {
      if (Object.prototype.hasOwnProperty.call(images, image)) {
         const url = images[image].default;
         urls.push(url);
      }
   }
</script>

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid">
      {#each urls as url}
         <img src={url} alt="Screenshot of {url}" />
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

      .grid {
         display: grid;
         grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
         gap: 1rem;

         img {
            width: 100%;
         }
      }
   }
</style>
