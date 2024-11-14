<script lang="ts">
   const links = {
      Github: "https://github.com/jazza-231",
      "Website Repo": "https://github.com/jazza-231/new-website",
      "Pronouns Page": "https://en.pronouns.page/@Jazza",
      Scratch: "https://scratch.mit.edu/users/greeny--231",
      YouTube: "https://www.youtube.com/@jazza231",
   };

   // Mulberry32 - A fast seeded random number generator
   function mulberry32(seed: number) {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
   }

   function getRandomPosition(index: number, total: number) {
      const maxRadius = 250; // Maximum radius of the circle
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const fraction = index / total;

      // Use index as seed for consistent but random positioning
      const baseSeed = index * 12345 + 35247;

      // Generate three different random numbers from the seed
      const rand1 = mulberry32(baseSeed);
      const rand2 = mulberry32(baseSeed + 1);
      const rand3 = mulberry32(baseSeed + 2);

      // Calculate radius with some randomness but maintaining general spiral pattern
      const radius = maxRadius * Math.sqrt(fraction) * (0.9 + rand1 * 0.2);

      // Generate angle based on golden ratio with slight random variation
      const angle = 2 * Math.PI * (fraction * goldenRatio + rand2 * 0.1);

      // Generate random offsets using seeded random numbers (±25px)
      const offsetX = rand2 * 50 - 25;
      const offsetY = rand3 * 50 - 100;

      return {
         x: Math.cos(angle) * radius + offsetX,
         y: Math.sin(angle) * radius + offsetY,
         scale: 0.9 + rand1 * 0.3, // Scale between 0.9 and 1.2
      };
   }
</script>

<h1>Links</h1>

<div class="links">
   {#each Object.entries(links) as [text, href], index}
      {@const position = getRandomPosition(index, Object.keys(links).length)}
      <a
         class="external-link float"
         {href}
         target="_blank"
         style="--x: {position.x}px; --y: {position.y}px; --scale: {position.scale}; --delay: {-index *
            0.4}s"
      >
         <div class="glow"></div>
         {text}
      </a>
   {/each}
</div>

<style>
   h1 {
      text-align: center;
   }

   .links {
      position: relative;
      min-height: 600px;
      width: 100%;
      display: grid;
      place-items: center;

      a {
         position: absolute;
         transform: translate(var(--x), var(--y)) scale(var(--scale, 1));
         transition: transform 200ms;
         text-decoration: none;
         font-size: 1.5rem;
         height: fit-content;
         white-space: nowrap; /* Prevent text wrapping */

         .glow {
            position: absolute;
            inset: -0.75rem;
            background: var(--primary);
            filter: blur(1rem);
            opacity: 0.15;
            border-radius: 1.5rem;
            z-index: -1;
            animation: subtle-pulse 3s ease-in-out infinite;
         }

         &:hover {
            transform: translate(var(--x), var(--y))
               scale(calc(var(--scale, 1) + 0.2));

            .glow {
               inset: -0.8rem;
               animation: complex-pulse-hover 3s ease-in-out infinite;
            }
         }
      }
   }

   @keyframes subtle-pulse {
      0% {
         opacity: 0.12;
         filter: blur(0.8rem);
      }
      50% {
         opacity: 0.15;
         filter: blur(1rem);
      }
      100% {
         opacity: 0.12;
         filter: blur(0.8rem);
      }
   }

   @keyframes complex-pulse-hover {
      0% {
         opacity: 0.3;
         background: var(--primary);
         filter: blur(1.2rem);
      }
      33% {
         opacity: 0.35;
         background: var(--secondary);
         filter: blur(1.4rem);
      }
      66% {
         opacity: 0.4;
         background: var(--accent);
         filter: blur(1.3rem);
      }
      100% {
         opacity: 0.3;
         background: var(--primary);
         filter: blur(1.2rem);
      }
   }

   @keyframes float {
      0% {
         translate: 0px 0px;
      }
      50% {
         translate: 0px -20px;
      }
      100% {
         translate: 0px 0px;
      }
   }

   .float {
      animation: float 4s ease-in-out var(--delay, 0s) infinite;
   }
</style>
