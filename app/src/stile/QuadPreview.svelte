<script lang="ts">
  // Esempio di figura interattiva nello stile comune: un quadrilatero su carta a quadretti,
  // vertici trascinabili con dito, mouse o frecce della tastiera.
  let { diagonals = false }: { diagonals?: boolean } = $props();

  const W = 480, H = 320, STEP = 40;
  let pts = $state([
    { n: 'A', x: 80, y: 260 },
    { n: 'B', x: 360, y: 260 },
    { n: 'C', x: 400, y: 80 },
    { n: 'D', x: 120, y: 80 },
  ]);
  let dragging = $state(-1);

  const snap = (v: number) => Math.round(v / STEP) * STEP;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  function toSvg(e: PointerEvent, svg: SVGSVGElement) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: clamp(snap(p.x), STEP, W - STEP), y: clamp(snap(p.y), STEP, H - STEP) };
  }

  function angleAt(i: number) {
    const p = pts[i], a = pts[(i + 3) % 4], b = pts[(i + 1) % 4];
    const v1 = Math.atan2(a.y - p.y, a.x - p.x), v2 = Math.atan2(b.y - p.y, b.x - p.x);
    let d = Math.abs(v1 - v2) * (180 / Math.PI);
    if (d > 180) d = 360 - d;
    return d;
  }
  const angles = $derived(pts.map((_, i) => angleAt(i)));
  const parallel = (i: number, j: number) => {
    const [a, b, c, d] = [pts[i], pts[(i + 1) % 4], pts[j], pts[(j + 1) % 4]];
    return Math.abs((b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)) < 1;
  };
  const par02 = $derived(parallel(0, 2));
  const par13 = $derived(parallel(1, 3));
  const kind = $derived(
    par02 && par13 ? 'Parallelogramma' : par02 || par13 ? 'Trapezio' : 'Trapezoide'
  );

  function onKey(e: KeyboardEvent, i: number) {
    const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    pts[i].x = clamp(pts[i].x + m[0] * STEP, STEP, W - STEP);
    pts[i].y = clamp(pts[i].y + m[1] * STEP, STEP, H - STEP);
  }

  let svgEl: SVGSVGElement;
</script>

<div class="wrap">
  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    class="stage"
    role="application"
    aria-label="Quadrilatero ABCD: {kind}"
    onpointermove={(e) => { if (dragging >= 0) Object.assign(pts[dragging], toSvg(e, svgEl)); }}
    onpointerup={() => (dragging = -1)}
    onpointercancel={() => (dragging = -1)}
  >
    {#each { length: W / STEP + 1 } as _, i}<line class="fig-grid" x1={i * STEP} y1="0" x2={i * STEP} y2={H} />{/each}
    {#each { length: H / STEP + 1 } as _, i}<line class="fig-grid" x1="0" y1={i * STEP} x2={W} y2={i * STEP} />{/each}
    <polygon class="fig-shape" points={pts.map((p) => `${p.x},${p.y}`).join(' ')} />
    {#if diagonals}
      <line class="fig-dash" x1={pts[0].x} y1={pts[0].y} x2={pts[2].x} y2={pts[2].y} />
      <line class="fig-dash" x1={pts[1].x} y1={pts[1].y} x2={pts[3].x} y2={pts[3].y} />
    {/if}
    {#each pts as p, i}
      {@const q = pts[(i + 1) % 4]}
      <line
        class="fig-side"
        class:a={(i === 0 || i === 2) && par02}
        class:b={(i === 1 || i === 3) && par13}
        x1={p.x} y1={p.y} x2={q.x} y2={q.y}
      />
    {/each}
    {#each pts as p, i}
      <g
        class="handle"
        class:active={dragging === i}
        tabindex="0"
        role="slider"
        aria-label="Vertice {p.n}"
        aria-valuetext="x {p.x / STEP}, y {p.y / STEP}"
        aria-valuenow={p.x}
        onpointerdown={(e) => { dragging = i; svgEl.setPointerCapture(e.pointerId); }}
        onkeydown={(e) => onKey(e, i)}
      >
        <circle class="hit" cx={p.x} cy={p.y} r="26" />
        <circle class="dot" cx={p.x} cy={p.y} r="8" />
        <text class="fig-vertex" x={p.x + (i === 0 || i === 3 ? -34 : 16)} y={p.y + (i < 2 ? 34 : -14)}>{p.n}</text>
      </g>
    {/each}
  </svg>
  <div class="readout">
    <p class="eyebrow">Questa figura è</p>
    <p class="kind">{kind}</p>
    <table class="num">
      <tbody>
        {#each pts as p, i}<tr><td>{p.n}̂</td><td>{Math.round(angles[i])}°</td></tr>{/each}
        <tr class="sum"><td>Somma</td><td>{Math.round(angles.reduce((s, a) => s + a, 0))}°</td></tr>
      </tbody>
    </table>
  </div>
</div>

<style>
  .wrap { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 16px; align-items: start; }
  .readout { min-width: 0; }
  .stage { width: 100%; height: auto; display: block; touch-action: none; user-select: none; background: var(--panel); border-radius: var(--radius-sm); }
  .handle { cursor: grab; outline: none; }
  .handle .hit { fill: transparent; }
  .handle .dot { fill: var(--ink); stroke: var(--panel); stroke-width: 3; }
  .handle:focus-visible .hit, .handle.active .hit { fill: var(--accent-soft); stroke: var(--focus); stroke-width: 3; }
  .kind { font-family: var(--font-display); font-weight: 600; font-size: 1.45em; line-height: 1.1; overflow-wrap: anywhere; hyphens: auto; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 3px 0; }
  td:last-child { text-align: right; font-weight: 800; }
  .sum td { border-top: var(--border) solid var(--line); padding-top: 6px; color: var(--accent); font-family: var(--font-display); font-size: 1.2em; }
  @media (max-width: 640px) { .wrap { grid-template-columns: 1fr; } }
</style>
