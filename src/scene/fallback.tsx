import { useMemo } from 'react';
import { BACK_LEAVES, CANOPY_BLOBS, FRONT_LEAVES, GREENS, LIMBS, ROOTS, bez, groundFlowers, grassBlades, onLimb, taper, type Leaf } from './geometry';

/**
 * Built-in placeholder art, drawn from code. It exists only so the garden works before the
 * real artwork is delivered: every piece below is replaced, layer by layer, as soon as its
 * file appears in public/scene/ (see manifest.ts). Nothing here knows about memories.
 */

export const WOOD = 'url(#ys-wood)';

function Leaves({ list, cls, delay }: { list: Leaf[]; cls?: string; delay?: string }) {
  return (
    <g className={cls} style={{ animationDelay: delay }}>
      {list.map((l, i) => (
        <use key={i} href="#ys-leaf" fill={GREENS[l.c]} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)}) scale(${l.s.toFixed(2)})`} />
      ))}
    </g>
  );
}

export function Bloom({ r, petal, center = '#f7c65a', n = 5 }: { r: number; petal: string; center?: string; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <ellipse key={i} cx={0} cy={-r * 0.62} rx={r * 0.46} ry={r * 0.62} fill={petal} stroke="#b4546f" strokeOpacity={0.35} strokeWidth={0.7} transform={`rotate(${(360 / n) * i})`} />
      ))}
      <circle r={r * 0.3} fill={center} stroke="#a8761f" strokeOpacity={0.5} strokeWidth={0.6} />
    </g>
  );
}

function Lantern({ x, y, drop, delay }: { x: number; y: number; drop: number; delay: string }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <g className="swing-s" style={{ animationDelay: delay }}>
        <path d={`M0 0V${drop}`} stroke="#3a2412" strokeWidth={1.4} />
        <g transform={`translate(0 ${drop})`}>
          <circle cy={12} r={30} fill="url(#ys-glow)" className="flicker" style={{ animationDelay: delay }} />
          <path d="M-8 3h16l-2 -4h-12z" fill="#3a2412" />
          <rect x={-7} y={3} width={14} height={20} rx={3} fill="#ffd978" stroke="#3a2412" strokeWidth={1.8} />
          <rect x={-3} y={7} width={6} height={12} rx={3} fill="#fff3bf" />
          <path d="M-8 23h16v3h-16z" fill="#3a2412" />
        </g>
      </g>
    </g>
  );
}

export function Defs() {
  return (
    <defs>
        <linearGradient id="ys-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b8ed0" />
          <stop offset=".32" stopColor="#a6b8e2" />
          <stop offset=".58" stopColor="#f3c48f" />
          <stop offset=".8" stopColor="#f9d9a2" />
          <stop offset="1" stopColor="#fbe7b6" />
        </linearGradient>
        <radialGradient id="ys-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff0b8" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffd98a" stopOpacity=".5" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ys-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe9a0" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffcf6a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ys-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a4cc58" />
          <stop offset=".4" stopColor="#6aa63a" />
          <stop offset="1" stopColor="#2f6a26" />
        </linearGradient>
        <linearGradient id="ys-bark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f2615" />
          <stop offset=".45" stopColor="#6f4626" />
          <stop offset=".85" stopColor="#b57f45" />
          <stop offset="1" stopColor="#c99259" />
        </linearGradient>
        <linearGradient id="ys-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a063" />
          <stop offset="1" stopColor="#a56a31" />
        </linearGradient>
        <linearGradient id="ys-plankwall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8e5a2c" />
          <stop offset="1" stopColor="#c58d52" />
        </linearGradient>
        <linearGradient id="ys-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2cf9c" />
          <stop offset=".4" stopColor="#9fc6e8" />
          <stop offset="1" stopColor="#4d84bd" />
        </linearGradient>
        <linearGradient id="ys-ray" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2c2" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff2c2" stopOpacity="0" />
        </linearGradient>
        <path id="ys-leaf" d="M0 0C3 -5.5 11 -6.5 17 0C11 6.5 3 5.5 0 0Z" />
        <path id="ys-petal-sm" d="M0 0C-3 -5 -3 -9 0 -11C3 -9 3 -5 0 0Z" />
    </defs>
  );
}

export function FbBackground() {
  return (
    <>
      {/* sky, sun, mountains, lake */}
      <g aria-hidden="true">
        <rect width="360" height="470" fill="url(#ys-sky)" />
        <circle cx="262" cy="330" r="190" fill="url(#ys-sun)" />
        <g opacity=".55">
          <ellipse cx="64" cy="74" rx="52" ry="11" fill="#fff4ef" />
          <ellipse cx="92" cy="64" rx="34" ry="10" fill="#fff4ef" />
          <ellipse cx="312" cy="54" rx="44" ry="9" fill="#ffe9de" />
          <ellipse cx="290" cy="46" rx="26" ry="8" fill="#ffe9de" />
        </g>
        <g className="rays" opacity=".14">
          <path d="M360 0L250 470L300 470Z" fill="url(#ys-ray)" />
          <path d="M360 0L170 420L214 440Z" fill="url(#ys-ray)" />
          <path d="M360 60L330 470L360 470Z" fill="url(#ys-ray)" />
        </g>
        <path d="M0 410L34 372L72 402L128 346L188 398L246 352L304 392L360 362V450H0Z" fill="#9a97c9" opacity=".75" />
        <path d="M0 428L50 398L110 424L170 386L240 424L300 398L360 420V456H0Z" fill="#b7b0d6" opacity=".85" />
        <rect y="432" width="360" height="30" fill="url(#ys-water)" opacity=".8" />
        <path d="M30 442H110M170 448H260M220 438H300" stroke="#fff4dc" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M0 452C70 440 160 446 240 440C300 436 340 442 360 446V480H0Z" fill="#8cb857" />
        {/* far trees */}
        <g>
          <rect x="22" y="420" width="4" height="30" fill="#5a3a22" />
          <circle cx="24" cy="414" r="20" fill="#4e8a34" />
          <circle cx="16" cy="410" r="13" fill="#6aa63e" />
          <rect x="332" y="424" width="3" height="24" fill="#5a3a22" />
          <circle cx="334" cy="418" r="15" fill="#5a9438" />
        </g>
      </g>

      {/* meadow */}
      <g aria-hidden="true">
        <path d="M0 462C90 446 220 450 360 464V640H0Z" fill="url(#ys-ground)" />
        <path d="M0 500C80 486 150 492 220 500C280 506 330 498 360 492V640H0Z" fill="#5d9a34" opacity=".55" />
        {/* pond */}
        <path d="M150 592C150 566 210 556 262 558C322 560 376 572 376 598C376 628 322 642 250 642C190 642 150 620 150 592Z" fill="url(#ys-water)" />
        <path d="M176 590C200 578 250 574 296 580" stroke="#fff0cf" strokeOpacity=".6" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse className="ripple" cx="300" cy="612" rx="26" ry="5" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="1.4" />
        <ellipse className="ripple r2" cx="214" cy="604" rx="20" ry="4" fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="1.4" />
        {[158, 178, 352, 366].map((x, i) => (
          <g key={x}>
            <ellipse cx={x} cy={i < 2 ? 600 + i * 10 : 586 + (i - 2) * 14} rx={11} ry={6} fill="#8d8f80" />
            <ellipse cx={x} cy={(i < 2 ? 600 + i * 10 : 586 + (i - 2) * 14) - 2} rx={9} ry={3.5} fill="#b9bba9" />
          </g>
        ))}
        <ellipse className="lily" cx="236" cy="624" rx="9" ry="3.4" fill="#5f9e3a" />
        <ellipse className="lily l2" cx="330" cy="598" rx="8" ry="3" fill="#5f9e3a" />
        <circle cx="236" cy="621" r="2.6" fill="#ffd5e1" />
      </g>
    </>
  );
}

export function FbStones() {
  return (
      <g aria-hidden="true">
        {[[72, 626, 36, 11], [122, 602, 31, 10], [84, 574, 26, 9], [128, 552, 22, 8]].map(([x, y, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 3} rx={rx} ry={ry} fill="#4a4d40" opacity={0.55} />
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#9a9d8c" />
            <ellipse cx={x} cy={y - 1.5} rx={rx * 0.82} ry={ry * 0.62} fill="#c4c6b3" />
            <path d={`M${x - rx * 0.7} ${y + ry * 0.4}q${rx * 0.4} ${ry * 0.6} ${rx * 0.9} ${ry * 0.3}`} stroke="#5f9e3a" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
  );
}

export function FbTrunk() {
  return (
    <g aria-hidden="true">
        <ellipse cx="140" cy="540" rx="120" ry="14" fill="#1c3a14" opacity=".3" />
        {ROOTS.map((r) => <path key={r.id} d={taper(r.c, r.w0, r.w1)} fill="url(#ys-bark)" />)}
        <path d="M73 538C85 504 97 472 101 432C103 384 93 334 103 285L171 285C181 334 173 384 175 432C177 472 185 504 199 538Z" fill="url(#ys-bark)" />
        <g fill="none" strokeLinecap="round">
          {[[108, 510, 112, 450, 108, 380], [122, 520, 126, 440, 120, 340], [138, 524, 140, 450, 136, 380], [152, 520, 156, 450, 150, 360], [166, 516, 166, 450, 160, 340], [92, 500, 96, 440, 94, 400], [182, 510, 176, 450, 172, 380]].map(([a, b, c1, d, e, g], i) => (
            <path key={i} d={`M${a} ${b}Q${c1} ${d} ${e} ${g}`} stroke="#2a180b" strokeOpacity={0.32} strokeWidth={2.2} />
          ))}
          {[[160, 500, 164, 440, 158, 350], [172, 490, 172, 430, 168, 360], [146, 508, 150, 450, 144, 380]].map(([a, b, c1, d, e, g], i) => (
            <path key={i} d={`M${a} ${b}Q${c1} ${d} ${e} ${g}`} stroke="#ffd9a0" strokeOpacity={0.4} strokeWidth={2} />
          ))}
        </g>
        <ellipse cx="136" cy="472" rx="12" ry="9" fill="#2a180b" opacity=".35" />
        {/* ivy climbing the trunk */}
        <path d="M84 524Q68 478 92 440Q106 406 94 362Q90 330 104 300" stroke="#3b7a2d" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M184 520Q198 480 176 446Q166 420 176 392" stroke="#3b7a2d" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        {[[80, 500, -50], [74, 470, 40], [90, 440, -60], [98, 412, 45], [94, 380, -55], [96, 350, 40], [102, 322, -40], [186, 500, 50], [192, 470, -40], [178, 440, 55], [172, 412, -45]].map(([x, y, r], i) => (
          <use key={i} href="#ys-leaf" fill={GREENS[2 + (i % 4)]} transform={`translate(${x} ${y}) rotate(${r}) scale(${0.85 + (i % 3) * 0.15})`} />
        ))}
    </g>
  );
}

export function FbCanopyBack() {
  const thirds = useMemo(() => [BACK_LEAVES.filter((_, i) => i % 3 === 0), BACK_LEAVES.filter((_, i) => i % 3 === 1), BACK_LEAVES.filter((_, i) => i % 3 === 2)], []);
  return (
    <g aria-hidden="true">
        {/* back canopy */}
        <g>
          {CANOPY_BLOBS.map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx * 0.9} ry={ry * 0.9} fill="#244f21" />)}
        </g>
        {/* limbs sit inside the foliage: leaves overlap them, so only the inner stretches show */}
        {LIMBS.map((l) => <path key={l.id} d={taper(l.c, l.w0, l.w1)} fill="url(#ys-bark)" />)}
        {LIMBS.slice(0, 5).map((l) => {
          const a = bez(l.c, 0.15);
          const b = bez(l.c, 0.8);
          return <path key={l.id} d={`M${a.x + 3} ${a.y}L${b.x + 2} ${b.y}`} stroke="#ffd9a0" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />;
        })}
        <Leaves list={thirds[0]} cls="foliage" delay="0s" />
        <Leaves list={thirds[1]} cls="foliage" delay="-2.3s" />
        <Leaves list={thirds[2]} cls="foliage" delay="-4.6s" />
    </g>
  );
}

export function FbHouse() {
  return (
      <g aria-hidden="true">
        <ellipse cx="150" cy="238" rx="86" ry="52" fill="url(#ys-glow)" opacity=".35" />
        <path d="M100 282L92 304M200 282L208 304M150 284V300" stroke="#4a2c14" strokeWidth={5} strokeLinecap="round" />
        <rect x="91" y="278" width="118" height="9" rx="2.5" fill="#5a3618" />
        <rect x="91" y="278" width="118" height="3" rx="1.5" fill="#d9a063" opacity=".7" />
        <rect x="107" y="222" width="86" height="56" rx="3" fill="url(#ys-plankwall)" />
        {[230, 238, 246, 254, 262, 270].map((y) => <path key={y} d={`M107 ${y}H193`} stroke="#4a2c14" strokeOpacity={0.35} strokeWidth={1.2} />)}
        <path d="M95 228L150 186L205 228Z" fill="#6a4020" />
        <path d="M95 228L150 186L205 228" stroke="#3a2410" strokeWidth={3} fill="none" strokeLinejoin="round" />
        {[196, 204, 212, 220].map((y, i) => <path key={y} d={`M${150 - (y - 186) * 1.25 + 2} ${y}H${150 + (y - 186) * 1.25 - 2}`} stroke="#3a2410" strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray={i % 2 ? '7 3' : '5 4'} />)}
        <path d="M150 186L205 228" stroke="#d9a063" strokeOpacity={0.5} strokeWidth={2} />
        <rect x="137" y="244" width="24" height="34" rx="12" fill="#3a2410" />
        <rect x="140" y="248" width="18" height="30" rx="9" fill="#ffd978" />
        <rect x="141" y="260" width="16" height="18" fill="#fff0b8" opacity=".6" />
        {[117, 167].map((x) => (
          <g key={x}>
            <circle cx={x + 8} cy={246} r={20} fill="url(#ys-glow)" />
            <rect x={x} y={238} width={16} height={16} rx={2} fill="#ffdf8d" stroke="#3a2410" strokeWidth={2} />
            <path d={`M${x + 8} 238V254M${x} 246H${x + 16}`} stroke="#3a2410" strokeWidth={1.6} />
          </g>
        ))}
        {/* railing */}
        <path d="M91 264H209" stroke="#4a2c14" strokeWidth={3} />
        {Array.from({ length: 15 }, (_, i) => <path key={i} d={`M${95 + i * 8.2} 264V278`} stroke="#4a2c14" strokeWidth={2.4} />)}
        {/* string lights */}
        <path d="M95 228Q125 238 150 226Q176 238 205 228" stroke="#3a2410" strokeWidth={1} fill="none" />
        {[108, 124, 138, 162, 176, 192].map((x, i) => <circle key={x} className="flicker" style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy={i % 2 ? 232 : 236} r={2.4} fill="#fff1a8" />)}
        {/* vines on the house */}
        <path d="M95 280Q92 262 100 248Q104 236 98 226M205 280Q210 262 202 250" stroke="#3b7a2d" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        {[[98, 250, -40], [101, 238, 30], [96, 264, -60], [204, 262, 40], [201, 250, -30]].map(([x, y, r], i) => <use key={i} href="#ys-leaf" fill={GREENS[3 + (i % 3)]} transform={`translate(${x} ${y}) rotate(${r}) scale(.8)`} />)}
      </g>
  );
}

export function FbSwing() {
  const swingL = onLimb('r', 188);
  const swingR = onLimb('r', 216);
  return (
      <g aria-hidden="true">
        <g className="swing" style={{ transformOrigin: `${(swingL.x + swingR.x) / 2}px ${swingL.y}px` }}>
          <path d={`M${swingL.x} ${swingL.y}L${swingL.x + 2} 440M${swingR.x} ${swingR.y}L${swingR.x - 2} 440`} stroke="#d8b878" strokeWidth={2.2} />
          <rect x={swingL.x - 6} y={438} width={swingR.x - swingL.x + 12} height={7} rx={2.5} fill="#a8682e" stroke="#5a3618" strokeWidth={1.4} />
          <rect x={swingL.x - 6} y={438} width={swingR.x - swingL.x + 12} height={2.4} rx={1.2} fill="#e6b377" />
        </g>
      </g>
  );
}

export function FbLanterns() {
  const lan1 = onLimb('l', 40);
  const lan2 = onLimb('ul', 88);
  return (
    <g aria-hidden="true">
        <Lantern x={lan1.x} y={lan1.y} drop={26} delay="0s" />
        <Lantern x={lan2.x} y={lan2.y} drop={34} delay="-1.4s" />
    </g>
  );
}

export function FbCanopyFront() {
  return (
      <g aria-hidden="true">
        <Leaves list={FRONT_LEAVES} cls="foliage" delay="-1s" />
      </g>
  );
}

export function FbForeground() {
  const flowers = useMemo(groundFlowers, []);
  const blades = useMemo(grassBlades, []);
  return (
      <g aria-hidden="true">
        <g>
          {[8, 28, 48].map((x) => (
            <g key={x}>
              <path d={`M${x} 530V490L${x + 5} 482L${x + 10} 490V530Z`} fill="url(#ys-wood)" stroke="#5a3618" strokeWidth={1.6} />
            </g>
          ))}
          <path d="M0 498H62M0 515H62" stroke="#a8682e" strokeWidth={5} strokeLinecap="round" />
          <path d="M0 496H62M0 513H62" stroke="#e6b377" strokeWidth={1.4} strokeLinecap="round" />
        </g>
        <ellipse cx="56" cy="532" rx="36" ry="14" fill="#3f7a2d" />
        <ellipse cx="206" cy="540" rx="40" ry="14" fill="#3f7a2d" />
        <ellipse cx="226" cy="536" rx="24" ry="11" fill="#5a9a36" />
        {flowers.map((fl, i) => {
          const petal = ['#ffffff', '#f8a8bf', '#fff1f4', '#d9c8f4'][fl.kind];
          return (
            <g key={i} transform={`translate(${fl.x.toFixed(1)} ${fl.y.toFixed(1)}) scale(${fl.s.toFixed(2)})`}>
              <g className="sway" style={{ ['--sd' as string]: `${(i * 0.31) % 3}s` }}>
                <path d={`M0 0Q${fl.r * 4 - 2} ${-fl.h * 0.5} 0 ${-fl.h}`} stroke="#3b7a2d" strokeWidth={1.6} fill="none" />
                <use href="#ys-leaf" fill="#4e9334" transform={`translate(0 ${-fl.h * 0.35}) rotate(-35) scale(.55)`} />
                <g transform={`translate(0 ${-fl.h})`}><Bloom r={7 + fl.r * 2} petal={petal} n={fl.kind === 1 ? 5 : 8} center={fl.kind === 1 ? '#ffd36b' : '#f2b83a'} /></g>
              </g>
            </g>
          );
        })}
        <g fill="#2f6a26" opacity=".95">
          {blades.map((d, i) => <path key={i} d={d} fill={i % 3 === 0 ? '#3f7a2d' : '#2f6a26'} />)}
        </g>
      </g>
  );
}

export function FbPost() {
  return (
    <g>
        <ellipse cx="280" cy="544" rx="30" ry="8" fill="#3f7a2d" aria-hidden="true" />
        <path d="M274 296H286V544H274Z" fill="url(#ys-bark)" stroke="#4a2c14" strokeWidth={1.6} aria-hidden="true" />
        <path d="M270 296H290L286 290H274Z" fill="#8e5a2c" aria-hidden="true" />
    </g>
  );
}

export function FbBird() {
  return (
        <g className="bird" aria-hidden="true">
          <g transform="translate(280 292)">
            <path d="M-12 0Q-20 -4 -26 -1Q-20 3 -12 4Z" fill="#2f6fc4" />
            <ellipse cx="0" cy="-5" rx="13" ry="9" fill="#3f86d8" />
            <ellipse cx="2" cy="-1" rx="8" ry="5" fill="#fff0d8" />
            <path d="M-4 -8Q4 -14 9 -6Q2 -2 -4 -8Z" fill="#2f6fc4" />
            <circle cx="9" cy="-12" r="6" fill="#3f86d8" />
            <circle cx="11" cy="-13" r="1.5" fill="#1b1b1b" />
            <path d="M14 -12L20 -10L14 -9Z" fill="#f5a23a" />
            <path d="M-2 4V8M3 4V8" stroke="#6a4a2a" strokeWidth={1.2} />
          </g>
        </g>
  );
}

export function FbButterflies() {
  return (
      <g aria-hidden="true">
        <g className="fly">
          <g className="flap"><ellipse cx="-4" cy="0" rx="5" ry="3.6" fill="#f4a640" /><ellipse cx="4" cy="0" rx="5" ry="3.6" fill="#f4a640" /></g>
        </g>
        <g className="fly f2">
          <g className="flap" style={{ animationDelay: '-.2s' }}><ellipse cx="-4" cy="0" rx="4" ry="3" fill="#6fb0e8" /><ellipse cx="4" cy="0" rx="4" ry="3" fill="#6fb0e8" /></g>
        </g>
      </g>
  );
}

