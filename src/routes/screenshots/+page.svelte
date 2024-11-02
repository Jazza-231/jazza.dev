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

   let ro = $state() as ResizeObserver;

   function getCurrentGameImagesLength(game: string): number {
      return imagesByGame[game]?.length || 0;
   }

   function getNextGameAndIndex(
      currentGame: string,
      currentIndex: number,
      direction: 1 | -1,
   ): { game: string; index: number } {
      const gamesList = Object.keys(imagesByGame);
      const currentGameIndex = gamesList.indexOf(currentGame);

      // If going forward and we're at the last image of the current game
      if (
         direction === 1 &&
         currentIndex === getCurrentGameImagesLength(currentGame) - 1
      ) {
         const nextGameIndex = (currentGameIndex + 1) % gamesList.length;

         return { game: gamesList[nextGameIndex], index: 0 };
      }

      // If going backward and we're at the first image of the current game
      if (direction === -1 && currentIndex === 0) {
         const previousGameIndex =
            (currentGameIndex - 1 + gamesList.length) % gamesList.length;
         const previousGame = gamesList[previousGameIndex];
         return {
            game: previousGame,
            index: getCurrentGameImagesLength(previousGame) - 1,
         };
      }

      // If we're not at a boundary, stay in the same game and just update the index
      return {
         game: currentGame,
         index:
            (currentIndex +
               direction +
               getCurrentGameImagesLength(currentGame)) %
            getCurrentGameImagesLength(currentGame),
      };
   }

   if (browser) {
      ro = new ResizeObserver((entries) => {
         const entry = entries[0];
         columns = getComputedStyle(entry.target)
            .getPropertyValue("grid-template-columns")
            .split(" ").length;
      });

      document.addEventListener("keydown", (e) => {
         if (e.key.includes("Arrow")) e.preventDefault();

         if (modal && modal.open) {
            const currentGameLength = getCurrentGameImagesLength(selectedGame);
            if (!currentGameLength) return;

            if (e.key === "ArrowLeft") {
               const { game, index } = getNextGameAndIndex(
                  selectedGame,
                  selectedImage,
                  -1,
               );
               selectedGame = game;
               selectedImage = index;
               if (index > 0 || game !== selectedGame) {
                  loader.src =
                     imagesByGame[game][Math.max(0, index - 1)]?.img.src;
               }
            } else if (e.key === "ArrowRight") {
               const { game, index } = getNextGameAndIndex(
                  selectedGame,
                  selectedImage,
                  1,
               );
               selectedGame = game;
               selectedImage = index;
               if (
                  index < getCurrentGameImagesLength(game) - 1 ||
                  game !== selectedGame
               ) {
                  loader.src =
                     imagesByGame[game][
                        Math.min(
                           getCurrentGameImagesLength(game) - 1,
                           index + 1,
                        )
                     ]?.img.src;
               }
            }
         } else {
            const newState = (() => {
               switch (e.key) {
                  case "ArrowLeft": {
                     const { game, index } = getNextGameAndIndex(
                        selectedGame,
                        selectedImage,
                        -1,
                     );
                     return { game, index };
                  }
                  case "ArrowRight": {
                     const { game, index } = getNextGameAndIndex(
                        selectedGame,
                        selectedImage,
                        1,
                     );
                     return { game, index };
                  }
                  case "ArrowUp": {
                     const currentLength =
                        getCurrentGameImagesLength(selectedGame);

                     const newIndex =
                        currentLength > 1
                           ? (selectedImage - columns + currentLength) %
                             currentLength
                           : 1;

                     if (newIndex > selectedImage) {
                        const { game, index } = getNextGameAndIndex(
                           selectedGame,
                           0,
                           -1,
                        );

                        return {
                           game,
                           index: getCurrentGameImagesLength(game) - 1,
                        };
                     }
                     return { game: selectedGame, index: newIndex };
                  }
                  case "ArrowDown": {
                     const currentLength =
                        getCurrentGameImagesLength(selectedGame);

                     const newIndex =
                        currentLength > 1
                           ? (selectedImage + columns) % currentLength
                           : -1;
                     if (newIndex < selectedImage) {
                        const { game, index } = getNextGameAndIndex(
                           selectedGame,
                           currentLength - 1,
                           1,
                        );
                        return { game, index: 0 };
                     }
                     return { game: selectedGame, index: newIndex };
                  }
                  default:
                     return { game: selectedGame, index: selectedImage };
               }
            })();

            selectedGame = newState.game;
            selectedImage = newState.index;

            const newGameIndex = gameNames.indexOf(selectedGame);
            if (newGameIndex !== -1) {
               if (details[newGameIndex]) details[newGameIndex].open = true;
            }

            buttons[globalSelectedImage]?.focus();
         }
      });
   }

   function handleClick(e: MouseEvent, index: number) {
      if (e.shiftKey || e.ctrlKey) {
         e.stopPropagation();
      }

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

                     // Get the next image, wrapping around to next category if needed
                     const { game: nextGame, index: nextIndex } =
                        getNextGameAndIndex(images[0].data.game, index, 1);

                     if (nextGame && imagesByGame[nextGame]?.[nextIndex]) {
                        loader.src = imagesByGame[nextGame][nextIndex].img.src;
                     }
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
      closingModal = false;

      // Find and open the correct details section for the current game
      const currentGameIndex = gameNames.indexOf(selectedGame);
      if (currentGameIndex !== -1) {
         // Close all details first
         details.forEach((detail, index) => {
            if (detail) detail.open = index === currentGameIndex;
         });

         // Wait for the browser to process the details opening
         setTimeout(() => {
            buttons[globalSelectedImage]?.focus();
         }, 0);
      }
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
