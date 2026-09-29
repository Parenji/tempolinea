<script lang="ts">
  import { untrack } from 'svelte';
  // Gestione delle categorie: elenco, creazione/modifica, unione, eliminazione e
  // spostamento di eventi in un'altra categoria (il "dividi" della v1).
  // Ogni azione confermata passa da edit(): si può annullare con ↶.
  import Dialog from '$shared/ui/Dialog.svelte';
  import Button from '$shared/ui/Button.svelte';
  import Segmented from '$shared/ui/Segmented.svelte';
  import Toggle from '$shared/ui/Toggle.svelte';
  import { edit } from '../store.svelte';
  import {
    PALETTE, newCategoryDraft, saveCategory, deleteCategories, mergeCategories, moveEvents, countEvents,
    categoryNameTaken, type CategoryDraft,
  } from '../data/ops';
  import { compareDates, eventStart, formatDate } from '../data/dates';
  import { safeColor } from '../format';
  import type { Category, Timeline } from '../data/schema';

  interface Props {
    open: boolean;
    timeline: Timeline;
    /** se valorizzato, si apre direttamente la modifica di questa categoria */
    focusId?: string | null;
    onchange?: (msg: string) => void;
  }
  let { open = $bindable(), timeline, focusId = null, onchange }: Props = $props();

  type View = 'list' | 'edit' | 'merge';
  let view = $state<View>('list');
  let query = $state('');
  let selecting = $state(false);
  let selected: string[] = $state([]);
  let draft: CategoryDraft = $state(newCategoryDraft({ categories: [] } as unknown as Timeline));
  let error = $state('');
  let confirmDelete = $state(false);
  // spostamento eventi
  let moving: string[] = $state([]);
  let moveTo = $state('');
  let moveNewName = $state('');

  $effect.pre(() => {
    if (!open) return;
    untrack(() => {
      selecting = false;
      selected = [];
      query = '';
      const cat = focusId ? timeline.categories.find((c) => c.id === focusId) : null;
      if (cat) startEdit(cat);
      else view = 'list';
    });
  });

  const sides = [
    { value: 'auto' as const, label: 'Automatico' },
    { value: 'left' as const, label: 'Sinistra' },
    { value: 'right' as const, label: 'Destra' },
  ];

  const list = $derived(
    [...timeline.categories]
      .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'it'))
  );
  const eventsOf = (id: string) =>
    timeline.events.filter((e) => e.categoryIds.includes(id)).sort((a, b) => compareDates(eventStart(a), eventStart(b)));

  function startNew() {
    draft = newCategoryDraft(timeline);
    error = '';
    confirmDelete = false;
    view = 'edit';
  }
  function startEdit(c: Category) {
    draft = { id: c.id, name: c.name, color: c.color, preferredSide: c.preferredSide ?? 'auto', showConnectors: c.showConnectors !== false };
    error = '';
    confirmDelete = false;
    moving = [];
    moveTo = '';
    moveNewName = '';
    view = 'edit';
  }

  function save() {
    if (!draft.name.trim()) return (error = 'Scrivi un nome.');
    if (categoryNameTaken(timeline, draft.name, draft.id)) return (error = 'Esiste già una categoria con questo nome.');
    const isNew = !draft.id;
    edit(isNew ? 'Nuova categoria' : 'Modifica categoria', (tl) => saveCategory(tl, $state.snapshot(draft) as CategoryDraft));
    onchange?.(isNew ? `Creata «${draft.name.trim()}».` : `Salvata «${draft.name.trim()}».`);
    view = 'list';
  }

  function remove(ids: string[]) {
    const names = ids.map((id) => timeline.categories.find((c) => c.id === id)?.name).filter(Boolean);
    edit('Elimina categorie', (tl) => deleteCategories(tl, ids));
    onchange?.(ids.length === 1 ? `Eliminata «${names[0]}».` : `Eliminate ${ids.length} categorie.`);
    selecting = false;
    selected = [];
    view = 'list';
  }

  function startMerge() {
    const first = timeline.categories.find((c) => c.id === selected[0]);
    draft = { ...newCategoryDraft(timeline), name: selected.map((id) => timeline.categories.find((c) => c.id === id)?.name).join(' e '), color: first?.color ?? PALETTE[0] };
    error = '';
    view = 'merge';
  }
  function merge() {
    if (!draft.name.trim()) return (error = 'Scrivi un nome.');
    const ids = [...selected];
    const others = timeline.categories.filter((c) => !ids.includes(c.id));
    if (others.some((c) => c.name.trim().toLowerCase() === draft.name.trim().toLowerCase())) return (error = 'Esiste già una categoria con questo nome.');
    edit('Unisci categorie', (tl) => mergeCategories(tl, ids, $state.snapshot(draft) as CategoryDraft));
    onchange?.(`Unite in «${draft.name.trim()}».`);
    selecting = false;
    selected = [];
    view = 'list';
  }

  function applyMove() {
    const fromId = draft.id!;
    if (!moving.length || !moveTo) return;
    if (moveTo === '__new__' && !moveNewName.trim()) return (error = 'Scrivi il nome della nuova categoria.');
    if (moveTo === '__new__' && categoryNameTaken(timeline, moveNewName)) return (error = 'Esiste già una categoria con questo nome.');
    const n = moving.length;
    const emptied = n === eventsOf(fromId).length;
    edit('Sposta eventi', (tl) => {
      const dest = moveTo === '__new__' ? saveCategory(tl, { ...newCategoryDraft(tl), name: moveNewName.trim() }) : moveTo;
      moveEvents(tl, fromId, moving, dest);
    });
    onchange?.(`Spostati ${n} eventi.`);
    moving = [];
    moveNewName = '';
    error = '';
    if (emptied) view = 'list';
  }

  const customColor = $derived(!PALETTE.some((c) => c.toLowerCase() === draft.color.toLowerCase()));
  const title = $derived(view === 'merge' ? 'Unisci categorie' : view === 'edit' ? (draft.id ? 'Modifica categoria' : 'Nuova categoria') : 'Categorie');
</script>

<Dialog bind:open {title} width={600}>
  {#if view === 'list'}
    <div class="top">
      {#if timeline.categories.length > 6}
        <input type="search" bind:value={query} placeholder="Cerca una categoria" aria-label="Cerca una categoria" />
      {/if}
      <div class="row">
        <Button variant="primary" onclick={startNew}>+ Nuova categoria</Button>
        {#if timeline.categories.length > 1}
          <Button variant="ghost" onclick={() => { selecting = !selecting; selected = []; }}>{selecting ? 'Fine selezione' : 'Seleziona più categorie'}</Button>
        {/if}
      </div>
    </div>
    {#if !timeline.categories.length}
      <p class="muted">Ancora nessuna categoria. Le categorie danno colore agli eventi e li collegano con una linea.</p>
    {/if}
    <ul class="list">
      {#each list as c (c.id)}
        {@const n = countEvents(timeline, c.id)}
        <li style:--cat={safeColor(c.color)}>
          {#if selecting}
            <label class="pick">
              <input type="checkbox" value={c.id} bind:group={selected} />
              <span class="dot"></span>
              <span class="name">{c.name}</span>
              <span class="count num">{n}</span>
            </label>
          {:else}
            <button type="button" class="open" onclick={() => startEdit(c)}>
              <span class="dot"></span>
              <span class="name">{c.name}</span>
              <span class="count num">{n} {n === 1 ? 'evento' : 'eventi'}</span>
            </button>
            <label class="lines" title="Mostra la linea che collega gli eventi della categoria">
              <input
                type="checkbox"
                role="switch"
                checked={c.showConnectors !== false}
                onchange={() => edit('Linea categoria', (tl) => {
                  const cat = tl.categories.find((k) => k.id === c.id);
                  if (cat) cat.showConnectors = cat.showConnectors === false;
                })}
              />
              <span>linea</span>
            </label>
          {/if}
        </li>
      {/each}
    </ul>
  {:else if view === 'edit' || view === 'merge'}
    <div class="form">
      <div class="field">
        <label for="cat-name">Nome *</label>
        <input id="cat-name" type="text" bind:value={draft.name} aria-invalid={!!error} placeholder="es. Politica, Arte, Scienza…" autocomplete="off" />
      </div>
      <div class="field">
        <span class="label">Colore</span>
        <div class="swatches" role="radiogroup" aria-label="Colore">
          {#each PALETTE as col}
            <button type="button" role="radio" aria-checked={draft.color.toLowerCase() === col.toLowerCase()} aria-label={col} style:--sw={col} onclick={() => (draft.color = col)}></button>
          {/each}
          <label class="custom" class:checked={customColor} title="Altro colore" style:--sw={draft.color}>
            <input type="color" bind:value={draft.color} aria-label="Scegli un altro colore" />
          </label>
        </div>
      </div>
      <div class="field">
        <span class="label">Lato preferito delle card</span>
        <Segmented label="Lato preferito" options={sides} bind:value={draft.preferredSide} />
        <p class="hint">Con "Automatico" le categorie si alternano e una card può cambiare lato per trovare spazio.</p>
      </div>
      {#if view === 'edit'}
        <Toggle label="Mostra la linea che collega i suoi eventi" bind:checked={draft.showConnectors} />
      {/if}
      {#if error}<p class="error">{error}</p>{/if}

      {#if view === 'edit' && draft.id && eventsOf(draft.id).length}
        {@const evs = eventsOf(draft.id)}
        <details class="move">
          <summary>Sposta alcuni eventi in un'altra categoria ({evs.length})</summary>
          <p class="hint">Utile per dividere una categoria in due. Salva prima le altre modifiche.</p>
          <ul class="evs">
            {#each evs as e (e.id)}
              <li><label><input type="checkbox" value={e.id} bind:group={moving} /> <b class="num">{formatDate(eventStart(e))}</b> {e.title}</label></li>
            {/each}
          </ul>
          <div class="row">
            <select bind:value={moveTo} aria-label="Categoria di destinazione">
              <option value="" disabled>Sposta in…</option>
              {#each timeline.categories.filter((c) => c.id !== draft.id) as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
              <option value="__new__">Una nuova categoria…</option>
            </select>
            {#if moveTo === '__new__'}
              <input type="text" bind:value={moveNewName} placeholder="Nome della nuova categoria" aria-label="Nome della nuova categoria" />
            {/if}
            <Button onclick={applyMove} disabled={!moving.length || !moveTo}>Sposta {moving.length || ''}</Button>
          </div>
        </details>
      {/if}
    </div>
  {/if}

  {#snippet footer()}
    {#if view === 'list'}
      {#if selecting}
        <Button onclick={startMerge} disabled={selected.length < 2}>Unisci {selected.length || ''}</Button>
        {#if confirmDelete}
          <Button onclick={() => { remove(selected); confirmDelete = false; }} disabled={!selected.length} style="background: var(--bad); color: var(--panel); border-color: var(--bad);">Sì, elimina {selected.length}</Button>
          <Button variant="ghost" onclick={() => (confirmDelete = false)}>No</Button>
        {:else}
          <Button variant="ghost" onclick={() => (confirmDelete = true)} disabled={!selected.length} style="color: var(--bad);">Elimina {selected.length || ''}</Button>
        {/if}
      {/if}
      <span class="spacer"></span>
      <Button onclick={() => (open = false)}>Chiudi</Button>
    {:else if view === 'edit'}
      {#if draft.id}
        {#if confirmDelete}
          <span class="warn">Gli eventi restano, senza questa categoria.</span>
          <Button onclick={() => remove([draft.id!])} style="background: var(--bad); color: var(--panel); border-color: var(--bad);">Sì, elimina</Button>
          <Button variant="ghost" onclick={() => (confirmDelete = false)}>No</Button>
        {:else}
          <Button variant="ghost" onclick={() => (confirmDelete = true)} style="color: var(--bad);">Elimina</Button>
        {/if}
      {/if}
      <span class="spacer"></span>
      <Button onclick={() => (view = 'list')}>Indietro</Button>
      <Button variant="primary" onclick={save}>Salva</Button>
    {:else}
      <span class="spacer"></span>
      <Button onclick={() => (view = 'list')}>Indietro</Button>
      <Button variant="primary" onclick={merge}>Unisci {selected.length} categorie</Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .top { display: flex; flex-direction: column; gap: 10px; }
  .spacer { flex: 1; }
  .error { font-size: 0.85em; color: var(--bad); font-weight: 700; }
  .warn { font-size: 0.85em; color: var(--muted); }
  .hint { font-size: 0.8em; color: var(--muted); }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .list li { display: flex; align-items: center; gap: 8px; border: var(--border) solid var(--line); border-radius: var(--radius-sm); background: var(--panel); }
  .open, .pick {
    all: unset; box-sizing: border-box; flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; min-height: var(--target); cursor: pointer;
  }
  .open:focus-visible { outline: 3px solid var(--focus); border-radius: var(--radius-sm); }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--cat); flex: none; }
  .name { font-weight: 800; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .count { color: var(--muted); font-size: 0.85em; font-weight: 700; white-space: nowrap; }
  .pick input { width: 20px; height: 20px; accent-color: var(--accent); }
  .lines { display: flex; align-items: center; gap: 6px; padding: 0 12px; font-size: 0.8em; font-weight: 700; color: var(--muted); cursor: pointer; }
  .lines input { width: 18px; height: 18px; accent-color: var(--cat); }

  .form { display: flex; flex-direction: column; gap: 18px; }
  .swatches { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .swatches button, .custom {
    width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--panel); background: var(--sw);
    cursor: pointer; box-shadow: 0 0 0 1px var(--line); position: relative;
  }
  .swatches button[aria-checked='true'] { box-shadow: 0 0 0 3px var(--ink); }
  .custom { background: conic-gradient(#D64545, #C99A06, #1F9D6B, #2F6FB0, #8B4FD8, #D64545); overflow: hidden; }
  .custom.checked { background: var(--sw); box-shadow: 0 0 0 3px var(--ink); }
  .custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .move { border: var(--border) solid var(--line); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; }
  .move summary { font-weight: 800; cursor: pointer; }
  .move[open] { gap: 10px; }
  .evs { list-style: none; margin: 8px 0; padding: 0; max-height: 240px; overflow: auto; display: flex; flex-direction: column; gap: 4px; }
  .evs label { display: flex; gap: 8px; align-items: baseline; cursor: pointer; font-size: 0.9em; }
  .move .row select { width: auto; flex: 1 1 180px; }
  .move .row input { flex: 1 1 180px; }
</style>
