<script lang="ts">
  import { untrack } from 'svelte';
  // Editor della spaziatura delle epoche. Ogni riga: da che anno parte, quanto spazio ha un anno,
  // ogni quanto il righello mostra una tacca. L'anteprima mostra quanto è alta ogni epoca.
  import Dialog from '$shared/ui/Dialog.svelte';
  import Button from '$shared/ui/Button.svelte';
  import { toRows, fromRows, validateRows, singleSegment, type SegmentRow } from '../data/segments';
  import { defaultSegments, type Segment, type Timeline } from '../data/schema';

  interface Props {
    open: boolean;
    timeline: Timeline;
    onsave: (segments: Segment[]) => void;
  }
  let { open = $bindable(), timeline, onsave }: Props = $props();

  let rows: SegmentRow[] = $state([]);
  let end: number | null = $state(2100);
  let tried = $state(false);

  function load(segs: readonly Segment[]) {
    const r = toRows(segs);
    rows = r.rows;
    end = r.end;
  }
  $effect.pre(() => {
    if (open) untrack(() => { load(timeline.segments); tried = false; });
  });

  const errors = $derived(tried ? validateRows(rows, end) : []);
  const preview = $derived.by(() => {
    if (validateRows(rows, end).length) return [];
    const segs = fromRows(rows, end!);
    const total = segs.reduce((s, g) => s + (g.end - g.start) * g.density, 0) || 1;
    return segs.map((g) => ({ ...g, share: ((g.end - g.start) * g.density) / total }));
  });
  const y = (n: number) => (n < 0 ? `${-n} a.C.` : String(n));

  function add() {
    const last = rows[rows.length - 1];
    const from = last?.from != null && end != null ? Math.round((last.from + end) / 2) : 0;
    rows.push({ from, density: last?.density ?? 20, step: last?.step ?? 1 });
    rows.sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
  }

  function save() {
    tried = true;
    if (validateRows(rows, end).length) return;
    onsave(fromRows($state.snapshot(rows) as SegmentRow[], end!));
    open = false;
  }

  const num = (v: string) => (v.trim() === '' ? null : Math.trunc(Number(v)));
</script>

<Dialog bind:open title="Spaziatura delle epoche" width={640}>
  <p class="muted small">
    Quanto spazio ha un anno in ogni epoca. Più spazio a un'epoca = eventi più distanziati. Per esempio: poco
    spazio per la preistoria, molto per il Novecento.
  </p>

  <div class="table" role="table" aria-label="Epoche">
    <div class="head" role="row">
      <span role="columnheader">Dall'anno</span>
      <span role="columnheader">Spazio per anno</span>
      <span role="columnheader">Tacche</span>
      <span></span>
    </div>
    {#each rows as r, i}
      <div class="r" role="row">
        <span class="yr">
          <input type="number" inputmode="numeric" min="0" value={r.from == null ? '' : Math.abs(r.from)} aria-label="Anno d'inizio, riga {i + 1}"
            oninput={(e) => { const v = num(e.currentTarget.value); r.from = v == null ? null : (r.from ?? 0) < 0 ? -v : v; }} />
          <button type="button" class="era" aria-pressed={(r.from ?? 0) < 0} onclick={() => (r.from = r.from == null ? null : -r.from)} title="Avanti Cristo">a.C.</button>
        </span>
        <span class="dens"><input type="number" min="0.1" step="0.5" bind:value={r.density} aria-label="Spazio per anno, riga {i + 1}" /><small>px</small></span>
        <select bind:value={r.step} aria-label="Tacche del righello, riga {i + 1}">
          <option value={1}>ogni anno</option>
          <option value={10}>ogni 10 anni</option>
          <option value={100}>ogni secolo</option>
        </select>
        <button type="button" class="rm" onclick={() => rows.splice(i, 1)} disabled={rows.length < 2} aria-label="Togli questa epoca">×</button>
      </div>
    {/each}
    <div class="r end" role="row">
      <span class="yr">
        <input type="number" inputmode="numeric" value={end == null ? '' : Math.abs(end)} aria-label="Fine dell'ultima epoca"
          oninput={(e) => { const v = num(e.currentTarget.value); end = v == null ? null : (end ?? 0) < 0 ? -v : v; }} />
        <button type="button" class="era" aria-pressed={(end ?? 0) < 0} onclick={() => (end = end == null ? null : -end)}>a.C.</button>
      </span>
      <span class="muted">fine dell'ultima epoca</span>
    </div>
  </div>

  {#each errors as e}<p class="error">{e}</p>{/each}

  <div class="row">
    <Button onclick={add}>+ Aggiungi un'epoca</Button>
    <Button variant="ghost" onclick={() => load(singleSegment(timeline.events))}>Un'unica epoca</Button>
    <Button variant="ghost" onclick={() => load(defaultSegments())}>Ripristina le predefinite</Button>
  </div>

  {#if preview.length}
    <div class="field">
      <span class="label">Anteprima: quanto è lunga ogni epoca</span>
      <div class="preview">
        {#each preview as g}
          <div class="seg" style:flex-grow={Math.max(g.share, 0.02)} title="{y(g.start)} – {y(g.end)}">
            <span class="num">{y(g.start)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#snippet footer()}
    <span class="spacer"></span>
    <Button onclick={() => (open = false)}>Annulla</Button>
    <Button variant="primary" onclick={save}>Salva</Button>
  {/snippet}
</Dialog>

<style>
  .small { font-size: 0.9em; }
  .spacer { flex: 1; }
  .error { font-size: 0.85em; color: var(--bad); font-weight: 700; }
  .table { display: flex; flex-direction: column; gap: 6px; }
  .head, .r { display: grid; grid-template-columns: minmax(130px, 1.3fr) minmax(90px, 1fr) minmax(120px, 1fr) 40px; gap: 8px; align-items: center; }
  .head span { font-size: 0.8em; font-weight: 800; color: var(--muted); }
  .r.end { grid-template-columns: minmax(130px, 1.3fr) 1fr; }
  .yr, .dens { display: flex; align-items: center; gap: 4px; min-width: 0; }
  .era {
    flex: none; min-height: 36px; padding: 0 8px; border-radius: 999px; cursor: pointer;
    font: 800 0.8em var(--font-body); border: var(--border) solid var(--line); background: var(--panel); color: var(--muted);
  }
  .era[aria-pressed='true'] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .dens small { color: var(--muted); font-weight: 700; }
  .rm { width: 36px; height: 36px; border: 0; background: none; font-size: 22px; color: var(--muted); cursor: pointer; border-radius: 50%; }
  .rm:disabled { opacity: 0.3; }
  .preview { display: flex; flex-direction: column; height: 220px; border-radius: var(--radius-sm); overflow: hidden; border: var(--border) solid var(--line); }
  .seg { min-height: 18px; display: flex; align-items: flex-start; padding: 2px 8px; font-size: 12px; font-weight: 800; border-top: 1px solid var(--panel); }
  .seg:nth-child(odd) { background: var(--accent-soft); }
  .seg:nth-child(even) { background: var(--chip); }
  @media (max-width: 600px) {
    .head { display: none; }
    .r { grid-template-columns: 1fr 1fr; }
    .r select { grid-column: 1; }
  }
</style>
