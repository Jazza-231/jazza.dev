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
   const gameNames = [...new Set(imagesLocation)];

   type ImageDataObject = ImageObject & {
      data: {
         nsfw: string | null;
         game: string;
         fullGame: string;
      };
   };

   const images = imagesArr.map((image, index) => ({
      ...image,
      data: {
         game: imagesLocation[index],
         nsfw: nsfwData[index],
      },
   }));

   const games: Record<string, string> = {
      rdr2: "Red Dead Redemption 2",
      forza: "Forza Horizon 5",
      cyberpunk: "Cyberpunk 2077",
   };

   const imagesByGame = images.reduce(
      (acc, image) => {
         const game = image.data.game;

         if (!acc[game]) acc[game] = [];

         acc[game].push({
            sources: image.sources,
            img: image.img,
            data: {
               nsfw: image.data.nsfw,
               game,
               fullGame: games[game],
            },
         });

         return acc;
      },
      {} as Record<string, ImageDataObject[]>,
   );

   let modalImage: HTMLImageElement;
   let modal: HTMLDialogElement;
   let loader: HTMLImageElement;
   let buttons: HTMLButtonElement[] = $state([]);
   let details: HTMLDetailsElement[] = $state([]);
   let selectedImage = $state(0);
   let selectedGame = $state(gameNames[0]);
   let closingModal = false;
   let columns = $state(3);
   let globalSelectedImage = $derived(
      calculateGlobalIndex(selectedGame, selectedImage),
   );
   $inspect(globalSelectedImage);
   $inspect(details);

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
                  buttons[globalSelectedImage]?.focus();

                  break;
               case "ArrowRight":
                  selectedImage = (selectedImage + 1) % images.length;
                  buttons[globalSelectedImage]?.focus();

                  break;
               case "ArrowUp":
                  selectedImage =
                     (selectedImage - columns + images.length) % images.length;
                  buttons[globalSelectedImage]?.focus();

                  break;
               case "ArrowDown":
                  selectedImage = (selectedImage + columns) % images.length;
                  buttons[globalSelectedImage]?.focus();

                  break;
            }

            details[
               gameNames.indexOf(
                  getSelectedGameAndImage(globalSelectedImage).selectedGame,
               )
            ].open = true;
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
   }

   function calculateGlobalIndex(
      selectedGame: string,
      selectedImage: number,
   ): number {
      let totalImagesBefore = 0;

      for (const game of Object.keys(imagesByGame)) {
         if (game === selectedGame) {
            break;
         }
         totalImagesBefore += imagesByGame[game].length;
      }

      return totalImagesBefore + selectedImage;
   }

   function getSelectedGameAndImage(globalIndex: number): {
      selectedGame: string;
      selectedImage: number;
   } {
      let totalImagesBefore = 0;

      for (const game of Object.keys(imagesByGame)) {
         const currentGameImages = imagesByGame[game].length;

         if (totalImagesBefore + currentGameImages > globalIndex) {
            const selectedImage = globalIndex - totalImagesBefore;
            return { selectedGame: game, selectedImage };
         }

         totalImagesBefore += currentGameImages;
      }

      return { selectedGame: "", selectedImage: -1 }; // If not found
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
   {#each Object.values(imagesByGame) as images, index}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <details open={index === 0} name="pain" bind:this={details[index]}>
         <summary>
            {images[0].data.fullGame}
         </summary>
         <div class="grid" use:ro.observe>
            {#each images as image, index}
               <button
                  bind:this={buttons[
                     calculateGlobalIndex(image.data.game, index)
                  ]}
                  aria-label="Image"
                  class="image-container"
                  onclick={() => {
                     selectedGame = images[0].data.game;
                     selectedImage = index;
                     modal.showModal();
                     closingModal = true;
                     loader.src = images[index + 1]?.img.src;

                     console.log(selectedGame, selectedImage);
                     console.log(imagesByGame[selectedGame][selectedImage]);
                  }}
                  onmouseenter={() => {
                     loader.src = image.img.src;
                  }}
                  onfocus={() => {
                     if (!closingModal) {
                        loader.src = image.img.src;
                        selectedGame = images[0].data.game;
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
      </details>
   {/each}
</div>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
   bind:this={modal}
   onmousedown={() => {
      modal.close();
   }}
   onclose={() => {
      buttons[globalSelectedImage]?.focus();
      closingModal = false;
   }}
>
   <img
      bind:this={modalImage}
      alt="Screenshot"
      src={imagesByGame[selectedGame]?.[selectedImage]?.img.src}
      width={imagesByGame[selectedGame]?.[selectedImage]?.img.w}
      height={imagesByGame[selectedGame]?.[selectedImage]?.img.h}
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
         backdrop-filter: blur(0.75rem);
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

      summary {
         color: var(--primary);
         font-size: 1.6rem;
         width: fit-content;
         margin-block-end: 1rem;
         outline: transparent 2px solid;
         padding: 0.4rem;
         border-radius: 0.75rem;

         &:focus-visible {
            outline: var(--secondary) 2px solid;
         }

         :global(svg) {
            stroke: var(--primary);
            scale: 1.5;
            transition: transform 200ms;
         }
      }

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
               border-radius: 0.75rem;

               &.blur {
                  filter: blur(1rem);
                  clip-path: inset(0 0 0 0 round 0.75rem);
               }
            }
         }
      }
   }
</style>
