<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '$shared/i18n';
  // Modulo per creare o modificare un evento, un periodo o un appunto.
  // Lavora su una bozza: la timeline cambia solo quando si preme Salva.
  import Dialog from '$shared/ui/Dialog.svelte';
  import Button from '$shared/ui/Button.svelte';
  import Segmented from '$shared/ui/Segmented.svelte';
  import DateInput from './DateInput.svelte';
  import { PALETTE, newDraft, newCategoryDraft, validateDraft, categoryNameTaken, type EventDraft, type EventKind, type CategoryDraft, type DraftError } from '../data/ops';
  import { compareDates, eventStart, formatDate } from '../data/dates';
  import { formatDescription, safeColor } from '../format';
  import type { Timeline } from '../data/schema';

  interface Props {
    open: boolean;
    initial: EventDraft;
    timeline: Timeline;
    onsave: (d: EventDraft) => void;
    ondelete: (id: string) => void;
    oncreatecategory: (d: CategoryDraft) => string | undefined;
  }
  let { open = $bindable(), initial, timeline, onsave, ondelete, oncreatecategory }: Props = $props();

  let d: EventDraft = $state(newDraft());
  // gli errori compaiono dopo il primo tentativo di salvataggio, poi si aggiornano mentre si scrive
  let tried = $state(false);
  const errors: DraftError[] = $derived(tried ? validateDraft(withEnd(d)) : []);
  let showEnd = $state(false);
  let confirmDelete = $state(false);
  let newCat: CategoryDraft | null = $state(null);
  let newCatError = $state('');
  let linkQuery = $state('');
  let preview = $state(false);
  let imgFailed = $state(false);
  let textarea: HTMLTextAreaElement | undefined = $state();

  // ogni volta che si apre, si riparte dalla bozza ricevuta (solo `open` è una dipendenza)
  $effect.pre(() => {
    if (!open) return;
    untrack(() => {
      d = structuredClone($state.snapshot(initial)) as EventDraft;
      tried = false;
      showEnd = d.end.year != null;
      confirmDelete = false;
      newCat = null;
      linkQuery = '';
      preview = false;
      imgFailed = false;
    });
  });

  const kinds: { value: EventKind; label: string }[] = [
    { value: 'event', label: t('Evento') },
    { value: 'period', label: t('Periodo') },
    { value: 'note', label: t('Appunto') },
  ];
  const titles: Record<EventKind, [string, string]> = {
    event: [t('Nuovo evento'), t('Modifica evento')],
    period: [t('Nuovo periodo'), t('Modifica periodo')],
    note: [t('Nuovo appunto'), t('Modifica appunto')],
  };
  const err = (f: DraftError['field']) => errors.filter((e) => e.field === f).map((e) => e.message).join(' ') || undefined;

  // ---------- categorie: al massimo due, la prima decide colore e lato ----------
  const sortedCats = $derived([...timeline.categories].sort((a, b) => a.name.localeCompare(b.name, 'it')));
  function toggleCat(id: string) {
    const i = d.categoryIds.indexOf(id);
    if (i >= 0) d.categoryIds.splice(i, 1);
    else if (d.categoryIds.length < 2) d.categoryIds.push(id);
    else d.categoryIds[1] = id;
  }
  function makePrimary(id: string) {
    d.categoryIds = [id, ...d.categoryIds.filter((c) => c !== id)];
  }
  function createCategory() {
    if (!newCat) return;
    if (!newCat.name.trim()) return (newCatError = t('Scrivi un nome.'));
    if (categoryNameTaken(timeline, newCat.name)) return (newCatError = t('Esiste già una categoria con questo nome.'));
    const id = oncreatecategory(newCat);
    if (id) toggleCat(id);
    newCat = null;
    newCatError = '';
  }

  // ---------- collegamenti ----------
  const byId = $derived(new Map(timeline.events.map((e) => [e.id, e])));
  const linkable = $derived(
    timeline.events.filter((e) => e.type !== 'note' && !e.isPeriod && e.id !== d.id && !d.linkedEvents.some((l) => l.eventId === e.id))
  );
  const linkResults = $derived.by(() => {
    const q = linkQuery.trim().toLowerCase();
    if (!q) return [];
    return linkable
      .filter((e) => (e.title ?? '').toLowerCase().includes(q) || String(e.startYear).startsWith(q))
      .sort((a, b) => compareDates(eventStart(a), eventStart(b)))
      .slice(0, 8);
  });

  // ---------- descrizione ----------
  function wrap(marker: string) {
    if (!textarea) return;
    const { selectionStart: s, selectionEnd: e, value } = textarea;
    d.description = value.slice(0, s) + marker + value.slice(s, e) + marker + value.slice(e);
    requestAnimationFrame(() => {
      textarea!.focus();
      textarea!.setSelectionRange(s + marker.length, e + marker.length);
    });
  }

  /** un evento senza "data di fine" aperta non ha fine, anche se il campo era stato compilato */
  function withEnd(x: EventDraft): EventDraft {
    return x.kind === 'event' && !showEnd ? { ...x, end: { year: null, bc: false, month: null, day: null } } : x;
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    tried = true;
    if (validateDraft(withEnd(d)).length) return;
    onsave(withEnd($state.snapshot(d) as EventDraft));
    open = false;
  }

  const dateLabel = (id: string) => {
    const e = byId.get(id);
    return e ? formatDate(eventStart(e)) : '';
  };
</script>

<Dialog bind:open title={titles[d.kind][d.id ? 1 : 0]} width={620}>
  <form id="event-form" class="form" onsubmit={submit} novalidate>
    <Segmented label={t('Tipo')} options={kinds} bind:value={d.kind} />
    <p class="muted small">
      {#if d.kind === 'event'}{t('Un fatto con una data: compare come card sulla linea.')}
      {:else if d.kind === 'period'}{t('Un intervallo di tempo: ha un titolo che apre il periodo e una fascia colorata accanto all\'asse.')}
      {:else}{t("Una nota libera: l'anno serve solo a posizionarla.")}{/if}
    </p>

    <div class="field">
      <label for="ev-title">{d.kind === 'note' ? t('Titolo (facoltativo)') : t('Titolo') + ' *'}</label>
      <!-- svelte-ignore a11y_autofocus (nel dialog modale il focus deve andare sul primo campo) -->
      <input id="ev-title" type="text" autofocus bind:value={d.title} aria-invalid={!!err('title')} placeholder={t("es. Scoperta dell'America")} autocomplete="off" />
      {#if err('title')}<p class="error">{err('title')}</p>{/if}
    </div>

    <DateInput
      id="ev-start"
      label={d.kind === 'period' ? t('Inizio') : d.kind === 'note' ? t('Anno') : t('Data')}
      required
      yearOnly={d.kind === 'note'}
      bind:value={d.start}
      error={err('start')}
    />

    {#if d.kind === 'period' || (d.kind === 'event' && showEnd)}
      <div class="end">
        <DateInput id="ev-end" label={t('Fine')} required={d.kind === 'period'} bind:value={d.end} error={err('end')} />
        {#if d.kind === 'event'}
          <button type="button" class="link-btn" onclick={() => (showEnd = false)}>{t('Togli la data di fine')}</button>
        {/if}
      </div>
    {:else if d.kind === 'event'}
      <button type="button" class="link-btn" onclick={() => (showEnd = true)}>+ {t('Aggiungi una data di fine (es. una guerra)')}</button>
    {/if}

    <div class="field">
      <div class="desc-head">
        <label for="ev-desc">{t('Descrizione')}</label>
        <div class="fmt" role="group" aria-label={t('Formattazione')}>
          <button type="button" onclick={() => wrap('**')} title={t('Grassetto')}><b>{t('G')}</b></button>
          <button type="button" onclick={() => wrap('*')} title={t('Corsivo')}><i>{t('C')}</i></button>
          <button type="button" onclick={() => wrap('__')} title={t('Sottolineato')}><u>{t('S')}</u></button>
          <button type="button" aria-pressed={preview} onclick={() => (preview = !preview)}>{t('Anteprima')}</button>
        </div>
      </div>
      {#if preview}
        <div class="preview">{@html formatDescription(d.description) || `<span class="muted">${t('Niente da mostrare.')}</span>`}</div>
      {:else}
        <textarea id="ev-desc" bind:this={textarea} bind:value={d.description} placeholder={t('Che cosa è successo? Perché è importante?')}></textarea>
      {/if}
    </div>

    <div class="field">
      <label for="ev-img">{t('Immagine (indirizzo web)')}</label>
      <input id="ev-img" type="url" inputmode="url" bind:value={d.imageUrl} oninput={() => (imgFailed = false)} placeholder="https://…" />
      {#if d.imageUrl.trim()}
        {#if imgFailed}
          <p class="error">{t("Non riesco a caricare questa immagine: controlla l'indirizzo.")}</p>
        {:else}
          <img class="thumb" src={d.imageUrl.trim()} alt={t('Anteprima')} onerror={() => (imgFailed = true)} />
        {/if}
      {:else}
        <p class="hint">{t('Compare quando si apre la card.')}</p>
      {/if}
    </div>

    {#if d.kind !== 'note'}
      <div class="field">
        <span class="label">{t('Categorie')}</span>
        <p class="hint">{t('Al massimo due. La prima decide il colore e il lato della card.')}</p>
        <div class="cats">
          {#each sortedCats as c (c.id)}
            {@const pos = d.categoryIds.indexOf(c.id)}
            <button
              type="button"
              class="cat"
              class:on={pos >= 0}
              style:--cat={safeColor(c.color)}
              aria-pressed={pos >= 0}
              onclick={() => toggleCat(c.id)}
            >
              {c.name}{#if pos === 0 && d.categoryIds.length > 1}<small> · {t('principale')}</small>{/if}
            </button>
          {/each}
          {#if !newCat}
            <button type="button" class="cat add" onclick={() => (newCat = newCategoryDraft(timeline))}>+ {t('Nuova')}</button>
          {/if}
        </div>
        {#if d.categoryIds.length === 2}
          <button type="button" class="link-btn" onclick={() => makePrimary(d.categoryIds[1])}>{t('Scambia principale e secondaria')}</button>
        {/if}
        {#if newCat}
          <div class="newcat">
            <input type="text" bind:value={newCat.name} placeholder={t('Nome della categoria')} aria-label={t('Nome della nuova categoria')}
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCategory(); } }} />
            <div class="swatches" role="radiogroup" aria-label={t('Colore')}>
              {#each PALETTE as col}
                <button type="button" role="radio" aria-checked={newCat.color === col} aria-label={col} style:--sw={col} onclick={() => (newCat!.color = col)}></button>
              {/each}
            </div>
            {#if newCatError}<p class="error">{newCatError}</p>{/if}
            <div class="row">
              <Button variant="primary" onclick={createCategory}>{t('Crea')}</Button>
              <Button variant="ghost" onclick={() => (newCat = null)}>{t('Annulla')}</Button>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if d.kind === 'event'}
      <div class="field">
        <label for="ev-link">{t('Eventi collegati')}</label>
        {#if d.linkedEvents.length}
          <ul class="links">
            {#each d.linkedEvents as l, i (l.eventId)}
              <li>
                <span class="lt"><b class="num">{dateLabel(l.eventId)}</b> {byId.get(l.eventId)?.title ?? t('(evento eliminato)')}</span>
                <select bind:value={l.side} aria-label={t('Direzione della curva')}>
                  <option value="auto">{t('Curva automatica')}</option>
                  <option value="left">{t('Curva a sinistra')}</option>
                  <option value="right">{t('Curva a destra')}</option>
                </select>
                <button type="button" class="rm" aria-label={t('Togli collegamento')} onclick={() => d.linkedEvents.splice(i, 1)}>×</button>
              </li>
            {/each}
          </ul>
        {/if}
        <input id="ev-link" type="search" bind:value={linkQuery} placeholder={t('Cerca un evento da collegare (titolo o anno)')} autocomplete="off" />
        {#if linkResults.length}
          <ul class="results">
            {#each linkResults as e (e.id)}
              <li>
                <button type="button" onclick={() => { d.linkedEvents.push({ eventId: e.id, side: 'auto' }); linkQuery = ''; }}>
                  <b class="num">{formatDate(eventStart(e))}</b> {e.title}
                </button>
              </li>
            {/each}
          </ul>
        {:else if linkQuery.trim()}
          <p class="hint">{t('Nessun evento trovato.')}</p>
        {/if}
      </div>
    {/if}
  </form>

  {#snippet footer()}
    {#if d.id}
      {#if confirmDelete}
        <Button onclick={() => { ondelete(d.id!); open = false; }} style="background: var(--bad); color: var(--panel); border-color: var(--bad);">{t('Sì, elimina')}</Button>
        <Button variant="ghost" onclick={() => (confirmDelete = false)}>{t('No')}</Button>
      {:else}
        <Button variant="ghost" onclick={() => (confirmDelete = true)} style="color: var(--bad);">{t('Elimina')}</Button>
      {/if}
    {/if}
    <span class="spacer"></span>
    {#if errors.length}<span class="error footer-err">{t('Controlla i campi evidenziati.')}</span>{/if}
    <Button onclick={() => (open = false)}>{t('Annulla')}</Button>
    <Button variant="primary" type="submit" form="event-form">{t('Salva')}</Button>
  {/snippet}
</Dialog>

<style>
  .form { display: flex; flex-direction: column; gap: 18px; }
  .small { font-size: 0.85em; margin-top: -8px; }
  .error { font-size: 0.85em; color: var(--bad); font-weight: 700; }
  .hint { font-size: 0.8em; color: var(--muted); }
  .spacer { flex: 1; }
  @media (max-width: 600px) { .footer-err { display: none; } }
  .end { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
  .link-btn { align-self: flex-start; border: 0; background: none; padding: 4px 0; color: var(--accent); font: 700 0.9em var(--font-body); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  .desc-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  .desc-head label { font-weight: 800; font-size: 0.89em; }
  .fmt { display: flex; gap: 4px; }
  .fmt button {
    min-width: 36px; min-height: 34px; border: var(--border) solid var(--line); background: var(--panel); color: var(--ink);
    border-radius: 8px; cursor: pointer; font: 700 0.85em var(--font-body); padding: 0 8px;
  }
  .fmt button[aria-pressed='true'] { background: var(--ink); color: var(--paper); }
  .preview { min-height: 110px; padding: 8px 12px; border: var(--border) dashed var(--line); border-radius: var(--radius-sm); }
  .thumb { max-width: 100%; max-height: 160px; border-radius: 8px; align-self: flex-start; background: var(--chip); }

  .cats { display: flex; flex-wrap: wrap; gap: 6px; }
  .cat {
    display: inline-flex; align-items: center; gap: 6px; min-height: 38px;
    font: 700 0.85em var(--font-body); color: var(--ink); background: var(--panel);
    border: var(--border) solid var(--line); border-radius: 999px; padding: 4px 12px 4px 9px; cursor: pointer;
  }
  .cat::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: var(--cat); }
  .cat.on { background: var(--cat); border-color: var(--cat); color: #fff; }
  .cat.on::before { background: #fff; }
  .cat small { font-weight: 600; opacity: 0.9; }
  .cat.add { border-style: dashed; color: var(--accent); }
  .cat.add::before { display: none; }
  .newcat { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: var(--radius-sm); background: var(--chip); }
  .swatches { display: flex; flex-wrap: wrap; gap: 6px; }
  .swatches button { width: 32px; height: 32px; border-radius: 50%; border: 3px solid var(--panel); background: var(--sw); cursor: pointer; box-shadow: 0 0 0 1px var(--line); }
  .swatches button[aria-checked='true'] { box-shadow: 0 0 0 3px var(--ink); }

  .links, .results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .links li { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 6px 8px 6px 12px; border-radius: var(--radius-sm); background: var(--chip); }
  .lt { flex: 1 1 200px; font-weight: 600; }
  .links select { width: auto; min-height: 36px; font-size: 0.85em; }
  .rm { width: 36px; height: 36px; border: 0; border-radius: 50%; background: none; font-size: 22px; color: var(--muted); cursor: pointer; }
  .results button {
    all: unset; box-sizing: border-box; width: 100%; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: 600;
    border: var(--border) solid var(--line);
  }
  .results button:hover, .results button:focus-visible { border-color: var(--accent); background: var(--accent-soft); }
</style>
