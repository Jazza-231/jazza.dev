<script lang="ts">
   import Image from "$lib/Image.svelte";

   const images = import.meta.glob(
      "/src/lib/images/screenshots/cropped/*.{png,jpg}",
      {
         eager: true,
         query: "?url",
         import: "default",
      },
   );

   const lowResImages = import.meta.glob(
      "/src/lib/low-res/screenshots/cropped/*.{png,jpg}",
      {
         eager: true,
         query: "?url",
         import: "default",
      },
   );

   let urls: string[] = [];
   let lowResUrls: string[] = [];

   for (const image in images) {
      if (Object.prototype.hasOwnProperty.call(images, image)) {
         const url = images[image] as string;

         urls.push(url);
      }
   }

   for (const image in lowResImages) {
      if (Object.prototype.hasOwnProperty.call(lowResImages, image)) {
         const url = lowResImages[image] as string;

         lowResUrls.push(url);
      }
   }

   let modalImage: HTMLImageElement;
   let modal: HTMLDialogElement;

   document.addEventListener("mousedown", (e) => {
      if (e.target === modal) {
         modal.close();
      }
   });
</script>

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid">
      {#each urls as url, index}
         <button
            class="image-container"
            onclick={() => {
               modalImage.src = url;
               modal.showModal();
            }}
         >
            <Image
               imagePath={url}
               lowResPath={lowResUrls[index]}
               header="screenshots"
            />
         </button>
      {/each}
   </div>
</div>

<dialog bind:this={modal}>
   <img bind:this={modalImage} alt="Screenshot" />
</dialog>

<style>
   dialog {
      border: none;
      background-color: var(--background);
      margin: auto 2rem;
      border-radius: 1.7rem;

      &::backdrop {
         backdrop-filter: blur(0.5rem);
      }

      img {
         width: 100%;
         height: auto;
         object-fit: contain;
         border-radius: 1rem;
      }
   }
   .screenshots {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      margin-block-end: 2rem;
      width: 65rem;

      .grid {
         display: grid;
         grid-template-columns: repeat(3, 1fr);
         gap: 1rem;
         width: 100%;

         .image-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            background: none;

            :global(img) {
               width: 100%;
               height: auto;
               object-fit: contain;
               opacity: 1;
               transition: filter 500ms;
            }
         }
      }
   }
</style>
