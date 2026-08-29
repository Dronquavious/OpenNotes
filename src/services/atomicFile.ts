import * as FileSystem from 'expo-file-system/legacy';

/**
 * Writes a string to `path` atomically: write to a temp file, verify the
 * bytes landed, then rename over the destination. A crash at any point leaves
 * either the old file or the new file in place, never a truncated one.
 * Returns false (and cleans up the temp file) if verification fails.
 */
export async function writeStringAtomic(path: string, contents: string): Promise<boolean> {
  const tmp = `${path}.tmp`;
  await FileSystem.deleteAsync(tmp, { idempotent: true });
  await FileSystem.writeAsStringAsync(tmp, contents);

  const info = await FileSystem.getInfoAsync(tmp);
  if (!info.exists || typeof info.size !== 'number' || info.size < contents.length) {
    await FileSystem.deleteAsync(tmp, { idempotent: true });
    if (__DEV__) {
      console.warn(
        `[atomicFile] verify failed for ${path}: expected ${contents.length}, got ${info.exists ? info.size : 'missing'}`,
      );
    }
    return false;
  }

  await FileSystem.moveAsync({ from: tmp, to: path });
  return true;
}
