<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    eyebrow?: string;
    children: Snippet;
  }
  let { eyebrow, children }: Props = $props();
</script>

<section class="panel">
  {#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
  {@render children()}
</section>

<style>
  .panel {
    background: var(--panel);
    border: var(--border) solid var(--line);
    border-radius: var(--radius);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
</style>
