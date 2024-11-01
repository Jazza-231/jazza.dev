<script lang="ts">
   import { browser, dev } from "$app/environment";

   const imports = import.meta.glob(
      "/src/lib/images/screenshots-cropped/**/*.{png,jpg}",
      {
         eager: true,
         query: "enhanced&w=2560;1280;640",
         import: "default",
      },
   );

   import nsfwDataImport from "./nsfw.json";
   let nsfwData = $state(nsfwDataImport) as ["blood" | "nudity" | null];

   $inspect(nsfwData);

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

   const location = /(?<=\/screenshots-cropped\/)([^/]+)/;
   const imagesArr: ImageObject[] = Object.values(imports) as ImageObject[];
   const imagesLocation = Object.keys(imports).map(
      (src) => src.match(location)?.[1] || "Unknown",
   );

   const images = imagesArr.map((image, index) => {
      return {
         ...image,
         data: {
            game: imagesLocation[index],
            nsfw: nsfwData[index],
         },
      };
   });

   console.log(images);

   let modalImage: HTMLImageElement;
   let modal: HTMLDialogElement;
   let loader: HTMLImageElement;
   let buttons: HTMLButtonElement[] = $state([]);
   let grid: HTMLDivElement;
   let selectedImage = $state(0);
   let closingModal = false;
   let columns = $state(3);

   let ro = $state() as ResizeObserver;

   if (browser) {
      ro = new ResizeObserver((entries) => {
         const entry = entries[0];
         columns = getComputedStyle(entry.target)
            .getPropertyValue("grid-template-columns")
            .split(" ").length;
      });

      document.addEventListener("keydown", (e) => {
         if (e.key.includes("Arrow")) e.preventDefault();

         // The old method worked by seeing an error (aka selectedImage was out of bounds)
         // and then fixing it, this method means that the selected image will always be in bounds
         // stopping the reactive usages of selectedImage from updating and causing an error
         if (modal && modal.open) {
            if (e.key === "ArrowLeft") {
               selectedImage =
                  (selectedImage - 1 + images.length) % images.length;
               loader.src = images[selectedImage - 1].img.src;
            } else if (e.key === "ArrowRight") {
               selectedImage = (selectedImage + 1) % images.length;
               loader.src = images[selectedImage + 1].img.src;
            }
         } else {
            switch (e.key) {
               case "ArrowLeft":
                  selectedImage =
                     (selectedImage - 1 + images.length) % images.length;
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowRight":
                  selectedImage = (selectedImage + 1) % images.length;
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowUp":
                  selectedImage =
                     (selectedImage - columns + images.length) % images.length;
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowDown":
                  selectedImage = (selectedImage + columns) % images.length;
                  buttons[selectedImage]?.focus();
                  break;
            }
         }
      });
   }

   function handleClick(e: MouseEvent, index: number) {
      if (e.shiftKey || e.ctrlKey) {
         e.stopPropagation();
      }

      console.log(e, index);
      if (nsfwData[index]) {
         nsfwData[index] = null;
      } else {
         if (e.ctrlKey) {
            nsfwData[index] = "blood";
         } else if (e.shiftKey) {
            nsfwData[index] = "nudity";
         }
      }

      images[index].data.nsfw = nsfwData[index];

      console.log(nsfwData[index]);
      console.log(images);
   }
</script>

<svelte:head>
   {#each images as image, index}
      {#if image && index < 10}
         <link rel="prerender" href={image.img.src} />
      {/if}
   {/each}
</svelte:head>

<!-- svelte-ignore a11y_missing_attribute -->
<img bind:this={loader} hidden />

<div class="screenshots">
   <h1>Screenshots</h1>
   <div class="grid" bind:this={grid} use:ro.observe>
      {#each images as image, index}
         <button
            bind:this={buttons[index]}
            aria-label="Image"
            class="image-container"
            onclick={() => {
               selectedImage = index;
               modal.showModal();
               closingModal = true;
               loader.src = images[index + 1]?.img.src;
            }}
            onmouseenter={() => {
               loader.src = image.img.src;
            }}
            onfocus={() => {
               if (!closingModal) {
                  loader.src = image.img.src;
                  selectedImage = index;
               }
            }}
         >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <enhanced:img
               src={image}
               alt="Game screenshot {index + 1}"
               class:blur={image.data.nsfw}
               onclick={(event) => {
                  if (!dev) return;
                  handleClick(event, index);
               }}
            />
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
   onclose={() => {
      buttons[selectedImage]?.focus();
      closingModal = false;
   }}
>
   <img
      bind:this={modalImage}
      alt="Screenshot"
      src={images[selectedImage]?.img.src}
      width={images[selectedImage]?.img.w}
      height={images[selectedImage]?.img.h}
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
         height: auto;
         width: auto;
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

      .grid {
         display: grid;
         grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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

            &:focus-visible {
               outline-color: var(--secondary);
            }

            :global(img) {
               width: 100%;
               height: auto;
               object-fit: contain;
               opacity: 1;
               transition: filter 500ms;

               &.blur {
                  filter: blur(1rem);
                  clip-path: inset(0);
               }
            }
         }
      }
   }
</style>
