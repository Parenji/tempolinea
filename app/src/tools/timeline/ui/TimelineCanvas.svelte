<script lang="ts">
  // Disegna il risultato del motore di layout. Card (HTML) e linee (SVG) stanno nello stesso
  // contenitore e leggono le stesse coordinate: nessuna misura dello schermo per posizionare le linee.
  import { computeLayout, type Layout } from '../engine/layout';
  import type { Timeline, TimelineEvent } from '../data/schema';
  import { formatDate } from '../data/dates';
  import { formatDescription } from '../format';
  import EventCard from './EventCard.svelte';

  interface Props {
    timeline: Timeline;
    zoom: number;
    /** categoria evidenziata (le altre si attenuano) */
    highlight: string | null;
  }
  let { timeline, zoom, highlight = $bindable() }: Props = $props();

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

  const layout: Layout | null = $derived(
    width > 0
      ? computeLayout(timeline.events, timeline.categories, timeline.segments, { width, zoom, heights, sideHeights })
      : null
  );
  // etichette del righello nascoste se un nodo cade proprio lì sopra
  const busyY = $derived(new Set(layout?.cards.flatMap((c) => [Math.round(c.dateY / 8), Math.round(c.dateY / 8) - 1, Math.round(c.dateY / 8) + 1]) ?? []));
  const eventById = $derived(new Map(timeline.events.map((e) => [e.id, e])));
  const inHighlight = (e: TimelineEvent | undefined) => !highlight || !!e?.categoryIds.includes(highlight);

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

  const period = $derived(openPeriod ? eventById.get(openPeriod) : null);
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') { expandedId = null; openPeriod = null; } }} />

<div class="canvas" class:narrow={layout?.narrow} bind:this={root} bind:clientWidth={width} style:height="{layout?.height ?? 600}px">
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

      {#each layout.tracks as t (t.categoryId)}
        <g
          class="track"
          class:on={highlight === t.categoryId}
          class:off={highlight && highlight !== t.categoryId}
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
          class:off={highlight && !(inHighlight(eventById.get(l.fromId)) || inHighlight(eventById.get(l.toId)))}
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

    {#each layout.periods as p (p.id)}
      {@const e = eventById.get(p.id)}
      <button
        type="button"
        class="period"
        class:off={!inHighlight(e)}
        class:open={openPeriod === p.id}
        style:left="{p.x}px"
        style:top="{p.top}px"
        style:width="{p.width}px"
        style:height="{p.bottom - p.top}px"
        style:--c={p.color}
        onclick={() => (openPeriod = openPeriod === p.id ? null : p.id)}
        aria-label="Periodo: {e?.title}"
      >
        <span>{e?.title}</span>
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
        bind:height={heights[c.id]}
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
    <p class="num when">
      {formatDate({ year: period.startYear, month: period.startMonth, day: period.startDay })} –
      {formatDate({ year: period.endYear!, month: period.endMonth, day: period.endDay })}
    </p>
    {#if period.imageUrl}<img src={period.imageUrl} alt={period.title ?? ''} loading="lazy" />{/if}
    {#if period.description}<p>{@html formatDescription(period.description)}</p>{/if}
  </aside>
{/if}

<style>
  .canvas { position: relative; width: 100%; }
  .lines { position: absolute; inset: 0; overflow: visible; z-index: 1; }
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

  .period {
    position: absolute; z-index: 1;
    border: 0; padding: 8px 0; cursor: pointer;
    border-radius: 999px;
    background: color-mix(in srgb, var(--c) 22%, var(--paper));
    border: 2px solid color-mix(in srgb, var(--c) 55%, transparent);
    color: var(--ink);
    display: flex; justify-content: center; overflow: hidden;
    transition: opacity 0.2s;
  }
  .period span {
    writing-mode: vertical-rl; transform: rotate(180deg);
    font: 800 12px var(--font-body); white-space: nowrap;
    position: sticky; top: 140px; bottom: 16px;
    max-height: 100%; overflow: hidden; text-overflow: ellipsis;
  }
  .narrow .period { padding: 0; }
  .narrow .period span { display: none; }
  .period.open { background: var(--c); color: var(--panel); }

  .period-sheet {
    position: fixed; z-index: 20; right: 16px; bottom: 16px;
    width: min(380px, calc(100vw - 32px)); max-height: 60vh; overflow: auto;
    background: var(--panel); border: var(--border) solid var(--line); border-radius: var(--radius);
    padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 0.25);
  }
  .period-sheet img { width: 100%; border-radius: 8px; }
  .when { color: var(--muted); font-weight: 700; }
  .close {
    position: absolute; top: 8px; right: 8px; width: var(--target); height: var(--target);
    border: 0; background: none; font-size: 28px; color: var(--muted); cursor: pointer;
  }
</style>
