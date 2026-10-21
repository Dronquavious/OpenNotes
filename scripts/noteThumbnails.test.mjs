import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(
  readFileSync(new URL('../src/services/notesRepo.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const ink = 'data:image/png;base64,aW5r';
const composite = 'data:image/png;base64,cGhvdG8=';
const photo = { id: 'photo', type: 'image', sourceUri: 'file:///photo.jpg', x: 20, y: 30, width: 100, height: 80 };
const body = () => ({ version: '1.0', pages: [{ id: 'page-1', data: '{"pages":{}}', previewUri: ink, insertedElements: [photo] }] });

function harness({ writeOk = true, renderFails = false } = {}) {
  let catalog = { notes: [{ id: 'note', createdAt: '2026-01-01', updatedAt: '2026-01-02', thumbnailUri: ink, backgroundType: 'plain' }] };
  let stored = body();
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === './catalogEnv') return { catalogStore: {
        getCatalog: async () => structuredClone(catalog),
        mutate: async fn => { catalog = fn(catalog) ?? catalog; return catalog; },
      } };
      if (name === './noteBodyStorage') return {
        writeBody: async (_id, data) => { if (writeOk) stored = structuredClone(data); return writeOk; },
        readBody: async () => ({ kind: 'ok', data: structuredClone(stored) }),
      };
      if (name === './thumbnailService') return {
        THUMBNAIL_VERSION: 1,
        createPageThumbnail: async () => {
          if (renderFails) throw new Error('Image decoder unavailable');
          return composite;
        },
      };
      if (name === '../i18n') return { t: { common: { untitled: 'Untitled' } } };
      if (name === '../utils/id') return {};
      if (name === './catalogStore') return {};
      if (name === './pdfStorage' || name === './imageInsertStorage') return {};
      throw new Error('Unexpected import: ' + name);
    },
  });
  return { ...exports, note: () => catalog.notes[0], stored: () => stored };
}

test('saving uses a composed cover without flattening overlays into the note body', async () => {
  const h = harness();
  const original = body();
  const result = await h.saveNoteBody('note', original);
  assert.equal(result.ok, true);
  assert.equal(h.note().thumbnailUri, composite);
  assert.equal(h.note().thumbnailVersion, 1);
  assert.deepEqual(h.stored(), original);
  assert.equal(h.stored().pages[0].previewUri, ink);
});

test('failed body writes leave the previous cover and metadata untouched', async () => {
  const h = harness({ writeOk: false });
  const before = structuredClone(h.note());
  assert.equal((await h.saveNoteBody('note', body())).ok, false);
  assert.deepEqual(h.note(), before);
});

test('thumbnail failure cannot fail a note save or discard its images', async () => {
  const h = harness({ renderFails: true });
  assert.equal((await h.saveNoteBody('note', body())).ok, true);
  assert.equal(h.stored().pages[0].insertedElements[0].sourceUri, photo.sourceUri);
  assert.equal(h.note().thumbnailUri, ink);
  assert.notEqual(h.note().thumbnailVersion, 1);
});

test('legacy thumbnail repair leaves the note body and modification date untouched', async () => {
  const h = harness();
  const before = structuredClone(h.stored());
  assert.equal(await h.getNoteThumbnail(h.note()), composite);
  assert.equal(h.note().updatedAt, '2026-01-02');
  assert.equal(h.note().thumbnailVersion, 1);
  assert.deepEqual(h.stored(), before);
});

test('failed legacy thumbnail repair keeps the existing cover eligible for retry', async () => {
  const h = harness({ renderFails: true });
  assert.equal(await h.getNoteThumbnail(h.note()), ink);
  assert.notEqual(h.note().thumbnailVersion, 1);
});
