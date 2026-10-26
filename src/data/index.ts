import { idbRepo } from './idb';
import type { MemoryRepo } from '../types';

/** Swap this export for an API-backed repo when the cloud version exists. */
export const repo: MemoryRepo = idbRepo;
