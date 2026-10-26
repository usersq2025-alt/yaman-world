import type { LetterMeta, Memory, MemoryRepo, Settings } from '../types';
import { todayStr } from '../lib/format';

const DB_NAME = 'yaman-world';
const MEM = 'memories';
const META = 'meta';
const LET = 'letters';
const LET_BODY = 'letterBodies';

let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(LET)) d.createObjectStore(LET, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(LET_BODY)) d.createObjectStore(LET_BODY, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(MEM)) d.createObjectStore(MEM, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return dbp;
}

async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req ? (req.result as T) : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(b);
  });

export const idbRepo: MemoryRepo = {
  async listMemories() {
    return ((await run<Memory[]>(MEM, 'readonly', (s) => s.getAll())) ?? []) as Memory[];
  },
  async addMemories(items) {
    await run(MEM, 'readwrite', (s) => {
      items.forEach((m) => s.put(m));
    });
  },
  async removeMemory(id) {
    await run(MEM, 'readwrite', (s) => {
      s.delete(id);
    });
  },
  async removeDemos() {
    const all = await this.listMemories();
    await run(MEM, 'readwrite', (s) => {
      all.filter((m) => m.demo).forEach((m) => s.delete(m.id));
    });
  },
  async getSettings(): Promise<Settings> {
    const birthDate = (await run<string>(META, 'readonly', (s) => s.get('birthDate'))) ?? null;
    return { birthDate };
  },
  async saveSettings(s) {
    await run(META, 'readwrite', (st) => {
      if (s.birthDate) st.put(s.birthDate, 'birthDate');
      else st.delete('birthDate');
    });
  },
  async isSeeded() {
    return !!(await run<boolean>(META, 'readonly', (s) => s.get('seeded')));
  },
  async markSeeded() {
    await run(META, 'readwrite', (s) => {
      s.put(true, 'seeded');
    });
  },
  async listLetters() {
    return ((await run<LetterMeta[]>(LET, 'readonly', (s) => s.getAll())) ?? []) as LetterMeta[];
  },
  async addLetter(l) {
    const { text, blob, ...meta } = l;
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction([LET, LET_BODY], 'readwrite');
      t.objectStore(LET).put(meta);
      t.objectStore(LET_BODY).put({ id: l.id, text, blob });
      t.oncomplete = () => resolve();
      t.onerror = t.onabort = () => reject(t.error);
    });
  },
  async openLetter(id) {
    const meta = await run<LetterMeta>(LET, 'readonly', (s) => s.get(id));
    if (!meta || meta.openAt > todayStr()) return null;
    const body = await run<{ text?: string; blob?: Blob }>(LET_BODY, 'readonly', (s) => s.get(id));
    return { ...meta, text: body?.text, blob: body?.blob };
  },
  async removeLetter(id) {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction([LET, LET_BODY], 'readwrite');
      t.objectStore(LET).delete(id);
      t.objectStore(LET_BODY).delete(id);
      t.oncomplete = () => resolve();
      t.onerror = t.onabort = () => reject(t.error);
    });
  },
  async exportBackup() {
    const all = (await this.listMemories()).filter((m) => !m.demo);
    const { birthDate } = await this.getSettings();
    const memories = [];
    for (const m of all) {
      const { blob, ...rest } = m;
      memories.push({ ...rest, data: blob ? await blobToDataUrl(blob) : null });
    }
    const letters = [];
    for (const meta of await this.listLetters()) {
      const body = await run<{ text?: string; blob?: Blob }>(LET_BODY, 'readonly', (s) => s.get(meta.id));
      letters.push({ ...meta, text: body?.text, data: body?.blob ? await blobToDataUrl(body.blob) : null });
    }
    const json = JSON.stringify({ format: 'yaman-world-backup', version: 2, exportedAt: new Date().toISOString(), birthDate, memories, letters });
    return new Blob([json], { type: 'application/json' });
  },
  async importBackup(file) {
    const data = JSON.parse(await file.text());
    if (data?.format !== 'yaman-world-backup' || !Array.isArray(data.memories)) throw new Error('bad-format');
    const existing = new Set((await this.listMemories()).map((m) => m.id));
    const items: Memory[] = [];
    for (const raw of data.memories) {
      if (!raw?.id || existing.has(raw.id)) continue;
      const { data: url, ...rest } = raw;
      const blob = url ? await (await fetch(url)).blob() : undefined;
      items.push({ ...rest, blob });
    }
    await this.addMemories(items);
    const haveL = new Set((await this.listLetters()).map((l) => l.id));
    let restored = items.length;
    for (const raw of Array.isArray(data.letters) ? data.letters : []) {
      if (!raw?.id || haveL.has(raw.id)) continue;
      const { data: url, ...rest } = raw;
      await this.addLetter({ ...rest, blob: url ? await (await fetch(url)).blob() : undefined });
      restored++;
    }
    if (data.birthDate && !(await this.getSettings()).birthDate) await this.saveSettings({ birthDate: data.birthDate });
    return restored;
  },
};
