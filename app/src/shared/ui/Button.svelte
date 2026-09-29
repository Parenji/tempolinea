<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: Snippet;
  }
  let { variant = 'secondary', children, type = 'button', ...rest }: Props = $props();
</script>

<button {type} class="btn {variant}" {...rest}>{@render children()}</button>

<style>
  .btn {
    font: 700 1em var(--font-body);
    min-height: var(--target);
    padding: 6px 18px;
    border-radius: 999px;
    border: var(--border) solid var(--line);
    background: var(--panel);
    color: var(--ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    touch-action: manipulation;
  }
  .btn:hover { border-color: var(--muted); }
  .primary { background: var(--accent); border-color: var(--accent); color: var(--panel); }
  .primary:hover { border-color: var(--ink); }
  .ghost { background: none; border-color: transparent; color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
