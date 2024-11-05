<script lang="ts">
   const imageURLs = Object.values(
      import.meta.glob("$lib/images/screenshots/**/*.avif", {
         eager: true,
         query: "?url",
         import: "default",
      }),
   );

   console.log(imageURLs);
</script>

<h1>Screenshots</h1>
<h3>SPOILERS!!!</h3>

<style>
   h1,
   h3 {
      text-align: center;

      &:is(h3) {
         font-size: 0.9rem;
         margin-block-start: -1rem;
      }
   }
</style>
