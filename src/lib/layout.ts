import type { Memory } from '../types';

export interface Branch { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number }

export const BASE = { x: 200, y: 530 };
export const TRUNK = 'M200 530C196 450 206 360 200 262';
export const TRUNK_TOP = 262;

/** Fixed skeleton of the tree; memories are assigned to slots along these branches, oldest lowest. */
export const BRANCHES: Branch[] = [
  { x0: 199, y0: 478, cx: 150, cy: 462, x1: 104, y1: 424 },
  { x0: 201, y0: 462, cx: 252, cy: 452, x1: 296, y1: 410 },
  { x0: 200, y0: 408, cx: 150, cy: 394, x1: 92, y1: 340 },
  { x0: 202, y0: 392, cx: 256, cy: 378, x1: 308, y1: 326 },
  { x0: 201, y0: 340, cx: 158, cy: 326, x1: 116, y1: 262 },
  { x0: 201, y0: 326, cx: 246, cy: 314, x1: 288, y1: 250 },
  { x0: 200, y0: 276, cx: 178, cy: 236, x1: 156, y1: 170 },
  { x0: 200, y0: 272, cx: 224, cy: 232, x1: 246, y1: 164 },
  { x0: 200, y0: 262, cx: 206, cy: 200, x1: 200, y1: 118 },
];

const PER_BRANCH = 3;
const T = [0.44, 0.72, 1];
const SIDE = [-1, 1, 0];
export const CAPACITY = BRANCHES.length * PER_BRANCH;
/** Leave a little slack below the physical capacity so the tree never looks packed. */
const MAX_NODES = CAPACITY - 3;

export interface Node {
  id: string;
  items: Memory[];
}

export interface Placed extends Node {
  x: number;
  y: number;
  rot: number;
  branch: number;
}

export function sortMemories(list: Memory[]): Memory[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

const keyers: ((d: string) => string)[] = [
  (d) => d.slice(0, 7),
  (d) => `${d.slice(0, 4)}-Q${Math.floor((+d.slice(5, 7) - 1) / 3)}`,
  (d) => d.slice(0, 4),
];

/** One leaf per memory while there is room; otherwise group by month → quarter → year so the tree stays calm. */
export function buildNodes(sorted: Memory[]): Node[] {
  if (sorted.length <= MAX_NODES) return sorted.map((m) => ({ id: m.id, items: [m] }));
  let groups: Node[] = [];
  for (const key of keyers) {
    const map = new Map<string, Memory[]>();
    for (const m of sorted) {
      const k = key(m.date);
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    groups = [...map.entries()].map(([k, items]) => ({ id: items.length === 1 ? items[0].id : `g-${k}`, items }));
    if (groups.length <= MAX_NODES) break;
  }
  return groups.slice(0, CAPACITY);
}

export function pointAt(b: Branch, t: number) {
  const u = 1 - t;
  return {
    x: u * u * b.x0 + 2 * u * t * b.cx + t * t * b.x1,
    y: u * u * b.y0 + 2 * u * t * b.cy + t * t * b.y1,
    dx: 2 * u * (b.cx - b.x0) + 2 * t * (b.x1 - b.cx),
    dy: 2 * u * (b.cy - b.y0) + 2 * t * (b.y1 - b.cy),
  };
}

/** Slot used by each node: contiguous while ungrouped, spread across the whole crown once memories are grouped. */
export function slotOf(i: number, n: number, grouped: boolean): number {
  return grouped && n > 1 ? Math.round((i * (CAPACITY - 1)) / (n - 1)) : i;
}

export function place(nodes: Node[]): Placed[] {
  const grouped = nodes.some((x) => x.items.length > 1);
  return nodes.map((n, idx) => {
    const i = slotOf(idx, nodes.length, grouped);
    const bi = Math.floor(i / PER_BRANCH);
    const k = i % PER_BRANCH;
    const p = pointAt(BRANCHES[bi], T[k]);
    const tangent = (Math.atan2(p.dy, p.dx) * 180) / Math.PI + 90;
    return { ...n, x: p.x, y: p.y, rot: tangent + SIDE[k] * 58, branch: bi };
  });
}

export function visibleBranches(placed: Placed[]): number {
  const top = placed.reduce((a, p) => Math.max(a, p.branch), 0);
  return Math.min(BRANCHES.length, Math.max(2, top + 1));
}

/** Fraction of the trunk that has grown: just enough to carry the highest visible branch. */
export function trunkProgress(placed: Placed[]): number {
  if (placed.length === 0) return 0.34;
  const vb = visibleBranches(placed);
  const top = Math.min(...BRANCHES.slice(0, vb).map((b) => b.y0));
  return Math.min(1, Math.max(0.4, (BASE.y - top) / (BASE.y - TRUNK_TOP) + 0.1));
}

export function treeScale(n: number): number {
  return 0.66 + 0.34 * Math.min(1, n / 16);
}
