<script lang="ts">
   import { onMount } from "svelte";
   import Huge from "$lib/images/test/Huge.png";
   import HugeOptimized from "$lib/images/test/optimized/Huge.optimized.avif";

   let isOptimized = false;
   const originalSize = "17,506.84 KB";
   const optimizedSize = "635.29 KB";

   onMount(() => {
      const interval = setInterval(() => {
         isOptimized = !isOptimized;
      }, 1000);

      return () => clearInterval(interval);
   });
</script>

<h1>Original vs Optimized, switching every second</h1>

<div class="comparison-container">
   <div class="image-container">
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img
         src={isOptimized ? HugeOptimized : Huge}
         alt="Image comparison"
         class="comparison-image"
      />
   </div>
   <div class="info-overlay">
      <p class="size-info">
         {isOptimized ? "Optimized" : "Original"} Size:
         <span class={isOptimized ? "optimized" : "original"}>
            {isOptimized ? optimizedSize : originalSize}
         </span>
      </p>
   </div>
</div>

<style>
   .comparison-container {
      position: relative;
      margin: 0 auto;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 0 2rem var(--primary-200);
      margin-block-end: 2rem;
   }

   .image-container {
      width: 100%;
      aspect-ratio: 16/9;
      overflow: hidden;
   }

   .comparison-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.5s ease-in-out;
   }

   .info-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 1rem;
      text-align: center;
      backdrop-filter: blur(8px);
   }

   .size-info {
      margin: 0;
      font-size: 1.2rem;
   }

   .optimized {
      color: var(--primary);
      font-weight: bold;
   }

   .original {
      color: var(--secondary);
      font-weight: bold;
   }
</style>
