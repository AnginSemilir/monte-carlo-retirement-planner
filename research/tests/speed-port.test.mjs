/*
 * THE SPEED PORT (STATE.md D30; SPEED-PORT.md on review/external-2026-10-21 at 775bfc3, step 2): the realAt cache (exact, on
 * everywhere), the table without the dealing cost (`tableDealing: false`; research only, off) and E5 (exact given it), in
 * src/solver/solve.js. Each check is shown failing on its plant (CHECKLIST 5).
 *   1. identity, the option unset (the cache in): S224 and S370 under SHIP and CAND - each world's tables, every layer, the
 *      adaptive reference's arrays and the engine's outcomes on 50 paths - hash as on the code before the port (0021898; the
 *      constants below printed there by --record); quick at 4 points with the candidate on a light lattice (48 x 9 x 32),
 *      --full at 6 points on the candidate's own; the plant (the cache keyed on the plan's own vector) parts a hash
 *   2. the realAt cache: every table the same with it and without (REALAT.cache false), on S370's candidate; its plant parts them
 *   3. E5: with tableDealing false, every table bit for bit the same with tsOnce on and off (quick S370 at 4 points; --full
 *      S370, S248 and S224 at 6 and S370 at 45), the meta recording both; the plant (tsOncePlant 'nocharge') parts them
 *   4. the engine and a forward run in step (V2's state check) on S370 with tableDealing false, every year a seeded random
 *      move: every slot within a pound, years with a switch (the dealing cost paid when the move is taken) above zero, and
 *      the forward run's states the same as under the default table, so the charge is paid as before; the plant (the engine's
 *      policy without the dealing cost) parts them
 *   5. refusals: tableDealing false without the tier state, and a value neither true nor false
 *   6. the smaller cuts (STATE.md D31; SPEED-PORT-2.md step 2), E7, E8, E9 and E11 in E5's path, value by value: with
 *      tableDealing false every table the same with the four on and off (tsLean false; quick S370 at 4 points, --full S224
 *      and S370 at 6 and S370 at 45); each plant, on top of the other three, parts them (on S370: E11's needs the bridge
 *      reader's table); the memo's world plant ('noworld') parts them with the four in and out; the split across two parts
 *      the same as unsplit with the four on (S370 at 4 points)
 * CAND with HR and the third step at full scale, the same as the factorial's units bit for bit, is read by n4-menu.mjs
 * (step 3's first arm), not here.
 *   node research/tests/speed-port.test.mjs [--full] [--record]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as S from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf, withTable } from '../../src/solver/bridge.js';
import { CANDIDATE_OPTS, candidatePlan } from '../solver/candidate.mjs';
import { checkE3pclsPin } from '../solver/e3pcls-pin.mjs';
import { LAMBDA } from '../solver/panel-7uf.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const FULL = process.argv.includes('--full'), RECORD = process.argv.includes('--record');
const PTS = FULL ? 6 : 4, NPATHS = 50, NLOCK = FULL ? 20 : 4, SEED = 99004;
const LIGHT = FULL ? {} : { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id); return E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } })); };
checkE3pclsPin({ ...CANDIDATE_OPTS });   // e3pcls guard: the candidate's solves below
// CAND is the candidate as D29 left it, the option unset (candidate.json less tableDealing since D30, and less failDelivered
// since D43), so check 1 compares what the code before the port solved, and checks 3 and 4 set the option themselves (the
// reviewer of 26 Oct, finding 2; of 29 Oct, finding 1b)
const { tableDealing: _td, failDelivered: _fd, ...D29_OPTS } = CANDIDATE_OPTS;
const solve = (id, arm, extra = {}, pts = PTS) => {
  const base = { lambda: LAMBDA, points: pts, bequestWeight: 0.02 };
  return arm === 'SHIP' ? S.solvePlan(E, M, candidatePlan(E, planOf(id)), base) : S.solvePlan(E, M, candidatePlan(E, planOf(id)), { ...D29_OPTS, ...(pts === 45 ? {} : LIGHT), ...base, ...extra });
};

/* the hashes two code versions must share: the typed arrays alone (a key added to meta moves none), in key order */
const arraysHash = (roots, depthMax) => {
  const h = createHash('sha256'), seen = new Set();
  const walk = (o, d) => {
    if (!o || typeof o !== 'object' || seen.has(o) || d > depthMax) return; seen.add(o);
    if (ArrayBuffer.isView(o)) { h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; }
    if (Array.isArray(o)) { o.forEach(x => walk(x, d + 1)); return; }
    for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; walk(o[k], d + 1); }
  };
  roots.forEach(r => walk(r, 0));
  return h.digest('hex').slice(0, 16);
};
const arefHash = r => {
  const ref = r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref, a = ref && ref.arrays ? ref.arrays() : null;
  return a ? arraysHash([a.V, a.MV, a.V0, a.MV0, a.AST, a.ASTY], 99) : '-';
};
const runHash = r => {
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), h = createHash('sha256');
  for (const zs of E.pathsForSeed(99001, NPATHS, r.m.ctx.totalYears)) { const x = E.runTrial(ctx, Float64Array.from(zs)); h.update([x.survived, x.failAge, x.terminalPot, x.terminalPotNet, x.minPot, x.lifetimeTax, x.unmetTotal, x.realisedSpend, x.cutYears, x.raiseYears].join(':') + ';'); }
  return h.digest('hex').slice(0, 16);
};
const hashes = r => ({ table: arraysHash(r.mix.tables, 3), layer: arraysHash([r.tablesW], 99), aref: arefHash(r), run: runHash(r) });
const same = (a, b) => ['table', 'layer', 'aref', 'run'].every(k => a[k] === b[k]);
const tablesOnly = r => `${arraysHash(r.mix.tables, 3)}/${arraysHash([r.tablesW], 99)}`;

// 1. identity, the option unset: the code before the port (0021898), recorded there with --record
const WANT = {
  quick: {"S224 SHIP":{"table":"1e7cb1868f1e3ee8","layer":"0f2baf48de46bb59","aref":"-","run":"f86a428710404f38"},"S370 SHIP":{"table":"c818f491471a363f","layer":"6e99a4198bd55789","aref":"-","run":"9291e4b208bfc7f2"},"S224 CAND":{"table":"b3aee4e120470d44","layer":"9c63773b72b98676","aref":"-","run":"76a93a8197e10a36"},"S370 CAND":{"table":"b84ebf1d6c25052c","layer":"2d1c886ece7e4b0f","aref":"26a9868a554fdb23","run":"8055e77b0a15da5a"}},
  full: {"S224 SHIP":{"table":"5dd89c0ef1bc4aad","layer":"0a1db04e01ce4006","aref":"-","run":"c909633f6c90da3c"},"S370 SHIP":{"table":"1b6ec15444d9e032","layer":"cba22d0450f4cab9","aref":"-","run":"563d54ee2038647b"},"S224 CAND":{"table":"4268de771a289678","layer":"958f37834f7f4b76","aref":"-","run":"dc9e97f6bdb44afb"},"S370 CAND":{"table":"a0b1792426a29d6e","layer":"68e88a44a93db1eb","aref":"35b72dc2dc22750d","run":"ab382b36ee46175d"}}
};
const got = {}, solved = {};
for (const [id, arm] of [['S224', 'SHIP'], ['S370', 'SHIP'], ['S224', 'CAND'], ['S370', 'CAND']]) { const r = solve(id, arm); solved[`${id} ${arm}`] = r; got[`${id} ${arm}`] = hashes(r); }
if (RECORD) { console.log(JSON.stringify(got)); process.exit(0); }
const want = WANT[FULL ? 'full' : 'quick'];
for (const k of Object.keys(got)) ok(same(got[k], want[k]), `1  ${k} at ${PTS} points, the option unset: the same as before the port (table ${got[k].table}, layer ${got[k].layer}, reference ${got[k].aref}, engine ${got[k].run})`);

// 2. the realAt cache, and the identity's plant
{
  const on = got['S370 CAND'];
  S.REALAT.cache = false; let off; try { off = hashes(solve('S370', 'CAND')); } finally { S.REALAT.cache = true; }
  ok(same(on, off), `2  S370's candidate: every table, layer, the reference and the engine's outcomes the same with the realAt cache and without (${on.table}, ${off.table})`);
  S.REALAT.plant = 'wrongkey'; let bad; try { bad = hashes(solve('S370', 'CAND')); } finally { S.REALAT.plant = ''; }
  ok(!same(on, bad) && !same(want['S370 CAND'], bad), `2  planted: the cache keyed on the plan's own vector parts them (table ${bad.table}, layer ${bad.layer}), and fails check 1`);
}

// 3. E5: tableDealing false, tsOnce on and off
const nd = {};
for (const [id, pts] of FULL ? [['S370', 6], ['S248', 6], ['S224', 6], ['S370', 45]] : [['S370', 4]]) {
  const t0 = Date.now(), r5 = solve(id, 'CAND', { tableDealing: false }, pts), s5 = (Date.now() - t0) / 1000;
  const t1 = Date.now(), rl = solve(id, 'CAND', { tableDealing: false, tsOnce: false }, pts), sl = (Date.now() - t1) / 1000;
  if (pts === PTS && id === 'S370') nd.r = r5;
  const a = tablesOnly(r5), b = tablesOnly(rl);
  ok(a === b && r5.meta.tableDealing === false && r5.meta.tsOnce === true && rl.meta.tsOnce === false,
    `3  ${id} at ${pts} points, tableDealing false: every table and layer the same bit for bit with E5 (${a}; ${Math.round(s5)} s) and the layer loop (${b}; ${Math.round(sl)} s); meta tableDealing ${r5.meta.tableDealing}, tsOnce ${r5.meta.tsOnce} and ${rl.meta.tsOnce}`);
  if (pts === PTS && id === 'S370') {
    const rp = solve(id, 'CAND', { tableDealing: false, tsOncePlant: 'nocharge' }, pts);
    ok(tablesOnly(rp) !== a, `3  planted: E5 with the switch charge dropped parts them (${tablesOnly(rp)})`);
    ok(a !== `${got['S370 CAND'].table}/${got['S370 CAND'].layer}`, `3  tableDealing false changes the tables (${a} against the default's ${got['S370 CAND'].table}/${got['S370 CAND'].layer}): the option is not inert`);
  }
}

// 4. the engine and a forward run in step under tableDealing false; the decision-time charge paid as before
const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
const gainOf = v => v[3] * (v[2] - v[12]);
const moveOf = (r, ai, code) => {
  const a = r.actions[ai], ca = r.c.acts[ai];
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code,
    tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
};
const rng = seed => { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const lockstep = (r, r0, plant = '') => {
  const id = 'S370', T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NLOCK, T).map(z => Float64Array.from(z));
  const base = withTable(r.m.ctx.plan, r), real = base.spending.policyOverride;
  let recs = null, worst = 0, worstAt = '', years = 0, switches = 0, asBefore = true;
  const pol = { ...real, ...(plant === 'nodeal' ? { switchCost: 0 } : {}), choose(st, t, held) {
    const want = real.choose(st, t, held), rec = recs[t];
    if (!rec) return want;
    const e = vecOf(r.m, modelStateOf(st));
    for (const k of MONEY) { const gap = Math.abs((e[k] || 0) - (rec.s[k] || 0)); if (!(gap <= worst)) { worst = gap; worstAt = `${id} year ${t} slot ${k}`; } }
    const gg = Math.abs(gainOf(e) - gainOf(rec.s)); if (!(gg <= worst)) { worst = gg; worstAt = `${id} year ${t} gain held`; }
    years++;
    return moveOf(r, rec.ai, 'forced');
  } };
  const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
  const zPathOf = zs => (zs.length > T + 1 ? zs[T + 1] : 0);
  for (let i = 0; i < paths.length; i++) {
    const R = rng(SEED + 7919 * i), seq = [];
    for (let t = 0; t <= T; t++) seq[t] = Math.floor(R() * r.actions.length);
    recs = []; const rec0 = [];
    S.runPolicy(r, paths[i], { choose: t => seq[t], visit: (t, s, held, ai) => { recs[t] = { s: Float64Array.from(s), ai }; const ca = r.c.acts[ai]; if ((ca.tierPen || 0) !== held.pen || (ca.tierIsa || 0) !== held.isa) switches++; } });
    S.runPolicy(r0, paths[i], { choose: t => seq[t], visit: (t, s) => { rec0[t] = Float64Array.from(s); } });
    for (let t = 0; t <= T; t++) if (recs[t] && rec0[t] && !recs[t].s.every((x, q) => Object.is(x, rec0[t][q]))) asBefore = false;
    const st = E.freshState(ctx);
    for (let t = 0; t <= T; t++) E.stepYear(ctx, st, t, { z: paths[i][t], zPath: zPathOf(paths[i]) });
  }
  return { worst, worstAt, years, switches, asBefore };
};
{
  const o = lockstep(nd.r, solved['S370 CAND']);
  ok(o.worst <= 1 && o.switches > 0 && o.asBefore, `4  S370 with tableDealing false: the engine and a forward run in step over ${o.years} years of ${NLOCK} paths, the largest gap £${o.worst.toExponential(2)} (${o.worstAt || 'none'}); years with a switch ${o.switches}; the forward run's states the same as under the default table: ${o.asBefore}`);
  const p = lockstep(nd.r, solved['S370 CAND'], 'nodeal');
  ok(p.worst > 1, `4  planted: the engine's policy without the dealing cost parts them by £${p.worst.toFixed(2)} (${p.worstAt})`);
}

// 5. refusals
{
  const refuses = (extra, re) => { try { S.solvePlan(E, M, planOf('S224'), { lambda: LAMBDA, points: 3, riskAbove: false, ...extra }); return false; } catch (e) { return re.test(e.message); } };
  ok(refuses({ tableDealing: false }, /tableDealing: false needs the tier state/), '5  tableDealing false without the tier state is refused');
  ok(refuses({ tierState: true, tableDealing: 'no' }, /tableDealing no: only true or false/), '5  tableDealing neither true nor false is refused');
}

// 6. THE SMALLER CUTS (STATE.md D31; SPEED-PORT-2.md step 2): E7, E8, E9 and E11 in E5's path, every table compared value by value
const valuesOf = r => { const out = [], seen = new Set(); const walk = (o, d, dm) => { if (!o || typeof o !== 'object' || seen.has(o) || d > dm) return; seen.add(o); if (ArrayBuffer.isView(o)) { out.push(o); return; } if (Array.isArray(o)) { o.forEach(x => walk(x, d + 1, dm)); return; } for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; walk(o[k], d + 1, dm); } }; r.mix.tables.forEach(t => walk(t, 0, 3)); walk(r.tablesW, 0, 99); return out; };
const differ = (r1, r2) => { const A = valuesOf(r1), B = valuesOf(r2); let n = 0, d = A.length === B.length ? 0 : Infinity; for (let i = 0; i < Math.min(A.length, B.length); i++) { const a = A[i], b = B[i]; n += a.length; if (a.length !== b.length) { d = Infinity; continue; } for (let q = 0; q < a.length; q++) if (!Object.is(a[q], b[q])) d++; } return { n, d }; };
const ND = { tableDealing: false };
{
  // 6.1 identity: tsLean on (the default under E5) and off, every value; the candidate as D29 left it is check 1's
  let lean4 = null, off4 = null;
  for (const [id, pts] of FULL ? [['S224', 6], ['S370', 6], ['S370', 45]] : [['S370', 4]]) {
    const t0 = Date.now(), on = solve(id, 'CAND', ND, pts), s0 = (Date.now() - t0) / 1000, t1 = Date.now(), off = solve(id, 'CAND', { ...ND, tsLean: false }, pts), s1 = (Date.now() - t1) / 1000, x = differ(on, off);
    ok(x.d === 0 && off.meta.tsLean === false && on.meta.tsLean === undefined, `6  ${id} at ${pts} points, tableDealing false: every table the same with the four cuts (${Math.round(s0)} s) and without (${Math.round(s1)} s): ${x.d} of ${x.n} values differ (tables ${tablesOnly(on)}); meta tsLean ${off.meta.tsLean} when set`);
    if (id === 'S370' && pts === PTS) { lean4 = on; off4 = off; }
  }
  if (!lean4) { lean4 = solve('S370', 'CAND', ND); off4 = solve('S370', 'CAND', { ...ND, tsLean: false }); }
  // 6.2 the plants, each on top of the other three (E11's on S370: S224's bridge reader builds no table)
  for (const [nm, o] of [['E7, the switching sum taken for staying', { mixOncePlant: 'swap' }], ['E8, the ids from the pension\'s two words alone', { postIdsPlant: 'pen' }], ['E9, every lookup at layer 0', { hoistNextPlant: 'layer0' }], ['E11, every world handed world 0\'s split', { readerDirectPlant: 'world0' }]]) {
    const x = differ(lean4, solve('S370', 'CAND', { ...ND, ...o }));
    ok(x.d > 0, `6  planted on S370 at ${PTS} points, ${nm}: ${x.d} of ${x.n} values differ`);
  }
  // 6.3 the memo's world plant under E5, with the four in and out (not 'nocls': under E5 the layer read fixes the tiers)
  for (const [id, pts] of FULL ? [['S224', 6], ['S370', 4]] : [['S370', 4]]) {
    const base = pts === PTS && id === 'S370' ? [lean4, off4] : [solve(id, 'CAND', ND, pts), solve(id, 'CAND', { ...ND, tsLean: false }, pts)];
    const xin = differ(base[0], solve(id, 'CAND', { ...ND, expMemoPlant: 'noworld' }, pts)), xout = differ(base[1], solve(id, 'CAND', { ...ND, tsLean: false, expMemoPlant: 'noworld' }, pts));
    ok(xin.d > 0 && xout.d > 0, `6  planted on ${id} at ${pts} points, the memo's world left out of its key: ${xin.d} of ${xin.n} values differ with the four in, ${xout.d} of ${xout.n} with them out`);
  }
  // 6.4 the split, with the four on: two parts the same as unsplit (S370 at 4 points)
  const { solveSplit } = await import('../solver/e2.mjs'), sOpts = { ...D29_OPTS, ...LIGHT, lambda: LAMBDA, points: 4, bequestWeight: 0.02, ...ND };
  const one = S.solvePlan(E, M, candidatePlan(E, planOf('S370')), sOpts), two = await solveSplit(E, M, candidatePlan(E, planOf('S370')), sOpts, 2), xs = differ(one, two);
  ok(xs.d === 0 && two.meta.e2 && two.meta.e2.parts === 2, `6  S370 at 4 points, the four on: split across ${two.meta.e2 ? two.meta.e2.parts : '?'} parts, ${xs.d} of ${xs.n} values differ from the unsplit solve`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
