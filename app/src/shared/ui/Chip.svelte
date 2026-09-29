<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'neutral' | 'accent' | 'good' | 'bad';
    /** colore libero, es. il colore di una categoria della timeline */
    color?: string;
    children: Snippet;
  }
  let { tone = 'neutral', color, children }: Props = $props();
</script>

<span class="chip {tone}" style:--chip-color={color}>
  {#if color}<span class="dot" aria-hidden="true"></span>{/if}
  {@render children()}
</span>

<style>
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 999px; padding: 2px 12px;
    font-size: 0.89em; font-weight: 700;
    background: var(--chip); color: var(--ink);
  }
  .accent { background: var(--accent-soft); color: var(--accent); }
  .good { background: var(--good-bg); color: var(--good); }
  .bad { background: var(--bad-bg); color: var(--bad); }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--chip-color); }
</style>
