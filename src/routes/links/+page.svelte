<script lang="ts">
   const links = {
      Github: "https://github.com/jazza-231",
      "Website Repo": "https://github.com/jazza-231/new-website",
      "Pronouns Page": "https://en.pronouns.page/@Jazza",
      Scratch: "https://scratch.mit.edu/users/greeny-231",
      YouTube: "https://www.youtube.com/@jazza231",
   };
</script>

<h1>Links</h1>

<div class="links">
   {#each Object.entries(links) as [text, href]}
      <a {href} target="_blank">{text}</a>
   {/each}
</div>

<style>
   h1 {
      text-align: center;
   }

   .links {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      flex-wrap: wrap;
      max-width: 40rem;

      a {
         text-decoration: none;
         font-size: 1.25rem;
      }
   }
</style>
