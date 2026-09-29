<script lang="ts">
  // Disegna il risultato del motore di layout. Card (HTML) e linee (SVG) stanno nello stesso
  // contenitore e leggono le stesse coordinate: nessuna misura dello schermo per posizionare le linee.
  import { computeLayout, headingKey, type Layout } from '../engine/layout';
  import type { Timeline, TimelineEvent } from '../data/schema';
  import { formatDate } from '../data/dates';
  import { formatDescription } from '../format';
  import EventCard from './EventCard.svelte';
  import Lightbox from '$shared/ui/Lightbox.svelte';

  interface Props {
    timeline: Timeline;
    zoom: number;
    /** categoria evidenziata (le altre si attenuano) */
    highlight: string | null;
    /** risultati della ricerca: gli altri eventi si attenuano */
    matches?: string[] | null;
    onedit: (id: string) => void;
    oncreate: (year: number) => void;
  }
  let { timeline, zoom, highlight = $bindable(), matches = null, onedit, oncreate }: Props = $props();
  const matchSet = $derived(matches ? new Set(matches) : null);
  let flashId = $state<string | null>(null);
  let bigImage = $state<string | null>(null);
  let bigCaption = $state('');
  const showImage = (src: string, caption: string) => { bigCaption = caption; bigImage = src; };
  let quick = $state<{ y: number; year: number } | null>(null);

  let width = $state(0);
  let heights: Record<string, number> = $state({});
  let expandedId = $state<string | null>(null);
  let openPeriod = $state<string | null>(null);
  let root: HTMLDivElement;

  // altezze delle card chiuse: servono al motore per non cambiare lato quando se ne apre una
  const sideHeights = $derived.by(() => {
    if (!expandedId || !(expandedId in collapsed)) return undefined;
    return { ...heights, [expandedId]: collapsed[expandedId] };
  });
  let collapsed: Record<string, number> = {};
  $effect.pre(() => {
    for (const [id, h] of Object.entries(heights)) if (id !== expandedId && h) collapsed[id] = h;
  });

  // Altezze reali delle card: un solo ResizeObserver per tutte. Il browser consegna in una sola
  // chiamata tutte le misure di un frame, quindi il motore ricalcola una volta sola.
  // (Con un binding per card il layout veniva ricalcolato ~200 volte all'avvio: 12 s di pagina bianca.)
  const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
    let changed: Record<string, number> | null = null;
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      const id = el.dataset.measureId ?? el.dataset.eventId;
      if (id && heights[id] !== el.offsetHeight) (changed ??= {})[id] = el.offsetHeight;
    }
    if (changed) heights = { ...heights, ...changed };
  });
  function measure(node: HTMLElement) {
    ro?.observe(node);
    return { destroy: () => ro?.unobserve(node) };
  }

  const layout: Layout | null = $derived(
    width > 0
      ? computeLayout(timeline.events, timeline.categories, timeline.segments, { width, zoom, heights, sideHeights })
      : null
  );
  // etichette del righello nascoste se un nodo cade proprio lì sopra
  const busyY = $derived(new Set(layout?.cards.flatMap((c) => [Math.round(c.dateY / 8), Math.round(c.dateY / 8) - 1, Math.round(c.dateY / 8) + 1]) ?? []));
  const eventById = $derived(new Map(timeline.events.map((e) => [e.id, e])));
  const inHighlight = (e: TimelineEvent | undefined) =>
    (!highlight || !!e?.categoryIds.includes(highlight)) && (!matchSet || (!!e && matchSet.has(e.id)));

  // quando si cambia timeline si riparte da zero
  let lastId = '';
  $effect.pre(() => {
    if (timeline.id !== lastId) {
      lastId = timeline.id;
      expandedId = null;
      openPeriod = null;
      heights = {};
      collapsed = {};
    }
  });

  function stem(c: Layout['cards'][number], axisX: number) {
    const x0 = axisX + c.nodeDx;
    const mx = (x0 + c.edgeX) / 2;
    return `M ${x0} ${c.dateY} C ${mx} ${c.dateY}, ${mx} ${c.anchorY}, ${c.edgeX} ${c.anchorY}`;
  }

  function toggle(id: string) {
    expandedId = expandedId === id ? null : id;
    if (expandedId) requestAnimationFrame(() => requestAnimationFrame(() => ensureVisible(id)));
  }

  function ensureVisible(id: string) {
    const el = root?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(id)}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const header = 140;
    if (r.bottom > innerHeight - 16) window.scrollBy({ top: Math.min(r.bottom - innerHeight + 24, r.top - header), behavior: 'smooth' });
    else if (r.top < header) window.scrollBy({ top: r.top - header, behavior: 'smooth' });
  }

  // ---------- anno al centro dello schermo (per l'indicatore e per lo zoom) ----------
  export function centerYear(): number | null {
    if (!layout || !root) return null;
    const y = innerHeight / 2 - root.getBoundingClientRect().top;
    const ticks = layout.ruler;
    if (!ticks.length) return null;
    let best = ticks[0];
    for (const t of ticks) if (Math.abs(t.y - y) < Math.abs(best.y - y)) best = t;
    return best.year;
  }

  export function scrollToYear(year: number, behavior: ScrollBehavior = 'instant') {
    if (!layout || !root) return;
    const top = root.getBoundingClientRect().top + scrollY + layout.yOf({ year }) - innerHeight / 2;
    window.scrollTo({ top, behavior });
  }

  export function scrollToEvent(id: string) {
    const c = layout?.cards.find((c) => c.id === id);
    if (!c || !root) return;
    window.scrollTo({ top: root.getBoundingClientRect().top + scrollY + c.top - innerHeight / 3, behavior: 'smooth' });
  }

  /** Porta in vista un elemento appena salvato e lo fa lampeggiare. */
  export function reveal(id: string) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const c = layout?.cards.find((c) => c.id === id);
      const h = layout?.headings.find((h) => h.id === id);
      const y = c?.top ?? h?.top;
      if (y == null || !root) return;
      window.scrollTo({ top: root.getBoundingClientRect().top + scrollY + y - innerHeight / 3, behavior: 'smooth' });
      flashId = id;
      setTimeout(() => { if (flashId === id) flashId = null; }, 1700);
    }));
  }

  /** Anno corrispondente a una y del contenitore (interpolando tra le tacche del righello). */
  function yearAtY(y: number): number | null {
    const t = layout?.ruler;
    if (!t?.length) return null;
    if (y <= t[0].y) return t[0].year;
    for (let i = 1; i < t.length; i++) {
      if (y <= t[i].y) {
        const a = t[i - 1], b = t[i];
        return Math.round(a.year + ((y - a.y) / Math.max(1, b.y - a.y)) * (b.year - a.year));
      }
    }
    return t[t.length - 1].year;
  }

  // tocco su uno spazio vuoto: proposta di creare un evento in quel punto
  function onCanvasClick(e: MouseEvent) {
    const target = e.target as Element;
    if (target.closest('.card, .heading, .strip, .quick')) return;
    if (quick) return void (quick = null);
    const y = e.clientY - root.getBoundingClientRect().top;
    const year = yearAtY(y);
    if (year != null) quick = { y, year };
  }

  /** Apre la scheda di un periodo (usato anche dalla barra "sei qui"). */
  export function showPeriod(id: string) {
    openPeriod = id;
  }

  const period = $derived(openPeriod ? eventById.get(openPeriod) : null);
  const periodDates = (e: TimelineEvent) =>
    `${formatDate({ year: e.startYear, month: e.startMonth, day: e.startDay })} – ${formatDate({ year: e.endYear!, month: e.endMonth, day: e.endDay })}`;
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') { expandedId = null; openPeriod = null; } }} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (per la tastiera c'è il tasto N e il pulsante +) -->
<div class="canvas" class:narrow={layout?.narrow} bind:this={root} bind:clientWidth={width} style:height="{layout?.height ?? 600}px" onclick={onCanvasClick}>
  {#if layout}
    <svg class="lines" width={layout.width} height={layout.height} aria-hidden="true">
      <defs>
        {#each layout.links as l, i (l.key)}
          <linearGradient id="lg{i}" gradientUnits="userSpaceOnUse" x1="0" y1={l.top} x2="0" y2={l.bottom}>
            <stop offset="0" style:stop-color={l.colorTop} />
            <stop offset="1" style:stop-color={l.colorBottom} />
          </linearGradient>
        {/each}
      </defs>

      <!-- asse: continuo, tratteggiato dove è stato allargato -->
      <line class="axis" x1={layout.axisX} y1="0" x2={layout.axisX} y2={layout.height} />
      {#each layout.gaps as g}
        <line class="axis-gap" x1={layout.axisX} y1={g.y} x2={layout.axisX} y2={g.y + g.size} />
      {/each}
      {#each layout.ruler as t (t.year)}
        {#if t.label}
          <line class="tick major" x1={layout.axisX - 9} y1={t.y} x2={layout.axisX + 9} y2={t.y} />
        {:else}
          <line class="tick" x1={layout.axisX - 4} y1={t.y} x2={layout.axisX + 4} y2={t.y} />
        {/if}
      {/each}

      {#each layout.ruler as t (t.year)}
        {#if t.label && !busyY.has(Math.round(t.y / 8))}<text class="year num" x={layout.axisX} y={t.y}>{t.label}</text>{/if}
      {/each}

      <!-- periodi: fasce accanto all'asse -->
      {#each layout.periods as p (p.id)}
        <rect
          class="strip"
          class:off={!inHighlight(eventById.get(p.id))}
          x={p.x}
          y={p.top}
          width={p.width}
          height={p.bottom - p.top}
          rx={p.width / 2}
          style:fill={p.color}
          role="button"
          tabindex="-1"
          aria-label="Periodo: {eventById.get(p.id)?.title}"
          onclick={() => (openPeriod = p.id)}
          onkeydown={() => {}}
        />
      {/each}

      {#each layout.tracks as t (t.categoryId)}
        <g
          class="track"
          class:on={highlight === t.categoryId}
          class:off={(highlight && highlight !== t.categoryId) || !!matchSet}
          style:--c={t.color}
        >
          <line x1={t.x} y1={t.top} x2={t.x} y2={t.bottom} />
          {#each t.dots as y}<circle cx={t.x} cy={y} r="3.5" />{/each}
        </g>
      {/each}

      {#each layout.cards as c (c.id)}
        {#if c.kind === 'event'}
          <path class="stem" class:off={!inHighlight(eventById.get(c.id))} d={stem(c, layout.axisX)} style:stroke={c.color} />
        {/if}
      {/each}

      {#each layout.links as l, i (l.key)}
        <path
          class="link"
          class:off={(highlight || matchSet) && !(inHighlight(eventById.get(l.fromId)) || inHighlight(eventById.get(l.toId)))}
          d={l.path}
          stroke="url(#lg{i})"
        />
      {/each}

      {#each layout.cards as c (c.id)}
        {#if c.kind === 'event'}
          <circle
            class="node"
            class:off={!inHighlight(eventById.get(c.id))}
            cx={layout.axisX + c.nodeDx}
            cy={c.dateY}
            r="6"
            style:fill={c.color}
            style:stroke={c.color2 ?? 'var(--panel)'}
          />
        {/if}
      {/each}
    </svg>

    {#if quick}
      <button
        type="button"
        class="quick"
        style:top="{quick.y}px"
        style:left="{layout.axisX}px"
        onclick={() => { const y = quick!.year; quick = null; oncreate(y); }}
      >
        + Nuovo evento nel {quick.year < 0 ? `${-quick.year} a.C.` : quick.year}
      </button>
    {/if}

    {#each layout.headings as h (h.id)}
      {@const e = eventById.get(h.id)!}
      <button
        type="button"
        class="heading"
        class:off={!inHighlight(e)}
        class:open={openPeriod === h.id}
        class:flash={flashId === h.id}
        data-measure-id={headingKey(h.id)}
        use:measure
        style:left="{h.x}px"
        style:top="{h.top}px"
        style:width="{h.width}px"
        style:--c={h.color}
        onclick={() => (openPeriod = openPeriod === h.id ? null : h.id)}
      >
        <span class="ht">{e.title}</span>
        <span class="hd num">{periodDates(e)}</span>
      </button>
    {/each}

    {#each layout.cards as c (c.id)}
      {@const e = eventById.get(c.id)!}
      <EventCard
        box={c}
        event={e}
        categories={timeline.categories}
        expanded={expandedId === c.id}
        dimmed={!inHighlight(e)}
        flash={flashId === c.id}
        onedit={() => onedit(c.id)}
        onimage={showImage}
        {measure}
        ontoggle={() => toggle(c.id)}
        oncategory={(id) => (highlight = highlight === id ? null : id)}
      />
    {/each}
  {/if}
</div>

{#if period}
  <aside class="period-sheet" aria-label="Dettagli del periodo">
    <button type="button" class="close" onclick={() => (openPeriod = null)} aria-label="Chiudi">×</button>
    <p class="eyebrow">Periodo</p>
    <h2>{period.title}</h2>
    <p class="num when">{periodDates(period)}</p>
    {#if period.imageUrl}
      <button type="button" class="img" onclick={() => showImage(period.imageUrl!, period.title ?? '')} aria-label="Ingrandisci l'immagine">
        <img src={period.imageUrl} alt={period.title ?? ''} loading="lazy" />
      </button>
    {/if}
    {#if period.description}<p>{@html formatDescription(period.description)}</p>{/if}
    <div><button type="button" class="edit" onclick={() => { const id = openPeriod!; openPeriod = null; onedit(id); }}>Modifica</button></div>
  </aside>
{/if}

<Lightbox bind:src={bigImage} caption={bigCaption} />

<style>
  .canvas { position: relative; width: 100%; }
  .lines { position: absolute; inset: 0; overflow: visible; z-index: 1; pointer-events: none; }
  .axis { stroke: var(--line); stroke-width: calc(4px * var(--stroke)); }
  .axis-gap { stroke: var(--paper); stroke-width: calc(4px * var(--stroke)); stroke-dasharray: 3 6; }
  .tick { stroke: var(--line); stroke-width: 2; }
  .tick.major { stroke: var(--muted); }

  .track line { stroke: var(--c); stroke-width: calc(4px * var(--stroke)); stroke-linecap: round; opacity: 0.45; }
  .track circle { fill: var(--c); stroke: var(--paper); stroke-width: 1.5; }
  .track.on line { opacity: 1; stroke-width: calc(6px * var(--stroke)); }
  .track.off { opacity: 0.12; }
  .stem { fill: none; stroke-width: 2; opacity: 0.5; }
  .link { fill: none; stroke-width: calc(3.5px * var(--stroke)); stroke-linecap: round; opacity: 0.85; }
  .node { stroke-width: 3; }
  .off { opacity: 0.12; }
  path.off, circle.off { opacity: 0.12; }

  .year {
    font: 800 12px var(--font-body); fill: var(--muted);
    text-anchor: middle; dominant-baseline: central;
    stroke: var(--paper); stroke-width: 7px; stroke-linejoin: round; paint-order: stroke;
  }

  .strip { opacity: 0.55; pointer-events: auto; cursor: pointer; }
  .strip.off { opacity: 0.1; }
  .heading {
    position: absolute; z-index: 3;
    display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 2px 12px;
    padding: 8px 18px; min-height: 40px;
    border-radius: 18px; cursor: pointer; text-align: center;
    background: color-mix(in srgb, var(--c) 16%, var(--panel));
    border: var(--border) solid color-mix(in srgb, var(--c) 65%, transparent);
    color: var(--ink);
    box-shadow: 0 1px 0 var(--line);
    transition: opacity 0.2s;
  }
  .heading .ht { font: 600 1.2em var(--font-display); letter-spacing: 0.01em; }
  .heading .hd { font-size: 0.85em; font-weight: 800; color: color-mix(in srgb, var(--c) 70%, var(--ink)); }
  .heading.open { background: var(--c); color: #fff; }
  .heading.open .hd { color: #fff; }
  .heading.off { opacity: 0.3; }
  .narrow .heading { justify-content: flex-start; text-align: left; padding: 6px 14px; }
  .heading.flash { animation: pflash 1.6s ease-out; }
  .period-sheet {
    position: fixed; z-index: 20; right: 16px; bottom: 16px;
    width: min(380px, calc(100vw - 32px)); max-height: 60vh; overflow: auto;
    background: var(--panel); border: var(--border) solid var(--line); border-radius: var(--radius);
    padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 0.25);
  }
  .quick {
    position: absolute; z-index: 6; transform: translate(-50%, -50%);
    font: 800 15px var(--font-body); color: var(--panel); background: var(--accent);
    border: 0; border-radius: 999px; padding: 10px 18px; min-height: var(--target); cursor: pointer;
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.25); white-space: nowrap;
  }
  .narrow .quick { transform: translate(-12px, -50%); }
  @keyframes pflash { 0%, 30% { box-shadow: 0 0 0 5px var(--c); } 100% { box-shadow: none; } }
  .edit {
    font: 700 14px var(--font-body); color: var(--ink); background: var(--panel);
    border: var(--border) solid var(--line); border-radius: 999px; padding: 6px 16px; min-height: 38px; cursor: pointer;
  }
  .period-sheet .img { all: unset; display: block; cursor: zoom-in; }
  .period-sheet img { display: block; width: 100%; border-radius: 8px; }
  .when { color: var(--muted); font-weight: 700; }
  .close {
    position: absolute; top: 8px; right: 8px; width: var(--target); height: var(--target);
    border: 0; background: none; font-size: 28px; color: var(--muted); cursor: pointer;
  }
</style>
