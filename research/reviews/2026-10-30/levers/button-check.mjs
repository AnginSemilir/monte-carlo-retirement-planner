/*
 * IS THE APP ARM THE APP'S OWN "AUTO-PICK BEST POLICY"? (EXPLORATORY; LEVERS.md; the maintainer's question of 30 Oct 10:00.)
 * The app arm (select-phase4.mjs armA, without the tournament; Phase 4's arm A, and FIXAPP and APP here) runs the app's own
 * policy optimiser: the same 18 combinations (E.buildPolicyCandidates: five withdrawal policies, phased or the full lump sum,
 * the harvest on or off) and the same picker (E.explainPick, the default priorities). It scores each on 300 paths of one
 * search seed (7001), where the button (App.jsx handleFindBestPolicy) scores each on 4,000: two seeds of 2,000, averaged.
 * This runs the search at the button's budget, on the seeds the brief allows (7001 and 99001, 2,000 paths each, never the
 * scoring seed), in both rows: spending fixed (FIXAPP's plan, guardrails off) and flexible (APP's, Phase 4's arm A). Where
 * the pick differs from the arm's, the button's pick is scored on the units' paths (seed 7002) beside the arm's unit and
 * the solver's.
 * Checks: the arm's 300-path pick is the unit's (its label); the arm's pick replayed is its unit on every path (planted:
 * against the solver's unit it must differ).
 *   node button-check.mjs <unit dir> [id...]        (from the root of the code under test)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { runPath } = await imp('research/solver/audit-phase4.mjs');
const [dir, ...only] = process.argv.slice(2);
const IDS = only.length ? only : ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
const SEEDS = [7001, 99001], PER = 2000;
const P = Object.fromEntries(readPanel().map(x => [x.id, x]));
const fixedAppPlan = raw => E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 5, raiseCap: 1 } });
const ROWS = [['fixed', 'fixapp', 'fixhold', fixedAppPlan], ['flexible', 'app', 'flexhold', appPlan]];
const unit = (id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));
const bits = u => { const b = Buffer.from(u.main.survived, 'base64'); return new Uint8Array(b.buffer, b.byteOffset, b.byteLength); };
const diff = (x, y) => { let n = 0; for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) n++; return n; };
const pair = (x, y) => { const N = x.length; let s1 = 0, s2 = 0, saved = 0, lost = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) saved++; if (d < 0) lost++; } const m = s1 / N; return { d: 100 * m, se: 100 * Math.sqrt((s2 / N - m * m) / N), saved, lost }; };
const labelOf = c => `${c.decumulationPolicy}${c.harvestPersonalAllowance ? '' : ' (harvest off)'}${c.drawdownStrategy === 'Full 25% Lump Sum' ? ', lump sum' : ''}`;
const sg = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
const out = [`IS THE APP ARM THE APP'S OWN "AUTO-PICK BEST POLICY"? (EXPLORATORY): the app's policy search at the button's budget (18 combinations, 2 seeds x ${PER} paths: ${SEEDS.join(' and ')}, averaged; the default priorities) against the arm's (300 paths of 7001)`];
let failed = 0, changed = 0;
const pooled = { fixed: [], flexible: [] };
for (const id of IDS) {
  const h = P[id];
  for (const [row, armUnit, solverUnit, planOf] of ROWS) {
    const plan = planOf(h.plan), uA = unit(id, armUnit), uS = unit(id, solverUnit);
    const arm = armA(plan, { tournament: false });
    // the button: each combination scored on both seeds, averaged, then the same picker; a close call when the seeds disagree
    const cands = E.buildPolicyCandidates(plan).map(c => {
      const p = E.resolveMpaa(c.planState), ctx = E.buildContext(p);
      const bySeed = SEEDS.map(seed => { const st = E.monteCarlo(ctx, { trials: PER, seed }); st.postTaxInheritance = E.postTaxInheritanceFor(p, ctx); return st; });
      return { ...c, stats: E.averageStats(bySeed), bySeed };
    });
    const won = E.explainPick(cands, { priorities: E.DEFAULT_PRIORITIES }).winner;
    const perSeed = SEEDS.map((_, si) => E.explainPick(cands.map(c => ({ ...c, stats: c.bySeed[si] })), { priorities: E.DEFAULT_PRIORITIES }).winner.id);
    const close = new Set(perSeed).size > 1;
    const sameLabel = arm.label === uA.ran.label;
    // the arm's pick replayed on the units' paths, as the unit scored it
    const ctxArm = E.buildContext(E.resolveMpaa(arm.planState)), T = ctxArm.totalYears, N = uA.N, paths = E.pathsForSeed(uA.seed, N, T);
    const survOf = ctx => { const s = new Uint8Array(N); for (let k = 0; k < N; k++) s[k] = runPath(ctx, Float64Array.from(paths[k]), false).survived ? 1 : 0; return s; };
    const sArm = survOf(ctxArm), replay = diff(sArm, bits(uA)), plant = diff(sArm, bits(uS));
    if (!sameLabel || replay !== 0 || !(plant > 0)) failed++;
    const searchRate = c => c.stats.successRate;
    const armC = cands.find(c => labelOf(c) === arm.label);
    let line = `  ${id.padEnd(6)} ${row.padEnd(8)} the arm's pick "${arm.label}" (the unit's: ${sameLabel ? 'yes' : `NO, ${uA.ran.label}`}; replayed, paths differing from its unit ${replay}, planted ${plant}); at the button's budget "${labelOf(won)}"${close ? ' (a close call: the two seeds pick differently)' : ''}; survival on the button's search ${searchRate(won).toFixed(2)}% against the arm's pick ${armC ? searchRate(armC).toFixed(2) : '-'}%`;
    const differs = won.id !== (armC && armC.id), sWon = differs ? survOf(E.buildContext(E.resolveMpaa(won.planState))) : sArm;
    const a = pair(sWon, sArm), s = pair(bits(uS), sWon), s0 = pair(bits(uS), sArm);
    pooled[row].push({ a, s, s0 });
    if (differs) {
      changed++;
      line += `\n           DIFFERENT: on the units' paths the button's pick less the arm's ${sg(a.d)} (se ${a.se.toFixed(2)}; ${a.saved}/${a.lost}); the solver (${solverUnit.toUpperCase()}) less the button's pick ${sg(s.d)} (se ${s.se.toFixed(2)}), less the arm's ${sg(s0.d)}`;
    }
    out.push(line);
  }
}
out.push('');
out.push(`${changed} of ${IDS.length * ROWS.length} household-rows pick differently at the button's budget`);
// pooled, each household once: the means of the per-household paired changes, their se from the per-household se's
const pool = (xs, k) => { const d = xs.reduce((p, x) => p + x[k].d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x[k].se ** 2, 0)) / xs.length; return `${sg(d)} (se ${se.toFixed(2)}; ${sg(d - 1.96 * se)} to ${sg(d + 1.96 * se)})`; };
for (const [row, , solverUnit] of ROWS) out.push(`Pooled, spending ${row} (${pooled[row].length} households, each once): the button's pick less the arm's ${pool(pooled[row], 'a')}; the solver (${solverUnit.toUpperCase()}) less the arm's ${pool(pooled[row], 's0')}, less the button's pick ${pool(pooled[row], 's')}`);
out.push(failed ? `CHECKS FAILED on ${failed} household-rows` : 'ALL CHECKS PASS');
console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
