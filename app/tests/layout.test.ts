// Proprietà del motore di layout, verificate su dati veri e su più larghezze/zoom.
// Sono le garanzie che nella v1 mancavano (linee staccate, curve che tornano indietro, card sovrapposte).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeTimeline } from '../src/tools/timeline/data/normalize';
import { compareDates, eventStart } from '../src/tools/timeline/data/dates';
import { computeLayout, L, type Layout } from '../src/tools/timeline/engine/layout';
import { basePx } from '../src/tools/timeline/engine/scale';
import type { Timeline } from '../src/tools/timeline/data/schema';

const privateDir = resolve(import.meta.dirname, 'fixtures/private');
const files = [
  resolve(import.meta.dirname, 'fixtures/compat-sample.json'),
  ...(existsSync(privateDir) ? readdirSync(privateDir).filter((f) => f.endsWith('.json')).map((f) => resolve(privateDir, f)) : []),
];
const load = (f: string): Timeline => normalizeTimeline(JSON.parse(readFileSync(f, 'utf8')).timeline);

const configs = [
  { width: 1280, zoom: 20 },
  { width: 1024, zoom: 5 },
  { width: 820, zoom: 80 },
  { width: 390, zoom: 20 }, // telefono / iPad diviso: una colonna
];

function run(tl: Timeline, cfg: { width: number; zoom: number }, heights?: Record<string, number>): Layout {
  return computeLayout(tl.events, tl.categories, tl.segments, { ...cfg, heights });
}

function checkInvariants(tl: Timeline, lay: Layout) {
  const EPS = 0.01;
  const flow = tl.events.filter((e) => !e.isPeriod);
  expect(lay.cards).toHaveLength(flow.length);

  // card sullo stesso lato: mai sovrapposte, sempre in ordine di data
  for (const side of ['left', 'right'] as const) {
    const cs = lay.cards.filter((c) => c.side === side);
    for (let i = 1; i < cs.length; i++) {
      expect(cs[i].top).toBeGreaterThanOrEqual(cs[i - 1].top + cs[i - 1].height + L.CARD_GAP - EPS);
    }
  }
  // dentro il contenitore, dalla parte giusta dell'asse
  for (const c of lay.cards) {
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x + c.width).toBeLessThanOrEqual(lay.width + EPS);
    if (c.side === 'left') expect(c.x + c.width).toBeLessThan(lay.axisX);
    else expect(c.x).toBeGreaterThan(lay.axisX);
    // la card non sta mai sopra la sua data
    expect(c.anchorY).toBeGreaterThanOrEqual(c.dateY - EPS);
    expect(c.top + c.height).toBeLessThanOrEqual(lay.height);
  }
  if (lay.narrow) expect(lay.cards.every((c) => c.side === 'right')).toBe(true);

  // l'asse rispetta il tempo: date in ordine → y in ordine; date uguali → stessa y
  const byId = new Map(tl.events.map((e) => [e.id, e]));
  const ordered = [...lay.cards].sort((a, b) => compareDates(eventStart(byId.get(a.id)!), eventStart(byId.get(b.id)!)));
  for (let i = 1; i < ordered.length; i++) {
    const cmp = compareDates(eventStart(byId.get(ordered[i - 1].id)!), eventStart(byId.get(ordered[i].id)!));
    if (cmp === 0) expect(ordered[i].dateY).toBeCloseTo(ordered[i - 1].dateY);
    else expect(ordered[i].dateY).toBeGreaterThanOrEqual(ordered[i - 1].dateY);
  }
  // yOf coincide con la posizione dei nodi (righello, periodi e card usano la stessa scala)
  for (const c of lay.cards) expect(lay.yOf(eventStart(byId.get(c.id)!))).toBeCloseTo(c.dateY);

  // linee di categoria: verticali, dall'alto in basso, con un punto per ogni evento della categoria
  for (const t of lay.tracks) {
    expect(t.top).toBeLessThan(t.bottom + EPS);
    for (const d of t.dots) {
      expect(d).toBeGreaterThanOrEqual(t.top - EPS);
      expect(d).toBeLessThanOrEqual(t.bottom + EPS);
    }
    expect(Math.abs(t.x - lay.axisX)).toBeGreaterThan(0);
    // la corsia sta tra l'asse e le card del suo lato
    const edges = lay.cards.filter((c) => c.side === t.side).map((c) => c.edgeX);
    if (edges.length) expect(Math.abs(t.x - lay.axisX)).toBeLessThan(Math.abs(edges[0] - lay.axisX));
  }
  // linee di categoria dello stesso lato che si sovrappongono nel tempo: corsie diverse
  for (const a of lay.tracks)
    for (const b of lay.tracks)
      if (a !== b && a.side === b.side && a.top <= b.bottom && b.top <= a.bottom) expect(a.x).not.toBe(b.x);

  // collegamenti: partono e arrivano esattamente su un bordo delle card
  const cardById = new Map(lay.cards.map((c) => [c.id, c]));
  for (const l of lay.links) {
    const m = l.path.match(/^M (\S+) (\S+) C .*, (\S+) (\S+)$/);
    expect(m).not.toBeNull();
    const [x1, y1, x2, y2] = m!.slice(1).map(Number);
    const ends = [cardById.get(l.fromId)!, cardById.get(l.toId)!];
    const onEdge = (x: number, y: number) =>
      ends.some((c) => Math.abs(y - c.anchorY) < EPS && (Math.abs(x - c.x) < EPS || Math.abs(x - (c.x + c.width)) < EPS));
    expect(onEdge(x1, y1)).toBe(true);
    expect(onEdge(x2, y2)).toBe(true);
  }

  // periodi: dentro il contenitore, fuori dalla zona delle card
  for (const p of lay.periods) {
    expect(p.bottom).toBeGreaterThan(p.top);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x + p.width).toBeLessThanOrEqual(lay.width);
    for (const c of lay.cards) expect(p.x + p.width <= c.x || p.x >= c.x + c.width).toBe(true);
  }

  // righello in ordine
  for (let i = 1; i < lay.ruler.length; i++) expect(lay.ruler[i].y).toBeGreaterThanOrEqual(lay.ruler[i - 1].y);
}

describe.each(files.map((f) => [f.split('/').slice(-2).join('/'), f]))('%s', (_n, file) => {
  const tl = load(file);

  it.each(configs.map((c) => [`${c.width}px zoom ${c.zoom}`, c]))('invarianti a %s', (_l, cfg) => {
    checkInvariants(tl, run(tl, cfg));
  });

  it('è deterministico', () => {
    expect(JSON.stringify(run(tl, configs[0]))).toBe(JSON.stringify(run(tl, configs[0])));
  });

  it('una card aperta (molto più alta) sposta le successive senza sovrapposizioni', () => {
    const before = run(tl, configs[0]);
    const mid = before.cards[Math.floor(before.cards.length / 2)];
    const after = run(tl, configs[0], { [mid.id]: 600 });
    checkInvariants(tl, after);
    const next = after.cards.find((c) => c.side === mid.side && c.top > after.cards.find((x) => x.id === mid.id)!.top);
    if (next) expect(next.top).toBeGreaterThanOrEqual(after.cards.find((x) => x.id === mid.id)!.top + 600);
    // gli eventi precedenti non si muovono
    const idx = before.cards.findIndex((c) => c.id === mid.id);
    for (let i = 0; i < idx; i++) expect(after.cards[i].top).toBeCloseTo(before.cards[i].top);
  });

  it('aprire una card non fa cambiare lato a nessuna card', () => {
    const closed = run(tl, configs[0]);
    const heights = Object.fromEntries(closed.cards.map((c) => [c.id, c.height]));
    for (const probe of closed.cards.filter((_, i) => i % 7 === 0)) {
      const opened = computeLayout(tl.events, tl.categories, tl.segments, {
        ...configs[0],
        heights: { ...heights, [probe.id]: 520 },
        sideHeights: heights,
      });
      checkInvariants(tl, opened);
      expect(opened.cards.map((c) => c.side)).toEqual(closed.cards.map((c) => c.side));
    }
  });

  it('senza affollamento le card stanno vicine alla loro data', () => {
    const lay = run(tl, configs[0]);
    for (const c of lay.cards) expect(c.anchorY - c.dateY).toBeLessThanOrEqual(L.MAX_DRIFT + 200);
  });
});

describe('scala', () => {
  const segs = normalizeTimeline({ events: [], categories: [] }).segments;
  it('è sempre crescente, anche con mesi e giorni', () => {
    let prev = -Infinity;
    for (const y of [-3000, -44, 0, 79, 800, 1492, 1999, 2024]) {
      for (const m of [null, 1, 6, 12]) {
        const p = basePx({ year: y, month: m, day: m ? 28 : null }, segs);
        expect(p).toBeGreaterThan(prev);
        prev = p;
      }
    }
  });
  it('ha le stesse proporzioni della v1 (yearToPixels, a meno dell\'origine)', () => {
    // v1: 1000→1700 a 20 px/anno con zoom 20
    expect(basePx({ year: 1700 }, segs) - basePx({ year: 1000 }, segs)).toBe(700 * 20);
    expect(basePx({ year: 1492, month: 7 }, segs) - basePx({ year: 1492 }, segs)).toBeCloseTo(6 * (20 / 12));
  });
});
