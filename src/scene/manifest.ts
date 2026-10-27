/**
 * The garden scene is described here as data, separately from how it is drawn.
 *
 * - `layers`: the art, back to front. Each layer is one transparent PNG/WebP/SVG file in
 *   `public/scene/`. When the file is missing the renderer draws the built-in placeholder
 *   named by `fallback`, so the garden always works while art is being delivered.
 * - `interactions`: everything that is behaviour, not picture: memory slots, signboard
 *   hotspots, mailbox hotspot. They are positioned in the same coordinate space as the art
 *   so artists can align to them, but never depend on what the art looks like.
 *
 * Coordinates are scene units on a 360 x 640 canvas. Production files are exported at 3x
 * (1080 x 1920 canvas), so a layer of w x h units is a (3w x 3h) px image.
 */

export const CANVAS = { w: 360, h: 640, pxPerUnit: 3 } as const;

export type Motion = 'none' | 'sway' | 'swing' | 'hop' | 'flutter';
export type FallbackId =
  | 'background' | 'stones' | 'trunk' | 'canopyBack' | 'house' | 'swing' | 'lanterns'
  | 'canopyFront' | 'foreground' | 'post' | 'bird' | 'butterflies';

export interface LayerDef {
  id: string;
  /** file name inside public/scene/ */
  file: string;
  /** where the image sits on the canvas, in scene units */
  rect: { x: number; y: number; w: number; h: number };
  /** pivot for the motion, in scene units (defaults to the rect centre) */
  pivot?: { x: number; y: number };
  motion?: Motion;
  /** a layer drawn from the same file at several places (e.g. two lanterns) */
  instances?: { x: number; y: number; delay?: string; hue?: number }[];
  /** built-in placeholder drawn when `file` is absent */
  fallback?: FallbackId;
  /** transparent sprite (true) or opaque full-bleed picture (false) */
  transparent: boolean;
  note: string;
}

export const LAYERS: LayerDef[] = [
  { id: 'background', file: 'background.webp', rect: { x: 0, y: 0, w: 360, h: 640 }, transparent: false, fallback: 'background', note: 'Sky, sun, mountains, lake, meadow, pond. No tree, no interactive items.' },
  { id: 'stones', file: 'stone_path.png', rect: { x: 40, y: 536, w: 110, h: 100 }, transparent: true, fallback: 'stones', note: 'Stepping stones leading to the tree.' },
  { id: 'trunk', file: 'tree_trunk.png', rect: { x: 6, y: 280, w: 262, h: 300 }, transparent: true, fallback: 'trunk', note: 'Trunk with roots and base shadow. Ends at the fork under the cabin.' },
  { id: 'canopyBack', file: 'canopy_back.png', rect: { x: -10, y: 20, w: 340, h: 310 }, pivot: { x: 150, y: 300 }, motion: 'sway', transparent: true, fallback: 'canopyBack', note: 'Limbs and dense back foliage, behind the cabin.' },
  { id: 'house', file: 'treehouse.png', rect: { x: 85, y: 180, w: 130, h: 125 }, transparent: true, fallback: 'house', note: 'Treehouse with its platform and railing.' },
  { id: 'swing', file: 'swing.png', rect: { x: 176, y: 290, w: 56, h: 160 }, pivot: { x: 204, y: 296 }, motion: 'swing', transparent: true, fallback: 'swing', note: 'Rope swing, hanging from the top centre.' },
  { id: 'lanterns', file: 'lantern.png', rect: { x: -20, y: 0, w: 40, h: 84 }, pivot: { x: 0, y: 0 }, motion: 'swing', instances: [{ x: 40.3, y: 272, delay: '0s' }, { x: 88.2, y: 213.8, delay: '-1.4s' }], transparent: true, fallback: 'lanterns', note: 'One lantern, hanging from the top centre. Used twice.' },
  { id: 'canopyFront', file: 'canopy_front.png', rect: { x: -10, y: 20, w: 340, h: 310 }, pivot: { x: 150, y: 300 }, motion: 'sway', transparent: true, fallback: 'canopyFront', note: 'Foliage in front of limbs and cabin edges. Leave the cabin area clear.' },
  { id: 'foreground', file: 'foreground.png', rect: { x: 0, y: 470, w: 360, h: 170 }, transparent: true, fallback: 'foreground', note: 'Fence, bushes, flowers and grass along the bottom edge.' },
  { id: 'post', file: 'sign_post.png', rect: { x: 262, y: 288, w: 36, h: 260 }, transparent: true, fallback: 'post', note: 'The signboard post only. Planks are separate (plank.png).' },
  { id: 'bird', file: 'bird.png', rect: { x: 258, y: 270, w: 44, h: 36 }, pivot: { x: 280, y: 296 }, motion: 'hop', transparent: true, fallback: 'bird', note: 'Bluebird perched on the post.' },
  { id: 'butterflies', file: 'butterfly.png', rect: { x: -12, y: -10, w: 24, h: 20 }, motion: 'flutter', instances: [{ x: 0, y: 0, delay: '0s' }, { x: 0, y: 0, delay: '-7s', hue: 200 }], transparent: true, fallback: 'butterflies', note: 'One butterfly, wings open, top view. Used twice (second is hue-shifted).' },
];

/** Optional pieces that exist only once the art exists. */
export const MAILBOX = {
  closed: 'mailbox_closed.png',
  open: 'mailbox_open.png',
  rect: { x: 198, y: 474, w: 52, h: 72 },
};

export const PLANK_ART = { file: 'plank.png', w: 104, h: 38 };

/** Sprites for memory blossoms, one per kind plus the grouped bouquet. Centred on the slot. */
export const BLOOM_ART = {
  image: { file: 'bloom_image.png', size: 40 },
  video: { file: 'bloom_video.png', size: 40 },
  audio: { file: 'bloom_audio.png', size: 40 },
  cluster: { file: 'bloom_cluster.png', size: 56 },
} as const;

/* ---------------- behaviour: independent of the art ---------------- */

export const PLANKS = [
  { id: 'memories', label: 'الذكريات', y: 302, tilt: -1.4 },
  { id: 'letters', label: 'رسائل إلى يمان', y: 348, tilt: 1.2 },
  { id: 'timeline', label: 'رحلة النمو', y: 394, tilt: -1 },
  { id: 'discover', label: 'اكتشفي ذكرى', y: 440, tilt: 1.4 },
] as const;
export type PlankId = (typeof PLANKS)[number]['id'];
export const PLANK_X = 228;

/** Where memory blossoms may grow. Edit these when the new tree has a different crown. */
export const ZONES = {
  canopy: [
    [85, 150, 100, 88],
    [240, 150, 100, 78],
    [165, 75, 120, 54],
    [45, 235, 60, 42],
    [285, 235, 50, 40],
    [150, 150, 72, 52],
  ] as [number, number, number, number][],
  /** rectangles that must stay clear (cabin, signboard) */
  keepOutRects: [
    { x0: 75, x1: 225, y0: 170, y1: 310 },
    { x0: 228, x1: 360, y0: 258, y1: 640 },
  ],
  /** round exclusions (lanterns) */
  keepOutCircles: [
    { x: 40.3, y: 310, r: 30 },
    { x: 88.2, y: 259.8, r: 30 },
  ],
  /** crown centre: the oldest memories grow nearest to it */
  heart: { x: 150, y: 300 },
  /** if set, these exact points are used instead of the sampler (27 max) */
  fixedSlots: null as { x: number; y: number }[] | null,
};
