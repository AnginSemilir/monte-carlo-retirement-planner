/*
 * V3: THE CONVERGENCE TABLE, SETTINGS IN EVERY DIRECTION (the external review of 21 Oct, Part B Step 5, with the follow-up
 * review's answers 1 and 8 and the deep review of 23 Oct; STATE.md D20, D23 and D24: run once on the ported code;
 * EXPLORATORY, the tuning seed). The assembled candidate (candidate.json) on seven households spanning the problem, as
 * proposed in PROGRESS.md (question 8) and adopted with answer 8: S362 and S370 (bridge years; S362 carries O191 and O179,
 * S370 is the deposit household the speed review names), S224 and S380 (mid-survival), S248 (thin), S002 (comfortable)
 * and S330 (thin, with a large taxable account, where F0 bit hardest). Never the maintainer's own (the library's only).
 * Each household solved at the shipped settings (SHIP_SETTINGS: 30 wealth points, 6 share points, 5 quadrature nodes, 3
 * worlds, the allowance axis interpolated and the gain axis snapped, as the candidate runs) and with one setting moved:
 * 20, 45, 60 and 90 wealth points; 10 share points; 9 quadrature nodes; the gain axis interpolated; the allowance axis
 * snapped; 5 worlds; at both estate weights (0.02 and 0.01). For each: each world's opening table value; the policy's
 * survival and whole score on 8,000 paths of the tuning seed 7002 (runPolicy, its trace; V2 holds runPolicy to the
 * engine), saved per path to pair; the cells with no move chosen and the non-finite cells (V1's census: both must be 0).
 * Two more kinds of unit:
 *   the one-pot oracle (answer 1): the known-answer test's one-pot plan solved at 20, 30, 45, 60 and 90 wealth points,
 *     each table's opening against the exact survival chance (research/oracle/one-pot.mjs); V3 fails if that error
 *     stops shrinking as points are added (a diagnostic of the numerics; the policy's convergence is the acceptance);
 *   S224's rungs (the deep review's one test of S224's loss): the candidate and SHIP side by side at 30, 60 and 90
 *     wealth points, both weights, on 32,000 paths of seed 7002, the whole score on every path.
 *   node research/solver/v3-convergence.mjs <household> <setting> <weight>   one unit, to results/v3 (V3_OUT)
 *   node research/solver/v3-convergence.mjs onepot                          the one-pot ladder
 *   node research/solver/v3-convergence.mjs ladder <CAND|SHIP> <points> <weight>
 *   node research/solver/v3-convergence.mjs --units                         the units, one a line
 *   node research/solver/v3-convergence.mjs --read [dir]                    the table, and the acceptance (below)
 * The acceptance (Step 5's), at each weight: the shipped setting stands in a direction where the next finer one moves the
 * policy by under 0.2 points on the panel mean and 0.5 on every household, in survival and in the whole score.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const HOUSEHOLDS = ['S362', 'S370', 'S224', 'S380', 'S248', 'S002', 'S330'];
export const SHIP_SETTINGS = { points: 30, shares: 6, quadNodes: 5, mix: 3, gainInterp: false, pclsInterp: true };
// each direction: its settings, and the shipped setting's next finer one in it (the acceptance's pair)
export const SETTINGS = { ship: {}, p20: { points: 20 }, p45: { points: 45 }, p60: { points: 60 }, p90: { points: 90 }, s10: { shares: 10 }, q9: { quadNodes: 9 }, gainI: { gainInterp: true }, pclsS: { pclsInterp: false }, w5: { mix: 5 } };
export const NEXT_FINER = { 'wealth points': ['ship', 'p45'], 'share points': ['ship', 's10'], 'quadrature nodes': ['ship', 'q9'], 'the gain axis': ['ship', 'gainI'], 'the allowance axis (snapped against the candidate\'s interpolated)': ['pclsS', 'ship'], 'worlds': ['ship', 'w5'] };
export const WEIGHTS = ['0.02', '0.01'], SEED = 7002, NPATHS = 8000, LADDER_PATHS = 32000, LADDER = [30, 60, 90], ONEPOT = [20, 30, 45, 60, 90];
export const LAMBDA = 0.0223606797749979, MEAN_TOL = 0.2, HH_TOL = 0.5;
const OUT = process.env.V3_OUT || join(HERE, 'results', 'v3');
export const fileOf = (id, s, w) => join(OUT, `${id}-${s}-w${w}.json.gz`);
const ladderFile = (arm, p, w) => join(OUT, `ladder-S224-${arm}-p${p}-w${w}.json.gz`);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const codeId = () => execFileSync(process.execPath, [join(HERE, 'code-id.mjs')], { encoding: 'utf8' }).trim();
export const UNITS = [
  ...HOUSEHOLDS.flatMap(id => Object.keys(SETTINGS).flatMap(s => WEIGHTS.map(w => `${id} ${s} ${w}`))),
  'onepot',
  ...LADDER.flatMap(p => ['CAND', 'SHIP'].flatMap(a => WEIGHTS.map(w => `ladder ${a} ${p} ${w}`)))
];
export const unitFile = u => { const a = u.split(' '); return a[0] === 'onepot' ? join(OUT, 'onepot.json') : a[0] === 'ladder' ? ladderFile(a[1], a[2], a[3]) : fileOf(a[0], a[1], a[2]); };

async function libs() {
  const { buildScenarios } = await import('../policy-study/scenarios.mjs');
  return { E: await import('../engine.mjs'), M: await import('../../src/solver/model.js'), S: await import('../../src/solver/solve.js'), C: await import('./candidate.mjs'), buildScenarios, R: await import('./record.mjs'), W: await import('./reduce-7uf.mjs') };
}
const planOf = (E, h) => E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
// a solve's policy on n paths of the tuning seed: survival and the whole score on every path
function simulate(L, r, w, n) {
  const { E, S, R, W } = L, T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, n, T), tr = R.makeTrace(n, T + 1), surv = new Uint8Array(n);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  return { surv, ws: Float32Array.from(W.wholeScore(bs, Number(w), tr.Y)), sim: 100 * surv.reduce((a, x) => a + x, 0) / n };
}

async function unit(id, name, w) {
  const L = await libs(), { E, M, C } = L, h = L.buildScenarios().find(s => s.id === id);
  if (!h || !SETTINGS[name] || !WEIGHTS.includes(w)) { console.error(`v3: no household ${id}, setting ${name} or weight ${w}`); process.exit(2); }
  const plan = planOf(E, h), set = { ...SHIP_SETTINGS, ...SETTINGS[name] }, code = codeId();
  const t0 = Date.now(), r = C.solveCandidate(E, M, plan, { lambda: LAMBDA, bequestWeight: Number(w), ...set }), secs = (Date.now() - t0) / 1000;
  // the settings the solve ran, held to the unit's
  const ran = { points: r.g.np, shares: r.g.ni, quadNodes: r.quadNodes ? r.quadNodes.length : 5, mix: r.mix.tables.length, gainInterp: !!r.g.gainInterp, pclsInterp: !!r.g.pclsInterp };
  for (const [k, v] of Object.entries(set)) if (ran[k] !== v) { console.error(`v3: ${id} ${name} ran ${k} ${ran[k]}, not ${v}`); process.exit(3); }
  // V1's census over every world and tier-state layer
  const T = r.m.ctx.totalYears; let cells = 0, unchosen = 0, nonFinite = 0;
  r.mix.tables.forEach(tab => (tab.tsLayers || [tab]).forEach(Ly => { for (let t = 0; t <= T; t++) for (let i = 0; i < Ly.surv[t].length; i++) { cells++; const sv = Ly.surv[t][i]; if (!(sv >= 0)) unchosen++; if (![sv, Ly.beq[t][i], Ly.resil[t][i], Ly.short[t][i]].every(Number.isFinite)) nonFinite++; } }));
  const s0 = M.initialState(r.m), opening = r.worlds.map(wd => 100 * wd.value(s0, 0).survival);
  const f0 = Date.now(), { surv, ws, sim } = simulate(L, r, w, NPATHS);
  console.log(`v3 ${id} ${name} W${w}: ${JSON.stringify(set)}; the candidate ${C.CANDIDATE_HASH}; code ${code}; cells ${cells} no move chosen ${unchosen} non-finite ${nonFinite}; opening ${opening.map(x => x.toFixed(4)).join(' ')}; survival ${sim.toFixed(4)} on ${NPATHS} (seed ${SEED}); solve ${Math.round(secs)} s, run ${Math.round((Date.now() - f0) / 1000)} s`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(fileOf(id, name, w), gzipSync(JSON.stringify({ id, name, w, set, candidate: C.CANDIDATE_HASH, code, seed: SEED, N: NPATHS, cells, unchosen, nonFinite, opening, sim, secs, survived: b64(surv), whole: b64(ws) })));
}

// S224's rungs: the candidate or SHIP at one wealth resolution, 32,000 paths, the whole score on every path
async function ladder(arm, p, w) {
  const L = await libs(), { E, M, S, C } = L, plan = planOf(E, L.buildScenarios().find(s => s.id === 'S224')), code = codeId();
  if (!['CAND', 'SHIP'].includes(arm) || !LADDER.includes(Number(p)) || !WEIGHTS.includes(w)) { console.error(`v3: no rung ${arm} ${p} ${w}`); process.exit(2); }
  const base = { lambda: LAMBDA, points: Number(p), bequestWeight: Number(w) };
  // e3pcls guard: SHIP's solve is solvePlan with the product's settings; the candidate's goes through solveCandidate
  const t0 = Date.now(), r = arm === 'SHIP' ? S.solvePlan(E, M, C.candidatePlan(E, plan), base) : C.solveCandidate(E, M, plan, base), secs = (Date.now() - t0) / 1000;
  if (r.g.np !== Number(p)) { console.error(`v3: the rung ran ${r.g.np} points, not ${p}`); process.exit(3); }
  const f0 = Date.now(), { surv, ws, sim } = simulate(L, r, w, LADDER_PATHS);
  console.log(`v3 ladder S224 ${arm} ${p} points W${w}: code ${code}; survival ${sim.toFixed(4)}, whole score ${(ws.reduce((a, x) => a + x, 0) / LADDER_PATHS).toFixed(4)} on ${LADDER_PATHS} (seed ${SEED}); solve ${Math.round(secs)} s, run ${Math.round((Date.now() - f0) / 1000)} s`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(ladderFile(arm, p, w), gzipSync(JSON.stringify({ id: 'S224', arm, points: Number(p), w, code, seed: SEED, N: LADDER_PATHS, sim, secs, survived: b64(surv), whole: b64(ws) })));
}

// the one-pot oracle at each wealth resolution (the known-answer test's plan and settings)
async function onepot() {
  const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), { solve, PRODUCT_BASELINE } = await import('../../src/solver/solve.js'), { solveOnePot } = await import('../oracle/one-pot.mjs');
  const base = E.normalizePlan({ demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 60, terminalAge: 95, statePensionAge: 66, privatePensionAge: 57, statePensionSelf: 0 }, spending: { targetSpend: 30000, spendBands: [] }, accounts: [{ id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 600000, contrib: 0, growth: 0, risk: 'Medium Risk' }], config: { valuationDate: '2026-01-01', lookaheadYears: 0, guardrails: false, solvencyFloor: 0 } });
  const pot = E.resolveMpaa(E.normalizePlan({ ...base, riskProfiles: { ...base.riskProfiles, 'Medium Risk': { ...base.riskProfiles['Medium Risk'], sigmaParam: 0 } }, riskSource: '' }));
  const m = M.prepare(E, pot), T = m.ctx.totalYears, tier = pot.riskProfiles['Medium Risk'], s0 = M.initialState(m);
  const oracle = solveOnePot({ W0: 600000, spend: 30000, years: T + 1, mu: Math.log(1 + tier.real / 100), sigma: tier.volatility / 100 }).V0;
  const rows = ONEPOT.map(p => { const r = solve(E, M, pot, { ...PRODUCT_BASELINE, spendLevels: [1], raiseWeight: 0, lambda: 0, points: p }); const t = r.value(s0, 0).survival; return { points: p, table: 100 * t, error: 100 * (t - oracle) }; });
  const out = { code: codeId(), oracle: 100 * oracle, rows };
  console.log(`v3 onepot: the oracle ${out.oracle.toFixed(3)}%; ${rows.map(x => `${x.points} points ${x.table.toFixed(3)}% (${x.error >= 0 ? '+' : ''}${x.error.toFixed(3)})`).join(', ')}`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'onepot.json'), JSON.stringify(out));
}

function read(dir) {
  const load = f => { const j = JSON.parse(gunzipSync(readFileSync(f)).toString()); const b = Buffer.from(j.survived, 'base64'), x = Buffer.from(j.whole, 'base64'); return { ...j, bits: new Uint8Array(b.buffer, b.byteOffset, b.byteLength), ws: new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)) }; };
  const pair = (a, b, n = Math.min(a.bits.length, b.bits.length)) => { let ds = 0, dw = 0, vs = 0, vw = 0; const d = new Float64Array(n), e = new Float64Array(n); for (let i = 0; i < n; i++) { d[i] = b.bits[i] - a.bits[i]; e[i] = b.ws[i] - a.ws[i]; ds += d[i]; dw += e[i]; } ds /= n; dw /= n; for (let i = 0; i < n; i++) { vs += (d[i] - ds) ** 2; vw += (e[i] - dw) ** 2; } return { s: 100 * ds, se: 100 * Math.sqrt(vs / (n - 1) / n), w: dw, sew: Math.sqrt(vw / (n - 1) / n) }; };
  const sg = x => `${x >= 0 ? '+' : ''}`;
  const all = [];
  const U = {};
  for (const id of HOUSEHOLDS) for (const s of Object.keys(SETTINGS)) for (const w of WEIGHTS) { const f = join(dir, `${id}-${s}-w${w}.json.gz`); if (existsSync(f)) { const x = load(f); ((U[w] = U[w] || {})[id] = U[w][id] || {})[s] = x; all.push(x); } }
  const missing = UNITS.filter(u => !existsSync(join(dir, unitFile(u).split('/').pop())));
  console.log(`V3 READ (EXPLORATORY, the tuning seed): ${dir}; ${HOUSEHOLDS.length} households x ${Object.keys(SETTINGS).length} settings x ${WEIGHTS.length} weights, the one-pot ladder and S224's ${LADDER.length * 4} rungs; missing ${missing.length ? missing.join(', ') : 'none'}`);
  const lad = {};
  for (const p of LADDER) for (const a of ['CAND', 'SHIP']) for (const w of WEIGHTS) { const f = join(dir, `ladder-S224-${a}-p${p}-w${w}.json.gz`); if (existsSync(f)) { const x = load(f); lad[`${a} ${p} ${w}`] = x; all.push(x); } }
  const op = existsSync(join(dir, 'onepot.json')) ? JSON.parse(readFileSync(join(dir, 'onepot.json'), 'utf8')) : null;
  // the gate: one code, one seed, one candidate, the paths as designed
  const codes = new Set([...all.map(x => x.code), ...(op ? [op.code] : [])]), cands = new Set(all.filter(x => x.candidate).map(x => x.candidate)), seeds = new Set(all.map(x => x.seed));
  if (codes.size !== 1 || cands.size > 1 || seeds.size !== 1) { console.log(`NOT FAIR: the units differ in code (${[...codes].join(' ')}), candidate (${[...cands].join(' ')}) or seed (${[...seeds].join(' ')})`); process.exit(1); }
  console.log(`the gate: one code (${[...codes][0]}), the candidate ${[...cands][0]}, seed ${[...seeds][0]}`);
  const bad = all.filter(x => x.unchosen || x.nonFinite);
  console.log(`V1 on every unit: ${bad.length ? `FAILED (${bad.map(x => `${x.id} ${x.name} W${x.w}: ${x.unchosen} unchosen, ${x.nonFinite} non-finite`).join('; ')})` : 'no cell without a move, none non-finite'}`);
  let allOk = !bad.length && !missing.length;
  for (const w of WEIGHTS) {
    console.log(`\nAT ESTATE WEIGHT ${w}`);
    for (const id of HOUSEHOLDS) if (U[w] && U[w][id]) console.log(`  ${id}: ${Object.entries(U[w][id]).map(([s, x]) => `${s} ${x.sim.toFixed(2)} (opening ${x.opening.map(v => v.toFixed(1)).join('/')}; ${Math.round(x.secs)} s)`).join(' | ')}`);
    console.log(`THE ACCEPTANCE AT W${w}: the next finer setting against the shipped one, paired on ${NPATHS} paths (survival points; whole score)`);
    for (const [dirName, [a, b]] of Object.entries(NEXT_FINER)) {
      const rows = HOUSEHOLDS.filter(id => U[w] && U[w][id] && U[w][id][a] && U[w][id][b]).map(id => ({ id, ...pair(U[w][id][a], U[w][id][b]) }));
      if (rows.length < HOUSEHOLDS.length) { console.log(`  ${dirName}: incomplete (${rows.length} of ${HOUSEHOLDS.length})`); allOk = false; continue; }
      const mS = rows.reduce((t, x) => t + x.s, 0) / rows.length, mW = rows.reduce((t, x) => t + x.w, 0) / rows.length;
      const ok = Math.abs(mS) < MEAN_TOL && Math.abs(mW) < MEAN_TOL && rows.every(x => Math.abs(x.s) < HH_TOL && Math.abs(x.w) < HH_TOL);
      if (!ok) allOk = false;
      console.log(`  ${dirName} (${a} -> ${b}): panel mean survival ${sg(mS)}${mS.toFixed(3)}, whole score ${sg(mW)}${mW.toFixed(3)}; ${rows.map(x => `${x.id} ${sg(x.s)}${x.s.toFixed(2)} (se ${x.se.toFixed(2)}) / ${sg(x.w)}${x.w.toFixed(2)}`).join(', ')}: ${ok ? 'the shipped setting stands' : 'MOVES BEYOND THE TARGETS'}`);
    }
    // the wealth points' whole ladder against the finest, reported
    for (const id of HOUSEHOLDS) if (U[w] && U[w][id] && U[w][id].p90) console.log(`  ${id} against 90 points: ${['p20', 'ship', 'p45', 'p60'].filter(s => U[w][id][s]).map(s => { const p = pair(U[w][id].p90, U[w][id][s]); return `${s} ${sg(p.s)}${p.s.toFixed(2)} / ${sg(p.w)}${p.w.toFixed(2)}`; }).join(', ')}`);
  }
  // the one-pot oracle at each resolution (answer 1): the table's opening error must shrink as points are added
  if (op) {
    const shrink = op.rows.every((x, i) => i === 0 || Math.abs(x.error) < Math.abs(op.rows[i - 1].error));
    if (!shrink) allOk = false;
    console.log(`\nTHE ONE-POT ORACLE (${op.oracle.toFixed(3)}%), the table's opening at each wealth resolution: ${op.rows.map(x => `${x.points} points ${sg(x.error)}${x.error.toFixed(3)}`).join(', ')}: ${shrink ? 'the error shrinks at every step' : 'THE ERROR STOPS SHRINKING'}`);
  }
  // S224's rungs: the candidate against SHIP at each resolution, on every path (the deep review's one test)
  console.log(`\nS224'S RUNGS (the deep review's one test of its loss): the candidate against SHIP, paired on ${LADDER_PATHS} paths (survival points; whole score, both on every path)`);
  for (const w of WEIGHTS) for (const p of LADDER) {
    const c = lad[`CAND ${p} ${w}`], s = lad[`SHIP ${p} ${w}`];
    if (!c || !s) { console.log(`  W${w} ${p} points: incomplete`); continue; }
    const d = pair(s, c);
    console.log(`  W${w} ${p} points: CAND ${c.sim.toFixed(2)}% SHIP ${s.sim.toFixed(2)}%; the change ${sg(d.s)}${d.s.toFixed(3)} (se ${d.se.toFixed(3)}), whole score ${sg(d.w)}${d.w.toFixed(3)} (se ${d.sew.toFixed(3)})`);
  }
  console.log(`\nV3: ${allOk ? 'every direction within the targets at both weights, the one-pot error shrinking' : 'NOT every direction within the targets (or units missing, or the one-pot error not shrinking)'}`);
  process.exit(allOk ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [a, b, c, d] = process.argv.slice(2);
  if (a === '--units') UNITS.forEach(u => console.log(u));
  else if (a === '--read') read(b || OUT);
  else if (a === 'onepot') await onepot();
  else if (a === 'ladder') await ladder(b, c, d);
  else await unit(a, b, c);
}
