import type { ReactNode } from 'react';
import type { Memory } from '../types';
import type { Node } from '../lib/layout';
import { assetUrl, useSceneAssets, type AssetMap } from '../scene/assets';
import { LAYERS, type FallbackId, type LayerDef, type Motion } from '../scene/manifest';
import { Defs, FbBackground, FbBird, FbButterflies, FbCanopyBack, FbCanopyFront, FbForeground, FbHouse, FbLanterns, FbPost, FbStones, FbSwing, FbTrunk } from '../scene/fallback';
import { Blossoms, Mailbox, Signboard } from '../scene/Interactions';

/**
 * Renders the garden as stacked layers. Each layer is a delivered image when one exists in
 * public/scene/ and a built-in placeholder otherwise. Memories, signs and the mailbox live in
 * src/scene/Interactions.tsx and do not depend on how the layers look.
 */

const FALLBACK: Record<FallbackId, () => ReactNode> = {
  background: () => <FbBackground />,
  stones: () => <FbStones />,
  trunk: () => <FbTrunk />,
  canopyBack: () => <FbCanopyBack />,
  house: () => <FbHouse />,
  swing: () => <FbSwing />,
  lanterns: () => <FbLanterns />,
  canopyFront: () => <FbCanopyFront />,
  foreground: () => <FbForeground />,
  post: () => <FbPost />,
  bird: () => <FbBird />,
  butterflies: () => <FbButterflies />,
};

const MOTION_CLASS: Record<Motion, string> = { none: '', sway: 'foliage', swing: 'swing', hop: 'bird', flutter: '' };

function ArtLayer({ def }: { def: LayerDef }) {
  const { x, y, w, h } = def.rect;
  const motion = def.motion ?? 'none';
  const pivot = def.pivot ?? { x: x + w / 2, y: y + h / 2 };
  const img = <image href={assetUrl(def.file)} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />;

  if (def.instances) {
    return (
      <g aria-hidden="true">
        {def.instances.map((it, i) => (
          <g key={i} transform={`translate(${it.x} ${it.y})`}>
            {motion === 'flutter' ? (
              <g className={`fly ${i ? 'f2' : ''}`} style={{ animationDelay: it.delay }}>
                <g className="flap" style={{ filter: it.hue ? `hue-rotate(${it.hue}deg)` : undefined }}>{img}</g>
              </g>
            ) : (
              <g className={MOTION_CLASS[motion]} style={{ transformOrigin: `${pivot.x}px ${pivot.y}px`, animationDelay: it.delay }}>{img}</g>
            )}
          </g>
        ))}
      </g>
    );
  }
  return (
    <g aria-hidden="true" className={MOTION_CLASS[motion]} style={motion === 'none' ? undefined : { transformOrigin: `${pivot.x}px ${pivot.y}px` }}>
      {img}
    </g>
  );
}

function Layer({ def, assets }: { def: LayerDef; assets: AssetMap }) {
  if (assets[def.file]) return <ArtLayer def={def} />;
  return def.fallback ? <>{FALLBACK[def.fallback]()}</> : null;
}

interface Props {
  memories: Memory[];
  fresh: Set<string>;
  onOpen: (n: Node) => void;
  onMemories: () => void;
  onLetters: () => void;
  onTimeline: () => void;
  onDiscover: () => void;
}

export default function GardenScene({ memories, fresh, onOpen, onMemories, onLetters, onTimeline, onDiscover }: Props) {
  const assets = useSceneAssets();
  // until the (tiny) asset list arrives, show the placeholders instead of a blank scene
  const a: AssetMap = assets ?? {};
  return (
    <svg className="scene" viewBox="0 0 360 640" preserveAspectRatio="xMidYMax slice" role="group" aria-label="حديقة يمان">
      <Defs />
      {LAYERS.map((def) => (
        <g key={def.id}>
          <Layer def={def} assets={a} />
          {def.id === 'canopyFront' && <Blossoms memories={memories} fresh={fresh} assets={a} onOpen={onOpen} />}
          {def.id === 'foreground' && <Mailbox assets={a} onClick={onLetters} />}
          {def.id === 'post' && <Signboard assets={a} handlers={{ memories: onMemories, letters: onLetters, timeline: onTimeline, discover: onDiscover }} />}
        </g>
      ))}
    </svg>
  );
}
