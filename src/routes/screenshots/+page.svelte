<script lang="ts">
   const images = import.meta.glob(
      "/src/lib/images/screenshots/cropped/*.{png,jpg}",
      {
         eager: true,
         query: "enhanced",
         import: "default",
      },
   );

   const imagesArr = Object.values(images);

   let modalImage: HTMLImageElement;
   let modal: HTMLDialogElement;
   let loader: HTMLImageElement;
</script>

<img bind:this={loader} hidden />

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid">
      {#each imagesArr as image, index}
         {console.log(image)}
         <button
            aria-label="Image"
            class="image-container"
            onclick={() => {
               modalImage.src = image.img.src;
               modal.showModal();
            }}
            onmouseenter={() => {
               loader.src = image.img.src;
            }}
         >
            <enhanced:img src={image} alt="Game screenshot {index + 1}" />
         </button>
      {/each}
   </div>
</div>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
   bind:this={modal}
   onmousedown={() => {
      modal.close();
   }}
>
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
