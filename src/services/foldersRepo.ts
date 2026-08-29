import type { FolderMetadata } from '../types/note';
import { folderId as makeFolderId } from '../utils/id';
import { catalogStore } from './catalogEnv';
import { deleteAllNotesInFolder, orphanNotesInFolder, listAllMetadata } from './notesRepo';

export async function listFolders(): Promise<FolderMetadata[]> {
  const catalog = await catalogStore.getCatalog();
  return catalog.folders;
}

export async function getFolder(id: string): Promise<FolderMetadata | null> {
  const catalog = await catalogStore.getCatalog();
  return catalog.folders.find((f) => f.id === id) ?? null;
}

export async function createFolder(name: string): Promise<FolderMetadata> {
  const now = new Date().toISOString();
  const meta: FolderMetadata = {
    id: makeFolderId(),
    name: name.trim() || 'New Folder',
    createdAt: now,
    updatedAt: now,
  };
  await catalogStore.mutate((catalog) => ({
    ...catalog,
    folders: [meta, ...catalog.folders.filter((f) => f.id !== meta.id)],
  }));
  return meta;
}

export async function renameFolder(id: string, name: string): Promise<FolderMetadata | null> {
  const next = await catalogStore.mutate((catalog) => {
    const current = catalog.folders.find((f) => f.id === id);
    if (!current) return null;
    const updated: FolderMetadata = {
      ...current,
      name: name.trim() || current.name,
      updatedAt: new Date().toISOString(),
    };
    return {
      ...catalog,
      folders: [updated, ...catalog.folders.filter((f) => f.id !== id)],
    };
  });
  // When the folder was missing the mutator returned null, the catalog is
  // unchanged, and this find comes back empty.
  return next.folders.find((f) => f.id === id) ?? null;
}

export type FolderDeleteMode = 'orphan-notes' | 'delete-notes';

export async function deleteFolder(id: string, mode: FolderDeleteMode): Promise<void> {
  if (mode === 'delete-notes') {
    await deleteAllNotesInFolder(id);
  } else {
    await orphanNotesInFolder(id);
  }
  await catalogStore.mutate((catalog) => ({
    ...catalog,
    folders: catalog.folders.filter((f) => f.id !== id),
  }));
}

export async function noteCountInFolder(id: string): Promise<number> {
  const all = await listAllMetadata();
  return all.filter((n) => n.folderId === id).length;
}
