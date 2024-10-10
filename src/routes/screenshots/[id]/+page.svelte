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

<div class="back">
   <a href="/screenshots">Back</a>
</div>

<div class="screenshot">
   <img src={urls[+id - 1]} alt="Screenshot" />
</div>

<style>
   .back {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;

      a {
         font-size: 1.5rem;
         padding: 0rem 1rem;
      }
   }
   .screenshot {
      height: 100%;
      width: 100%;
      display: flex;
      margin-bottom: 1rem;
   }
   img {
      max-height: 70vh;
      max-width: 100%;
   }
</style>
