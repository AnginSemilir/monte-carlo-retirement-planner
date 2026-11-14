import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inlineEdit from './vite-plugin-inline-edit.js';
import solverCode from './vite-plugin-solver-code.js';

const ISOLATED = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' };

/*
 * A HARNESS'S BUILD (research/solver/PHASE-12.md item 3). The solver's switch and B6's beta are on in src/App.jsx since Phase 12,
 * so the site's own build is the one the beta ships, and the preview plugin that turned them on for a preview retired with it
 * (the launch plan's F9: once the switch read true it would have stopped every build). What is left acts only in a harness's
 * build, with SOLVER_HARNESS=1:
 *   - SOLVER_HARNESS_OPTS (JSON): `const SOLVER_OPTS = null;` reads it, the harness's light settings, so its solves are quick;
 *     unset, the page solves at the app's own settings, as the site does;
 *   - PLANNER_BETA_OFF=1: `const PLANNER_BETA = true;` reads false, the rollback ("one deploy turns it off for everyone"), which
 *     solver-planner-ui check 16 builds to see it give everyone the classic planner;
 *   - COUPLES_OFF=1 (Part D, D6): src/couplesSwitch.js's `export const COUPLES = true;` reads false, the couples' rollback (one
 *     deploy turning couples off for everyone), which solver-planner-ui check 10 builds to see a couple's screens as before D5.
 * Either line moved stops the build, so a harness can never pass on a build that ignored what it asked for.
 */
const OPTS = '\nconst SOLVER_OPTS = null;\n', BETA = '\nconst PLANNER_BETA = true;\n', COUPLES = '\nexport const COUPLES = true;\n';
const solverHarness = () => ({
  name: 'solver-harness',
  enforce: 'pre',
  transform(code, id) {
    if (process.env.SOLVER_HARNESS !== '1') return null;
    // Part D, D6: COUPLES_OFF=1 turns the couples' screens off (src/couplesSwitch.js COUPLES), on in the source since D99
    if (/[\\/]src[\\/]couplesSwitch\.js$/.test(id)) {
      if (!code.includes(COUPLES)) this.error('solver-harness: the couples line in src/couplesSwitch.js has moved');
      return process.env.COUPLES_OFF === '1' ? { code: code.replace(COUPLES, '\nexport const COUPLES = false;\n'), map: null } : null;
    }
    if (!/[\\/]src[\\/]App\.jsx$/.test(id)) return null;
    if (!code.includes(OPTS) || !code.includes(BETA)) this.error('solver-harness: the settings or beta lines in src/App.jsx have moved');
    const opts = process.env.SOLVER_HARNESS_OPTS || 'null';
    JSON.parse(opts);
    let out = code.replace(OPTS, `\nconst SOLVER_OPTS = ${opts};\n`);
    if (process.env.PLANNER_BETA_OFF === '1') out = out.replace(BETA, '\nconst PLANNER_BETA = false;\n');
    return { code: out, map: null };
  }
});

/*
 * THE WORKERS READ THE SWITCH OFF (Phase 12). The engine's workers (src/simWorker.js, src/mcWorker.js) import src/App.jsx for
 * the engine, never for its screens. With the switch on in the source they would reach the solver's client and, through it,
 * the solver's worker, which imports the engine's: a circular worker import Vite refuses. Before Phase 12 every worker build
 * read `const SOLVER = false;` (the preview plugin acted in the page's build only), so App.jsx's solver branches folded away
 * in them; this keeps that, the workers' bundles as they were. The page's own build reads the switch as the source has it.
 */
const SWITCH_ON = '\nconst SOLVER = true;\n';
const workerSolverOff = () => ({
  name: 'worker-solver-off',
  enforce: 'pre',
  transform(code, id) {
    if (!/[\\/]src[\\/]App\.jsx$/.test(id)) return null;
    if (!code.includes(SWITCH_ON)) this.error('worker-solver-off: the switch line in src/App.jsx has moved');
    return { code: code.replace(SWITCH_ON, '\nconst SOLVER = false;\n'), map: null };
  }
});

// step U's planted faults (src/plannerPlant.js): a harness's build only (SOLVER_HARNESS), named in PLANNER_PLANT
// (comma-separated). In the page's bundle and the workers' alike: the outlook's arms are drawn in the solver's worker
// (src/solverStrategy.js outlookOf, the plant 'outlookswap'), which the page's plugins do not reach. With PLANNER_PLANT unset
// it leaves the module as it is, so every other build is the same byte for byte.
const plannerPlant = () => ({
  name: 'planner-plant',
  enforce: 'pre',
  transform(code, id) {
    if (process.env.SOLVER_HARNESS !== '1' || !process.env.PLANNER_PLANT) return null;
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
  plugins: [solverHarness(), plannerPlant(), react(), inlineEdit()],
  /*
   * The worker bundle needs the same plugins. src/simWorker.js imports the engine from App.jsx, which
   * reaches EditMode.jsx and its virtual:editable-copy module - so without this the worker build fails
   * to resolve an import the main build resolves fine.
   */
  /*
   * solverCode names the solver worker's code by its module graph, for the stored solves' key (vite-plugin-solver-code.js;
   * step P1 (g)); it acts in the solver worker's build only.
   */
  worker: { format: 'es', plugins: () => [workerSolverOff(), plannerPlant(), react(), inlineEdit(), solverCode()] },
  /*
   * Cross-origin isolation on the local servers, so the solver can split a solve across workers (src/solverPool.js needs
   * SharedArrayBuffer, which a page has only when isolated; research/solver/PHASE-7.md). Local only: GitHub Pages cannot send
   * them, so the deployed site gets them from a service worker once the new planner first solves (src/isolation.js, Phase 10,
   * B5). Every asset the app loads is its own, so `require-corp` blocks nothing.
   */
  server: { headers: ISOLATED },
  preview: { headers: ISOLATED },
});
