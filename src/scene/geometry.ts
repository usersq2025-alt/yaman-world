import { rng } from './rng';

/** Geometry for the built-in placeholder art only. Memory slots live in slots.ts. */

export interface P { x: number; y: number }
export type Cubic = [P, P, P, P];

export function bez(c: Cubic, t: number): P {
  const u = 1 - t;
  return {
    x: u * u * u * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t * t * t * c[3].x,
    y: u * u * u * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t * t * t * c[3].y,
  };
}

const f = (n: number) => n.toFixed(1);

/** Filled ribbon along a curve whose width tapers from w0 to w1: a branch, not a stroked line. */
export function taper(c: Cubic, w0: number, w1: number, steps = 14): string {
  const L: P[] = [];
  const R: P[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = bez(c, Math.max(0, t - 0.01));
    const b = bez(c, Math.min(1, t + 0.01));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    const p = bez(c, t);
    L.push({ x: p.x - (dy / len) * w, y: p.y + (dx / len) * w });
    R.push({ x: p.x + (dy / len) * w, y: p.y - (dx / len) * w });
  }
  return `M${L.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}L${R.reverse().map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`;
}

const c = (a: number, b: number, c1: number, d: number, e: number, g: number, h: number, i: number): Cubic => [
  { x: a, y: b }, { x: c1, y: d }, { x: e, y: g }, { x: h, y: i },
];

export interface Limb { id: string; c: Cubic; w0: number; w1: number }

export const LIMBS: Limb[] = [
  { id: 'top', c: c(135, 296, 131, 230, 145, 150, 161, 66), w0: 20, w1: 5 },
  { id: 'ul', c: c(113, 304, 97, 250, 81, 190, 66, 116), w0: 24, w1: 6 },
  { id: 'ur', c: c(163, 304, 181, 240, 209, 180, 250, 108), w0: 24, w1: 6 },
  { id: 'l', c: c(105, 322, 77, 304, 45, 284, 6, 232), w0: 32, w1: 8 },
  { id: 'r', c: c(169, 322, 199, 304, 247, 284, 306, 232), w0: 32, w1: 8 },
  { id: 'tl', c: c(33, 262, 21, 230, 15, 205, 26, 168), w0: 9, w1: 3 },
  { id: 'tr', c: c(276, 262, 296, 240, 316, 215, 318, 178), w0: 9, w1: 3 },
];

export const ROOTS: Limb[] = [
  { id: 'r1', c: c(80, 520, 66, 536, 46, 542, 20, 550), w0: 26, w1: 4 },
  { id: 'r2', c: c(190, 520, 206, 536, 226, 542, 256, 548), w0: 26, w1: 4 },
  { id: 'r3', c: c(96, 530, 90, 546, 80, 556, 64, 564), w0: 16, w1: 3 },
  { id: 'r4', c: c(176, 530, 184, 546, 196, 556, 214, 563), w0: 16, w1: 3 },
];

const limb = (id: string) => LIMBS.find((l) => l.id === id)!;

/** Point on a limb where x is closest to the target; used to hang things from real branches. */
export function onLimb(id: string, x: number): P {
  const l = limb(id);
  let best = bez(l.c, 0);
  for (let t = 0; t <= 1; t += 0.01) {
    const p = bez(l.c, t);
    if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
  }
  return best;
}

export const HOUSE = { x0: 85, x1: 215, y0: 180, y1: 300 };

const ELL: [number, number, number, number][] = [
  [85, 150, 100, 88],
  [240, 150, 100, 78],
  [165, 75, 120, 54],
  [45, 235, 60, 42],
  [285, 235, 50, 40],
  [150, 150, 72, 52],
];

export function inCanopy(x: number, y: number, k = 1): boolean {
  return ELL.some(([cx, cy, rx, ry]) => ((x - cx) / (rx * k)) ** 2 + ((y - cy) / (ry * k)) ** 2 <= 1);
}
export const inHouse = (x: number, y: number, pad = 0) =>
  x > HOUSE.x0 - pad && x < HOUSE.x1 + pad && y > HOUSE.y0 - pad && y < HOUSE.y1 + pad;
export const CANOPY_BLOBS = ELL;

export interface Leaf { x: number; y: number; r: number; s: number; c: number }
export const GREENS = ['#1f4a20', '#2c6126', '#3b7a2d', '#4e9334', '#6aab3a', '#8dc24a', '#b6d65e'];

function scatter(seed: number, count: number, ok: (x: number, y: number) => boolean, warmBias: number): Leaf[] {
  const r = rng(seed);
  const out: Leaf[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = -10 + r() * 340;
    const y = 20 + r() * 300;
    if (!ok(x, y)) continue;
    const lit = (x / 340) * 0.55 + (1 - y / 320) * 0.35 + warmBias;
    const idx = Math.max(0, Math.min(6, Math.floor(r() * 3.4 + lit * 3.6)));
    out.push({ x, y, r: r() * 360, s: 0.85 + r() * 0.75, c: idx });
  }
  return out;
}

export const BACK_LEAVES = scatter(7, 330, (x, y) => inCanopy(x, y, 1), 0);
export const FRONT_LEAVES = scatter(21, 150, (x, y) => inCanopy(x, y, 1.02) && !inCanopy(x, y, 0.72) && !inHouse(x, y, 6), 0.12);

export interface Flower { x: number; y: number; s: number; kind: number; h: number; r: number }
export function groundFlowers(): Flower[] {
  const r = rng(5);
  const out: Flower[] = [];
  while (out.length < 52) {
    const z = r();
    const x = z < 0.5 ? -4 + r() * 96 : z < 0.62 ? 196 + r() * 44 : 240 + r() * 124;
    const y = 548 + r() * 96;
    out.push({ x, y, s: 0.8 + (y - 548) / 96 * 0.9, kind: Math.floor(r() * 4), h: 10 + r() * 22, r: r() });
  }
  return out.sort((a, b) => a.y - b.y);
}

export function grassBlades(): string[] {
  const r = rng(11);
  const out: string[] = [];
  for (let i = 0; i < 90; i++) {
    const x = r() * 380 - 10;
    const y = 626 + r() * 20;
    const h = 14 + r() * 22;
    const lean = (r() - 0.5) * 14;
    out.push(`M${f(x)} ${f(y)}Q${f(x + lean * 0.3)} ${f(y - h * 0.6)} ${f(x + lean)} ${f(y - h)}Q${f(x + lean * 0.5 + 3)} ${f(y - h * 0.5)} ${f(x + 5)} ${f(y)}Z`);
  }
  return out;
}


