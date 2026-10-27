import { useEffect, useState } from 'react';

export interface AssetInfo { w: number; h: number; alpha: boolean }
export type AssetMap = Record<string, AssetInfo>;

let cache: Promise<AssetMap> | null = null;

/**
 * `public/scene/assets.json` is written by `npm run assets:scan` and lists the art files that
 * were delivered and passed validation. One request, no per-file 404s; if the list is absent
 * the garden simply uses its built-in placeholders.
 */
function load(): Promise<AssetMap> {
  if (!cache) {
    cache = fetch('./scene/assets.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { files: {} }))
      .then((j) => (j && typeof j.files === 'object' ? (j.files as AssetMap) : {}))
      .catch(() => ({}));
  }
  return cache;
}

export const assetUrl = (file: string) => `./scene/${file}`;

/** null while loading, then the map of available art files. */
export function useSceneAssets(): AssetMap | null {
  const [map, setMap] = useState<AssetMap | null>(null);
  useEffect(() => {
    let live = true;
    load().then((m) => live && setMap(m));
    return () => { live = false; };
  }, []);
  return map;
}
