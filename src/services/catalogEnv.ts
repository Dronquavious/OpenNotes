import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { writeStringAtomic } from './atomicFile';
import { createCatalogStore, type CatalogEnv, type CatalogStore } from './catalogStore';
import { bodyModifiedAt, listBodyIds, readBody } from './noteBodyStorage';
import { pdfUriForNote } from './pdfStorage';

const CATALOG_FILENAME = 'notes-catalog.json';

function catalogPath(): string {
  return `${FileSystem.documentDirectory ?? ''}${CATALOG_FILENAME}`;
}

const env: CatalogEnv = {
  kv: AsyncStorage,

  async readCatalogFile(): Promise<string | null> {
    const path = catalogPath();
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return FileSystem.readAsStringAsync(path);
  },

  writeCatalogFile(json: string): Promise<boolean> {
    return writeStringAtomic(catalogPath(), json);
  },

  async preserveCorruptCatalogFile(): Promise<void> {
    const path = catalogPath();
    const preserved = `${path}.corrupt`;
    await FileSystem.deleteAsync(preserved, { idempotent: true });
    await FileSystem.moveAsync({ from: path, to: preserved });
  },

  listBodyIds,

  bodyModifiedAt,

  async readBodyPreview(id: string): Promise<string | null> {
    const result = await readBody(id);
    if (result.kind !== 'ok') return null;
    return result.data.pages[0]?.previewUri ?? null;
  },

  async pdfExistsForNote(id: string): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(pdfUriForNote(id));
    return info.exists;
  },

  pdfUriForNote,

  now(): string {
    return new Date().toISOString();
  },

  warn(message: string, error?: unknown): void {
    if (__DEV__) console.warn(message, error ?? '');
  },
};

export const catalogStore: CatalogStore = createCatalogStore(env);
