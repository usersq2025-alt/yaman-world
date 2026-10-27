import { memo } from 'react';
import type { Node } from '../lib/layout';
import { buildNodes, slotOf, sortMemories } from '../lib/layout';
import { formatDate, memoriesLabel, num } from '../lib/format';
import type { Memory } from '../types';
import { assetUrl, type AssetMap } from './assets';
import { BLOOM_ART, MAILBOX, PLANKS, PLANK_ART, PLANK_X, type PlankId } from './manifest';
import { SLOTS } from './slots';
import { Bloom, WOOD } from './fallback';

/**
 * Behaviour layer. Everything here is about memories and buttons: which blossom belongs to
 * which memory id, what a tap does. It draws with a sprite when the art exists and falls
 * back to a placeholder otherwise, but its logic never changes with the art.
 */

const PETAL: Record<string, string> = { image: '#f8b3c4', video: '#d6e6f8', audio: '#ffdcae' };

function Sprite({ file, size, assets }: { file: string; size: number; assets: AssetMap }) {
  return assets[file] ? <image href={assetUrl(file)} x={-size / 2} y={-size / 2} width={size} height={size} /> : null;
}

const Blossom = memo(function Blossom({ x, y, i, node, fresh, assets, onOpen }: { x: number; y: number; i: number; node: Node; fresh: boolean; assets: AssetMap; onOpen: () => void }) {
  const m = node.items[0];
  const group = node.items.length > 1;
  const label = group
    ? `${memoriesLabel(node.items.length)}، من ${formatDate(node.items[0].date)} إلى ${formatDate(node.items[node.items.length - 1].date)}`
    : `${m.demo ? 'ذكرى تجريبية، ' : ''}ذكرى ${formatDate(m.date)}`;
  const art = group ? BLOOM_ART.cluster : BLOOM_ART[m.kind];
  const hasArt = !!assets[art.file];
  return (
    <g
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      data-memory-ids={node.items.map((it) => it.id).join(' ')}
      className="node"
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
    >
      <circle r={22} fill="transparent" />
      {fresh && <circle className="ring" r={22} fill="none" stroke="#ffe08a" strokeWidth={3} />}
      <g className="sprout" style={{ ['--d' as string]: `${Math.min(i, 24) * 80}ms` }}>
        <g className="sway" style={{ ['--sd' as string]: `${(i * 0.43) % 3}s` }}>
          {hasArt ? (
            <g opacity={!group && m.demo ? 0.82 : 1}>
              <Sprite file={art.file} size={art.size} assets={assets} />
              {group && (
                <text x={art.size * 0.28} y={-art.size * 0.2} textAnchor="middle" fontSize={11} fontWeight={700} fill="#3d2a10" stroke="#fffaf0" strokeWidth={3} paintOrder="stroke" style={{ fontFamily: 'var(--ui)' }}>
                  {num(node.items.length)}
                </text>
              )}
            </g>
          ) : (
            <>
              <ellipse cy={5} rx={13} ry={4} fill="#1a3a18" opacity={0.18} />
              {group ? (
                <g>
                  <g transform="translate(-9 3)"><Bloom r={11} petal="#f8b3c4" /></g>
                  <g transform="translate(9 3)"><Bloom r={11} petal="#fff1ec" /></g>
                  <g transform="translate(0 -8)"><Bloom r={13} petal="#f59ab4" /></g>
                  <circle cx={13} cy={-15} r={9} fill="#fffaf0" stroke="#7a5a22" strokeWidth={1} />
                  <text x={13} y={-11.6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#3d2a10" style={{ fontFamily: 'var(--ui)' }}>
                    {num(node.items.length)}
                  </text>
                </g>
              ) : (
                <g opacity={m.demo ? 0.82 : 1}>
                  <Bloom r={13} petal={PETAL[m.kind]} />
                </g>
              )}
            </>
          )}
        </g>
      </g>
    </g>
  );
});

export function Blossoms({ memories, fresh, assets, onOpen }: { memories: Memory[]; fresh: Set<string>; assets: AssetMap; onOpen: (n: Node) => void }) {
  const nodes = buildNodes(sortMemories(memories));
  const grouped = nodes.some((n) => n.items.length > 1);
  return (
    <g>
      {nodes.map((n, i) => {
        const s = SLOTS[slotOf(i, nodes.length, grouped)];
        return s ? <Blossom key={n.id} x={s.x} y={s.y} i={i} node={n} assets={assets} fresh={n.items.some((x) => fresh.has(x.id))} onOpen={() => onOpen(n)} /> : null;
      })}
      {nodes.length === 0 && (
        <text x={150} y={118} textAnchor="middle" fontSize={17} fontWeight={600} fill="#fff6e0" stroke="#244f21" strokeWidth={4} paintOrder="stroke" style={{ fontFamily: 'var(--display)' }}>
          الشجرة تنتظر أول ذكرى
        </text>
      )}
    </g>
  );
}

export function Signboard({ assets, handlers }: { assets: AssetMap; handlers: Record<PlankId, () => void> }) {
  const art = !!assets[PLANK_ART.file];
  const { w, h } = PLANK_ART;
  return (
    <g>
      {PLANKS.map((p) => {
        const fire = handlers[p.id];
        return (
          <g
            key={p.id}
            className="plank"
            role="button"
            tabIndex={0}
            aria-label={p.label}
            onClick={fire}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fire())}
            transform={`rotate(${p.tilt} ${PLANK_X + w / 2} ${p.y + h / 2})`}
          >
            <rect x={PLANK_X - 2} y={p.y - 3} width={w + 4} height={h + 8} fill="transparent" />
            {art ? (
              <image className="plank-face" href={assetUrl(PLANK_ART.file)} x={PLANK_X} y={p.y} width={w} height={h} />
            ) : (
              <>
                <rect className="plank-face" x={PLANK_X} y={p.y} width={w} height={h} rx={9} fill={WOOD} stroke="#6a3f1e" strokeWidth={2} />
                <path d={`M${PLANK_X + 6} ${p.y + 5}H${PLANK_X + w - 6}`} stroke="#ffd9a0" strokeOpacity={0.55} strokeWidth={1.6} strokeLinecap="round" />
                <path d={`M${PLANK_X + 6} ${p.y + 33}H${PLANK_X + w - 6}`} stroke="#4d2c12" strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round" />
                <circle cx={PLANK_X + 8} cy={p.y + 19} r={1.8} fill="#4d2c12" opacity={0.7} />
                <circle cx={PLANK_X + w - 8} cy={p.y + 19} r={1.8} fill="#4d2c12" opacity={0.7} />
              </>
            )}
            {/* the label is live text, never part of the artwork */}
            <text x={PLANK_X + w / 2} y={p.y + 25} textAnchor="middle" fontSize={13.5} fontWeight={600} fill="#fff4de" stroke="#4d2c12" strokeWidth={2.6} paintOrder="stroke" style={{ fontFamily: 'var(--ui)' }}>
              {p.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Appears only when both mailbox images have been delivered; opens the letters section. */
export function Mailbox({ assets, onClick }: { assets: AssetMap; onClick: () => void }) {
  if (!assets[MAILBOX.closed] || !assets[MAILBOX.open]) return null;
  const { x, y, w, h } = MAILBOX.rect;
  return (
    <g className="mailbox" role="button" tabIndex={0} aria-label="صندوق الرسائل" onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}>
      <rect x={x} y={y} width={w} height={h} fill="transparent" />
      <image className="mb-closed" href={assetUrl(MAILBOX.closed)} x={x} y={y} width={w} height={h} />
      <image className="mb-open" href={assetUrl(MAILBOX.open)} x={x} y={y} width={w} height={h} />
    </g>
  );
}
