<script lang="ts">
  import { safeColor } from './format';
  import AppHeader from '$shared/ui/AppHeader.svelte';
  import Button from '$shared/ui/Button.svelte';
  import { syncDisplay } from '$shared/display.svelte';
  import { store, current, save, addImported, replaceCurrent, readImportFile, downloadCurrent, loadExample } from './store.svelte';
  import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from './engine/scale';
  import TimelineCanvas from './ui/TimelineCanvas.svelte';
  import type { ImportedData } from './data/io';

  syncDisplay();

  const ZOOM_KEY = 'quaderno.timeline.zoom';
  function loadZoom() {
    try {
      const z = Number(localStorage.getItem(ZOOM_KEY));
      return z >= MIN_ZOOM && z <= MAX_ZOOM ? z : DEFAULT_ZOOM;
    } catch {
      return DEFAULT_ZOOM;
    }
  }
  let zoom = $state(loadZoom());
  let highlight = $state<string | null>(null);
  let canvas: ReturnType<typeof TimelineCanvas> | undefined = $state();
  let fileInput: HTMLInputElement;
  let fileMenu: HTMLDetailsElement | undefined = $state();
  let pending = $state<ImportedData | null>(null);
  let message = $state<{ text: string; tone: 'good' | 'bad' | 'info' } | null>(null);
  let yearNow = $state<number | null>(null);

  const tl = $derived(current());
  const timelines = $derived(Object.values(store.timelines).sort((a, b) => a.name.localeCompare(b.name)));
  const usedCats = $derived(
    tl ? tl.categories.filter((c) => tl.events.some((e) => e.categoryIds.includes(c.id))) : []
  );

  function toast(text: string, tone: 'good' | 'bad' | 'info' = 'info') {
    message = { text, tone };
    setTimeout(() => { if (message?.text === text) message = null; }, 4000);
  }

  if (store.fromLegacy) toast('Ho recuperato le timeline salvate dalla versione precedente.', 'good');

  function setZoom(z: number) {
    const year = canvas?.centerYear();
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch { /* ignora */ }
    // dopo il nuovo layout, torna allo stesso anno al centro dello schermo
    if (year != null) requestAnimationFrame(() => canvas?.scrollToYear(year));
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const res = await readImportFile(file);
    if (!res.ok) {
      toast(res.error === 'json' ? 'Il file non è un JSON valido.' : 'Il file non sembra una timeline.', 'bad');
      return;
    }
    if (res.problems.length) {
      toast(`Attenzione: ${res.problems.length} elementi del file hanno dati incompleti.`, 'bad');
    }
    if (tl && (tl.events.length || tl.categories.length)) pending = res.data;
    else finishImport(res.data, 'new');
  }

  function finishImport(data: ImportedData, mode: 'new' | 'replace') {
    pending = null;
    const t = mode === 'new' ? addImported(data) : replaceCurrent(data);
    highlight = null;
    toast(`Importata «${t.name}»: ${data.events.length} eventi.`, 'good');
    scrollTo({ top: 0 });
  }

  async function example() {
    try {
      const t = await loadExample();
      toast(`Caricato l'esempio «${t.name}».`, 'good');
    } catch (err) {
      toast('Non riesco a scaricare l\'esempio: serve internet.', 'bad');
    }
  }

  function onScroll() {
    yearNow = canvas?.centerYear() ?? null;
  }
</script>

<svelte:window onscroll={onScroll} />

<div class="top">
  <AppHeader title="Linea del tempo" subject="Storia" />

  {#if tl}
    <div class="bar no-print">
      <div class="zoom" role="group" aria-label="Zoom">
        <button type="button" onclick={() => setZoom(zoom - 5)} disabled={zoom <= MIN_ZOOM} aria-label="Riduci">−</button>
        <button type="button" class="z" onclick={() => setZoom(DEFAULT_ZOOM)} title="Zoom normale">{Math.round((zoom / DEFAULT_ZOOM) * 100)}%</button>
        <button type="button" onclick={() => setZoom(zoom + 5)} disabled={zoom >= MAX_ZOOM} aria-label="Ingrandisci">+</button>
      </div>
      {#if timelines.length > 1}
        <select
          class="tl-select"
          aria-label="Timeline aperta"
          value={store.currentId}
          onchange={(e) => { store.currentId = e.currentTarget.value; highlight = null; save(); scrollTo({ top: 0 }); }}
        >
          {#each timelines as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
        </select>
      {/if}
      <div class="cats" role="group" aria-label="Evidenzia una categoria">
        {#each usedCats as c (c.id)}
          <button
            type="button"
            class="cat"
            style:--cat={safeColor(c.color)}
            aria-pressed={highlight === c.id}
            onclick={() => (highlight = highlight === c.id ? null : c.id)}
          >{c.name}</button>
        {/each}
      </div>
      <details class="file" bind:this={fileMenu}>
        <summary aria-label="File">File</summary>
        <div class="menu">
          <button type="button" onclick={() => { fileMenu!.open = false; fileInput.click(); }}>Importa un file JSON…</button>
          <button type="button" onclick={() => { fileMenu!.open = false; downloadCurrent(); }}>Esporta «{tl.name}»</button>
          <button type="button" onclick={() => { fileMenu!.open = false; example(); }}>Carica l'esempio</button>
        </div>
      </details>
    </div>
  {/if}
</div>

<input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={onFile} />

<main>
  {#if tl && tl.events.length}
    <TimelineCanvas bind:this={canvas} timeline={tl} {zoom} bind:highlight />
  {:else}
    <section class="empty">
      <h2>{tl ? `«${tl.name}» è vuota` : 'Nessuna timeline'}</h2>
      <p class="muted">Importa un file JSON esportato dalla linea del tempo, oppure prova con l'esempio.</p>
      <div class="row">
        <Button variant="primary" onclick={() => fileInput.click()}>Importa un file</Button>
        <Button onclick={example}>Carica l'esempio</Button>
      </div>
    </section>
  {/if}
</main>

{#if yearNow != null && tl?.events.length}
  <div class="year-now num no-print" aria-hidden="true">{yearNow < 0 ? `${-yearNow} a.C.` : yearNow}</div>
{/if}

{#if pending}
  <div class="dialog-backdrop" role="presentation" onclick={() => (pending = null)}></div>
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="imp-title">
    <h2 id="imp-title">Importa «{pending.name}»</h2>
    <p>La timeline aperta, «{tl?.name}», contiene già dei dati. Dove vuoi importare il file?</p>
    <div class="row">
      <Button variant="primary" onclick={() => finishImport(pending!, 'new')}>In una nuova timeline</Button>
      <Button onclick={() => finishImport(pending!, 'replace')}>Sostituisci «{tl?.name}»</Button>
      <Button variant="ghost" onclick={() => (pending = null)}>Annulla</Button>
    </div>
  </div>
{/if}

{#if message}
  <div class="toast {message.tone}" role="status">{message.text}</div>
{/if}

<style>
  .top { position: sticky; top: 0; z-index: 10; background: var(--paper); }
  .tl-select {
    font: 700 16px var(--font-body); color: var(--ink); background: var(--panel);
    border: var(--border) solid var(--line); border-radius: 999px; min-height: var(--target);
    padding: 0 12px; max-width: 34vw; flex: none;
  }
  .bar {
    display: flex; align-items: center; gap: 10px 16px; padding: 8px 16px;
    border-bottom: var(--border) solid var(--line); background: var(--paper);
  }
  .zoom { display: flex; align-items: center; border: var(--border) solid var(--line); border-radius: 999px; background: var(--panel); flex: none; }
  .zoom button {
    min-width: var(--target); min-height: calc(var(--target) - 4px);
    border: 0; background: none; color: var(--ink); font: 800 18px var(--font-body); cursor: pointer;
  }
  .zoom .z { font-size: 14px; min-width: 56px; }
  .zoom button:disabled { opacity: 0.35; }
  .cats {
    display: flex; gap: 6px; overflow-x: auto; flex: 1; min-width: 0;
    scrollbar-width: thin; padding: 2px;
  }
  .cat {
    flex: none; display: inline-flex; align-items: center; gap: 6px;
    font: 700 14px var(--font-body); color: var(--ink); background: var(--panel);
    border: var(--border) solid var(--line); border-radius: 999px; padding: 6px 12px 6px 9px;
    cursor: pointer; white-space: nowrap;
  }
  .cat::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: var(--cat); }
  .cat[aria-pressed='true'] { background: var(--cat); border-color: var(--cat); color: #fff; }
  .cat[aria-pressed='true']::before { background: #fff; }
  .file { position: relative; flex: none; }
  .file summary {
    list-style: none; cursor: pointer; min-height: var(--target); display: flex; align-items: center;
    font: 700 1em var(--font-body); padding: 0 18px; border-radius: 999px;
    border: var(--border) solid var(--line); background: var(--panel);
  }
  .file summary::-webkit-details-marker { display: none; }
  .file[open] summary { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .menu {
    position: absolute; right: 0; top: calc(100% + 6px); z-index: 20; min-width: 240px;
    background: var(--panel); border: var(--border) solid var(--line); border-radius: var(--radius-sm);
    padding: 6px; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
  }
  .menu button {
    all: unset; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; cursor: pointer;
    font-weight: 700; min-height: var(--target); display: flex; align-items: center;
  }
  .menu button:hover, .menu button:focus-visible { background: var(--chip); }
  @media (max-width: 700px) {
    .bar { flex-wrap: wrap; padding: 6px 12px; gap: 6px 8px; }
    .cats { order: 3; flex-basis: 100%; }
    .file { margin-left: auto; }
  }

  main { padding: 0 0 40px; }
  .empty { max-width: 560px; margin: 64px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 12px; text-align: center; align-items: center; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

  .year-now {
    position: fixed; left: 16px; bottom: 16px; z-index: 9;
    font: 600 22px var(--font-display); color: var(--ink);
    background: var(--panel); border: var(--border) solid var(--line); border-radius: 999px; padding: 4px 16px;
  }
  .toast {
    position: fixed; left: 50%; top: 16px; transform: translateX(-50%); z-index: 30;
    background: var(--ink); color: var(--paper); padding: 10px 18px; border-radius: 999px; font-weight: 700;
    max-width: calc(100vw - 32px);
  }
  .toast.good { background: var(--good); color: var(--panel); }
  .toast.bad { background: var(--bad); color: var(--panel); }
  .dialog-backdrop { position: fixed; inset: 0; background: rgb(0 0 0 / 0.4); z-index: 40; }
  .dialog {
    position: fixed; z-index: 41; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(520px, calc(100vw - 32px)); background: var(--panel); border-radius: var(--radius);
    border: var(--border) solid var(--line); padding: 20px 24px; display: flex; flex-direction: column; gap: 14px;
  }
  .dialog .row { justify-content: flex-start; }
</style>
