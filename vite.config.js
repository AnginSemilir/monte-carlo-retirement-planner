import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inlineEdit from './vite-plugin-inline-edit.js';
import solverCode from './vite-plugin-solver-code.js';

const ISOLATED = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' };

/*
 * THE SOLVER'S SWITCH, TURNED ON FOR A HARNESS'S BUILD ONLY (research/solver/PHASE-8.md). Inert unless the build runs with
 * SOLVER_PREVIEW=1: then src/App.jsx's `const SOLVER = false;` reads true, `const SOLVER_OPTS = null;` reads the JSON in
 * SOLVER_PREVIEW_OPTS (a harness's light settings) and `const PLANNER_BETA = false;` reads true (step U). Any of the lines
 * moved stops the build, so a harness can never pass on a build whose switch stayed off. The site's own build is untouched: the switch stays the one line Phase 12 turns on.
 */
const SWITCH = '\nconst SOLVER = false;\n', OPTS = '\nconst SOLVER_OPTS = null;\n';
// A Vercel preview deployment (VERCEL_ENV 'preview': a pull request's or a branch's preview link; never the site, which GitHub
// Pages serves, nor Vercel's production deployment) builds with the switch and the beta on at the app's own settings, so a
// preview link shows the new planner to whoever opts in with "Try the new planner (beta)" (step U's report to the maintainer).
// Every other build, the harnesses' and the site's, reads SOLVER_PREVIEW as it is set.
if (process.env.VERCEL_ENV === 'preview' && process.env.SOLVER_PREVIEW === undefined) process.env.SOLVER_PREVIEW = '1';
// step U (research/reviews/2026-11-03/LAYOUT.md section 2.1): the preview build sets B6's beta switch true with SOLVER, so a
// harness that opts in (rp_planner 'new') reaches the new planner; a harness that does not sees the classic planner
const BETA = '\nconst PLANNER_BETA = false;\n';
const solverPreview = () => ({
  name: 'solver-preview',
  enforce: 'pre',
  transform(code, id) {
    if (process.env.SOLVER_PREVIEW !== '1') return null;
    if (!/[\\/]src[\\/]App\.jsx$/.test(id)) return null;
    if (!code.includes(SWITCH) || !code.includes(OPTS) || !code.includes(BETA)) this.error('solver-preview: the switch lines in src/App.jsx have moved');
    const opts = process.env.SOLVER_PREVIEW_OPTS || 'null';
    JSON.parse(opts);
    return { code: code.replace(SWITCH, '\nconst SOLVER = true;\n').replace(BETA, '\nconst PLANNER_BETA = true;\n').replace(OPTS, `\nconst SOLVER_OPTS = ${opts};\n`), map: null };
  }
});

// step U's planted faults (src/plannerPlant.js): a harness's preview only (SOLVER_PREVIEW), named in PLANNER_PLANT
// (comma-separated). In the page's bundle and the workers' alike: the outlook's arms are drawn in the solver's worker
// (src/solverStrategy.js outlookOf, the plant 'outlookswap'), which the page's plugins do not reach. With PLANNER_PLANT unset
// it leaves the module as it is, so every other build is the same byte for byte.
const plannerPlant = () => ({
  name: 'planner-plant',
  enforce: 'pre',
  transform(code, id) {
    if (process.env.SOLVER_PREVIEW !== '1' || !process.env.PLANNER_PLANT) return null;
    if (!/[\\/]src[\\/]plannerPlant\.js$/.test(id)) return null;
    const list = process.env.PLANNER_PLANT;
    if (!/^[a-z0-9,]*$/.test(list)) this.error('planner-plant: PLANNER_PLANT is a comma-separated list of plant names');
    if (!code.includes("const LIST = '';")) this.error('planner-plant: the plant line in src/plannerPlant.js has moved');
    return { code: code.replace("const LIST = '';", `const LIST = '${list}';`), map: null };
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
  plugins: [solverPreview(), plannerPlant(), react(), inlineEdit()],
  /*
   * The worker bundle needs the same plugins. src/simWorker.js imports the engine from App.jsx, which
   * reaches EditMode.jsx and its virtual:editable-copy module - so without this the worker build fails
   * to resolve an import the main build resolves fine.
   */
  /*
   * solverCode names the solver worker's code by its module graph, for the stored solves' key (vite-plugin-solver-code.js;
   * step P1 (g)); it acts in the solver worker's build only.
   */
  worker: { format: 'es', plugins: () => [plannerPlant(), react(), inlineEdit(), solverCode()] },
  /*
   * Cross-origin isolation on the local servers, so the solver can split a solve across workers (src/solverPool.js needs
   * SharedArrayBuffer, which a page has only when isolated; research/solver/PHASE-7.md). Local only: the deployed site sends
   * no such headers until Phase 12 settles how (GitHub Pages cannot send them), and with the solver switched off nothing
   * in the app reads them. Every asset the app loads is its own, so `require-corp` blocks nothing.
   */
  server: { headers: ISOLATED },
  preview: { headers: ISOLATED },
});
