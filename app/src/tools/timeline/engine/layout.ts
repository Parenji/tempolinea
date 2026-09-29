// ================================================================
//  MOTORE DI LAYOUT della timeline. Funzione pura: nessun accesso al DOM.
//
//  Una sola fonte di verità: card, nodi, linee di categoria, collegamenti,
//  periodi e righello escono tutti da qui, nello stesso sistema di coordinate
//  (pixel del contenitore). Il renderer disegna e basta, per questo le linee
//  non possono staccarsi dalle card.
//
//  Passi:
//   1. ordine cronologico completo (anno, mese, giorno)
//   2. posizione verticale: ogni card sta alla sua data; se tocca la card sopra
//      scende; se dovrebbe scendere troppo, si inserisce uno "spazio" nell'asse
//      (tutto ciò che viene dopo scende insieme: righello, nodi, periodi)
//   3. corsie per le linee di categoria e per i periodi
//   4. posizioni orizzontali
// ================================================================
import { compareDates, eventStart, type PartialDate } from '../data/dates';
import type { Category, Segment, TimelineEvent } from '../data/schema';
import { basePx, niceStep, yearAtBasePx, DEFAULT_ZOOM } from './scale';
import { safeColor } from '../format';

export type Side = 'left' | 'right';

export interface LayoutOptions {
  width: number;
  zoom?: number;
  /** altezze misurate delle card (id → px); per le altre si usa una stima */
  heights?: Record<string, number>;
  /** altezze usate per scegliere il lato (di solito: tutte le card chiuse) */
  sideHeights?: Record<string, number>;
}

export interface CardBox {
  id: string;
  kind: 'event' | 'note';
  side: Side;
  x: number;
  width: number;
  top: number;
  height: number;
  /** punto della card a cui si attaccano gambo e collegamenti */
  anchorY: number;
  /** y della data sull'asse */
  dateY: number;
  /** x del bordo verso l'asse */
  edgeX: number;
  /** spostamento orizzontale del nodo sull'asse (date coincidenti) */
  nodeDx: number;
  color: string;
  color2: string | null;
}

/** Fascia di un periodo accanto all'asse: mostra quanto dura. */
export interface PeriodBox {
  id: string;
  side: Side;
  x: number;
  width: number;
  top: number;
  bottom: number;
  color: string;
}

/** Intestazione di un periodo ("capitolo"): occupa tutta la riga all'inizio del periodo. */
export interface HeadingBox {
  id: string;
  x: number;
  width: number;
  top: number;
  height: number;
  /** y della data d'inizio sull'asse */
  dateY: number;
  color: string;
}

/** Chiave delle altezze misurate per l'intestazione di un periodo. */
export const headingKey = (id: string) => `p:${id}`;

export interface Track {
  categoryId: string;
  color: string;
  side: Side;
  x: number;
  top: number;
  bottom: number;
  dots: number[];
}

export interface LinkBox {
  key: string;
  fromId: string;
  toId: string;
  path: string;
  /** colori dall'alto al basso */
  colorTop: string;
  colorBottom: string;
  top: number;
  bottom: number;
}

export interface RulerTick {
  y: number;
  year: number;
  label: string | null;
}

export interface Gap {
  y: number;
  size: number;
}

export interface Layout {
  width: number;
  height: number;
  narrow: boolean;
  axisX: number;
  cards: CardBox[];
  periods: PeriodBox[];
  headings: HeadingBox[];
  tracks: Track[];
  links: LinkBox[];
  ruler: RulerTick[];
  gaps: Gap[];
  /** converte una data in y, tenendo conto degli spazi inseriti */
  yOf: (date: PartialDate) => number;
}

// ---------- costanti (px) ----------
export const L = {
  NARROW_BELOW: 640,
  MARGIN: 12,
  ANCHOR: 18, // distanza del punto d'attacco dal bordo superiore della card
  CARD_GAP: 10, // spazio minimo tra due card sullo stesso lato
  MAX_DRIFT: 90, // oltre questo spostamento si allarga l'asse
  SWITCH_AT: 30, // spostamento oltre il quale una card può passare dall'altro lato
  AXIS_PAD: 14,
  LANE: 10,
  STEM: 18,
  MAX_CARD: 300,
  STRIP: 6, // larghezza della fascia di un periodo
  STRIP_GAP: 3,
  STRIP_FROM: 9, // distanza della prima fascia dal centro dell'asse (i nodi hanno raggio 6)
  MAX_HEADING: 540,
  PAD_TOP: 120,
  PAD_BOTTOM: 200,
  NODE_SPREAD: 5,
} as const;

const FALLBACK_COLOR = '#6B7A99';

export function estimateHeight(e: TimelineEvent, width = 240): number {
  const charsPerLine = Math.max(12, Math.floor(width / 8.5));
  const lines = Math.ceil(((e.title ?? '').length || 1) / charsPerLine);
  return 36 + lines * 22;
}

export function estimateHeadingHeight(e: TimelineEvent, width = 500): number {
  const chars = (e.title ?? '').length + 14; // titolo + date
  return 22 + Math.ceil(chars / Math.max(16, Math.floor(width / 9))) * 22;
}

const primaryCat = (e: TimelineEvent) => e.categoryIds[0] ?? null;

function categorySides(sorted: TimelineEvent[], cats: Map<string, Category>): Map<string, Side> {
  const sides = new Map<string, Side>();
  for (const e of sorted) {
    const id = primaryCat(e);
    if (!id || sides.has(id)) continue;
    const pref = cats.get(id)?.preferredSide;
    sides.set(id, pref === 'left' || pref === 'right' ? pref : sides.size % 2 === 0 ? 'left' : 'right');
  }
  return sides;
}

/** Assegna intervalli a corsie senza sovrapposizioni (il primo posto libero). */
function assignLanes<T extends { start: number; end: number }>(items: T[], pad: number): Map<T, number> {
  const laneEnds: number[] = [];
  const out = new Map<T, number>();
  for (const it of [...items].sort((a, b) => a.start - b.start)) {
    let lane = laneEnds.findIndex((end) => it.start > end + pad);
    if (lane === -1) lane = laneEnds.push(-Infinity) - 1;
    laneEnds[lane] = it.end;
    out.set(it, lane);
  }
  return out;
}

export function computeLayout(
  events: readonly TimelineEvent[],
  categories: readonly Category[],
  segments: readonly Segment[],
  opts: LayoutOptions
): Layout {
  const zoom = opts.zoom ?? DEFAULT_ZOOM;
  const heights = opts.heights ?? {};
  const width = Math.max(280, opts.width);
  const narrow = width < L.NARROW_BELOW;
  const cats = new Map(categories.map((c) => [c.id, c]));
  const colorOf = (id: string | null | undefined) => safeColor((id && cats.get(id)?.color) || FALLBACK_COLOR);

  const isPeriod = (e: TimelineEvent) => !!e.isPeriod && e.endYear != null;
  // a parità di data l'intestazione di un periodo viene prima degli eventi
  const sorted = [...events].sort(
    (a, b) =>
      compareDates(eventStart(a), eventStart(b)) ||
      Number(isPeriod(b)) - Number(isPeriod(a)) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  const flow = sorted.filter((e) => !isPeriod(e));
  const periods = sorted.filter(isPeriod);
  const catSide = categorySides(sorted, cats);

  // ---------- origine: un po' di spazio prima del primo evento ----------
  const base = (d: PartialDate) => basePx(d, segments, zoom);
  const firstBase = sorted.length ? base(eventStart(sorted[0])) : base({ year: 1900 });
  const origin = firstBase - L.PAD_TOP;

  // ---------- 2. posizione verticale ----------
  const cardW0 = narrow ? width - 80 : Math.min(L.MAX_CARD, width / 2 - 70);
  const headW = narrow ? width - 2 * L.MARGIN : Math.min(L.MAX_HEADING, width - 2 * L.MARGIN);
  type Placed = { e: TimelineEvent; side: Side; top: number; height: number; dateY: number };
  type PlacedHeading = { e: TimelineEvent; top: number; height: number; dateY: number };

  const place = (hs: Record<string, number>, fixedSides: Map<string, Side> | null) => {
    // spazi inseriti nell'asse: [base da cui valgono, dimensione]
    const gaps: { atBase: number; size: number }[] = [];
    const bottom: Record<Side, number> = { left: -Infinity, right: -Infinity };
    const lastCat: Record<Side, string | null> = { left: null, right: null };
    const out: Placed[] = [];
    const heads: PlacedHeading[] = [];
    let shift = 0;
    let prevBase = -Infinity;
    for (const e of sorted) {
      const b = base(eventStart(e));
      let dateY = b - origin + shift;
      if (isPeriod(e)) {
        // intestazione: centrata sulla data, sotto a tutto ciò che c'è già su entrambi i lati
        const h = hs[headingKey(e.id)] ?? estimateHeadingHeight(e, headW);
        let push = Math.max(0, Math.max(bottom.left, bottom.right) + L.CARD_GAP - (dateY - h / 2));
        if (push > L.MAX_DRIFT && b > prevBase) {
          const extra = push - L.MAX_DRIFT;
          gaps.push({ atBase: b, size: extra });
          shift += extra;
          dateY += extra;
          push = L.MAX_DRIFT;
        }
        const top = dateY - h / 2 + push;
        bottom.left = bottom.right = top + h;
        lastCat.left = lastCat.right = null;
        prevBase = b;
        heads.push({ e, top, height: h, dateY });
        continue;
      }
      const h = hs[e.id] ?? estimateHeight(e, cardW0);
      const catId = primaryCat(e);
      const pushOn = (s: Side) => Math.max(0, bottom[s] + L.CARD_GAP - (dateY - L.ANCHOR));
      let side: Side;
      if (fixedSides) side = fixedSides.get(e.id)!;
      else {
        const pref: Side = narrow
          ? 'right'
          : catId && catSide.has(catId)
            ? catSide.get(catId)!
            : out.length % 2 === 0 ? 'left' : 'right';
        const forced = narrow || (catId != null && ['left', 'right'].includes(cats.get(catId)?.preferredSide ?? ''));
        side = pref;
        if (!forced) {
          const other: Side = pref === 'left' ? 'right' : 'left';
          // come nella v1: si cambia lato solo se l'ingombro è di un'altra categoria
          if (pushOn(pref) > L.SWITCH_AT && lastCat[pref] !== catId && pushOn(other) + 8 < pushOn(pref)) side = other;
        }
      }
      let push = pushOn(side);
      if (push > L.MAX_DRIFT && b > prevBase) {
        const extra = push - L.MAX_DRIFT;
        gaps.push({ atBase: b, size: extra });
        shift += extra;
        dateY += extra;
        push = L.MAX_DRIFT;
      }
      const top = dateY - L.ANCHOR + push;
      bottom[side] = top + h;
      lastCat[side] = catId;
      prevBase = b;
      out.push({ e, side, top, height: h, dateY });
    }
    return { placed: out, heads, gaps, shift };
  };

  // I lati si decidono con le altezze "a riposo" (card chiuse): aprire una card non fa saltare
  // le altre dall'altra parte, le spinge solo in basso.
  let pass = place(opts.sideHeights ?? heights, null);
  if (opts.sideHeights) pass = place(heights, new Map(pass.placed.map((p) => [p.e.id, p.side])));
  const vertical = pass.placed;
  const gapList = pass.gaps;
  const shift = pass.shift;
  const yOfBase = (b: number) => {
    let y = b - origin;
    for (const g of gapList) if (b >= g.atBase) y += g.size;
    return y;
  };

  const yOf = (d: PartialDate) => yOfBase(base(d));

  // ---------- 3a. linee di categoria ----------
  type TrackDraft = { id: string; side: Side; start: number; end: number; dots: number[] };
  const drafts: TrackDraft[] = [];
  for (const [id, cat] of cats) {
    if (cat.showConnectors === false) continue;
    const dots = vertical.filter((v) => v.e.categoryIds.includes(id)).map((v) => v.dateY);
    if (dots.length < 2) continue;
    drafts.push({ id, side: narrow ? 'right' : catSide.get(id) ?? 'left', start: Math.min(...dots), end: Math.max(...dots), dots });
  }
  const slotOf = new Map<TrackDraft, number>();
  const slots: Record<Side, number> = { left: 0, right: 0 };
  for (const s of ['left', 'right'] as Side[]) {
    const lanes = assignLanes(drafts.filter((d) => d.side === s), 10);
    for (const [d, lane] of lanes) {
      slotOf.set(d, lane);
      slots[s] = Math.max(slots[s], lane + 1);
    }
  }

  // ---------- 3b. fasce dei periodi, accanto all'asse ----------
  // corsia 0 a sinistra dell'asse, 1 a destra, 2 a sinistra più in fuori, ...
  type PeriodDraft = { e: TimelineEvent; start: number; end: number };
  const headOf = new Map(pass.heads.map((h) => [h.e.id, h]));
  const pDrafts: PeriodDraft[] = periods.map((e) => {
    const a = headOf.get(e.id)!.dateY;
    const z = yOf({ year: e.endYear!, month: e.endMonth, day: e.endDay });
    return { e, start: Math.min(a, z), end: Math.max(a, z, a + 24) };
  });
  const pLane = assignLanes(pDrafts, 6);
  const strips: Record<Side, number> = { left: 0, right: 0 };
  for (const lane of pLane.values()) strips[lane % 2 === 0 ? 'left' : 'right'] = Math.max(strips[lane % 2 === 0 ? 'left' : 'right'], Math.floor(lane / 2) + 1);
  const stripBlock = (side: Side) => (strips[side] ? L.STRIP_FROM + strips[side] * (L.STRIP + L.STRIP_GAP) : 0);

  // ---------- 4. posizioni orizzontali ----------
  // su schermo stretto le corsie sono più sottili: lo spazio serve alle card
  const LANE = narrow ? 5 : L.LANE;
  const STEM = narrow ? 12 : L.STEM;
  const pad: Record<Side, number> = {
    left: Math.max(L.AXIS_PAD, stripBlock('left') + 4),
    right: Math.max(L.AXIS_PAD, stripBlock('right') + 4),
  };
  const axisX = narrow ? L.MARGIN + stripBlock('left') + 8 : Math.round(width / 2);
  const laneX = (side: Side, slot: number) => {
    const d = pad[side] + slot * LANE + LANE / 2;
    return side === 'left' ? axisX - d : axisX + d;
  };
  const edge: Record<Side, number> = {
    left: axisX - (pad.left + slots.left * LANE + STEM),
    right: axisX + (pad.right + slots.right * LANE + STEM),
  };
  const outer: Record<Side, number> = { left: L.MARGIN, right: width - L.MARGIN };
  const cardWidth: Record<Side, number> = {
    left: Math.max(120, Math.min(L.MAX_CARD, edge.left - outer.left)),
    right: Math.max(120, Math.min(L.MAX_CARD, outer.right - edge.right)),
  };

  // nodi con la stessa data: leggermente sfalsati sull'asse
  const sameDate = new Map<number, string[]>();
  for (const v of vertical) {
    if (v.e.type === 'note') continue;
    const k = Math.round(v.dateY);
    sameDate.set(k, [...(sameDate.get(k) ?? []), v.e.id]);
  }
  const nodeDx = new Map<string, number>();
  for (const ids of sameDate.values()) {
    const spread = Math.min(12, (ids.length - 1) * L.NODE_SPREAD);
    ids.forEach((id, i) => nodeDx.set(id, ids.length === 1 ? 0 : -spread + (2 * spread * i) / (ids.length - 1)));
  }

  const cards: CardBox[] = vertical.map((v) => {
    const w = cardWidth[v.side];
    return {
      id: v.e.id,
      kind: v.e.type === 'note' ? 'note' : 'event',
      side: v.side,
      width: w,
      x: v.side === 'left' ? edge.left - w : edge.right,
      top: v.top,
      height: v.height,
      anchorY: v.top + L.ANCHOR,
      dateY: v.dateY,
      edgeX: edge[v.side],
      nodeDx: nodeDx.get(v.e.id) ?? 0,
      color: colorOf(primaryCat(v.e)),
      color2: v.e.categoryIds[1] ? colorOf(v.e.categoryIds[1]) : null,
    };
  });
  const cardById = new Map(cards.map((c) => [c.id, c]));

  const tracks: Track[] = drafts.map((d) => ({
    categoryId: d.id,
    color: colorOf(d.id),
    side: d.side,
    x: laneX(d.side, slotOf.get(d) ?? 0),
    top: d.start,
    bottom: d.end,
    dots: d.dots,
  }));

  const periodBoxes: PeriodBox[] = pDrafts.map((p) => {
    const lane = pLane.get(p)!;
    const side: Side = lane % 2 === 0 ? 'left' : 'right';
    const d = L.STRIP_FROM + Math.floor(lane / 2) * (L.STRIP + L.STRIP_GAP);
    return {
      id: p.e.id,
      side,
      x: side === 'left' ? axisX - d - L.STRIP : axisX + d,
      width: L.STRIP,
      top: p.start,
      bottom: p.end,
      color: colorOf(primaryCat(p.e)),
    };
  });

  const headings: HeadingBox[] = pass.heads.map((h) => ({
    id: h.e.id,
    x: narrow ? L.MARGIN : Math.round(axisX - headW / 2),
    width: headW,
    top: h.top,
    height: h.height,
    dateY: h.dateY,
    color: colorOf(primaryCat(h.e)),
  }));

  // ---------- collegamenti ----------
  const links: LinkBox[] = [];
  const seen = new Set<string>();
  for (const e of flow) {
    for (const l of e.linkedEvents ?? []) {
      const a = cardById.get(e.id);
      const b = cardById.get(l.eventId);
      if (!a || !b || a === b) continue;
      const key = [a.id, b.id].sort().join('→');
      if (seen.has(key)) continue;
      seen.add(key);
      const [hi, lo] = a.anchorY <= b.anchorY ? [a, b] : [b, a];
      links.push({
        key,
        fromId: e.id,
        toId: l.eventId,
        path: linkPath(hi, lo, l.side, axisX),
        colorTop: hi.color,
        colorBottom: lo.color,
        top: hi.anchorY,
        bottom: lo.anchorY,
      });
    }
  }

  // ---------- righello ----------
  const lastY = Math.max(400, ...cards.map((c) => c.top + c.height), ...headings.map((h) => h.top + h.height));
  const height = Math.max(lastY, ...periodBoxes.map((p) => p.bottom)) + L.PAD_BOTTOM;
  const ruler = buildRuler(segments, zoom, origin, yOfBase, height, shift);

  const gaps: Gap[] = gapList.map((g) => ({ y: yOfBase(g.atBase) - g.size, size: g.size }));

  return { width, height, narrow, axisX, cards, periods: periodBoxes, headings, tracks, links, ruler, gaps, yOf };
}

/** Curva di collegamento tra due card, dal bordo verso l'asse. */
function linkPath(a: CardBox, b: CardBox, side: string | undefined, axisX: number): string {
  const dy = Math.abs(b.anchorY - a.anchorY);
  if (a.side !== b.side) {
    const bend = Math.max(30, Math.min(120, dy * 0.3));
    const d1 = a.side === 'left' ? 1 : -1;
    const d2 = b.side === 'left' ? 1 : -1;
    return `M ${a.edgeX} ${a.anchorY} C ${a.edgeX + d1 * bend} ${a.anchorY}, ${b.edgeX + d2 * bend} ${b.anchorY}, ${b.edgeX} ${b.anchorY}`;
  }
  // stesso lato: arco verso l'asse, oppure verso l'esterno se richiesto (link.side)
  const outward = side === a.side;
  const x = outward ? (a.side === 'left' ? a.x : a.x + a.width) : a.edgeX;
  const x2 = outward ? (b.side === 'left' ? b.x : b.x + b.width) : b.edgeX;
  const towardAxis = a.edgeX < axisX ? 1 : -1;
  const dir = outward ? -towardAxis : towardAxis;
  const bend = Math.max(24, Math.min(80, dy * 0.2));
  return `M ${x} ${a.anchorY} C ${x + dir * bend} ${a.anchorY}, ${x2 + dir * bend} ${b.anchorY}, ${x2} ${b.anchorY}`;
}

function buildRuler(
  segments: readonly Segment[],
  zoom: number,
  origin: number,
  yOfBase: (b: number) => number,
  height: number,
  totalShift: number
): RulerTick[] {
  const zf = zoom / DEFAULT_ZOOM;
  const firstYear = Math.max(segments[0].start, yearAtBasePx(origin, segments, zoom));
  const lastYear = Math.min(segments[segments.length - 1].end, yearAtBasePx(origin + height - totalShift, segments, zoom) + 1);
  const ticks: RulerTick[] = [];
  for (const seg of segments) {
    const pxPerYear = seg.density * zf;
    const tick = niceStep(seg.rulerStep, pxPerYear, 16);
    const label = niceStep(tick, pxPerYear, 56);
    const from = Math.max(seg.start, firstYear);
    const to = Math.min(seg.end, lastYear);
    for (let yr = Math.ceil(from / tick) * tick; yr < to; yr += tick) {
      const y = yOfBase(basePx({ year: yr }, segments, zoom));
      if (y < 0 || y > height) continue;
      ticks.push({ y, year: yr, label: yr % label === 0 ? formatRulerYear(yr) : null });
    }
  }
  return ticks;
}

function formatRulerYear(yr: number): string {
  return yr < 0 ? `${-yr} a.C.` : String(yr);
}
