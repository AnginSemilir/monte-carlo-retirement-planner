// EXPLORATORY (the external review, 10 Nov): the solve on anchors and shortlists (opts.coarse, prototype/solve-coarse.diff)
// against the solve as it is.
//   REPO_ROOT=<a tree with solve-coarse.diff applied> node solve-anchors.mjs <household> <points> <paths> <setting>[,<setting>...]
// a setting: see solve-cfg.mjs, e.g. w2a3b3g2c2-NT-LRVOH-h3
// One process: the solve as it is, then each setting, each compared with it: the solve's time, the tables (the stored move
// and the cell's score, every layer, year and cell, the worlds weighted as the choice weighs them) and both plans run by the
// engine on the same paths of SEED (default 99003).
//   BREAK=1      also the score lost by wealth point and by year
//   TIME_ONLY=1  the solves timed in turn and nothing else
//   CACHE=0      solve the whole menu afresh; else its tables, its time and its paths are kept in SOLVE_CACHE (default: the
//                system's temporary folder) and read back by the next run, so a later run's "the solve as it is" time is
//                the first run's
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs'); const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js'); const S = await import(R + '/src/solverStrategy.js');
const { COARSE } = await import(R + '/src/solver/solve.js'); const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP] = [process.argv[2] || 'S116', Number(process.argv[3] || 4), Number(process.argv[4] || 200)];
const CONFIGS = (process.argv[5] || 'w2a1b1-NT-none').split(','), SEED = Number(process.env.SEED || 99003);
const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
const solveWith = cfg => { const t0 = process.hrtime.bigint(); const r = solveForApp(E, M, plan, { points: pts, research: researchOf(cfg, light) }); return { r, secs: Number(process.hrtime.bigint() - t0) / 1e9 }; };
import { parseConfig as parse, researchOf } from './solve-cfg.mjs';
// the solve as it is, kept on disk between runs (its tables, its time and its paths' outcomes): CACHE=0 solves it afresh
import fs from 'node:fs';
import os from 'node:os';
const cdir = (process.env.SOLVE_CACHE || os.tmpdir() + '/solve-anchors-cache').replace(/\/$/, '') + '/', ckey = `${id}-${pts}-${SEED}`, NB = Math.max(nP, Number(process.env.NPBASE || (pts >= 30 ? 4000 : nP)));
const KEYS = ['surv', 'beq', 'resil', 'short', 'pol'];
function saveBase(b, out0) {
  const r = b.r, g = r.g, T = r.m.ctx.totalYears, K = r.mix.tables.length, NL = r.mix.tables[0].tsLayers.length;
  const f = new Float64Array(K * NL * (T + 1) * g.size * 4), u = new Uint16Array(K * NL * (T + 1) * g.size); let o = 0, ou = 0;
  for (let k = 0; k < K; k++) for (let j = 0; j < NL; j++) { const L = r.mix.tables[k].tsLayers[j]; for (let t = 0; t <= T; t++) { for (const key of KEYS.slice(0, 4)) { f.set(L[key][t], o); o += g.size; } u.set(L.pol[t], ou); ou += g.size; } }
  fs.mkdirSync(cdir, { recursive: true });
  fs.writeFileSync(cdir + ckey + '.f64', Buffer.from(f.buffer)); fs.writeFileSync(cdir + ckey + '.u16', Buffer.from(u.buffer));
  fs.writeFileSync(cdir + ckey + '.json', JSON.stringify({ secs: b.secs, ref: r.g.reader && r.g.reader.adaptive ? r.g.reader.adaptive.secs : 0, size: g.size, dims: [g.np, g.ni, g.nt, g.gain.length, g.pcls.length], T, K, NL, weights: Array.from(r.mix.weights), wB: r.wB, wR: r.wR, moves: r.actions.length, out0: out0.map(x => [x.survived ? 1 : 0, x.delivered, x.target, x.terminalPot]) }));
}
function loadBase() {
  const h = JSON.parse(fs.readFileSync(cdir + ckey + '.json', 'utf8')), fb = fs.readFileSync(cdir + ckey + '.f64'), ub = fs.readFileSync(cdir + ckey + '.u16');
  const f = new Float64Array(fb.buffer, fb.byteOffset, fb.byteLength / 8), u = new Uint16Array(ub.buffer, ub.byteOffset, ub.byteLength / 2); let o = 0, ou = 0;
  const tables = []; for (let k = 0; k < h.K; k++) { const lays = []; for (let j = 0; j < h.NL; j++) { const L = { surv: [], beq: [], resil: [], short: [], pol: [] }; for (let t = 0; t <= h.T; t++) { for (const key of KEYS.slice(0, 4)) { L[key][t] = f.subarray(o, o + h.size); o += h.size; } L.pol[t] = u.subarray(ou, ou + h.size); ou += h.size; } lays.push(L); } tables.push({ tsLayers: lays }); }
  return { ...h, tables, out0: h.out0.map(([s, d, tg, p]) => ({ survived: !!s, delivered: d, target: tg, terminalPot: p })) };
}
// TIME_ONLY=1: the solve as it is and each config, timed in turn in this process, nothing else read or run (a quiet machine's figure)
if (process.env.TIME_ONLY === '1') {
  const refOf = r => (r.g.reader && r.g.reader.adaptive ? r.g.reader.adaptive.secs : 0);
  const b = solveWith(null);
  console.log(`${id} at ${pts} points, the solves timed in turn in one process: the solve as it is ${b.secs.toFixed(1)} s (its bridge reference ${refOf(b.r).toFixed(1)} s); EXPLORATORY`);
  for (const cfg of CONFIGS) { const x = solveWith(parse(cfg)); console.log(`  ${cfg}: the solve ${x.secs.toFixed(1)} s (${(b.secs / x.secs).toFixed(2)} times; its bridge reference ${refOf(x.r).toFixed(1)} s); ${COARSE.stats.fine} cells on a shortlist of ${(COARSE.stats.listed / Math.max(1, COARSE.stats.fine)).toFixed(1)} moves`); }
  process.exit(0);
}
let B0;
if (process.env.CACHE !== '0' && fs.existsSync(cdir + ckey + '.json') && JSON.parse(fs.readFileSync(cdir + ckey + '.json', 'utf8')).out0.length >= nP) B0 = loadBase();
else { const b = solveWith(null), sc0 = S.solvedContext(E, b.r), paths0 = E.pathsForSeed(SEED, NB, b.r.m.ctx.totalYears); saveBase(b, paths0.map(zs => S.runPath(E, sc0, zs))); B0 = loadBase(); }
B0.out0.length = nP;   // path i is built from the seed and i alone (engine pathsForSeed), so the first nP of a longer set are the nP-path set
const T = B0.T, g = { size: B0.size, np: B0.dims[0], ni: B0.dims[1], nt: B0.dims[2], gain: { length: B0.dims[3] }, pcls: { length: B0.dims[4] } };
const base = { secs: B0.secs, r: { mix: { tables: B0.tables, weights: B0.weights }, wB: B0.wB, wR: B0.wR, actions: { length: B0.moves } } }, out0 = B0.out0;
const paths = E.pathsForSeed(SEED, nP, T);
const runAll = sc => paths.map(zs => S.runPath(E, sc, zs));
console.log(`${id} at ${pts} points: grid ${g.np} x ${g.ni} x ${g.nt} x ${g.gain.length} x ${g.pcls.length}, ${T + 1} years, ${base.r.actions.length} moves; the solve as it is ${base.secs.toFixed(1)} s (its bridge reference ${(B0.ref || 0).toFixed(1)} s); survival ${(100 * out0.filter(x => x.survived).length / nP).toFixed(2)}% on ${nP} paths of seed ${SEED}; EXPLORATORY`);
const score = (L, t, i, wB, wR) => L.surv[t][i] + wR * L.resil[t][i] + wB * L.beq[t][i] - L.short[t][i];
for (const cfg of CONFIGS) {
  const pc = parse(cfg); if (!pc.coarse) COARSE.stats = { fine: 0, listed: 0, fallback: 0, flows: 0, hits: 0 };
  const x = solveWith(pc), st = { ...COARSE.stats };
  const byW = new Float64Array(g.np), byT = new Float64Array(T + 1);
  // the tables: every world's layers
  // the tables: each layer, year and cell, the worlds' scores weighted as the choice weighs them
  let n = 0, polDiff = 0, sum = 0, worst = 0, over01 = 0, over1 = 0, gainN = 0, bits = 0, y0 = 0, y0w = 0;
  const A = base.r.mix.tables, B = x.r.mix.tables, W = base.r.mix.weights, wB = base.r.wB, wR = base.r.wR, NLy = A[0].tsLayers.length;
  for (let j = 0; j < NLy; j++) for (let t = 0; t <= T; t++) for (let i = 0; i < g.size; i++) {
    n++; if (A[0].tsLayers[j].pol[t][i] !== B[0].tsLayers[j].pol[t][i]) polDiff++;
    let d = 0, same = true; for (let k = 0; k < A.length; k++) { const La = A[k].tsLayers[j], Lb = B[k].tsLayers[j]; d += W[k] * (score(La, t, i, wB, wR) - score(Lb, t, i, wB, wR)); if (!Object.is(La.surv[t][i], Lb.surv[t][i]) || !Object.is(La.beq[t][i], Lb.beq[t][i]) || !Object.is(La.short[t][i], Lb.short[t][i]) || !Object.is(La.resil[t][i], Lb.resil[t][i])) same = false; }
    if (!same) bits++; sum += d; if (d > worst) worst = d; if (d > 1e-3) over01++; if (d > 1e-2) over1++; if (d < -1e-9) gainN++;
    if (t === 0 && j === 0) { y0 += d; if (d > y0w) y0w = d; }
    byW[i % g.np] += d; byT[t] += d;
  }
  if (process.env.BREAK === '1') {
    const perW = n / g.np, perT = n / (T + 1);
    console.log(`    by wealth point (points lost on average): ${Array.from(byW, v => (100 * v / perW).toFixed(2)).join(' ')}`);
    console.log(`    by year: ${Array.from(byT, v => (100 * v / perT).toFixed(2)).join(' ')}`);
  }
  const out = runAll(S.solvedContext(E, x.r));
  let saved = 0, lost = 0, dA = 0, dB = 0, tg = 0, pA = 0, pB = 0;
  for (let i = 0; i < nP; i++) { const a = out0[i], b = out[i]; if (b.survived && !a.survived) saved++; if (a.survived && !b.survived) lost++; dA += a.delivered; dB += b.delivered; tg += a.target; pA += a.terminalPot; pB += b.terminalPot; }
  const ref = x.r.g.reader && x.r.g.reader.adaptive ? x.r.g.reader.adaptive.secs : 0;
  console.log(`  ${cfg}: the solve ${x.secs.toFixed(1)} s (${(base.secs / x.secs).toFixed(2)} times; its bridge reference ${ref.toFixed(1)} s); cells on a shortlist ${st.fine} with ${(st.listed / Math.max(1, st.fine)).toFixed(1)} moves listed (${(100 * st.hits / Math.max(1, st.listed * base.r.mix.tables.length)).toFixed(0)}% of their expectations a listed move's own; ${st.fallback} cells with nothing listed); tables: ${bits} of ${n} entries differ in a value, the stored move at ${(100 * polDiff / n).toFixed(2)}%, the score lost ${(100 * sum / n).toExponential(2)} points on average, over 0.1 points at ${(100 * over01 / n).toFixed(3)}%, over 1 point at ${(100 * over1 / n).toFixed(4)}%, the worst ${(100 * worst).toFixed(2)}, higher at ${gainN}; year 0: ${(100 * y0 / g.size).toExponential(2)} on average, the worst ${(100 * y0w).toFixed(3)} | paths: ${saved} saved, ${lost} lost of ${nP} (${(100 * (saved - lost) / nP).toFixed(2)} points, se ${(100 * Math.sqrt(Math.max(0, saved + lost - (saved - lost) ** 2 / nP)) / nP).toFixed(2)}); spending delivered ${(100 * (dB - dA) / tg).toFixed(3)} points of target; mean pot left ${(100 * (pB / pA - 1)).toFixed(2)}%`);
}
