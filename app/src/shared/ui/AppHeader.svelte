<script lang="ts">
  // Intestazione comune: ritorno all'indice, titolo, materia, controlli di visualizzazione.
  import type { Snippet } from 'svelte';
  import { display, type Theme } from '../display.svelte';

  interface Props {
    title: string;
    subject?: string;
    /** false nella pagina indice */
    home?: boolean;
    actions?: Snippet;
  }
  let { title, subject, home = true, actions }: Props = $props();

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'auto', label: 'Tema automatico', icon: '◐' },
    { value: 'light', label: 'Tema chiaro', icon: '☀' },
    { value: 'dark', label: 'Tema scuro', icon: '☾' },
  ];
  const current = $derived(themes.find((t) => t.value === display.theme) ?? themes[0]);

  function nextTheme() {
    const i = themes.findIndex((t) => t.value === display.theme);
    display.theme = themes[(i + 1) % themes.length].value;
  }
</script>

<header class="app-header no-print">
  <div class="title">
    {#if home}<a class="home" href={import.meta.env.BASE_URL} aria-label="Torna all'indice">‹ Quaderno</a>{/if}
    <h1>{title}</h1>
    {#if subject}<span class="subject">{subject}</span>{/if}
  </div>
  <div class="tools">
    {@render actions?.()}
    <button type="button" class="icon" onclick={nextTheme} title={current.label} aria-label="{current.label}: cambia">
      <span aria-hidden="true">{current.icon}</span>
    </button>
    <button
      type="button"
      class="icon projector"
      aria-pressed={display.projector}
      onclick={() => (display.projector = !display.projector)}
      title="Modalità proiettore: testo grande e più contrasto"
    >
      <span aria-hidden="true">▣</span><span class="lbl">Proiettore</span>
    </button>
  </div>
</header>

<style>
  .app-header {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 8px 16px; padding: 12px 20px;
    border-bottom: var(--border) solid var(--line);
    background: var(--panel);
  }
  .title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; min-width: 0; }
  .home { font-weight: 800; text-decoration: none; color: var(--muted); }
  .home:hover { color: var(--accent); }
  h1 { font-size: clamp(22px, 2.4vw, 30px); }
  .subject {
    font-size: 14px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--accent); background: var(--accent-soft); border-radius: 999px; padding: 2px 10px;
  }
  .tools { display: flex; align-items: center; gap: 8px; }
  .icon {
    min-width: var(--target); min-height: var(--target);
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    font: 700 16px var(--font-body); color: var(--ink);
    background: var(--panel); border: var(--border) solid var(--line); border-radius: 999px;
    padding: 0 12px; cursor: pointer;
  }
  .icon span[aria-hidden] { font-size: 20px; line-height: 1; }
  .projector[aria-pressed='true'] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  @media (max-width: 520px) { .lbl { display: none; } }
</style>
