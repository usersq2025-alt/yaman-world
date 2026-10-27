import type { Memory } from '../types';

export function sortMemories(list: Memory[]): Memory[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}
