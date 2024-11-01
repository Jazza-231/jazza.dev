<script lang="ts">
   import { browser, dev } from "$app/environment";
   import { Dropdown } from "$lib/Icons";

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
   let selectedImage = $state(0);
   let selectedGame = $state("");
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
                  (selectedImage - 1 + imagesByGame[selectedGame].length) %
                  imagesByGame[selectedGame].length;
               loader.src =
                  imagesByGame[selectedGame][selectedImage - 1].img.src;
            } else if (e.key === "ArrowRight") {
               selectedImage =
                  (selectedImage + 1) % imagesByGame[selectedGame].length;
               loader.src =
                  imagesByGame[selectedGame][selectedImage + 1].img.src;
            }
         } else {
            switch (e.key) {
               case "ArrowLeft":
                  selectedImage =
                     (selectedImage - 1 + imagesByGame[selectedGame].length) %
                     imagesByGame[selectedGame].length;
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowRight":
                  selectedImage =
                     (selectedImage + 1) % imagesByGame[selectedGame].length;
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowUp":
                  selectedImage =
                     (selectedImage -
                        columns +
                        imagesByGame[selectedGame].length) %
                     imagesByGame[selectedGame].length;
                  buttons[selectedImage]?.focus();
                  break;
               case "ArrowDown":
                  selectedImage =
                     (selectedImage + columns) %
                     imagesByGame[selectedGame].length;
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

   let collapsed: Record<string, boolean> = $state({});
   $inspect(collapsed);

   $effect(() => {
      const gameKeys = Object.keys(imagesByGame);
      gameKeys.forEach((game, index) => {
         collapsed[game] = index === 0 ? false : true;
      });
   });

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
   {#each Object.values(imagesByGame) as images}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <h2
         onclick={() => {
            let current = collapsed[images[0].data.game];

            const collapsedKeys = Object.keys(collapsed);
            collapsedKeys.forEach((key) => {
               collapsed[key] = true;
            });

            collapsed[images[0].data.game] = !current;
         }}
         class:collapsed={collapsed[images[0].data.game]}
      >
         {images[0].data.fullGame}
         <Dropdown />
      </h2>
      <div
         class="grid"
         use:ro.observe
         class:hidden={collapsed[images[0].data.game]}
      >
         {#each images as image, index}
            <button
               bind:this={buttons[calculateGlobalIndex(image.data.game, index)]}
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
   {/each}
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

      h2 {
         :global(svg) {
            stroke: var(--primary);
            scale: 1.5;
            transition: transform 200ms;
         }

         &.collapsed {
            :global(svg) {
               transform: rotate(180deg);
            }
         }
      }

      .grid {
         display: grid;
         grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
         gap: 1rem;
         width: 100%;
         align-items: center;

         &.hidden {
            display: none;
         }

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
