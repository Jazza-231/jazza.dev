<script lang="ts">
   import { browser } from "$app/environment";

   const images = import.meta.glob(
      "/src/lib/images/screenshots/cropped/*.{png,jpg}",
      {
         eager: true,
         query: "enhanced",
         import: "default",
      },
   );

   type ImageObject = {
      sources: {
         avif: string;
         webp: string;
         jpeg: string;
      };
      img: {
         src: string;
         w: number;
         h: number;
      };
   };

   const imagesArr: ImageObject[] = Object.values(images) as ImageObject[];

   let modalImage: HTMLImageElement;
   let modal: HTMLDialogElement;
   let loader: HTMLImageElement;
   let selectedImage = $state(0);
   let buttons: HTMLButtonElement[] = $state([]);

   if (browser) {
      document.addEventListener("keydown", (e) => {
         if (e.key.includes("Arrow")) e.preventDefault();

         if (modal && modal.open) {
            if (e.key === "ArrowLeft") {
               selectedImage--;
               if (selectedImage < 0) {
                  selectedImage = imagesArr.length - 1;
               }
               loader.src = imagesArr[selectedImage - 1]?.img.src;
            } else if (e.key === "ArrowRight") {
               selectedImage++;
               if (selectedImage >= imagesArr.length) {
                  selectedImage = 0;
               }
               loader.src = imagesArr[selectedImage + 1]?.img.src;
            }
         } else {
            switch (e.key) {
               case "ArrowLeft":
                  selectedImage--;
                  if (selectedImage < 0) {
                     selectedImage = imagesArr.length - 1;
                  }
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowRight":
                  selectedImage++;
                  if (selectedImage >= imagesArr.length) {
                     selectedImage = 0;
                  }
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowUp":
                  selectedImage -= 3;
                  if (selectedImage < 0) {
                     selectedImage = imagesArr.length - 1;
                  }
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowDown":
                  selectedImage += 3;
                  if (selectedImage >= imagesArr.length) {
                     selectedImage = 0;
                  }
                  buttons[selectedImage]?.focus();
                  break;
            }
         }
      });
   }

   $effect(() => {
      modal.onclose = () => {
         buttons[selectedImage].focus();
      };
   });
</script>

<svelte:head>
   {#each imagesArr as image, index}
      {#if image && index < 10}
         <link rel="prerender" href={image.img.src} />
      {/if}
   {/each}
</svelte:head>

<!-- svelte-ignore a11y_missing_attribute -->
<img bind:this={loader} hidden />

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid">
      {#each imagesArr as image, index}
         <button
            bind:this={buttons[index]}
            aria-label="Image"
            class="image-container"
            onclick={() => {
               selectedImage = index;
               modal.showModal();
               loader.src = imagesArr[index + 1]?.img.src;
            }}
            onmouseenter={() => {
               loader.src = image.img.src;
            }}
            onfocus={() => {
               loader.src = image.img.src;
               selectedImage = index;
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
   <img
      bind:this={modalImage}
      alt="Screenshot"
      src={imagesArr[selectedImage]?.img.src}
   />
</dialog>

<style>
   dialog {
      border: none;
      background-color: var(--background);
      border-radius: 1.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      display: none;
      outline: none;
      &[open] {
         display: initial;
      }
      &::backdrop {
         backdrop-filter: blur(0.5rem);
      }

      img {
         max-width: 90vw;
         max-height: 80vh;
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
         align-items: center;

         .image-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            background: none;
            height: fit-content;
            outline: transparent 2px solid;

            &:focus {
               outline-color: var(--secondary);
            }

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
