<script lang="ts">
  // Anteprima statica dell'aspetto della nuova timeline. Mostra anche il principio che
  // risolve i bug delle linee: card e SVG stanno nello stesso contenitore e usano le stesse coordinate.
  import { formatDate } from '../tools/timeline/data/dates';

  const cats = {
    car: { name: 'Carolingi', color: '#2F6FB0' },
    sar: { name: 'Saraceni', color: '#B4561A' },
    ott: { name: 'Ottoni', color: '#2E7D4F' },
    inv: { name: 'Lotta per le investiture', color: '#B03A7A' },
  };
  type CatKey = keyof typeof cats;
  const events: { id: string; year: number; month?: number; day?: number; title: string; cat: CatKey; side: 'left' | 'right' }[] = [
    { id: 'a', year: 800, month: 12, day: 25, title: 'Carlo Magno incoronato imperatore', cat: 'car', side: 'left' },
    { id: 'b', year: 827, title: 'Invasione saracena in Sicilia', cat: 'sar', side: 'right' },
    { id: 'c', year: 843, title: 'Trattato di Verdun', cat: 'car', side: 'left' },
    { id: 'd', year: 962, month: 2, day: 2, title: 'Ottone I incoronato imperatore', cat: 'ott', side: 'right' },
    { id: 'e', year: 1077, month: 1, title: 'Umiliazione di Canossa', cat: 'inv', side: 'left' },
  ];
  const link = ['c', 'd'];

  let width = $state(700);
  let heights: Record<string, number> = $state({});
  const GAP = 44; // distanza delle card dall'asse
  const LANE = 22; // distanza delle linee di categoria dall'asse
  // schermo stretto (telefono, iPad in verticale diviso): asse a sinistra, card tutte a destra
  const narrow = $derived(width < 560);
  const cx = $derived(narrow ? 28 : width / 2);
  const cardW = $derived(narrow ? width - cx - GAP - 4 : Math.min(240, cx - GAP - 12));
  const y = (year: number) => 44 + (year - 800) * 2.3;

  // Mini motore di layout: ogni card sta alla sua data, ma se toccherebbe la card sopra
  // (misurata davvero) scende. Le linee usano le stesse posizioni: non possono staccarsi.
  const placed = $derived.by(() => {
    const bottom = { left: -Infinity, right: -Infinity };
    return events.map((ev) => {
      const e = { ...ev, side: narrow ? ('right' as const) : ev.side };
      const dateY = y(e.year);
      const top = Math.max(dateY - 16, bottom[e.side] + 10);
      bottom[e.side] = top + (heights[e.id] ?? 56);
      return {
        ...e,
        dateY,
        top,
        anchorY: top + 16,
        x: e.side === 'left' ? cx - GAP - cardW : cx + GAP,
        edge: e.side === 'left' ? cx - GAP : cx + GAP,
        lane: e.side === 'left' ? cx - LANE : cx + LANE,
      };
    });
  });
  const byId = $derived(Object.fromEntries(placed.map((p) => [p.id, p])));
  const H = $derived(Math.max(...placed.map((p) => p.top + (heights[p.id] ?? 56))) + 24);

  // linea di categoria: segue le date vere, con curve verticali che non tornano mai indietro
  function catPath(key: CatKey) {
    const pts = placed.filter((p) => p.cat === key);
    if (pts.length < 2) return null;
    return pts.reduce((d, p, i) => {
      if (i === 0) return `M ${p.lane} ${p.dateY}`;
      const mid = (pts[i - 1].dateY + p.dateY) / 2;
      return `${d} C ${p.lane} ${mid}, ${p.lane} ${mid}, ${p.lane} ${p.dateY}`;
    }, '');
  }

  // gambo: dal punto sulla data al bordo della card (che può essere scesa)
  const stem = (p: (typeof placed)[number]) => {
    const mx = (p.lane + p.edge) / 2;
    return `M ${p.lane} ${p.dateY} C ${mx} ${p.dateY}, ${mx} ${p.anchorY}, ${p.edge} ${p.anchorY}`;
  };

  const linkPath = $derived.by(() => {
    const a = byId[link[0]], b = byId[link[1]];
    const bend = Math.max(40, Math.abs(b.anchorY - a.anchorY) * 0.3);
    return `M ${a.edge} ${a.anchorY} C ${a.edge + bend} ${a.anchorY}, ${b.edge - bend} ${b.anchorY}, ${b.edge} ${b.anchorY}`;
  });

  const rulerYears = [800, 850, 900, 950, 1000, 1050];
</script>

<div class="tl" bind:clientWidth={width} style:height="{H}px">
  <svg class="lines" width={width} height={H} aria-hidden="true">
    <line class="axis" x1={cx} y1="0" x2={cx} y2={H} />
    {#each rulerYears as yr}
      <line class="tick" x1={cx - 6} y1={y(yr)} x2={cx + 6} y2={y(yr)} />
    {/each}
    {#each Object.keys(cats) as key}
      {@const d = catPath(key as CatKey)}
      {#if d}<path class="cat" d={d} stroke={cats[key as CatKey].color} />{/if}
    {/each}
    <path class="link" d={linkPath} />
    {#each placed as p}
      <path class="stem" d={stem(p)} stroke={cats[p.cat].color} />
      <circle class="node" cx={cx} cy={p.dateY} r="6" fill={cats[p.cat].color} />
    {/each}
  </svg>
  {#each rulerYears as yr}
    <span class="year num" style:top="{y(yr)}px" style:left="{cx + 10}px">{yr}</span>
  {/each}
  {#each placed as p (p.id)}
    <article
      class="card"
      bind:offsetHeight={heights[p.id]}
      style:top="{p.top}px" style:left="{p.x}px" style:width="{cardW}px" style:--cat={cats[p.cat].color}>
      <p class="date num">{formatDate({ year: p.year, month: p.month, day: p.day })}</p>
      <h3>{p.title}</h3>
    </article>
  {/each}
</div>

<style>
  .tl { position: relative; overflow: hidden; }
  .lines { position: absolute; inset: 0; }
  .axis { stroke: var(--line); stroke-width: calc(4px * var(--stroke)); }
  .tick { stroke: var(--line); stroke-width: 2; }
  .cat { fill: none; stroke-width: calc(4px * var(--stroke)); stroke-linecap: round; opacity: 0.55; }
  .stem { fill: none; stroke-width: 2; opacity: 0.55; }
  .link { fill: none; stroke: var(--highlight); stroke-width: calc(3px * var(--stroke)); stroke-dasharray: 2 7; stroke-linecap: round; }
  .node { stroke: var(--panel); stroke-width: 3; }
  .year { position: absolute; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: var(--muted); display: none; }
  .card {
    position: absolute;
    background: var(--panel);
    border: var(--border) solid var(--line);
    border-left: 6px solid var(--cat);
    border-radius: var(--radius-sm);
    padding: 6px 12px 8px;
    box-shadow: 0 1px 0 var(--line);
  }
  .date { font-family: var(--font-display); font-weight: 600; color: var(--cat); font-size: 0.9em; }
  h3 { font-family: var(--font-body); font-weight: 800; font-size: 0.95em; line-height: 1.25; }
</style>
