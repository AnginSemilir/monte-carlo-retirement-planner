/*
 * V3: THE CONVERGENCE TABLE, SETTINGS IN EVERY DIRECTION (the external review of 21 Oct, Part B Step 5; run after 7u-F reads;
 * exploratory, the tuning seed). The assembled candidate (candidate.json) on six households spanning the problem, chosen by
 * rule from 7u's SHIP records at estate weight 0.02 (results/diag7u, seed 7013, already read): the two bridge households
 * 7u left unsettled (S224, S380); two mid-survival, the household nearest 50% (S248) and the one with no bridge years
 * nearest 75% (S104); the thin one, the only household between 5% and 50% (S360); a comfortable one with no bridge years,
 * S008 (93%). Never the maintainer's own (the library's households only).
 * Each household solved at the shipped settings (SHIP_SETTINGS: 30 wealth points, 6 share points, 5 quadrature nodes, 3
 * worlds, the allowance axis interpolated and the gain axis snapped, as the candidate runs) and with one setting moved:
 * 20, 45, 60 and 90 wealth points; 10 share points; 9 quadrature nodes; the gain axis interpolated; the allowance axis
 * snapped; 5 worlds. For each: each world's opening table value; the policy's survival and whole score on 8,000 paths of
 * the tuning seed 7002 (runPolicy, its trace; V2 holds runPolicy to the engine), saved per path to pair against the
 * finest setting; the cells with no move chosen and the non-finite cells (V1's census: both must be 0).
 *   node research/solver/v3-convergence.mjs <household> <setting>     one unit, to results/v3 (V3_OUT)
 *   node research/solver/v3-convergence.mjs --units                   the units, one a line
 *   node research/solver/v3-convergence.mjs --read [dir]              the table, and the acceptance (below)
 * The acceptance (Step 5's): the shipped setting stands in a direction where the next finer one moves the policy by under
 * 0.2 points on the panel mean and 0.5 on every household, in survival and in the whole score.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const HOUSEHOLDS = ['S224', 'S380', 'S248', 'S104', 'S360', 'S008'];
export const SHIP_SETTINGS = { points: 30, shares: 6, quadNodes: 5, mix: 3, gainInterp: false, pclsInterp: true };
// each direction: its settings, and the shipped setting's next finer one in it (the acceptance's pair)
export const SETTINGS = { ship: {}, p20: { points: 20 }, p45: { points: 45 }, p60: { points: 60 }, p90: { points: 90 }, s10: { shares: 10 }, q9: { quadNodes: 9 }, gainI: { gainInterp: true }, pclsS: { pclsInterp: false }, w5: { mix: 5 } };
export const NEXT_FINER = { 'wealth points': ['ship', 'p45'], 'share points': ['ship', 's10'], 'quadrature nodes': ['ship', 'q9'], 'the gain axis': ['ship', 'gainI'], 'the allowance axis (snapped against the candidate\'s interpolated)': ['pclsS', 'ship'], 'worlds': ['ship', 'w5'] };
export const SEED = 7002, NPATHS = 8000, LAMBDA = 0.0223606797749979, W = 0.02, MEAN_TOL = 0.2, HH_TOL = 0.5;
const OUT = process.env.V3_OUT || join(HERE, 'results', 'v3');
const fileOf = (id, s) => join(OUT, `${id}-${s}.json.gz`);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');

async function unit(id, name) {
  const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), { runPolicy } = await import('../../src/solver/solve.js');
  const { solveCandidate, CANDIDATE_HASH } = await import('./candidate.mjs'), { buildScenarios } = await import('../policy-study/scenarios.mjs');
  const { makeTrace } = await import('./record.mjs'), { wholeScore } = await import('./reduce-7uf.mjs');
  const h = buildScenarios().find(s => s.id === id);
  if (!h || !SETTINGS[name]) { console.error(`v3: no household ${id} or setting ${name}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const set = { ...SHIP_SETTINGS, ...SETTINGS[name] };
  const t0 = Date.now(), r = solveCandidate(E, M, plan, { lambda: LAMBDA, bequestWeight: W, ...set }), secs = (Date.now() - t0) / 1000;
  // the settings the solve ran, held to the unit's
  const ran = { points: r.g.np, shares: r.g.ni, quadNodes: r.quadNodes ? r.quadNodes.length : 5, mix: r.mix.tables.length, gainInterp: !!r.g.gainInterp, pclsInterp: !!r.g.pclsInterp };
  for (const [k, v] of Object.entries(set)) if (ran[k] !== v) { console.error(`v3: ${id} ${name} ran ${k} ${ran[k]}, not ${v}`); process.exit(3); }
  // V1's census over every world and tier-state layer
  const T = r.m.ctx.totalYears; let cells = 0, unchosen = 0, nonFinite = 0;
  r.mix.tables.forEach(tab => (tab.tsLayers || [tab]).forEach(L => { for (let t = 0; t <= T; t++) for (let i = 0; i < L.surv[t].length; i++) { cells++; const sv = L.surv[t][i]; if (!(sv >= 0)) unchosen++; if (![sv, L.beq[t][i], L.resil[t][i], L.short[t][i]].every(Number.isFinite)) nonFinite++; } }));
  const s0 = M.initialState(r.m), opening = r.worlds.map(wd => 100 * wd.value(s0, 0).survival);
  const paths = E.pathsForSeed(SEED, NPATHS, T), tr = makeTrace(NPATHS, T + 1), surv = new Uint8Array(NPATHS);
  const f0 = Date.now();
  paths.forEach((zs, k) => { tr.row = k; if (runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  tr.survived = surv;
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float32Array.from(wholeScore(bs, W, tr.Y));
  const sim = 100 * surv.reduce((a, x) => a + x, 0) / NPATHS;
  console.log(`v3 ${id} ${name}: ${JSON.stringify(set)}; the candidate ${CANDIDATE_HASH}; cells ${cells} no move chosen ${unchosen} non-finite ${nonFinite}; opening ${opening.map(x => x.toFixed(4)).join(' ')}; survival ${sim.toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s, run ${Math.round((Date.now() - f0) / 1000)} s`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(fileOf(id, name), gzipSync(JSON.stringify({ id, name, set, candidate: CANDIDATE_HASH, seed: SEED, N: NPATHS, cells, unchosen, nonFinite, opening, sim, secs, survived: b64(surv), whole: b64(ws) })));
}

function read(dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), w = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(w.buffer.slice(w.byteOffset, w.byteOffset + w.byteLength)) }; };
  const U = {};
  for (const id of HOUSEHOLDS) for (const s of Object.keys(SETTINGS)) { const f = join(dir, `${id}-${s}.json.gz`); if (existsSync(f)) (U[id] = U[id] || {})[s] = load(f); }
  const missing = HOUSEHOLDS.flatMap(id => Object.keys(SETTINGS).filter(s => !(U[id] || {})[s]).map(s => `${id} ${s}`));
  console.log(`V3 READ: ${dir}; ${HOUSEHOLDS.length} households x ${Object.keys(SETTINGS).length} settings; missing ${missing.length ? missing.join(', ') : 'none'}`);
  const seeds = new Set(Object.values(U).flatMap(x => Object.values(x)).map(x => `${x.seed}/${x.N}/${x.candidate}`));
  if (seeds.size !== 1) { console.log(`NOT FAIR: the units differ in seed, paths or candidate (${[...seeds].join(' ')})`); process.exit(1); }
  const bad = Object.values(U).flatMap(x => Object.values(x)).filter(x => x.unchosen || x.nonFinite);
  console.log(`V1 on every unit: ${bad.length ? `FAILED (${bad.map(x => `${x.id} ${x.name}: ${x.unchosen} unchosen, ${x.nonFinite} non-finite`).join('; ')})` : 'no cell without a move, none non-finite'}`);
  for (const id of HOUSEHOLDS) if (U[id]) console.log(`  ${id}: ${Object.entries(U[id]).map(([s, x]) => `${s} ${x.sim.toFixed(2)} (opening ${x.opening.map(v => v.toFixed(1)).join('/')}; ${Math.round(x.secs)} s)`).join(' | ')}`);
  console.log('\nTHE ACCEPTANCE: the next finer setting against the shipped one, paired (survival and whole score, points)');
  const pair = (a, b) => { const n = a.bits.length; let ds = 0, dw = 0, v = 0; const d = new Float64Array(n); for (let i = 0; i < n; i++) { d[i] = b.bits[i] - a.bits[i]; ds += d[i]; dw += b.ws[i] - a.ws[i]; } ds /= n; for (let i = 0; i < n; i++) v += (d[i] - ds) ** 2; return { s: 100 * ds, se: 100 * Math.sqrt(v / (n - 1) / n), w: dw / n }; };
  let allOk = true;
  for (const [dirName, [a, b]] of Object.entries(NEXT_FINER)) {
    const rows = HOUSEHOLDS.filter(id => U[id] && U[id][a] && U[id][b]).map(id => ({ id, ...pair(U[id][a], U[id][b]) }));
    if (rows.length < HOUSEHOLDS.length) { console.log(`  ${dirName}: incomplete (${rows.length} of ${HOUSEHOLDS.length})`); allOk = false; continue; }
    const mS = rows.reduce((t, x) => t + x.s, 0) / rows.length, mW = rows.reduce((t, x) => t + x.w, 0) / rows.length;
    const ok = Math.abs(mS) < MEAN_TOL && Math.abs(mW) < MEAN_TOL && rows.every(x => Math.abs(x.s) < HH_TOL && Math.abs(x.w) < HH_TOL);
    if (!ok) allOk = false;
    console.log(`  ${dirName} (${a} -> ${b}): panel mean survival ${mS >= 0 ? '+' : ''}${mS.toFixed(3)}, whole score ${mW >= 0 ? '+' : ''}${mW.toFixed(3)}; ${rows.map(x => `${x.id} ${x.s >= 0 ? '+' : ''}${x.s.toFixed(2)} (se ${x.se.toFixed(2)}) / ${x.w >= 0 ? '+' : ''}${x.w.toFixed(2)}`).join(', ')}: ${ok ? 'the shipped setting stands' : 'MOVES BEYOND THE TARGETS'}`);
  }
  // the wealth points' whole ladder against the finest, reported
  for (const id of HOUSEHOLDS) if (U[id] && U[id].p90) console.log(`  ${id} against 90 points: ${['p20', 'ship', 'p45', 'p60'].filter(s => U[id][s]).map(s => { const p = pair(U[id].p90, U[id][s]); return `${s} ${p.s >= 0 ? '+' : ''}${p.s.toFixed(2)}`; }).join(', ')}`);
  console.log(`V3: ${allOk ? 'every direction within the targets' : 'NOT every direction within the targets'}`);
  process.exit(allOk && !bad.length && !missing.length ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--units') { for (const id of HOUSEHOLDS) for (const s of Object.keys(SETTINGS)) console.log(`${id} ${s}`); }
  else if (process.argv[2] === '--read') read(process.argv[3] || OUT);
  else await unit(process.argv[2], process.argv[3]);
}
