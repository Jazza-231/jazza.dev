<script lang="ts">
   import { page } from "$app/stores";

   const id: string = $page.params.id;

   const images = import.meta.glob(
      "$lib/images/screenshots/cropped/*.{png,jpg}",
      {
         eager: true,
      },
   );

   let urls: string[] = [];

   for (const image in images) {
      if (Object.prototype.hasOwnProperty.call(images, image)) {
         let url = (images[image] as { default: string }).default;
         urls.push(url);
      }
   }
</script>

<div class="screenshot">
   <img src={urls[+id - 1]} alt="Screenshot" />
</div>

<style>
   img {
      width: 100%;
   }
</style>
