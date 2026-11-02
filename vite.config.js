import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inlineEdit from './vite-plugin-inline-edit.js';

const ISOLATED = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' };

/*
 * THE SOLVER'S SWITCH, TURNED ON FOR A HARNESS'S BUILD ONLY (research/solver/PHASE-8.md). Inert unless the build runs with
 * SOLVER_PREVIEW=1: then src/App.jsx's `const SOLVER = false;` reads true, and `const SOLVER_OPTS = null;` reads the JSON in
 * SOLVER_PREVIEW_OPTS (a harness's light settings). Either line moved stops the build, so a harness can never pass on a
 * build whose switch stayed off. The site's own build is untouched: the switch stays the one line Phase 12 turns on.
 */
const SWITCH = '\nconst SOLVER = false;\n', OPTS = '\nconst SOLVER_OPTS = null;\n';
const solverPreview = () => ({
  name: 'solver-preview',
  enforce: 'pre',
  transform(code, id) {
    if (process.env.SOLVER_PREVIEW !== '1' || !/[\\/]src[\\/]App\.jsx$/.test(id)) return null;
    if (!code.includes(SWITCH) || !code.includes(OPTS)) this.error('solver-preview: the switch lines in src/App.jsx have moved');
    const opts = process.env.SOLVER_PREVIEW_OPTS || 'null';
    JSON.parse(opts);
    return { code: code.replace(SWITCH, '\nconst SOLVER = true;\n').replace(OPTS, `\nconst SOLVER_OPTS = ${opts};\n`), map: null };
  }
});

export default defineConfig({
  /*
   * Asset URLs relative to the page, not absolute from the domain root.
   *
   * GitHub Pages serves a project site from a subpath - /monte-carlo-retirement-planner/ - so a build that asks
   * for /assets/index.js gets a 404 there while working perfectly on a root domain. './' resolves
   * against wherever the page happens to sit, so one build works at a root, at a subpath, and from
   * `npx serve dist` locally. Safe here because there is no client-side routing: the tabs are state,
   * so no URL is ever deeper than the page itself.
   */
  base: './',
  // inlineEdit supplies the manifest of editable copy, and under `vite dev` an endpoint that writes
  // edits back to source. A production build gets the manifest only — there is no server to write with.
  plugins: [solverPreview(), react(), inlineEdit()],
  /*
   * The worker bundle needs the same plugins. src/simWorker.js imports the engine from App.jsx, which
   * reaches EditMode.jsx and its virtual:editable-copy module - so without this the worker build fails
   * to resolve an import the main build resolves fine.
   */
  worker: { format: 'es', plugins: () => [react(), inlineEdit()] },
  /*
   * Cross-origin isolation on the local servers, so the solver can split a solve across workers (src/solverPool.js needs
   * SharedArrayBuffer, which a page has only when isolated; research/solver/PHASE-7.md). Local only: the deployed site sends
   * no such headers until Phase 12 settles how (GitHub Pages cannot send them), and with the solver switched off nothing
   * in the app reads them. Every asset the app loads is its own, so `require-corp` blocks nothing.
   */
  server: { headers: ISOLATED },
  preview: { headers: ISOLATED },
});
