/*
 * D138, THE WORKING FOR THE FULL TIER'S PINNED FIGURES THE SAVINGS SPLIT MOVES (the reviewer on D138's change of default,
 * reviews/2026-11-21-default-save-split.md, finding 1: the full tier failed on the build in tests the change did not name;
 * d73-fulltier.mjs is the same working for D73's port). Two full-tier tests pin a digest of a solve at the candidate's
 * settings, each at 4 points on a light reference lattice, on households that work and save, which the split's two keys
 * (`saveSplit`, `saveIsaFirst`) now reach. Each pinned solve is made here twice on the build, as its test makes it: with both
 * keys out, which must give the figure pinned before (nothing else in the change reaches it), and as the candidate now is,
 * which gives the figure the test pins now. A figure of a household with no year to choose is the same both ways.
 *   - couple-tables.test.mjs check 6: a single's tables, the engine's runs under them and its value reads (S116, S224), the
 *     app's solve (solveForApp);
 *   - lock-tiers.test.mjs check 1b: the tables and 40 forward runs of a Phase 4 panel household under APP's pick, both
 *     options off (solveCandidate), at the candidate's settings (E5, on anchors) and on the layer loop (tsOnce: false, the
 *     whole menu): S090 and S328F;
 *   - couple-solve-client.test.mjs check 6: the digest of the library's 210 singles' stored-solve keys (src/solverKey.js),
 *     which name the app's candidate whole, so every one moves with it; "both keys out" is the key plant 'nod138', which
 *     names the candidate without the split's two keys (as 'nod73' did for D73's).
 * One line a figure: the test and check, what is solved, the figure before, the figure with both keys out, the figure now.
 *   node research/solver/d138-fulltier.mjs > research/solver/results-d138-fulltier.txt
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as S from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveForApp } from '../../src/solverApp.js';
import { solveKey, PLANT as KEY_PLANT } from '../../src/solverKey.js';
import { APP_CANDIDATE } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { solveCandidate, CANDIDATE_HASH, BEFORE_D138_HASH } from './candidate.mjs';
import { readPanel, appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { solverPlanOf, LAMBDA } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';

const OUT = { saveSplit: undefined, saveIsaFirst: undefined };   // the split's two keys left out, as the re-based tests leave them
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
  return { tables: await digestOf(tablesOf(r)), runs: sha(JSON.stringify(runs)), reads: sha(JSON.stringify(reads)), moves: r.actions.length };
};

// ---- lock-tiers.test.mjs check 1b: a Phase 4 panel household under APP's pick, the light settings, both options off ----
const panel = readPanel();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => { const h = structuredClone(panel.find(x => x.id === id)); const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy; return prep(solverPlanOf(h.plan, { decumulationPolicy: pk })); };
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const panelDigest = (id, loop) => async extra => {
  const r = solveCandidate(E, M, planOf(id), { ...light, ...(loop ? { tsOnce: false } : {}), ...extra });
  const runs = E.pathsForSeed(99001, 40, r.m.ctx.totalYears).map(zs => JSON.stringify(S.runPolicy(r, Float64Array.from(zs))));
  return { digest: createHash('sha256').update(await digestOf(tablesOf(r))).update(runs.join('\n')).digest('hex'), moves: r.actions.length };
};

// ---- couple-solve-client.test.mjs check 6: the library's singles' keys, their digest as the test takes it ----
const keysDigest = async extra => {
  const was = KEY_PLANT.rule;
  KEY_PLANT.rule = extra === OUT ? 'nod138' : was;
  try {
    const h = createHash('sha256');
    for (const s of library.filter(x => x.plan.demographics.planningMode === 'single')) h.update(`${s.id}:${await solveKey(E, s.plan, {})};`);
    return { digest: h.digest('hex').slice(0, 16) };
  } finally { KEY_PLANT.rule = was; }
};

// each pinned figure: the test and check, what is solved, how, and the figure pinned before D138
const PINS = [
  ['couple-tables.test.mjs check 6', 'S116', s => single('S116', s), { tables: 'e6548bee07f4aec4cf18b15a0ce567368789fe361307e68fc152ec6aab0ffed3', runs: 'ef9cde5176d306d5e5155d17d1be705cbc3216226c02d5719eb981d74c08782b', reads: '6bfd6886300f5024cd6ad84d963a79a4577c1ad0ccb10507bb45a6780e6b9fc4' }],
  ['couple-tables.test.mjs check 6', 'S224', s => single('S224', s), { tables: '401e8096847fdb5dad24c210243bd0f5dbc7273fceb9bc67a75f1895c4097be6', runs: '3c707d8249ba094d485daa7a66c854c62f52e84af6d396b13446d99177abc1dc', reads: '1f82d4ce3e21994044775a93665f786c7e50d92f494ddaceff21aeb915ba10b2' }],
  ['lock-tiers.test.mjs check 1b (S090 e5)', "S090, its tables and 40 forward runs, the candidate's settings", panelDigest('S090', false), { digest: 'bf4b261da569350ec97b2b7625ca3463ac57863948a64daa98d1c3a7a80997ac' }],
  ['lock-tiers.test.mjs check 1b (S090 loop)', 'S090, its tables and 40 forward runs, the layer loop (tsOnce: false)', panelDigest('S090', true), { digest: 'e82ad3e7329ba50b78e0a7d9445e5a7203885c163558f4f03d825a662abab144' }],
  ['lock-tiers.test.mjs check 1b (S328F e5)', "S328F, its tables and 40 forward runs, the candidate's settings", panelDigest('S328F', false), { digest: '79d3eb8d19e0c7b56221b837ab05d4a1278cd3241c6ec826bdd1ee58d3f4c2eb' }],
  ['lock-tiers.test.mjs check 1b (S328F loop)', 'S328F, its tables and 40 forward runs, the layer loop (tsOnce: false)', panelDigest('S328F', true), { digest: '9a7e04cf0a63e5991b5b6319aa1b45c8bb6563b485de99d0f8baf4fc146e57fa' }],
  ['couple-solve-client.test.mjs check 6', "the library's 210 singles' stored-solve keys, their digest", keysDigest, { digest: '6825f36b3e1a20ff' }]
];

const id = codeId();
console.log(`D138: the full tier's pinned figures the savings split moves, and the working (d138-fulltier.mjs; code ${id.hash})`);
console.log(`the candidate ${CANDIDATE_HASH} (before D138 ${BEFORE_D138_HASH}); its keys since D138: saveSplit ${JSON.stringify(APP_CANDIDATE.saveSplit)}, saveIsaFirst ${JSON.stringify(APP_CANDIDATE.saveIsaFirst)}`);
console.log('each solve at 4 points on its test\'s light reference lattice, as the test makes it; "both keys out": saveSplit and saveIsaFirst left out of the candidate\n');
let bad = 0, n = 0;
const moved = [];
for (const [test, what, run, old] of PINS) {
  const out = await run(OUT), now = await run({});
  for (const k of Object.keys(old)) {
    n++;
    const same = out[k] === old[k], mv = now[k] !== old[k];
    if (!same) bad++;
    if (mv) moved.push(`${test}: ${what}${k === 'digest' ? '' : `, its ${k}`}`);
    console.log(`${test} | ${what}${k === 'digest' ? '' : `, its ${k}`} | before ${old[k]} | both keys out ${out[k]} ${same ? '(= before)' : '(NOT the figure before)'} | now ${now[k]}${mv ? ' (moved)' : ' (the same)'}`);
  }
  if (Number.isFinite(out.moves)) console.log(`  the menu: ${out.moves} moves with both keys out, ${now.moves} now`);
}
console.log('');
console.log(bad === 0
  ? `VERDICT: with both keys out each of the ${n} figures is the figure pinned before, so the change moves them by the split's two keys alone; as the candidate now is, ${moved.length} move (${moved.join('; ')}) and the rest are the same.`
  : `VERDICT: ${bad} of ${n} figures with both keys out are NOT the figures pinned before: something besides the split's two keys moves them.`);
process.exit(bad === 0 ? 0 : 1);
