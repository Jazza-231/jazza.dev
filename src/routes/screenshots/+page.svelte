<script lang="ts">
   import Image from "$lib/Image.svelte";

   const images = import.meta.glob(
      "/src/lib/images/screenshots/cropped/*.{png,jpg}",
      {
         eager: true, // Load immediately
         query: "?url", // Use the query for URLs
         import: "default", // Get the default export (the URL)
      },
   );

   let urls: string[] = [];

   for (const image in images) {
      if (Object.prototype.hasOwnProperty.call(images, image)) {
         let url = images[image] as string;

         urls.push(url);
      }
   }

   let modal: HTMLDivElement;
   let modalBack: HTMLDivElement;
   function showImage(index: number) {
      modal.style.backgroundImage = `url(${urls[index]})`;
      modal.style.display = "block";
      modalBack.style.display = "block";

      document.addEventListener("mousedown", function handler(e) {
         modal.style.display = "none";
         modalBack.style.display = "none";
         document.removeEventListener("mousedown", handler);
      });
   }
</script>

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid">
      {#each urls as url, index}
         <button
            class="image-container"
            onclick={() => {
               showImage(index);
            }}
         >
            <Image
               imagePath={url}
               lowResPath={url.replace("images", "low-res")}
               header="screenshots"
            />
         </button>
      {/each}
   </div>
</div>

<div class="modal-back" bind:this={modalBack}>
   <div class="modal" bind:this={modal}></div>
</div>

<style>
   .modal-back {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 100;
      backdrop-filter: blur(0.5rem);
      display: none;
   }
   .modal {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80vw;
      height: 100%;
      z-index: 101;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
   }

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
