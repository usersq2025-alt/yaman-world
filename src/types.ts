export type Kind = 'image' | 'video' | 'audio';

export interface Memory {
  id: string;
  kind: Kind;
  /** YYYY-MM-DD, local calendar day of the memory */
  date: string;
  text: string;
  createdAt: number;
  /** placeholder memory shown before real content exists */
  demo?: boolean;
  blob?: Blob;
  mime?: string;
  /** inline illustration for demo memories */
  svg?: string;
}

export interface LetterMeta {
  id: string;
  kind: 'text' | 'audio';
  /** first day the letter may be opened (YYYY-MM-DD) */
  openAt: string;
  occasion: string;
  createdAt: number;
}

export interface Letter extends LetterMeta {
  text?: string;
  blob?: Blob;
}

export interface Settings {
  birthDate: string | null;
}

/**
 * Storage boundary. The prototype implements it on IndexedDB (this device only).
 * A production build would implement the same interface against an authenticated
 * API + object storage, where access rules are enforced on the server.
 */
export interface MemoryRepo {
  listMemories(): Promise<Memory[]>;
  addMemories(items: Memory[]): Promise<void>;
  removeMemory(id: string): Promise<void>;
  removeDemos(): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  isSeeded(): Promise<boolean>;
  markSeeded(): Promise<void>;
  /** Metadata only: bodies of letters are never part of a listing. */
  listLetters(): Promise<LetterMeta[]>;
  addLetter(letter: Letter): Promise<void>;
  /** Returns the body only once `openAt` has arrived; otherwise null. In production this check belongs on the server. */
  openLetter(id: string): Promise<Letter | null>;
  removeLetter(id: string): Promise<void>;
  exportBackup(): Promise<Blob>;
  importBackup(file: File): Promise<number>;
}

