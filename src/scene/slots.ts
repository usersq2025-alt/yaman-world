import { ZONES } from './manifest';
import { rng } from './rng';

export interface Slot { x: number; y: number; i: number }

const inside = (x: number, y: number, k: number) =>
  ZONES.canopy.some(([cx, cy, rx, ry]) => ((x - cx) / (rx * k)) ** 2 + ((y - cy) / (ry * k)) ** 2 <= 1);

const blocked = (x: number, y: number) =>
  ZONES.keepOutRects.some((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) ||
  ZONES.keepOutCircles.some((c) => Math.hypot(c.x - x, c.y - y) < c.r);

/** Slot positions for memory blossoms, nearest the heart of the crown first. Pure behaviour data: no drawing. */
function build(): Slot[] {
  if (ZONES.fixedSlots) return ZONES.fixedSlots.slice(0, 27).map((p, i) => ({ ...p, i }));
  const r = rng(99);
  const pts: { x: number; y: number }[] = [];
  let minD = 40;
  let guard = 0;
  while (pts.length < 27) {
    if (guard++ > 4000) { minD -= 3; guard = 0; }
    const x = -4 + r() * 330;
    const y = 30 + r() * 270;
    if (!inside(x, y, 0.88) || blocked(x, y)) continue;
    if (pts.some((p) => Math.hypot(p.x - x, p.y - y) < minD)) continue;
    pts.push({ x, y });
  }
  const h = ZONES.heart;
  pts.sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y));
  return pts.map((p, i) => ({ ...p, i }));
}

export const SLOTS = build();

