/*
 * In-app editing support, split into two independent halves.
 *
 * 1. A virtual module (`virtual:editable-copy`) listing every piece of displayed copy in the UI source,
 *    with how many places each is shown from. The editor uses it to decide what to offer for editing: a
 *    string that is not in the manifest is dynamic (a computed figure, a date) and would have nothing to
 *    write back to. It is generated at dev-server start and at build time, so a deployed copy carries it.
 *
 * 2. A dev-only endpoint that applies a patch straight to the source files. It exists only under
 *    `vite dev` — a built site has no server to write with, and the editor falls back to exporting the
 *    patch as a file instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractProse } from './scripts/extract-copy.mjs';

const VIRTUAL_ID = 'virtual:editable-copy';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/*
 * The manifest is keyed on what the browser shows, and its count is how many places in the source that
 * text is *displayed* — not how many times the characters appear. "Myself" is written seventeen times in
 * the source but shown in four places, and only those four are an edit's business. The applier uses the
 * same extractor, so the count the editor shows is exactly the number of places a save will change.
 */
// every file that carries copy the editor should reach; the Documentation tab lives in its own chunk
export const COPY_FILES = ['src/App.jsx', 'src/Docs.jsx'];

function buildManifest(root) {
  let source = '';
  for (const rel of COPY_FILES) { try { source += fs.readFileSync(path.join(root, ...rel.split('/')), 'utf8') + '\n'; } catch { /* a file that is not there carries no copy */ } }
  if (!source) return { strings: {}, generatedAt: null };
  const strings = {};
  /*
   * Two lists, because there are two kinds of copy and only one of them can be clicked.
   *
   * `strings` is text the DOM shows verbatim, so a text node can be matched to it and edited in place.
   * `codeDriven` is text written with ${…} holes in the source: on screen it appears with the holes
   * filled, so it never matches its own source form and click-to-edit is impossible for it. It is listed
   * separately in the panel instead, and exported flagged, so a person can make the change with the
   * interpolations visible rather than a script guessing where they went.
   */
  const codeDriven = {};
  for (const r of extractProse(source)) {
    const bucket = r.codeDriven ? codeDriven : strings;
    bucket[r.shown] = (bucket[r.shown] || 0) + 1;
  }
  return { strings, codeDriven, generatedAt: new Date().toISOString() };
}

export default function inlineEdit() {
  let root = process.cwd();
  let isDev = false;
  return {
    name: 'inline-edit',
    configResolved(config) { root = config.root; isDev = config.command === 'serve'; },
    resolveId(id) { return id === VIRTUAL_ID ? RESOLVED_ID : null; },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const manifest = buildManifest(root);
      // `canSaveToSource` tells the editor which save path to offer without it having to probe the server
      return `export const EDITABLE = ${JSON.stringify(manifest.strings)};
export const CODE_DRIVEN = ${JSON.stringify(manifest.codeDriven)};
export const GENERATED_AT = ${JSON.stringify(manifest.generatedAt)};
export const CAN_SAVE_TO_SOURCE = ${JSON.stringify(isDev)};
`;
    },
    // Rebuild the manifest when the source changes, so newly added copy becomes editable without a restart.
    // Vite reloads the page itself afterwards, which is what picks the edit up.
    handleHotUpdate({ file, server }) {
      if (!COPY_FILES.some(rel => file.endsWith(path.join(...rel.split('/'))))) return;
      const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (mod) server.moduleGraph.invalidateModule(mod);
    },
    configureServer(server) {
      server.middlewares.use('/__inline-edit/apply', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > 4e6) req.destroy(); });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const patch = JSON.parse(body);
            const { applyPatch } = await import('./scripts/apply-edits.mjs');
            const result = applyPatch(patch, { root, write: true });
            res.end(JSON.stringify(result));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
          }
        });
      });
    }
  };
}
