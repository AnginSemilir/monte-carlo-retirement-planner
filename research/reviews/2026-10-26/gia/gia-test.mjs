/*
 * M15 v3's tests (EXPLORATORY; research/reviews/2026-10-26/GIA-LADDER.md). From the root of a copy of the code, engine built.
 *   node gia-test.mjs hash <household> <points>   the latest candidate's tables hashed, the ladder unset (run on both codes)
 *   node gia-test.mjs all                         on the ladder's code: the gate, the superset, the plants, the shared chooser
 *   node gia-test.mjs inert <household> <points>  inert rungs leave today's layers bit for bit (env PLANT2=readlayer0: must not)
 *   node gia-test.mjs diagnose <household> <pts>  where the superset fails, by year and world (env SOLVER_INTERP=linear)
 * e3pcls is off throughout (declared: the solver's code changed, so its pin is stale; the copies it makes are exact).
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js'), F = await imp('src/solver/fast.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const LAMBDA = 0.0223606797749979;
const byId = id => buildScenarios().find(s => s.id === id);
const planOf = (id, gain = 0) => { const h = byId(id); return E.resolveMpaa(E.normalizePlan({ ...h.plan,
  accounts: h.plan.accounts.map(a => (/^Other Investments/.test(a.category) && a.owner === 'Myself' && E.num(a.balance, 0) > 0 ? { ...a, unrealisedGain: Math.round(gain * E.num(a.balance, 0)) } : a)),
  config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } })); };
const solve = (id, pts, extra = {}, gain = 0) => S.solvePlan(E, M, C.candidatePlan(E, planOf(id, gain)), { ...C.CANDIDATE_OPTS, e3pcls: false, lambda: LAMBDA, points: pts, ...extra });
const arrays = r => { const out = []; for (const ls of r.tablesW.layW) for (const L of ls) for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); return out; };
const hashOf = A => { const h = createHash('sha256'); for (const a of A) h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)); return h.digest('hex').slice(0, 16); };
const [mode, id, ptsArg] = process.argv.slice(2);
let fails = 0; const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fails++; };

if (mode === 'hash') {
  const t0 = Date.now(), r = solve(id, Number(ptsArg || 6));
  console.log(`${id} at ${ptsArg || 6} points, the ladder unset: hash ${hashOf(arrays(r))}, ${r.actions.length} moves, layers ${r.meta.tierState}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  process.exit(0);
}

const supersetOf = (offR, onR, label) => {
  const JW = onR.mix ? onR.mix.weights : null, K = onR.tablesW.layW.length, wR = onR.wR, wB = onR.wB, T = onR.m.ctx.totalYears;
  let n = 0, below = 0, worst = 0, worstAt = '', atT = 0;
  for (let j = 0; j < 4; j++) for (let t = 0; t <= T; t++) for (let i = 0; i < onR.g.size; i++) {
    let vOn = 0, vOff = 0;
    for (let k = 0; k < K; k++) {
      const a = onR.tablesW.layW[k][j], b = offR.tablesW.layW[k][j], w = JW ? JW[k] : 1 / K;
      vOn += w * (a.surv[t][i] + wR * a.resil[t][i] + wB * a.beq[t][i] - a.short[t][i]);
      vOff += w * (b.surv[t][i] + wR * b.resil[t][i] + wB * b.beq[t][i] - b.short[t][i]);
    }
    n++;
    if (vOn < vOff - 1e-9) { below++; if (t === T) atT++; if (vOff - vOn > worst) { worst = vOff - vOn; worstAt = `layer ${j}, year ${t}, cell ${i}`; } }
  }
  console.log(`the superset${label}: ${below} of ${n} (layer, year, cell) values below today's by more than 1e-9 (${atT} in the final year); the largest gap ${worst.toExponential(2)} (${worstAt || '-'})`);
  return { below, atT, worst };
};
if (mode === 'superset') {
  const lin = process.env.SOLVER_INTERP === 'linear';
  const X = process.env.SUPERSET_EXTRA ? JSON.parse(process.env.SUPERSET_EXTRA) : {};
  const a = solve(id, Number(ptsArg || 6), X), b = solve(id, Number(ptsArg || 6), { ...X, giaLadder: true });
  const exact = lin && X.raiseSurvival === false;
  const x = supersetOf(a, b, ` on ${id} at ${ptsArg || 6} points, survival read ${lin ? 'LINEARLY (SOLVER_INTERP=linear)' : 'in log-odds'}${Object.keys(X).length ? `, with ${JSON.stringify(X)}` : ''}`);
  check(exact ? x.below === 0 : x.atT === 0, exact ? 'with a linear read and the raise credit not weighted by survival, a move\'s score is linear in the corners\' scores, so the larger menu can only raise every value: none below' : 'the final year, where the read is exact: none below (before it, the log-odds read and the raise credit\'s survival weight are not linear in the score)');
  console.log(fails ? `FAILED: ${fails}` : 'ALL PASS');
  process.exit(0);
}
if (mode === 'inert') {
  // the replacement for the superset (GIA-LADDER.md, the amendment): the rungs made inert ('samerate': each rung move a copy of
  // the bottom joint step's move, entered at the same switch charge) must leave today's four layers bit for bit, in every
  // world: every value, and the move stored (by its identity, as the indices move); env PLANT2 adds a planted fault, which must
  // not ('readlayer0': a rung move's backward read takes next year's layer 0, not its own)
  const pts = Number(ptsArg || 6), plant2 = process.env.PLANT2 || '';
  const a = solve(id, pts);
  F.GIA_LADDER.plant = ['samerate', plant2].filter(Boolean).join(',');
  const b = solve(id, pts, { giaLadder: true });
  F.GIA_LADDER.plant = '';
  const K = a.tablesW.layW.length, T = a.m.ctx.totalYears;
  const idOf = (r, ai) => { const x = r.actions[ai]; return x.tierGia > 0 ? `rung ${x.tierGia}` : `${x.label}|${x.tierPen || 0}/${x.tierIsa || 0}`; };
  let n = 0, diff = 0, worst = 0, polDiff = 0, rungStored = 0;
  for (let k = 0; k < K; k++) for (let j = 0; j < 4; j++) {
    const La = a.tablesW.layW[k][j], Lb = b.tablesW.layW[k][j];
    for (let t = 0; t <= T; t++) for (let i = 0; i < a.g.size; i++) {
      n++;
      for (const key of ['surv', 'beq', 'resil', 'short']) { const x = La[key][t][i], y = Lb[key][t][i]; if (!Object.is(x, y)) { diff++; worst = Math.max(worst, Math.abs(x - y)); } }
      if (idOf(a, La.pol[t][i]) !== idOf(b, Lb.pol[t][i])) { polDiff++; if (b.actions[Lb.pol[t][i]].tierGia > 0) rungStored++; }
    }
  }
  console.log(`inert rungs on ${id} at ${pts} points (plants: ${['samerate', plant2].filter(Boolean).join(', ')}): ${b.actions.length} moves against ${a.actions.length}, layers ${b.meta.tierState}; today's four layers in ${K} worlds, ${n} (layer, year, cell) entries: ${diff} values not bit for bit (largest ${worst.toExponential(2)}), ${polDiff} stored moves not the same (${rungStored} of them a rung)`);
  if (plant2) check(diff > 0 || polDiff > 0, `the planted fault '${plant2}' parts today's layers from today's tables: caught`);
  else check(diff === 0 && polDiff === 0, `inert rungs leave today's four layers bit for bit, every value and every stored move`);
  console.log(fails ? `FAILED: ${fails}` : 'ALL PASS');
  process.exit(0);
}
if (mode === 'diagnose') {
  // where the superset fails, by year: the mixture's values below today's, and the cells where one world's value falls
  const pts = Number(ptsArg || 6), a = solve(id, pts), b = solve(id, pts, { giaLadder: true });
  const JW = b.mix ? b.mix.weights : null, K = b.tablesW.layW.length, wR = b.wR, wB = b.wB, T = b.m.ctx.totalYears;
  const val = (L, t, i) => L.surv[t][i] + wR * L.resil[t][i] + wB * L.beq[t][i] - L.short[t][i];
  const tot = { mix: 0, world: 0, worldOnly: 0 };
  console.log(`where the superset fails on ${id} at ${pts} points, survival read ${process.env.SOLVER_INTERP === 'linear' ? 'linearly' : 'in log-odds'}; today's four layers, ${b.g.size} cells a layer; worlds weighted ${JW ? JW.map(x => x.toFixed(3)).join('/') : 'equally'}`);
  console.log('  year: mixture values below today\'s (largest gap) | cells where some world\'s own value falls (largest), and of them the mixture not below');
  for (let t = T; t >= 0; t--) {
    let mix = 0, mixW = 0, world = 0, worldW = 0, worldOnly = 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < b.g.size; i++) {
      let vOn = 0, vOff = 0, fall = 0;
      for (let k = 0; k < K; k++) {
        const x = val(b.tablesW.layW[k][j], t, i), y = val(a.tablesW.layW[k][j], t, i), w = JW ? JW[k] : 1 / K;
        vOn += w * x; vOff += w * y; if (x < y - 1e-9) fall = Math.max(fall, y - x);
      }
      const below = vOn < vOff - 1e-9;
      if (below) { mix++; mixW = Math.max(mixW, vOff - vOn); }
      if (fall > 0) { world++; worldW = Math.max(worldW, fall); if (!below) worldOnly++; }
    }
    tot.mix += mix; tot.world += world; tot.worldOnly += worldOnly;
    if (t >= T - 4 || t % 5 === 0 || mix > 0 && t >= T - 8) console.log(`  ${String(t).padStart(4)}: ${String(mix).padStart(6)} (${mixW.toExponential(2)}) | ${String(world).padStart(6)} (${worldW.toExponential(2)}), ${worldOnly}`);
  }
  console.log(`  all years: ${tot.mix} mixture values below today's; ${tot.world} cells where some world's own value falls, ${tot.worldOnly} of them with the mixture not below`);
  process.exit(0);
}
// 1. the gate: S248 (its GIA 2% of the pots) with the ladder on gives today's tables bit for bit
{
  const off = solve('S248', 6), on = solve('S248', 6, { giaLadder: true });
  check(hashOf(arrays(off)) === hashOf(arrays(on)) && on.meta.giaLadder && on.meta.giaLadder.on === false && on.actions.length === off.actions.length,
    `the gate: S248 (the GIA ${(100 * on.meta.giaLadder.share).toFixed(1)}% of the pots) with the ladder on: the same tables bit for bit (${hashOf(arrays(on))}), the same ${on.actions.length} moves, the rungs not added`);
}
// 2. the ladder on S330: its menu, its layers, the superset, and its moves' rates
const off = solve('S330', 6), on = solve('S330', 6, { giaLadder: true });
{
  const gl = on.meta.giaLadder, tiersGia = on.c.tiers.gia.map(x => x.name);
  console.log(`S330: the GIA ${(100 * gl.share).toFixed(1)}% of the pots; rungs added ${gl.rungs}; the GIA's list ${tiersGia.join(', ')}; layers off ${off.meta.tierState}, on ${on.meta.tierState}; moves ${off.actions.length} and ${on.actions.length}`);
  check(gl.on && gl.rungs === 2 && on.meta.tierState === `${off.meta.tierState.split(',').map(x => x + '/0').join(',')},3/3/1,3/3/2` && on.actions.length === off.actions.length * 6 / 4,
    'the ladder on S330: two rungs after the bottom joint step (3/3/1, 3/3/2), six layers, the menu half as large again');
  // the superset: at each of today's four layers, each cell and year, the mixture score of the stored move, on against off
  const JW = on.mix ? on.mix.weights : null, K = on.tablesW.layW.length, wR = on.wR, wB = on.wB, T = on.m.ctx.totalYears;
  let n = 0, below = 0, worst = 0, worstAt = '', atT = 0;
  for (let j = 0; j < 4; j++) for (let t = 0; t <= T; t++) for (let i = 0; i < on.g.size; i++) {
    let vOn = 0, vOff = 0;
    for (let k = 0; k < K; k++) {
      const a = on.tablesW.layW[k][j], b = off.tablesW.layW[k][j], w = JW ? JW[k] : 1 / K;
      vOn += w * (a.surv[t][i] + wR * a.resil[t][i] + wB * a.beq[t][i] - a.short[t][i]);
      vOff += w * (b.surv[t][i] + wR * b.resil[t][i] + wB * b.beq[t][i] - b.short[t][i]);
    }
    n++;
    if (vOn < vOff - 1e-12) { below++; if (t === T) atT++; if (vOff - vOn > worst) { worst = vOff - vOn; worstAt = `layer ${j}, year ${t}, cell ${i}`; } }
  }
  // measured, not a test (GIA-LADDER.md, the amendment): one move for every world and the log-odds read let a larger menu lower
  // a value; with each world choosing its own move, a fixed reader and a linear read it cannot ('superset' mode shows both)
  console.log(`INFO  the superset, as measured: ${below} of ${n} (layer, year, cell) values below today's (${atT} in the final year); the largest gap ${worst.toExponential(2)} (${worstAt || '-'}): not a test under one move for every world (the amendment)`);
  // the rung moves grow the GIA at the rung's rates, the pension and ISA at their bottom step's
  const ai0 = on.c.acts.findIndex(a => a.tierPen === 3 && a.tierIsa === 3 && a.tierGia === 0), ai1 = on.c.acts.findIndex(a => a.tierGia === 1), ai2 = on.c.acts.findIndex(a => a.tierGia === 2);
  const g = i => on.c.acts[i].real[2];
  check(ai1 > 0 && ai2 > 0 && g(ai1) < g(ai0) && g(ai2) < g(ai1) && on.c.acts[ai1].real[0] === on.c.acts[ai0].real[0] && on.c.acts[ai1].real[1] === on.c.acts[ai0].real[1],
    `the rungs' rates: the GIA at ${(100 * g(ai0)).toFixed(2)}%, ${(100 * g(ai1)).toFixed(2)}%, ${(100 * g(ai2)).toFixed(2)}% (real), the pension and ISA held at their bottom step's`);
}
// 3. the plants
{
  F.GIA_LADDER.plant = 'samerate';
  const p = solve('S330', 6, { giaLadder: true });
  F.GIA_LADDER.plant = 'samerate,readlayer0';
  const q = solve('S330', 6, { giaLadder: true });
  F.GIA_LADDER.plant = '';
  const ai0 = p.c.acts.findIndex(a => a.tierPen === 3 && a.tierIsa === 3 && a.tierGia === 0), ai1 = p.c.acts.findIndex(a => a.tierGia === 1);
  const caught = p.c.acts[ai1].real[2] === p.c.acts[ai0].real[2];
  check(caught && hashOf(arrays(p)) !== hashOf(arrays(on)), `the plant 'samerate' (the rungs grown at the plan's GIA rates): the rates check would fail on it, and its tables differ (${hashOf(arrays(p))} against ${hashOf(arrays(on))})`);
  // the inert rungs (the amendment's replacement for the superset): with 'samerate' each rung move is a copy of the bottom joint
  // step's, entered at the same charge, so today's four layers must be today's bit for bit in every world, values and stored
  // moves; the planted wrong-layer read ('readlayer0') must part them
  const today = r => { const out = []; for (const ls of r.tablesW.layW) for (const L of ls.slice(0, 4)) for (const key of ['surv', 'beq', 'resil', 'short']) for (const x of L[key]) out.push(x); return out; };
  const moveIds = r => { const ids = []; for (const ls of r.tablesW.layW) for (const L of ls.slice(0, 4)) for (const pl of L.pol) for (const ai of pl) { const x = r.actions[ai]; ids.push(x.tierGia > 0 ? `rung ${x.tierGia}` : `${x.label}|${x.tierPen || 0}/${x.tierIsa || 0}`); } return ids.join(';'); };
  const hOff = hashOf(today(off)), hP = hashOf(today(p)), hQ = hashOf(today(q)), mOff = moveIds(off);
  check(hP === hOff && moveIds(p) === mOff, `the inert rungs: today's four layers bit for bit (${hP} against ${hOff}), every stored move the same`);
  check(hQ !== hOff || moveIds(q) !== mOff, `the planted wrong-layer read ('readlayer0') parts them (${hQ}): caught`);
}
{
  // the decision-time tax: a GIA switch with a 40% gain, from the bottom joint step to the first GIA rung
  const c = on.c, s = new Float64Array(7), T = on.m.ctx.totalYears, t = Math.min(T, 40);
  s[0] = 200000; s[1] = 100000; s[2] = 400000 + c.yr.buffer[t]; s[3] = 0.4; s[4] = 0; s[5] = 0; s[6] = -1;
  const ai = c.acts.findIndex(a => a.tierGia === 1 && a.level === 1), held = { pen: 3, isa: 3, gia: 0 };
  const run = () => { const p = Float64Array.from(s); F.flow(c, t, ai, p); const before = Float64Array.from(p); const paid = F.chargeSwitch(c, p, held, c.acts[ai], t); return { paid, gainAfter: p[3], before }; };
  const a = run();
  const d = Math.abs(c.tiers.gia[1].equity - c.tiers.gia[0].equity), slice = (a.before[2] - Math.min(a.before[2], c.yr.buffer[t])) * d, dealing = slice * c.switchCost;
  F.GIA_LADDER.plant = 'nocgt'; const b = run(); F.GIA_LADDER.plant = '';
  check(a.paid > dealing + 1 && Math.abs(b.paid - dealing) < 1e-6 && Math.abs(a.gainAfter - a.before[3] * (1 - d)) < 1e-12,
    `the decision-time tax: a GIA switch (a slice of £${Math.round(slice)}, its gain share ${a.before[3].toFixed(3)} after the year's flow) pays £${Math.round(a.paid)} (dealing £${Math.round(dealing)} and the tax), the gain share falls to ${a.gainAfter.toFixed(3)} (the slice rebought at cost); the plant 'nocgt' pays £${Math.round(b.paid)}, the dealing alone: caught`);
}
// 4. the shared chooser with the ladder: every score the same as scoreMoves' on 20 paths (S2's own check)
{
  S.CHOOSER.check = true; S.SHARE_CHECKED.n = 0;
  const paths = E.pathsForSeed(7002, 20, on.m.ctx.totalYears);
  let err = null, giaYears = 0;
  try { for (const zs of paths) S.runPolicy(on, Float64Array.from(zs), { visit: (t, s, held, ai) => { if (on.c.acts[ai].tierGia > 0) giaYears++; } }); } catch (e) { err = e.message; }
  S.CHOOSER.check = false;
  check(!err && S.SHARE_CHECKED.n > 0, `the shared chooser with the ladder: ${S.SHARE_CHECKED.n} scores checked against scoreMoves on 20 paths${err ? `: ${err}` : ', every one the same'}; GIA rungs held in ${giaYears} path-years`);
}
console.log(fails ? `FAILED: ${fails}` : 'ALL PASS');
