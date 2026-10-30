/*
 * EPSTEIN-ZIN SPENDING'S OWN TESTS (EXPLORATORY; EZ.md section 5; the patch ez/solve-ez.patch, on the agent's code at
 * a0e6400, in a local worktree only). Run from the root of the patched code, with the root of the original code given and,
 * optionally, a second original (the agent's code at 1b39400, on which the age-weight and dial units were solved):
 *   node ez-test.mjs <root of the original code> [<root of a second original>] [--dev]
 * --dev: every solve with e3pcls off, for use before the pin is refreshed on the patched code; never a record.
 * At light settings (4 wealth points, a small reference lattice), the candidate with EZ { gamma 4, rho 2 } on the layer loop
 * (tsOnce: false), and without EZ:
 *   1. OFF: on S090 and S328F, every table of every layer, world and year is the original code's to the bit, at the
 *      candidate's settings and on the layer loop, and 40 forward runs return the same; planted: EZ on parts the tables
 *   2. THE FORMULAS (S090), each against its definition computed here, each with a plant that must be caught:
 *      a. the chance of living each year (Gompertz, mode 90, dispersion 9, from the plan's age); planted: mode 91
 *      b. the ruin level, the guaranteed income after tax over the target, between ruinMin and 1; planted: no ruinMin
 *      c. the ruin path's value, as the sum the recursion unrolls to; planted: beta 0.99
 *      d. the aggregator at random years, levels and continuations; planted: rho 2.1
 *      e. the final year's end rule; planted: running out at ruinMin, not at the guaranteed income
 *      f. the failure year; planted: what is paid not held at ruinMin
 *   3. THE RECURSION IN THE TABLES (S090): at the opening, a middle retired year and the final year, at every cell and
 *      layer, each world's stored V^(1 - gamma) is the year's value, computed here from the formulas of 2, of the stored
 *      move's continuation as the chooser's scoreMoves reads it at the cell (the final year: of its chance of ending above
 *      the minimum pot), less the switch charge as a fraction; and the stored move is the best on the mixture of the
 *      worlds. Planted: rho 2.1 at the two earlier years, gamma 4.1 at the final year, each must fail
 *   4. THE CHOOSER: forward runs with the shared year's check on (each shared score recomputed by scoreMoves, a difference
 *      thrown); EZ's moves differ from the candidate's on some path; every run's figures finite
 *   5. THE REFUSALS: EZ with E5, without failDelivered, with a switch margin, and with gamma 1, each throws
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const ROOT = process.cwd(), ORIGS = process.argv.slice(2).filter(x => !x.startsWith('--')).map(x => resolve(x));
if (!ORIGS.length || ORIGS.length > 2) throw new Error('usage: node ez-test.mjs <root of the original code> [<root of a second original>] [--dev]');
const DEV = process.argv.includes('--dev');
const imp = (root, p) => import(pathToFileURL(resolve(root, p)).href);
const E = await imp(ROOT, 'research/engine.mjs'), M = await imp(ROOT, 'src/solver/model.js'), C = await imp(ROOT, 'research/solver/candidate.mjs');
const S = await imp(ROOT, 'src/solver/solve.js'), G = await imp(ROOT, 'src/solver/grid.js'), F = await imp(ROOT, 'src/solver/fast.js');
const ORIG = await Promise.all(ORIGS.map(async root => ({ root, E: await imp(root, 'research/engine.mjs'), M: await imp(root, 'src/solver/model.js'), C: await imp(root, 'research/solver/candidate.mjs'), S: await imp(root, 'src/solver/solve.js') })));
const { readPanel, appPlan } = await imp(ROOT, 'research/solver/phase4-panel.mjs');
const { armA } = await imp(ROOT, 'research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp(ROOT, 'research/solver/audit-phase4.mjs');

let failed = 0, passed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (c) passed++; else failed++; };
const sec = t0 => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
const panel = readPanel();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => { const h = panel.find(x => x.id === id); const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy; return prep(solverPlanOf(h.plan, { decumulationPolicy: pk })); };
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true }, ...(DEV ? { e3pcls: false } : {}) };
const EZ = { gamma: 4, rho: 2 }, LOOP = { tsOnce: false };
const { execSync } = await import('child_process');
const headOf = root => { try { return execSync('git log --oneline -1', { cwd: root }).toString().trim().slice(0, 7); } catch (e) { return '?'; } };
console.log(`EZ's tests${DEV ? ' (--dev: e3pcls off, not a record)' : ''}: the patched code at ${ROOT} (${headOf(ROOT)} with the patch), the original${ORIG.length > 1 ? 's' : ''} at ${ORIG.map(o => `${o.root} (${headOf(o.root)})`).join(' and ')}`);

// ---------------------------------------------------------------------------------------------------- 1. OFF
console.log('=========== 1. OFF: THE ORIGINAL CODE\'S TABLES AND RUNS ===========');
const KEYS = ['surv', 'lsurv', 'resil', 'lresil', 'beq', 'short', 'pol'];
const sameTables = (a, b) => {
  const La = a.tablesW.layW, Lb = b.tablesW.layW;
  let n = 0;
  if (!La || !Lb || La.length !== Lb.length) return { same: false, n, at: 'the worlds\' layers' };
  for (let k = 0; k < La.length; k++) {
    if (La[k].length !== Lb[k].length) return { same: false, n, at: `world ${k}'s layers` };
    for (let j = 0; j < La[k].length; j++) for (const key of KEYS) {
      const x = La[k][j][key], y = Lb[k][j][key];
      if (!x || !y || x.length !== y.length) return { same: false, n, at: `world ${k} layer ${j} ${key}` };
      for (let t = 0; t < x.length; t++) {
        const u = x[t], v = y[t];
        if (u.length !== v.length) return { same: false, n, at: `world ${k} layer ${j} ${key} year ${t}` };
        for (let i = 0; i < u.length; i++) { n++; if (!Object.is(u[i], v[i])) return { same: false, n, at: `world ${k} layer ${j} ${key} year ${t} cell ${i}: ${u[i]} against ${v[i]}` }; }
      }
    }
  }
  return { same: true, n };
};
const runsOf = (Sx, r, paths) => paths.map(zs => JSON.stringify(Sx.runPolicy(r, zs)));
const solved = {};
for (const id of ['S090', 'S328F']) {
  const plan = planOf(id);
  for (const [name, extra] of [['the candidate\'s settings', {}], ['the layer loop (tsOnce: false)', LOOP]]) {
    let t0 = Date.now();
    const a = C.solveCandidate(E, M, structuredClone(plan), { ...light, ...extra }), ta = sec(t0), paths = E.pathsForSeed(99001, 40, a.m.ctx.totalYears), ra = runsOf(S, a, paths);
    // the run record, its timings aside (every key named ms, at any depth)
    const flat = (o, pre = '', out = {}) => { for (const [k, x] of Object.entries(o || {})) { if (k === 'ms') continue; if (x && typeof x === 'object' && !Array.isArray(x)) flat(x, `${pre}${k}.`, out); else out[`${pre}${k}`] = JSON.stringify(x); } return out; };
    for (const o of ORIG) {
      t0 = Date.now();
      const b = o.C.solveCandidate(o.E, o.M, structuredClone(plan), { ...light, ...extra });
      const st = sameTables(a, b), rb = runsOf(o.S, b, paths), runDiff = ra.findIndex((x, i) => x !== rb[i]);
      const fa = flat(a.meta), fb = flat(b.meta), metaDiff = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter(k => fa[k] !== fb[k]);
      ok(st.same && st.n > 0 && runDiff < 0 && metaDiff.length === 0 && a.ez === null && a.meta.ez === undefined,
        `1. ${id}, ${name}, EZ off, against ${headOf(o.root)}: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${runDiff < 0 ? 'the same' : `differ first at path ${runDiff}`}; the run record ${metaDiff.length === 0 ? 'the same, its timings aside' : `differs at ${metaDiff.slice(0, 4).join(', ')}`} (the patched code's solve ${ta}, the original's ${sec(t0)})`);
    }
    if (extra === LOOP) solved[id] = { plan, off: a };
  }
}
{
  const t0 = Date.now(), plan = solved.S090.plan;
  const on = C.solveCandidate(E, M, structuredClone(plan), { ...light, ...LOOP, ez: EZ });
  const st = sameTables(on, solved.S090.off);
  ok(!st.same, `1. planted: S090 with EZ on parts the tables (first difference at ${st.at}) (${sec(t0)})`);
  solved.S090.on = on;
}

// ---------------------------------------------------------------------------------------------------- 2. THE FORMULAS
console.log('=========== 2. THE FORMULAS ===========');
const r = solved.S090.on, z = r.ez, T = r.m.ctx.totalYears, a0 = r.m.ctx.ageSelf0, spend = r.c.yr.spend, gam = EZ.gamma, rho = EZ.rho;
const e1 = 1 - rho, e2 = 1 - gam, rmin = 0.1, beta = 1;
ok(z && z.gamma === gam && z.rho === rho && z.beta === beta && z.ruinMin === rmin && z.mortality.mode === 90 && z.mortality.disp === 9 && JSON.stringify(r.meta.ez) === JSON.stringify({ gamma: gam, rho, beta, ruinMin: rmin, mortality: { mode: 90, disp: 9 } }),
  `2. the settings: ${JSON.stringify(r.meta.ez)} (the defaults beta 1, ruinMin 0.1, Gompertz mode 90, dispersion 9)`);
const maxRel = (f, n0, n1) => { let w = 0, at = -1; for (let i = n0; i <= n1; i++) { const [x, y] = f(i); const d = Math.abs(x - y) / Math.max(1e-300, Math.abs(y)); if (!(d <= w)) { w = d; at = i; } } return { w, at }; };
// a. the chance of living each year
const Sg = (mode, t) => Math.exp(-Math.exp((a0 - mode) / 9) * (Math.exp(t / 9) - 1));
const pOf = mode => t => Sg(mode, t + 1) / Sg(mode, t);
const pA = maxRel(t => [z.p[t], pOf(90)(t)], 0, T), pP = maxRel(t => [z.p[t], pOf(91)(t)], 0, T);
const alive = (from, to) => { let s = 1; for (let t = from - a0; t < to - a0; t++) s *= z.p[t]; return s; };
ok(pA.w < 1e-14, `2a. the chance of living each year is Gompertz's from age ${a0}: the largest relative gap ${pA.w.toExponential(2)} over ${T + 1} years${a0 <= 65 ? ` (alive at 75 given 65: ${alive(65, 75).toFixed(3)}; at 85: ${alive(65, 85).toFixed(3)})` : ''}`);
ok(!(pP.w < 1e-14), `    planted: against mode 91 the gap is ${pP.w.toExponential(2)}, caught`);
// b. the ruin level
const gi = t => r.c.yr.taxFree0[t] + E.calculateUKNetIncome(r.c.yr.taxable0[t], r.c.P);
const ruinOf = floor => t => (spend[t] > 0 ? Math.min(1, Math.max(floor, gi(t) / spend[t])) : 1);
const rA = maxRel(t => [z.ruin[t], ruinOf(rmin)(t)], 0, T), rP = maxRel(t => [z.ruin[t], ruinOf(0)(t)], 0, T);
const rSpend = Array.from(spend).map((x, t) => (x > 0 ? z.ruin[t] : null)).filter(x => x !== null);
ok(rA.w < 1e-14, `2b. the ruin level is the guaranteed income after tax over the target, between ${rmin} and 1: the largest gap ${rA.w.toExponential(2)} (in the spending years from ${Math.min(...rSpend).toFixed(3)} to ${Math.max(...rSpend).toFixed(3)})`);
ok(!(rP.w < 1e-14), `    planted: without the floor at ruinMin the gap is ${rP.w.toExponential(2)}, caught`);
// c. the ruin path's value, as the sum it unrolls to: V_t^(1 - rho) = sum over u of (beta^(u-t) prod p) x ruin_u^(1 - rho), the spending years and the final year
const vRuinOf = b => { const out = new Float64Array(T + 1); for (let t = 0; t <= T; t++) { let s = 0, d = 1; for (let u = t; u <= T; u++) { if (spend[u] > 0 || u === T) s += d * Math.pow(z.ruin[u], e1); d *= b * z.p[u]; } out[t] = Math.pow(s, 1 / e1); } return out; };
const vR = vRuinOf(beta), vRP = vRuinOf(0.99);
const vTarget = (() => { let s = 0, d = 1; for (let u = 0; u <= T; u++) { if (spend[u] > 0 || u === T) s += d; d *= beta * z.p[u]; } return Math.pow(s, 1 / e1); })();
const cA = maxRel(t => [z.vRuin[t], vR[t]], 0, T), cP = maxRel(t => [z.vRuin[t], vRP[t]], 0, T);
ok(cA.w < 1e-12, `2c. the ruin path's value is its unrolled sum: the largest relative gap ${cA.w.toExponential(2)} (at the opening ${z.vRuin[0].toPrecision(6)})`);
ok(!(cP.w < 1e-12), `    planted: beta 0.99 gives a gap of ${cP.w.toExponential(2)}, caught`);
// d. the aggregator
const valueOfWith = (rh, gm) => { const f1 = 1 - rh, f2 = 1 - gm; return (t, l, q) => { const ce = Math.pow(q, 1 / f2); return t >= T ? ce : Math.pow((spend[t] > 0 ? Math.pow(l, f1) : 0) + beta * z.p[t] * Math.pow(ce, f1), 1 / f1); }; };
const vOf = valueOfWith(rho, gam), vOfP = valueOfWith(2.1, gam);
let rnd = 12345; const u01 = () => ((rnd = (Math.imul(rnd, 1103515245) + 12345) >>> 0) / 4294967296);
const pts = Array.from({ length: 2000 }, () => { const t = Math.floor(u01() * (T + 1)), l = 0.8 + 0.3 * u01(), V = (0.3 + 0.7 * u01()) * vR[Math.min(T, t + 1)] * 3; return [t, l, Math.pow(V, e2)]; });
const dA = maxRel(i => [z.valueOf(...pts[i]), vOf(...pts[i])], 0, pts.length - 1), dP = maxRel(i => [z.valueOf(...pts[i]), vOfP(...pts[i])], 0, pts.length - 1);
ok(dA.w < 1e-13, `2d. the aggregator is its definition at 2,000 random years, levels and continuations: the largest relative gap ${dA.w.toExponential(2)}`);
ok(!(dP.w < 1e-13), `    planted: rho 2.1 gives a gap of ${dP.w.toExponential(2)}, caught`);
// e. the final year's end rule: E[V_T^(1 - gamma)] = s l^(1 - gamma) + (1 - s) ruin_T^(1 - gamma)
const fqOf = rT => (l, s) => s * Math.pow(l, e2) + (1 - s) * Math.pow(rT, e2);
const fpts = Array.from({ length: 500 }, () => [0.8 + 0.3 * u01(), u01()]);
const eA = maxRel(i => [z.finalQ(...fpts[i]), fqOf(z.ruin[T])(...fpts[i])], 0, fpts.length - 1), eP = maxRel(i => [z.finalQ(...fpts[i]), fqOf(rmin)(...fpts[i])], 0, fpts.length - 1);
ok(eA.w < 1e-13, `2e. the final year is at its level with the chance of ending above the minimum pot, at the guaranteed income's level (${z.ruin[T].toFixed(3)}) otherwise: the largest relative gap ${eA.w.toExponential(2)}`);
ok(z.ruin[T] !== rmin ? !(eP.w < 1e-13) : false, `    planted: running out at ruinMin gives a gap of ${eP.w.toExponential(2)}, caught`);
// f. the failure year
const fvOf = fl => (t, d) => { const dl = Math.max(fl, d); return t >= T ? dl : Math.pow((spend[t] > 0 ? Math.pow(dl, e1) : 0) + beta * z.p[t] * Math.pow(vR[t + 1], e1), 1 / e1); };
const vpts = Array.from({ length: 1000 }, () => [Math.floor(u01() * (T + 1)), 1.1 * u01()]);
const fA = maxRel(i => [z.failValue(...vpts[i]), fvOf(rmin)(...vpts[i])], 0, vpts.length - 1), fP = maxRel(i => [z.failValue(...vpts[i]), fvOf(0)(...vpts[i])], 0, vpts.length - 1);
ok(fA.w < 1e-12, `2f. a failure year is that year at what it pays (at least ${rmin}), then the ruin path: the largest relative gap ${fA.w.toExponential(2)} at 1,000 random years and levels`);
ok(!(fP.w < 1e-12), `    planted: what is paid not held at ruinMin gives a gap of ${fP.w.toExponential(2)}, caught`);

// ---------------------------------------------------------------------------------------------------- 3. THE RECURSION
console.log('=========== 3. THE RECURSION IN THE TABLES ===========');
{
  const g = r.g, n = r.actions.length, K = r.worlds.length, JW = r.mix.weights, LW = r.tablesW.layW, J = LW[0].length, sc = r.switchCharge || 0;
  const fresh_ = { _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null, _sc: null, _tx: null, _bq: null, _scm: null, _txm: null, _bqm: null, _sc2: null, _dec: null, _cm: null, _clsAt: null };
  const views = r.worlds.map(w => ({ ...w, ...fresh_ }));
  const fr = Array.from(spend).findIndex(x => x > 0), tm = Math.min(T - 1, fr + Math.floor((T - fr) / 2));
  const years = [...new Set([0, tm, T])];
  const fv = fvOf(rmin), vP = valueOfWith(2.1, gam);
  const SC = Array.from({ length: K }, () => new Float64Array(n)), SV = Array.from({ length: K }, () => new Float64Array(n)), TX = new Float64Array(n), BQ = new Float64Array(n);
  const failA = new Uint8Array(n), paid = new Float64Array(n), v = new Float64Array(7);
  for (const t of years) {
    const t0 = Date.now();
    let worst = 0, wAt = '', worstP = 0, nCells = 0, nVals = 0, nFail = 0, nSwitch = 0, choiceBad = 0, choiceAt = '', worstC = 0;
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
      const idx = g.index(ip, ii, it, ig, ic);
      G.toVec(g, ip, ii, it, ig, ic, v, t);
      for (let k = 0; k < K; k++) S.scoreMoves(views[k], Float64Array.from(v), t, SC[k], TX, BQ, null, null, SV[k]);
      // the moves that cannot pay, and what they pay (the backward pass's failDelivered level)
      for (let ai = 0; ai < n; ai++) {
        failA[ai] = SC[0][ai] === -Infinity ? 1 : 0; paid[ai] = 0;
        if (failA[ai]) { const post = Float64Array.from(v), unmet = F.flow(r.c, t, ai, post); paid[ai] = spend[t] > 0 ? Math.min(1, Math.max(0, r.levelOf[ai] - unmet / spend[t])) : 0; }
      }
      nCells++;
      for (let j = 0; j < J; j++) {
        // the year's value of a move in one world (or, k = -1, on the mixture), as the backward pass forms it, by the formulas of 2
        const valueAt = (ai, k, vfn, gm) => {
          const sw = r.tsLayerOf[ai] !== j ? 1 - sc : 1;
          if (failA[ai]) return fv(t, paid[ai]) * sw;
          const f2 = 1 - gm;
          const qOf = kk => (t >= T ? SV[kk][ai] * Math.pow(r.levelOf[ai], f2) + (1 - SV[kk][ai]) * Math.pow(z.ruin[T], f2) : SC[kk][ai]);
          let q = 0; if (k >= 0) q = qOf(k); else for (let kk = 0; kk < K; kk++) q += JW[kk] * qOf(kk);
          return vfn(t, r.levelOf[ai], q) * sw;
        };
        const a = LW[0][j].pol[t][idx];
        if (r.tsLayerOf[a] !== j) nSwitch++;
        if (failA[a]) nFail++;
        for (let k = 0; k < K; k++) {
          const stored = LW[k][j].resil[t][idx];
          const want = Math.pow(valueAt(a, k, vOf, gam), e2);
          const d = Math.abs(stored - want) / Math.abs(want); nVals++;
          if (!(d <= worst)) { worst = d; wAt = `world ${k}, layer ${j}, cell ${ip}/${ii}/${it}/${ig}/${ic}, ${r.actions[a].label || a}${failA[a] ? ' (cannot pay)' : ''}`; }
          // planted: rho 2.1 before the final year; at it, gamma 4.1 in the end rule
          const wantP = t >= T ? Math.pow(valueAt(a, k, valueOfWith(rho, 4.1), 4.1), e2) : Math.pow(valueAt(a, k, vP, gam), e2);
          worstP = Math.max(worstP, Math.abs(stored - wantP) / Math.abs(wantP));
        }
        // the stored move is the best on the mixture (ties within 1e-12 of the value)
        let best = -Infinity; for (let ai = 0; ai < n; ai++) best = Math.max(best, valueAt(ai, -1, vOf, gam));
        // (the backward pass takes a move within its eps, 1e-12 of value, of the best when its estate is larger)
        const va = valueAt(a, -1, vOf, gam), gap = best - va;
        if (gap > worstC) worstC = gap;
        if (gap > 2e-12) { choiceBad++; if (!choiceAt) choiceAt = `layer ${j}, cell ${ip}/${ii}/${it}/${ig}/${ic}: stored ${r.actions[a].label || a} ${va} against the best ${best}`; }
      }
    }
    ok(nVals > 0 && worst < 1e-9, `3. year ${t}${t === T ? ' (the final year)' : t === tm ? ' (a middle retired year)' : ' (the opening)'}: ${nVals} stored values (${nCells} cells x ${J} layers x ${K} worlds; ${nFail} cell-layers whose stored move cannot pay, ${nSwitch} that switch) are the year's value of the stored move as the chooser reads it: the largest relative gap ${worst.toExponential(2)}${worst > 0 ? ` (${wAt})` : ''} (${sec(t0)})`);
    ok(choiceBad === 0, `   the stored move is the best on the mixture of the worlds at every cell-layer (the largest shortfall from the best ${worstC.toExponential(2)} of value, in value units, where a plan at target every year is worth ${vTarget.toPrecision(4)} at the opening)${choiceAt ? `; first miss: ${choiceAt}` : ''}`);
    ok(!(worstP < 1e-9), `   planted: ${t >= T ? 'gamma 4.1 in the end rule' : 'rho 2.1'} gives a gap of ${worstP.toExponential(2)}, caught`);
  }
}

// ---------------------------------------------------------------------------------------------------- 4. THE CHOOSER
console.log('=========== 4. THE CHOOSER ===========');
{
  const t0 = Date.now(), paths = E.pathsForSeed(99001, 40, T);
  const n0 = S.SHARE_CHECKED.n; S.CHOOSER.check = true;
  let threw = '';
  try { for (const zs of paths.slice(0, 10)) S.runPolicy(r, zs); } catch (e) { threw = e.message; }
  S.CHOOSER.check = false;
  const nChecked = S.SHARE_CHECKED.n - n0;
  ok(!threw && nChecked > 0, `4. the shared year's scores are scoreMoves' to the bit under EZ: ${nChecked} move scores checked on 10 forward runs${threw ? `; threw: ${threw}` : ''}`);
  const on = paths.map(zs => S.runPolicy(r, zs)), off = paths.map(zs => S.runPolicy(solved.S090.off, zs));
  const differ = on.filter((x, i) => x.levelSum !== off[i].levelSum || x.changes !== off[i].changes || x.tierChanges !== off[i].tierChanges).length;
  const finite = on.every(x => [x.levelSum, x.lifetimeTax, x.terminal, x.spendYears].every(Number.isFinite));
  const mean = (xs, f) => xs.reduce((s, x) => s + f(x), 0) / xs.length;
  ok(differ > 0 && finite, `4. EZ's moves reach the forward runs: ${differ} of 40 paths spend or switch otherwise than the candidate's; every figure finite (survival ${on.filter(x => x.survived).length} against ${off.filter(x => x.survived).length}; mean level ${mean(on, x => x.levelSum / Math.max(1, x.spendYears)).toFixed(4)} against ${mean(off, x => x.levelSum / Math.max(1, x.spendYears)).toFixed(4)}) (${sec(t0)})`);
}

// ---------------------------------------------------------------------------------------------------- 5. THE REFUSALS
console.log('=========== 5. THE REFUSALS ===========');
{
  const plan = solved.S090.plan;
  for (const [name, extra, want] of [
    ['with E5 (tsOnce left on)', { ez: EZ }, /ez runs on the tier state/],
    ['without failDelivered', { ...LOOP, ez: EZ, failDelivered: false }, /ez runs on the tier state/],
    ['with a switch margin', { ...LOOP, ez: EZ, switchMargin: 0.001 }, /ez runs on the tier state/],
    ['with gamma 1', { ...LOOP, ez: { gamma: 1, rho: 2 } }, /ez needs/]
  ]) {
    let msg = '';
    try { C.solveCandidate(E, M, structuredClone(plan), { ...light, ...extra }); } catch (e) { msg = e.message; }
    ok(want.test(msg), `5. EZ ${name} throws${msg ? `: "${msg.slice(0, 90)}..."` : ': it did not'}`);
  }
}

console.log(failed ? `FAILED: ${failed} of ${passed + failed} checks` : `ALL PASS: ${passed} checks${DEV ? ' (--dev: not a record)' : ''}`);
process.exit(failed ? 1 : 0);
