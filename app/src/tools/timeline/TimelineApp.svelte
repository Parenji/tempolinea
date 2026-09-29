<script lang="ts">
  import AppHeader from '$shared/ui/AppHeader.svelte';
  import Button from '$shared/ui/Button.svelte';
  import Dialog from '$shared/ui/Dialog.svelte';
  import { syncDisplay, display } from '$shared/display.svelte';
  import {
    store, current, addImported, replaceCurrent, readImportFile, downloadCurrent, loadExample,
    edit, undo, redo, history, switchTimeline, newEmpty, renameCurrent, deleteCurrent, isNameTaken,
  } from './store.svelte';
  import { newDraft, draftFromEvent, saveDraft, deleteEvent, saveCategory, type EventDraft, type CategoryDraft } from './data/ops';
  import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from './engine/scale';
  import { safeColor } from './format';
  import { formatDate } from './data/dates';
  import TimelineCanvas from './ui/TimelineCanvas.svelte';
  import EventEditor from './ui/EventEditor.svelte';
  import CategoryManager from './ui/CategoryManager.svelte';
  import SearchBox from './ui/SearchBox.svelte';
  import Navigator from './ui/Navigator.svelte';
  import SegmentsEditor from './ui/SegmentsEditor.svelte';
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
  let search: ReturnType<typeof SearchBox> | undefined = $state();
  let fileInput: HTMLInputElement;
  let fileMenu: HTMLDetailsElement | undefined = $state();
  let pending = $state<ImportedData | null>(null);
  let importOpen = $state(false);
  type Toast = { text: string; tone: 'good' | 'bad' | 'info'; undoable?: boolean };
  let message = $state<Toast | null>(null);
  let matches = $state<string[] | null>(null);
  let navOpen = $state(false);
  let segOpen = $state(false);
  let yearNow = $state<number | null>(null);

  // editor
  let editorOpen = $state(false);
  let editorDraft: EventDraft = $state(newDraft());
  let catsOpen = $state(false);
  // nuova / rinomina / elimina timeline
  let tlMode = $state<'new' | 'rename' | 'delete' | null>(null);
  let tlOpen = $state(false);
  let tlName = $state('');
  let tlError = $state('');

  const tl = $derived(current());
  const timelines = $derived(Object.values(store.timelines).sort((a, b) => a.name.localeCompare(b.name, 'it')));
  // periodi in corso nel punto della timeline che si sta guardando
  const currentPeriods = $derived(
    yearNow == null || !tl
      ? []
      : tl.events
          .filter((e) => e.isPeriod && e.endYear != null && Math.min(e.startYear, e.endYear) <= yearNow! && Math.max(e.startYear, e.endYear) >= yearNow!)
          .sort((a, b) => a.startYear - b.startYear)
  );
  const usedCats = $derived(
    tl ? tl.categories.filter((c) => tl.events.some((e) => e.categoryIds.includes(c.id))) : []
  );

  /** Messaggio in basso; dopo una modifica offre "Annulla" (comodo sul touch, dove non c'è ⌘Z). */
  function toast(text: string, tone: Toast['tone'] = 'info', undoable = false) {
    const m: Toast = { text, tone, undoable };
    message = m;
    setTimeout(() => { if (message === m) message = null; }, undoable ? 6000 : 3500);
  }

  if (store.fromLegacy) toast('Ho recuperato le timeline salvate dalla versione precedente.', 'good');

  function setZoom(z: number) {
    const year = canvas?.centerYear();
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch { /* ignora */ }
    // dopo il nuovo layout, torna allo stesso anno al centro dello schermo
    if (year != null) requestAnimationFrame(() => canvas?.scrollToYear(year));
  }

  // ---------- eventi ----------
  function openNew(year: number | null = canvas?.centerYear() ?? null) {
    editorDraft = newDraft('event', year);
    editorOpen = true;
  }
  function openEdit(id: string) {
    const e = tl?.events.find((x) => x.id === id);
    if (!e) return;
    editorDraft = draftFromEvent(e);
    editorOpen = true;
  }
  function onSave(d: EventDraft) {
    const isNew = !d.id;
    const what = { event: 'Evento', period: 'Periodo', note: 'Appunto' }[d.kind];
    const id = edit(isNew ? `Nuovo ${what}` : `Modifica ${what}`, (t) => saveDraft(t, d));
    toast(`${what} ${isNew ? 'aggiunto' : 'salvato'}.`, 'good', true);
    if (id) requestAnimationFrame(() => canvas?.reveal(id));
  }
  function onDelete(id: string) {
    const title = tl?.events.find((e) => e.id === id)?.title;
    edit('Elimina', (t) => deleteEvent(t, id));
    toast(`Eliminato «${title ?? ''}».`, 'info', true);
  }
  function createCategory(d: CategoryDraft) {
    const id = edit('Nuova categoria', (t) => saveCategory(t, d));
    toast(`Creata la categoria «${d.name.trim()}».`, 'good');
    return id;
  }

  function doUndo() { if (undo()) toast('Modifica annullata.'); }
  function closeMenu() { if (fileMenu) fileMenu.open = false; }
  function doRedo() { if (redo()) toast('Modifica ripristinata.'); }

  function onKey(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable], dialog')) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); }
    else if (!mod && !e.altKey && e.key === 'n' && tl) { e.preventDefault(); openNew(); }
    else if (!mod && !e.altKey && (e.key === '/' || e.key === 'f') && tl) { e.preventDefault(); search?.focus(); }
    else if (!mod && !e.altKey && e.key === 'g' && tl?.events.length) { e.preventDefault(); navOpen = true; }
  }

  // ---------- timeline ----------
  function openTl(mode: 'new' | 'rename' | 'delete') {
    if (fileMenu) fileMenu.open = false;
    tlMode = mode;
    tlName = mode === 'rename' ? tl?.name ?? '' : '';
    tlError = '';
    tlOpen = true;
  }
  function confirmTl() {
    if (tlMode === 'delete') {
      const name = tl?.name;
      deleteCurrent();
      tlOpen = false;
      toast(`Eliminata «${name}».`);
      return;
    }
    const name = tlName.trim();
    if (!name) return (tlError = 'Scrivi un nome.');
    if (isNameTaken(name, tlMode === 'rename' ? tl?.id ?? null : null)) return (tlError = 'Esiste già una timeline con questo nome.');
    if (tlMode === 'new') {
      newEmpty(name);
      highlight = null;
      scrollTo({ top: 0 });
    } else renameCurrent(name);
    tlOpen = false;
  }

  // ---------- import ----------
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
    if (tl && (tl.events.length || tl.categories.length)) {
      pending = res.data;
      importOpen = true;
    } else finishImport(res.data, tl ? 'replace' : 'new');
  }

  function finishImport(data: ImportedData, mode: 'new' | 'replace') {
    pending = null;
    importOpen = false;
    const t = mode === 'new' ? addImported(data) : replaceCurrent(data);
    highlight = null;
    toast(`Importata «${t.name}»: ${data.events.length} eventi.`, 'good');
    scrollTo({ top: 0 });
  }

  async function example() {
    if (fileMenu) fileMenu.open = false;
    try {
      const t = await loadExample();
      toast(`Caricato l'esempio «${t.name}».`, 'good');
    } catch {
      toast('Non riesco a scaricare l\'esempio: serve internet.', 'bad');
    }
  }

  function onScroll() {
    yearNow = canvas?.centerYear() ?? null;
  }
</script>

<svelte:window onscroll={onScroll} onkeydown={onKey} />

<div class="top">
  <AppHeader title="Linea del tempo" subject="Storia" />

  <div class="bar no-print">
    <a class="home narrow-only" href={import.meta.env.BASE_URL} aria-label="Torna all'indice del Quaderno">‹</a>
    {#if tl?.events.length}
      <div class="zoom wide-only" role="group" aria-label="Zoom">
        <button type="button" onclick={() => setZoom(zoom - 5)} disabled={zoom <= MIN_ZOOM} aria-label="Riduci">−</button>
        <button type="button" class="z" onclick={() => setZoom(DEFAULT_ZOOM)} title="Zoom normale">{Math.round((zoom / DEFAULT_ZOOM) * 100)}%</button>
        <button type="button" onclick={() => setZoom(zoom + 5)} disabled={zoom >= MAX_ZOOM} aria-label="Ingrandisci">+</button>
      </div>
    {/if}
    <div class="zoom" role="group" aria-label="Annulla e ripeti">
      <button type="button" onclick={doUndo} disabled={!history.canUndo} aria-label="Annulla" title="Annulla (Ctrl/⌘+Z)">↶</button>
      <button type="button" class="wide-only" onclick={doRedo} disabled={!history.canRedo} aria-label="Ripeti" title="Ripeti (Ctrl/⌘+Maiusc+Z)">↷</button>
    </div>
    {#if tl?.events.length}
      <SearchBox bind:this={search} timeline={tl} bind:matches ongo={(id) => canvas?.reveal(id)} onyear={(y) => canvas?.scrollToYear(y, 'smooth')} />
    {/if}
    {#if timelines.length > 1}
      <select
        class="tl-select wide-only"
        aria-label="Timeline aperta"
        value={store.currentId}
        onchange={(e) => { switchTimeline(e.currentTarget.value); highlight = null; scrollTo({ top: 0 }); }}
      >
        {#each timelines as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
      </select>
    {/if}
    {#if tl}
      <button type="button" class="tool wide-only" onclick={() => (catsOpen = true)}>Categorie</button>
    {/if}
    <details class="file" bind:this={fileMenu}>
      <summary aria-label="Menu"><span class="wide-only">File</span><span class="narrow-only" aria-hidden="true">⋯</span></summary>
      <div class="menu">
        {#if tl?.events.length}
          <div class="menu-zoom narrow-only" role="group" aria-label="Zoom">
            <span>Zoom</span>
            <button type="button" onclick={() => setZoom(zoom - 5)} disabled={zoom <= MIN_ZOOM} aria-label="Riduci">−</button>
            <b class="num">{Math.round((zoom / DEFAULT_ZOOM) * 100)}%</b>
            <button type="button" onclick={() => setZoom(zoom + 5)} disabled={zoom >= MAX_ZOOM} aria-label="Ingrandisci">+</button>
          </div>
          <button type="button" class="narrow-only" onclick={() => { closeMenu(); doRedo(); }} disabled={!history.canRedo}>↷ Ripeti</button>
          <button type="button" class="narrow-only" onclick={() => { closeMenu(); navOpen = true; }}>Vai a un anno…</button>
        {/if}
        {#if tl}<button type="button" class="narrow-only" onclick={() => { closeMenu(); catsOpen = true; }}>Categorie…</button>{/if}
        {#if timelines.length > 1}
          <label class="menu-select narrow-only">
            <span>Timeline</span>
            <select value={store.currentId} onchange={(e) => { closeMenu(); switchTimeline(e.currentTarget.value); highlight = null; scrollTo({ top: 0 }); }}>
              {#each timelines as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
            </select>
          </label>
        {/if}
        <button type="button" class="narrow-only" onclick={() => (display.theme = display.theme === 'auto' ? 'light' : display.theme === 'light' ? 'dark' : 'auto')}>
          Tema: {display.theme === 'auto' ? 'automatico' : display.theme === 'light' ? 'chiaro' : 'scuro'}
        </button>
        <button type="button" class="narrow-only" onclick={() => (display.projector = !display.projector)}>
          Modalità proiettore: {display.projector ? 'sì' : 'no'}
        </button>
        <hr class="narrow-only" />
        <button type="button" onclick={() => { closeMenu(); fileInput.click(); }}>Importa un file JSON…</button>
        {#if tl}<button type="button" onclick={() => { closeMenu(); downloadCurrent(); }}>Esporta «{tl.name}»</button>{/if}
        <button type="button" onclick={example}>Carica l'esempio</button>
        <hr />
        <button type="button" onclick={() => openTl('new')}>Nuova timeline…</button>
        {#if tl}
          <button type="button" onclick={() => openTl('rename')}>Rinomina «{tl.name}»…</button>
          <button type="button" onclick={() => { closeMenu(); segOpen = true; }}>Spaziatura delle epoche…</button>
          <button type="button" class="danger" onclick={() => openTl('delete')}>Elimina «{tl.name}»…</button>
        {/if}
      </div>
    </details>
  </div>
  {#if usedCats.length && tl?.events.length}
    <div class="cats no-print" role="group" aria-label="Evidenzia una categoria">
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
  {/if}
  {#if currentPeriods.length && tl?.events.length}
    <div class="now no-print" aria-label="Periodi in corso">
      <span class="now-lbl">Sei in</span>
      {#each currentPeriods as p (p.id)}
        {@const c = tl.categories.find((k) => k.id === p.categoryIds[0])}
        <button type="button" class="now-chip" style:--c={safeColor(c?.color ?? '#6B7A99')} onclick={() => canvas?.showPeriod(p.id)}>
          {p.title} <span class="num">{formatDate({ year: p.startYear })}–{formatDate({ year: p.endYear! })}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={onFile} />

<main>
  {#if tl && tl.events.length}
    <TimelineCanvas bind:this={canvas} timeline={tl} {zoom} {matches} bind:highlight onedit={openEdit} oncreate={(y) => openNew(y)} />
  {:else}
    <section class="empty">
      <h2>{tl ? `«${tl.name}» è vuota` : 'Nessuna timeline'}</h2>
      <p class="muted">
        {tl ? 'Aggiungi il primo evento, oppure importa' : 'Crea una timeline, oppure importa'} un file JSON esportato dalla linea del tempo.
      </p>
      <div class="row">
        {#if tl}
          <Button variant="primary" onclick={() => openNew(null)}>+ Aggiungi il primo evento</Button>
        {:else}
          <Button variant="primary" onclick={() => openTl('new')}>+ Nuova timeline</Button>
        {/if}
        <Button onclick={() => fileInput.click()}>Importa un file</Button>
        <Button variant="ghost" onclick={example}>Carica l'esempio</Button>
      </div>
    </section>
  {/if}
</main>

{#if tl}
  <button type="button" class="fab no-print" onclick={() => openNew()} aria-label="Nuovo evento" title="Nuovo evento (N)">+</button>
{/if}

{#if yearNow != null && tl?.events.length}
  <button type="button" class="year-now num no-print" onclick={() => (navOpen = true)} title="Vai a un anno (G)" aria-label="Anno {yearNow}: vai a un altro anno">
    {yearNow < 0 ? `${-yearNow} a.C.` : yearNow} <span aria-hidden="true">▾</span>
  </button>
{/if}

{#if tl}
  <EventEditor
    bind:open={editorOpen}
    initial={editorDraft}
    timeline={tl}
    onsave={onSave}
    ondelete={onDelete}
    oncreatecategory={createCategory}
  />
  <CategoryManager bind:open={catsOpen} timeline={tl} onchange={(m) => toast(m, 'good', true)} />
  <Navigator bind:open={navOpen} timeline={tl} current={yearNow} ongo={(y) => canvas?.scrollToYear(y, 'smooth')} />
  <SegmentsEditor
    bind:open={segOpen}
    timeline={tl}
    onsave={(segs) => { edit('Spaziatura', (t) => { t.segments = segs; }); toast('Spaziatura aggiornata.', 'good', true); }}
  />
{/if}

<Dialog bind:open={tlOpen} title={tlMode === 'new' ? 'Nuova timeline' : tlMode === 'rename' ? 'Rinomina timeline' : 'Elimina timeline'} width={460}>
  {#if tlMode === 'delete'}
    <p>Vuoi eliminare «{tl?.name}» con i suoi {tl?.events.length} eventi? Non si può annullare.</p>
    <p class="muted">Se vuoi tenerne una copia, prima usa File → Esporta.</p>
  {:else}
    <div class="field">
      <label for="tl-name">Nome</label>
      <input id="tl-name" type="text" bind:value={tlName} placeholder="es. Storia medievale" aria-invalid={!!tlError}
        onkeydown={(e) => { if (e.key === 'Enter') confirmTl(); }} />
      {#if tlError}<p class="error">{tlError}</p>{/if}
    </div>
  {/if}
  {#snippet footer()}
    <span class="spacer"></span>
    <Button onclick={() => (tlOpen = false)}>Annulla</Button>
    {#if tlMode === 'delete'}
      <Button onclick={confirmTl} style="background: var(--bad); color: var(--panel); border-color: var(--bad);">Elimina</Button>
    {:else}
      <Button variant="primary" onclick={confirmTl}>{tlMode === 'new' ? 'Crea' : 'Salva'}</Button>
    {/if}
  {/snippet}
</Dialog>

<Dialog bind:open={importOpen} title="Importa «{pending?.name ?? ''}»" width={520} onclose={() => (pending = null)}>
  <p>La timeline aperta, «{tl?.name}», contiene già dei dati. Dove vuoi importare il file?</p>
  {#snippet footer()}
    <Button variant="primary" onclick={() => finishImport(pending!, 'new')}>In una nuova timeline</Button>
    <Button onclick={() => finishImport(pending!, 'replace')}>Sostituisci «{tl?.name}»</Button>
    <span class="spacer"></span>
    <Button variant="ghost" onclick={() => { importOpen = false; pending = null; }}>Annulla</Button>
  {/snippet}
</Dialog>

{#if message}
  <div class="toast {message.tone}" role="status">
    {message.text}
    {#if message.undoable && history.canUndo}
      <button type="button" onclick={() => { message = null; doUndo(); }}>Annulla</button>
    {/if}
  </div>
{/if}

<style>
  .top { position: sticky; top: 0; z-index: 10; background: var(--paper); }
  .now {
    position: absolute; top: 100%; left: 0; right: 0;
    display: flex; align-items: center; gap: 6px; padding: 6px 12px; overflow-x: auto;
    background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line); scrollbar-width: none;
  }
  .now-lbl { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); flex: none; }
  .now-chip {
    flex: none; border: 0; cursor: pointer; border-radius: 999px; padding: 4px 12px; white-space: nowrap;
    font: 700 14px var(--font-body); color: var(--ink);
    background: color-mix(in srgb, var(--c) 18%, var(--panel)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c) 60%, transparent);
  }
  .now-chip span { font-weight: 600; color: var(--muted); margin-left: 4px; }
  .tl-select {
    font: 700 16px var(--font-body); color: var(--ink); background: var(--panel);
    border: var(--border) solid var(--line); border-radius: 999px; min-height: var(--target);
    padding: 0 12px; max-width: 34vw; flex: none; width: auto;
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
    display: flex; gap: 6px; overflow-x: auto; min-width: 0;
    scrollbar-width: thin; padding: 6px 16px; border-bottom: var(--border) solid var(--line);
  }
  .narrow-only { display: none !important; }
  @media (max-width: 700px) {
    .wide-only { display: none !important; }
    .narrow-only { display: revert !important; }
    .cats { padding: 6px 12px; }
  }
  .menu-zoom { display: flex !important; align-items: center; gap: 6px; padding: 4px 12px; font-weight: 700; }
  @media (min-width: 701px) { .menu-zoom { display: none !important; } }
  .menu-zoom span { flex: 1; }
  .menu-zoom button { all: unset; width: 40px; height: 40px; text-align: center; border-radius: 50%; font-size: 20px; cursor: pointer; background: var(--chip); }
  .menu-select { flex-direction: column; gap: 4px; padding: 6px 12px; font-weight: 700; }
  @media (max-width: 700px) { .menu-select { display: flex !important; } }
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
  .file { margin-left: auto; }
  .home { font: 800 30px/1 var(--font-body); color: var(--muted); text-decoration: none; padding: 4px 8px 8px 4px; }
  /* telefono: una sola riga compatta, niente intestazione grande */
  @media (max-width: 700px) {
    .top :global(.app-header) { display: none; }
    .bar { padding: 6px 8px; gap: 6px; }
    .bar :global(.search) { min-height: 40px; flex: 1 1 auto; max-width: none; }
    .zoom button { min-width: 40px; min-height: 36px; }
    .file summary { min-height: 40px; padding: 0 14px; font-size: 22px; }
    .cats { padding: 4px 8px; gap: 4px; }
    .cat { font-size: 13px; padding: 3px 10px 3px 8px; }
    .now { padding: 4px 8px; }
  }

  main { padding: 0 0 40px; }
  .empty { max-width: 560px; margin: 64px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 12px; text-align: center; align-items: center; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

  .year-now span { font-size: 14px; color: var(--muted); }
  .year-now {
    position: fixed; left: 16px; bottom: 16px; z-index: 9;
    font: 600 22px var(--font-display); color: var(--ink);
    background: var(--panel); border: var(--border) solid var(--line); border-radius: 999px; padding: 4px 16px;
    cursor: pointer; min-height: var(--target);
  }
  .toast {
    position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 30;
    background: var(--ink); color: var(--paper); padding: 10px 18px; border-radius: 999px; font-weight: 700;
    max-width: calc(100vw - 32px);
  }
  .toast { display: flex; align-items: center; gap: 12px; }
  .toast button { border: 0; background: rgb(255 255 255 / 0.2); color: inherit; font: 800 0.95em var(--font-body); padding: 6px 14px; border-radius: 999px; cursor: pointer; min-height: 36px; }
  .toast.good { background: var(--good); color: var(--panel); }
  .toast.bad { background: var(--bad); color: var(--panel); }
  .spacer { flex: 1; }
  .error { font-size: 0.85em; color: var(--bad); font-weight: 700; }
  .tool {
    flex: none; min-height: var(--target); padding: 0 16px; border-radius: 999px; cursor: pointer;
    font: 700 1em var(--font-body); color: var(--ink); background: var(--panel); border: var(--border) solid var(--line);
  }
  .menu hr { border: 0; border-top: var(--border) solid var(--line); margin: 4px 6px; }
  .menu .danger { color: var(--bad); }
  .fab {
    position: fixed; right: 20px; bottom: calc(20px + env(safe-area-inset-bottom)); z-index: 9;
    width: 60px; height: 60px; border-radius: 50%; border: 0; cursor: pointer;
    background: var(--accent); color: var(--panel); font: 600 34px/1 var(--font-display);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
  }
  .fab:hover { filter: brightness(1.08); }
  :global(:root[data-projector]) .fab { width: 72px; height: 72px; font-size: 40px; }
</style>
