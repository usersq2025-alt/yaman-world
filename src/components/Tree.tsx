import { BASE, BRANCHES, TRUNK, buildNodes, place, sortMemories, treeScale, trunkProgress, visibleBranches, type Node, type Placed } from '../lib/layout';
import { formatDate, memoriesLabel, num } from '../lib/format';
import type { Memory } from '../types';

const LEAF = 'M0 0C15 -11 15 -27 0 -38C-15 -27 -15 -11 0 0Z';
const KIND_FILL: Record<string, string> = { image: '#A8B8A0', video: '#B9C7CC', audio: '#E8DCCB' };

interface Props {
  memories: Memory[];
  fresh: Set<string>;
  onOpen: (node: Node) => void;
}

function Leaf({ p, i, s, fresh, onOpen }: { p: Placed; i: number; s: number; fresh: boolean; onOpen: () => void }) {
  const m = p.items[0];
  const group = p.items.length > 1;
  const k = 1.35 / Math.pow(s, 0.6);
  const label = group
    ? `${memoriesLabel(p.items.length)}، من ${formatDate(p.items[0].date)} إلى ${formatDate(p.items[p.items.length - 1].date)}`
    : `${m.demo ? 'ذكرى تجريبية، ' : ''}ذكرى ${formatDate(m.date)}`;
  return (
    <g
      transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      className="node"
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
    >
      <circle r={26 / s} fill="transparent" />
      {fresh && <circle className="ring" r={24} fill="none" stroke="#C9A86A" strokeWidth={2.4} />}
      <g style={{ ['--d' as string]: `${Math.min(i, 24) * 70}ms` }} className="sprout">
        <g transform={`rotate(${p.rot.toFixed(1)}) scale(${k.toFixed(2)})`}>
          <g className="sway" style={{ ['--sd' as string]: `${(i * 0.37) % 2}s` }}>
            {group ? (
              <g transform="translate(0 -20)">
                {[0, 60, 120, 180, 240, 300].map((a) => (
                  <ellipse key={a} cx={0} cy={-14} rx={8} ry={14} transform={`rotate(${a})`} fill="#E8DCCB" stroke="#405A48" strokeOpacity={0.45} strokeWidth={1} />
                ))}
                <circle r={12} fill="#C9A86A" />
                <text textAnchor="middle" y={4.5} fontSize={13} fontWeight={600} fill="#405A48" transform={`rotate(${-p.rot})`} fontFamily="Readex Pro, sans-serif">
                  {num(p.items.length)}
                </text>
              </g>
            ) : (
              <g opacity={m.demo ? 0.78 : 1}>
                <path d={LEAF} fill={KIND_FILL[m.kind]} stroke="#405A48" strokeOpacity={0.55} strokeWidth={1.2} />
                <path d="M0 -3V-31" stroke="#405A48" strokeOpacity={0.4} strokeWidth={1} />
                {!m.demo && <circle cy={-40} r={3} fill="#C9A86A" />}
              </g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
}

export default function Tree({ memories, fresh, onOpen }: Props) {
  const nodes = buildNodes(sortMemories(memories));
  const placed = place(nodes);
  const n = nodes.length;
  const s = treeScale(memories.length);
  const vb = visibleBranches(placed);
  const progress = trunkProgress(placed);
  const empty = n === 0;

  return (
    <svg className="tree" viewBox="0 0 400 560" preserveAspectRatio="xMidYMax meet" role="group" aria-label="شجرة ذكريات يمان">
      <circle cx={200} cy={300} r={170} fill="#E8DCCB" opacity={0.42} />
      <ellipse cx={200} cy={538} rx={158} ry={13} fill="#E8DCCB" />
      <ellipse cx={200} cy={536} rx={96} ry={7} fill="#A8B8A0" opacity={0.55} />
      <g className="grow" style={{ transform: `scale(${s})`, transformOrigin: `${BASE.x}px ${BASE.y}px` }}>
        <path className="limb" d={TRUNK} pathLength={1} style={{ strokeDashoffset: 1 - progress }} stroke="#405A48" strokeWidth={11} fill="none" strokeLinecap="round" />
        <path className="limb" d={TRUNK} pathLength={1} style={{ strokeDashoffset: 1 - progress }} stroke="#A8B8A0" strokeWidth={2.4} fill="none" strokeLinecap="round" transform="translate(-1.6 0)" />
        {BRANCHES.slice(0, vb).map((b, i) => (
          <path
            key={i}
            className="branch"
            d={`M${b.x0} ${b.y0}Q${b.cx} ${b.cy} ${b.x1} ${b.y1}`}
            pathLength={1}
            stroke="#405A48"
            strokeWidth={4.2 - Math.floor(i / 3) * 0.5}
            fill="none"
            strokeLinecap="round"
            style={{ ['--d' as string]: `${i * 90}ms` }}
          />
        ))}
        {empty && (
          <g transform="translate(200 266)">
            <g className="sway" style={{ ['--sd' as string]: '0s' }}>
              <path d={LEAF} fill="#A8B8A0" stroke="#405A48" strokeOpacity={0.55} strokeWidth={1.2} transform="rotate(-38) scale(1.1)" />
              <path d={LEAF} fill="#A8B8A0" stroke="#405A48" strokeOpacity={0.55} strokeWidth={1.2} transform="rotate(38) scale(1.1)" />
              <circle cy={-6} r={5} fill="#C9A86A" />
            </g>
          </g>
        )}
        {placed.map((p, i) => (
          <Leaf key={p.id} p={p} i={i} s={s} fresh={p.items.some((x) => fresh.has(x.id))} onOpen={() => onOpen(p)} />
        ))}
      </g>
    </svg>
  );
}

