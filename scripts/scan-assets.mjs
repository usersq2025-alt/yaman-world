// Validates the art delivered in public/scene/ against src/scene/manifest.ts and writes
// public/scene/assets.json, the list the garden reads at runtime. Files that fail validation
// are NOT listed, so a bad export can never break the garden: its placeholder stays in place.
//
//   npm run assets:scan            report + write assets.json
//   npm run assets:scan -- --strict   also exit 1 on any rejected file
import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public', 'scene');
mkdirSync(dir, { recursive: true });

// manifest.ts has no imports, so Node can load a copy of it directly
const tmp = join(tmpdir(), `yaman-manifest-${process.pid}.mts`);
copyFileSync(join(root, 'src', 'scene', 'manifest.ts'), tmp);
const M = await import(pathToFileURL(tmp).href);
const PX = M.CANVAS.pxPerUnit;

/** expected files: name -> { w, h (px), transparent, what } */
const expected = new Map();
for (const l of M.LAYERS) expected.set(l.file, { w: l.rect.w * PX, h: l.rect.h * PX, transparent: l.transparent, what: l.id });
for (const k of ['closed', 'open']) expected.set(M.MAILBOX[k], { w: M.MAILBOX.rect.w * PX, h: M.MAILBOX.rect.h * PX, transparent: true, what: `mailbox ${k} (optional)` });
expected.set(M.PLANK_ART.file, { w: M.PLANK_ART.w * PX, h: M.PLANK_ART.h * PX, transparent: true, what: 'plank (no text)' });
for (const [k, v] of Object.entries(M.BLOOM_ART)) expected.set(v.file, { w: v.size * PX, h: v.size * PX, transparent: true, what: `bloom ${k}` });

function png(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), depth = buf[24], ct = buf[25], interlace = buf[28];
  let hasTrns = false, off = 8;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'tRNS') hasTrns = true;
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const channelAlpha = ct === 4 || ct === 6;
  let seesTransparency = null; // null = could not tell
  if (channelAlpha && depth === 8 && !interlace) {
    const bpp = ct === 6 ? 4 : 2;
    const raw = inflateSync(Buffer.concat(idat));
    const stride = w * bpp;
    const rows = [];
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)];
      const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
        let p = 0;
        if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
        else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        line[i] = (line[i] + p) & 255;
      }
      rows.push(line); prev = line;
    }
    let clear = 0, total = 0;
    for (let y = 0; y < h; y += Math.max(1, h >> 6)) for (let x = 0; x < w; x += Math.max(1, w >> 6)) { total++; if (rows[y][x * bpp + bpp - 1] < 250) clear++; }
    seesTransparency = clear / total > 0.01;
  }
  return { w, h, alpha: channelAlpha || hasTrns, seesTransparency };
}

function webp(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const t = buf.toString('ascii', 12, 16);
  if (t === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), alpha: !!(buf[20] & 0x10), seesTransparency: null };
  if (t === 'VP8L') { const b = buf.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff), alpha: !!((b >> 28) & 1), seesTransparency: null }; }
  if (t === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, alpha: false, seesTransparency: null };
  return null;
}

function svg(buf) {
  const s = buf.toString('utf8', 0, 4000);
  if (!/<svg[\s>]/i.test(s)) return null;
  if (/<image[^>]+href=["']data:image\/(png|jpe?g)/i.test(buf.toString('utf8'))) return { w: 0, h: 0, alpha: true, embedded: true };
  const vb = s.match(/viewBox=["']\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  return { w: vb ? +vb[1] : 0, h: vb ? +vb[2] : 0, alpha: true };
}

const present = existsSync(dir) ? readdirSync(dir).filter((f) => /\.(png|webp|svg)$/i.test(f)) : [];
const files = {};
const lines = [];
let rejects = 0;
const mark = { OK: 'OK      ', WARN: 'WARN    ', REJECT: 'REJECT  ', MISSING: 'missing ' };

for (const [name, e] of expected) {
  if (!present.includes(name)) { lines.push([mark.MISSING, name, `${e.w}x${e.h}px`, e.what]); continue; }
  const buf = readFileSync(join(dir, name));
  const ext = extname(name).toLowerCase();
  const info = ext === '.png' ? png(buf) : ext === '.webp' ? webp(buf) : svg(buf);
  if (!info) { rejects++; lines.push([mark.REJECT, name, 'not a valid ' + ext + ' file', e.what]); continue; }
  const problems = [];
  const warnings = [];
  if (e.transparent && !info.alpha) problems.push('has no transparency (opaque picture, e.g. a cropped sheet with a white background)');
  if (e.transparent && info.seesTransparency === false) problems.push('alpha channel exists but nothing is transparent');
  if (!e.transparent && info.w && info.w < e.w * 0.66) warnings.push(`only ${info.w}px wide, ${e.w}px expected`);
  if (info.w && info.h && !info.embedded) {
    const ratio = info.w / info.h, want = e.w / e.h;
    if (Math.abs(ratio - want) / want > 0.03) problems.push(`aspect ${info.w}x${info.h} does not match ${e.w}x${e.h}`);
    else if (info.w < e.w * 0.66) warnings.push(`low resolution ${info.w}x${info.h}, ${e.w}x${e.h} expected`);
    else if (info.w > e.w * 2.2) warnings.push(`very large ${info.w}x${info.h}, ${e.w}x${e.h} is enough`);
  }
  if (buf.length > 1.6 * 1024 * 1024) warnings.push(`${(buf.length / 1048576).toFixed(1)} MB: compress for phones`);
  if (problems.length) { rejects++; lines.push([mark.REJECT, name, `${info.w}x${info.h}`, problems.join('; ')]); continue; }
  files[name] = { w: info.w, h: info.h, alpha: !!info.alpha };
  lines.push([warnings.length ? mark.WARN : mark.OK, name, `${info.w}x${info.h}`, warnings.join('; ') || e.what]);
}
for (const f of present) if (!expected.has(f)) lines.push([mark.WARN, f, '', 'not in manifest, ignored']);

writeFileSync(join(dir, 'assets.json'), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2));
console.log('\nGarden art in public/scene/ (canvas 1080x1920 px, 3 px per scene unit)\n');
for (const l of lines) console.log(l[0] + l[1].padEnd(24) + String(l[2]).padEnd(14) + l[3]);
console.log(`\n${Object.keys(files).length} accepted, ${rejects} rejected, ${[...expected.keys()].filter((k) => !present.includes(k)).length} missing (placeholders stay in place)\n`);
if (rejects && process.argv.includes('--strict')) process.exit(1);
