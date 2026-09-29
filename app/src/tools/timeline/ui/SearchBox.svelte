<script lang="ts">
  // Ricerca: mentre scrivi gli eventi che non corrispondono si attenuano; ‹ › (o Invio) passano
  // da un risultato all'altro. Un anno ("1492", "44 a.C.") senza risultati porta a quell'anno.
  import { parseYear, searchEvents } from '../data/search';
  import type { Timeline } from '../data/schema';

  interface Props {
    timeline: Timeline;
    /** risultati (null = nessuna ricerca in corso) */
    matches: string[] | null;
    ongo: (id: string) => void;
    onyear: (year: number) => void;
  }
  let { timeline, matches = $bindable(), ongo, onyear }: Props = $props();

  let query = $state('');
  let index = $state(0);
  /** false finché non si è andati al primo risultato */
  let started = false;
  let input: HTMLInputElement;

  $effect(() => {
    const q = query.trim();
    matches = q ? searchEvents(timeline.events, timeline.categories, q) : null;
    index = 0;
    started = false;
  });

  function go(step: number) {
    if (!matches?.length) {
      const y = parseYear(query);
      if (y != null) onyear(y);
      return;
    }
    if (started) index = (index + step + matches.length) % matches.length;
    started = true;
    ongo(matches[index]);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      go(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      query = '';
      input.blur();
    }
  }

  export function focus() {
    input.focus();
    input.select();
  }
</script>

<div class="search" class:active={!!query}>
  <span class="icon" aria-hidden="true">⌕</span>
  <input
    bind:this={input}
    type="search"
    bind:value={query}
    onkeydown={onKey}
    placeholder="Cerca evento o anno"
    aria-label="Cerca un evento o un anno"
    enterkeyhint="search"
    autocomplete="off"
  />
  {#if query}
    <span class="count num" aria-live="polite">
      {#if matches?.length}{index + 1}/{matches.length}{:else if parseYear(query) != null}anno{:else}0{/if}
    </span>
    <button type="button" onclick={() => go(-1)} aria-label="Risultato precedente" disabled={!matches?.length}>‹</button>
    <button type="button" onclick={() => go(1)} aria-label="Risultato successivo">›</button>
    <button type="button" onclick={() => (query = '')} aria-label="Cancella la ricerca">×</button>
  {/if}
</div>

<style>
  .search {
    display: flex; align-items: center; min-width: 0; flex: 1 1 220px; max-width: 420px;
    border: var(--border) solid var(--line); border-radius: 999px; background: var(--panel);
    min-height: var(--target); padding: 0 4px 0 12px;
  }
  .search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .icon { font-size: 20px; color: var(--muted); margin-right: 4px; }
  input {
    all: unset; flex: 1; min-width: 0; font: 600 1em var(--font-body); color: var(--ink);
  }
  input::placeholder { color: var(--muted); opacity: 0.8; }
  input::-webkit-search-cancel-button { display: none; }
  .count { font-size: 13px; font-weight: 800; color: var(--muted); padding: 0 6px; white-space: nowrap; }
  button {
    width: 34px; height: 34px; flex: none; border: 0; border-radius: 50%; background: none;
    color: var(--ink); font: 700 20px var(--font-body); cursor: pointer;
  }
  button:hover:not(:disabled) { background: var(--chip); }
  button:disabled { opacity: 0.3; }
</style>
