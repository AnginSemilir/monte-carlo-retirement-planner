/*
 * V1 AND V2 ON THE ASSEMBLED CANDIDATE (the external review of 21 Oct, Part B Step 4.2: "Run V1 and V2 (Step 5) on it").
 * Per household, one solve as 7u-F's CAND arm solves it (audit-7uf.mjs: 7u's plan preparation, 30 points, 7u's lambda,
 * estate weight 0.02, solveCandidate), then
 *   V1 (solver-invariants.test.mjs's census, over every world and tier-state layer): every cell finite, survival and
 *      resilience in [0, 1], a move chosen in every cell; REPORTED, not failing: the share of neighbouring wealth nodes where
 *      survival falls as wealth rises by more than a millionth;
 *   V2 (engine-fidelity.test.mjs's check): the solved table executed by the engine (withTable on the model's own plan,
 *      runTrial) and by runPolicy on 2,000 common paths of seed 99001 (the review's, outside the held-out set): the paths
 *      that survive in one and fail in the other. The households with large taxable accounts (S330, S224, S070) must show no
 *      more than the households with small ones (S008, S194) plus one, as V2's own bar; S370 and S380 (bridge households
 *      under the adaptive reference) are held to the same bar.
 *   node research/solver/v-candidate.mjs <id>          one household's lines
 *   node research/solver/v-candidate.mjs --read <dir>  the verdict over the households' outputs (<dir>/<id>.txt)
 * Exploratory (no seed of the registry): a check of the candidate's code before 7u-F registers, not a test of a default;
 * run again on the candidate as D29 left it (the third tier step and HR whole; results-v-candidate-d29.txt), the read
 * naming the candidate each household's solve ran.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const CONTROLS = ['S008', 'S194'], LARGE = ['S330', 'S224', 'S070'], BRIDGE = ['S370', 'S380'], HOUSEHOLDS = [...CONTROLS, ...LARGE, ...BRIDGE];
const NPATHS = 2000, SEED = 99001;

if (process.argv[2] === '--read') {
  const dir = process.argv[3], rows = {};
  for (const id of HOUSEHOLDS) {
    const f = join(dir, `${id}.txt`);
    if (!existsSync(f)) { console.log(`${id}: no output (${f})`); process.exitCode = 1; continue; }
    const t = readFileSync(f, 'utf8'), v1 = /^V1 (\S+) (PASS|FAIL)/m.exec(t), v2 = /^V2 \S+ model-only (\d+) engine-only (\d+)/m.exec(t);
    if (!v1 || !v2) { console.log(`${id}: an incomplete output (${f})`); process.exitCode = 1; continue; }
    rows[id] = { v1: v1[2], mo: +v2[1], eo: +v2[2], d: +v2[1] + +v2[2], text: t.split('\n').filter(l => /^(V1|V2|REPORTED|solve)/.test(l)) };
  }
  if (process.exitCode) process.exit(1);
  const bar = Math.max(...CONTROLS.map(id => rows[id].d)) + 1;
  for (const id of HOUSEHOLDS) rows[id].text.forEach(l => console.log(`${id.padEnd(5)} ${l}`));
  const v1ok = HOUSEHOLDS.every(id => rows[id].v1 === 'PASS'), v2ok = [...LARGE, ...BRIDGE].every(id => rows[id].d <= bar);
  const cands = [...new Set(HOUSEHOLDS.flatMap(id => rows[id].text.map(l => (/the candidate (\w+)/.exec(l) || [])[1]).filter(Boolean)))], on = cands.length === 1 && cands[0] !== 'e65e5e99ba49' ? `the candidate ${cands[0]}` : 'the assembled candidate';
  if (cands.length > 1) { console.log(`NOT ONE CANDIDATE: the households solved ${cands.join(', ')}`); process.exit(1); }
  console.log(`V1 on ${on}: ${v1ok ? 'ALL PASS' : 'FAILED'} (${HOUSEHOLDS.filter(id => rows[id].v1 === 'PASS').length} of ${HOUSEHOLDS.length} households)`);
  console.log(`V2 on ${on}: the controls' bar ${bar}; ${[...LARGE, ...BRIDGE].map(id => `${id} ${rows[id].mo} / ${rows[id].eo}`).join(', ')}: ${v2ok ? 'ALL PASS' : 'FAILED'}`);
  process.exit(v1ok && v2ok ? 0 : 1);
}

const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), { runPolicy } = await import('../../src/solver/solve.js');
const { withTable } = await import('../../src/solver/bridge.js'), { solveCandidate, CANDIDATE_HASH } = await import('./candidate.mjs');
const { buildScenarios } = await import('../policy-study/scenarios.mjs'), { LAMBDA, PTS } = await import('./panel-7uf.mjs');
const id = process.argv[2], h = buildScenarios().find(s => s.id === id);
if (!h) { console.error(`v-candidate: no household ${id}`); process.exit(2); }
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now(), r = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: 0.02 });
console.log(`solve ${id}: the candidate ${CANDIDATE_HASH}, ${PTS} points, readerRef ${r.meta.readerRef} readerSplit ${r.meta.readerSplit}, ${r.mix.tables.length} worlds, ${Math.round((Date.now() - t0) / 1000)} s`);
// V1
{
  const T = r.m.ctx.totalYears, A = r.actions.length, bad = { nonFinite: 0, survOut: 0, resilOut: 0, unchosen: 0, cells: 0 };
  let first = '', falls = 0, pairs = 0;
  const g = r.g, ax = g.axes.W ? [g.axes.W, g.axes.a, g.axes.b] : [g.axes.pen, g.axes.isa, g.axes.tax], [n1, n2, n3] = ax.map(x => x.pts.length), ng = g.gain.length, nc = g.pcls.length;
  r.mix.tables.forEach((tab, k) => (tab.tsLayers || [tab]).forEach((L, li) => {
    for (let t = 0; t <= T; t++) for (let i = 0; i < L.surv[t].length; i++) {
      bad.cells++;
      const sv = L.surv[t][i], b = L.beq[t][i], rs = L.resil[t][i], hh = L.short[t][i], p = L.pol ? L.pol[t][i] : null;
      const nf = ![sv, b, rs, hh].every(Number.isFinite), so = !(sv >= 0 && sv <= 1), ro = !(rs >= 0 && rs <= 1), un = !(sv >= 0) || (p !== null && !(p >= 0 && p < A));
      if (nf) bad.nonFinite++; if (so) bad.survOut++; if (ro) bad.resilOut++; if (un) bad.unchosen++;
      if ((nf || so || ro || un) && !first) first = `world ${k}, layer ${li}, year ${t}, cell ${i}: survival ${sv}, estate ${b}, resilience ${rs}, move ${p}`;
    }
    for (let t = 0; t <= T; t++) for (let i2 = 0; i2 < n2; i2++) for (let i3 = 0; i3 < n3; i3++) for (let ig = 0; ig < ng; ig++) for (let ic = 0; ic < nc; ic++) for (let i1 = 1; i1 < n1; i1++) { pairs++; if (L.surv[t][g.index(i1, i2, i3, ig, ic)] < L.surv[t][g.index(i1 - 1, i2, i3, ig, ic)] - 1e-6) falls++; }
  }));
  const pass = bad.nonFinite === 0 && bad.survOut === 0 && bad.resilOut === 0 && bad.unchosen === 0;
  console.log(`V1 ${id} ${pass ? 'PASS' : 'FAIL'}: ${bad.cells} cells over ${r.mix.tables.length} worlds and their layers: non-finite ${bad.nonFinite}, survival outside [0, 1] ${bad.survOut}, resilience outside [0, 1] ${bad.resilOut}, no move chosen ${bad.unchosen}${first ? ` (first: ${first})` : ''}`);
  console.log(`REPORTED ${id}: survival falls as wealth rises (beyond a millionth) at ${falls} of ${pairs} neighbouring wealth nodes (${(100 * falls / pairs).toFixed(3)}%)`);
}
// V2
{
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), paths = E.pathsForSeed(SEED, NPATHS, r.m.ctx.totalYears);
  let mo = 0, eo = 0, ms = 0, es = 0;
  for (const zs of paths) { const a = runPolicy(r, Float64Array.from(zs)).survived, b = E.runTrial(ctx, Float64Array.from(zs)).survived; if (a) ms++; if (b) es++; if (a && !b) mo++; if (b && !a) eo++; }
  console.log(`V2 ${id} model-only ${mo} engine-only ${eo} of ${NPATHS} (runPolicy ${(100 * ms / NPATHS).toFixed(2)}%, the engine ${(100 * es / NPATHS).toFixed(2)}%; seed ${SEED})`);
}
