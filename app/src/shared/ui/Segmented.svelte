<script lang="ts" generics="T extends string">
  // Gruppo di pulsanti a scelta singola (es. le modalità del laboratorio).
  interface Props {
    options: { value: T; label: string }[];
    value: T;
    label: string;
  }
  let { options, value = $bindable(), label }: Props = $props();
</script>

<div class="seg" role="group" aria-label={label}>
  {#each options as opt (opt.value)}
    <button type="button" aria-pressed={value === opt.value} onclick={() => (value = opt.value)}>
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .seg { display: flex; flex-wrap: wrap; gap: 8px; }
  button {
    font: 700 0.94em var(--font-body);
    min-height: var(--target);
    color: var(--ink);
    background: var(--panel);
    border: var(--border) solid var(--line);
    border-radius: 999px;
    padding: 6px 16px;
    cursor: pointer;
    touch-action: manipulation;
  }
  button[aria-pressed='true'] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
</style>
