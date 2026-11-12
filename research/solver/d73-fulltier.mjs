/*
 * D73'S PORT, THE WORKING FOR THE FULL TIER'S PINNED FIGURES IT MOVES (the reviewer of 11 Nov, reviews/2026-11-11-default-d73.md,
 * finding 2: the full tier was red on the port and its moved figures listed nowhere; d73-digests.mjs is the same working for
 * the fast tier's three). Four full-tier tests pin a digest of a solve at the candidate's settings, each at 4 points on a
 * light reference lattice, so D73's third change (the reference's lattice) does not reach them and its two keys do:
 * `sweepCashIsaTo: 'isa'` (item 5) and `coarse` (item 10's solve on anchors and shortlists). Each pinned solve is made here
 * twice on the ported code, as its test makes it: with both keys out, which must give the figure pinned before the port
 * (nothing else in the port reaches it), and as the candidate now is, which gives the figure the test pins now.
 *   - couple-tables.test.mjs check 6: a single's tables, the engine's runs under them and its value reads (S116, S224), the
 *     app's solve (solveForApp);
 *   - windfall-split.test.mjs, save-split.test.mjs and lock-tiers.test.mjs check 1b: the tables and 40 forward runs of a
 *     Phase 4 panel household under APP's pick with the test's option unset (solveCandidate). lock-tiers pins each household
 *     twice, at the candidate's settings and on the layer loop (tsOnce: false): before D73 one figure (E5 is the loop, to
 *     the bit), now two, the loop being off the path `coarse` runs on and so solved on the whole menu (solve.js
 *     coarseWhereFits), the candidate's own solve on anchors.
 * One line a figure: the test and check, what is solved, the figure before, the figure with both keys out, the figure now.
 *   node research/solver/d73-fulltier.mjs > research/solver/results-d73-fulltier.txt
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as S from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp } from '../../src/solverApp.js';
import { APP_CANDIDATE } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveCandidate, CANDIDATE_HASH, BEFORE_D73_HASH } from './candidate.mjs';
import { readPanel, appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { solverPlanOf, LAMBDA } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';

const OUT = { sweepCashIsaTo: undefined, coarse: undefined };   // D73's two keys left out, as d73-digests.mjs leaves them
const sha = x => createHash('sha256').update(x).digest('hex');

// ---- couple-tables.test.mjs check 6: the app's solve of a library single, its runs under the engine and its value reads ----
const library = buildScenarios();
const single = async (id, extra) => {
  const plan = E.normalizePlan(library.find(s => s.id === id).plan);
  const r = solveForApp(E, M, plan, { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true }, ...extra } }), T = r.m.ctx.totalYears;
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), runs = [], reads = [];
  for (const zs of E.pathsForSeed(99004, 10, T)) {
    const st = E.freshState(ctx), out = [];
    for (let t = 0; t <= T; t++) {
      reads.push(r.value(vecOf(r.m, { pots: st.pots, basis: st.giaBasis, cgtCarry: st.cgtCarry, cumPcls: st.cumPcls, lumpTaken: st.lumpSumTaken, cashIsa: st.cashIsa, guard: null }), t));
      out.push(E.stepYear(ctx, st, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 }));
    }
    runs.push(out);
  }
  return { tables: await digestOf(tablesOf(r)), runs: sha(JSON.stringify(runs)), reads: sha(JSON.stringify(reads)) };
};

// ---- check 1b of windfall-split, save-split and lock-tiers: a Phase 4 panel household under APP's pick, the light settings ----
const panel = readPanel();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => { const h = structuredClone(panel.find(x => x.id === id)); const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy; return prep(solverPlanOf(h.plan, { decumulationPolicy: pk })); };
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const memo = new Map();
const panelDigest = (id, loop) => async extra => {
  const key = `${id}|${loop}|${'coarse' in extra}`;
  if (!memo.has(key)) {
    const r = solveCandidate(E, M, planOf(id), { ...light, ...(loop ? { tsOnce: false } : {}), ...extra });
    const runs = E.pathsForSeed(99001, 40, r.m.ctx.totalYears).map(zs => JSON.stringify(S.runPolicy(r, Float64Array.from(zs))));
    memo.set(key, { digest: createHash('sha256').update(await digestOf(tablesOf(r))).update(runs.join('\n')).digest('hex') });
  }
  return memo.get(key);
};

// each pinned figure: the test and check, what is solved, how, and the figure pinned before D73's port
const NODEP = panel.find(h => !(h.plan.oneOffContributions || []).some(x => x.date || x.year)).id;   // windfall-split's household with no deposit
const PINS = [
  ['couple-tables.test.mjs check 6', 'S116', s => single('S116', s), { tables: 'b954f145878ff4604101cff2c8513547430df0e9a0835547f3b5471982b65eb4', runs: '36c5ce5e9062fdee78212e51475a6c04d3bac29a73cc8b55ba789a20d1a5e83e', reads: 'a0d64da0839c6b4303ba7891607e0c5c7e0916a77d906f35b4dfab375177a7e1' }],
  ['couple-tables.test.mjs check 6', 'S224', s => single('S224', s), { tables: '4a38efe85909a4e3af5410d1795d1e47cc5c3a7970760a76fbc32ca65360ed08', runs: '099e73f40cfcd918c7eeaadca94382c2e5a4551ac5267e777b7d63da30dc467f', reads: '4d7ef15fabca2aaa35aca6c21fe61c031f189dc8b7ab6777a934efd787343410' }],
  ['windfall-split.test.mjs check 1b; save-split.test.mjs check 1b (its retired household)', 'S026, its tables and 40 forward runs', panelDigest('S026', false), { digest: 'dc4b42a7ce29f5fe5f8626135a429bc422f0d66435d7c451b8accd5c934e7fcd' }],
  ['windfall-split.test.mjs check 1b; lock-tiers.test.mjs check 1b (S090 e5)', "S090, its tables and 40 forward runs, the candidate's settings", panelDigest('S090', false), { digest: 'f1e1167100e2f43b8b80aeeb9bbab5e9fa92895936a3a53a09f27938361483fa' }],
  ['windfall-split.test.mjs check 1b (its household with no deposit)', `${NODEP}, its tables and 40 forward runs`, panelDigest(NODEP, false), { digest: '4adc22e273e981c7b38bc893ce22d1793b6d49c1c52a2b15c83834d91377af50' }],
  ['save-split.test.mjs check 1b', 'S188, its tables and 40 forward runs', panelDigest('S188', false), { digest: '847a1cbc6947bba10f8b17db2acae94497a7b25e5de571a74795d66955ab8d54' }],
  ['save-split.test.mjs check 1b', 'S244, its tables and 40 forward runs', panelDigest('S244', false), { digest: '2fcb676ee98a867e781c3d9ce91f9cb7a56655d61a495503d83e53e23157a56c' }],
  ['lock-tiers.test.mjs check 1b (S090 loop)', 'S090, its tables and 40 forward runs, the layer loop (tsOnce: false; the whole menu now)', panelDigest('S090', true), { digest: 'f1e1167100e2f43b8b80aeeb9bbab5e9fa92895936a3a53a09f27938361483fa' }],
  ['lock-tiers.test.mjs check 1b (S328F e5)', "S328F, its tables and 40 forward runs, the candidate's settings", panelDigest('S328F', false), { digest: '7f0bb15e4811424cb0ecaf50ae0d15479681265f25c217079dc34d95f163e8ad' }],
  ['lock-tiers.test.mjs check 1b (S328F loop)', 'S328F, its tables and 40 forward runs, the layer loop (tsOnce: false; the whole menu now)', panelDigest('S328F', true), { digest: '7f0bb15e4811424cb0ecaf50ae0d15479681265f25c217079dc34d95f163e8ad' }]
];

const id = codeId();
console.log(`D73's port: the full tier's pinned figures it moves, and the working (d73-fulltier.mjs; code ${id.hash})`);
console.log(`the candidate ${CANDIDATE_HASH} (before D73 ${BEFORE_D73_HASH}); its keys since D73: sweepCashIsaTo ${JSON.stringify(APP_CANDIDATE.sweepCashIsaTo)}, coarse ${JSON.stringify(APP_CANDIDATE.coarse)}`);
console.log('each solve at 4 points on its test\'s light reference lattice, as the test makes it; "both keys out": sweepCashIsaTo and coarse left out of the candidate\n');
let bad = 0, n = 0;
for (const [test, what, run, old] of PINS) {
  const out = await run(OUT), now = await run({});
  for (const k of Object.keys(old)) {
    n++;
    const same = out[k] === old[k], moved = now[k] !== old[k];
    if (!same || !moved) bad++;
    console.log(`${test} | ${what}${k === 'digest' ? '' : `, its ${k}`} | before ${old[k]} | both keys out ${out[k]} ${same ? '(= before)' : '(NOT the figure before)'} | now ${now[k]}${moved ? '' : ' (NOT MOVED)'}`);
  }
}
console.log('');
console.log(bad === 0 ? `VERDICT: with both keys out each of the ${n} figures is the figure pinned before, so the port moves them by the two keys alone; as the candidate now is, each gives the figure its test pins now.` : `VERDICT: ${bad} of ${n} figure(s) do not behave so: STOP, the port reaches those solves some other way.`);
process.exit(bad === 0 ? 0 : 1);
