// THE SPEED REVIEW'S TIMING SCRIPT (EXPLORATORY), for its instruction 5 (STATE.md D24): research/reviews/2026-10-23/
// scripts/speed-timing.mjs on the branch review/external-2026-10-21 at cff3d86, copied here so the re-time can be
// reproduced, with three changes and its hashes and timings untouched: S1's counts read from solve.js's EXP_MEMO_STATS
// and the reference's arrays from its arrays() where the code has them (the port exposes no globalThis), and the e3pcls pin
// checked before the candidate's solve (e3pcls-guard.test.mjs; each copy checks its own code against its own pin); and
// one hash added for D28 (tableHashNoBelow, below), the others untouched.
// One household and arm, solved as 7u-F's audit solves it (guardrails and the lookahead off, the floor at 0.8 of the
// target); times the solve and the engine's run of the solved table, and prints hashes two code versions must share:
//   tableHash  the typed arrays within three levels of each world's view (each world's own tables)
//   layerHash  every typed array of the solve's tables at any depth, every layer of every world included
//   runHash    each engine path's outcome (survived, fail age, end pots, minimum pot, lifetime tax, unmet, spend, cuts)
//   arefHash   the adaptive reference's own arrays, where the code exposes them
// On the ported code (S.CHOOSER exists) the engine runs twice on the same paths, the chooser's sharing off and then on.
// Env: PTS (grid points; the panel's 30), PATHS (engine paths, 200; 0 skips the engine), CHECKPATHS, MEMO=0 (S1 off).
// usage (from a copy's root): node <path>/speed-timing.mjs <household> <SHIP|CAND|JOINT> [estate weight]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const S = await imp('src/solver/solve.js');
const B = await imp('src/solver/bridge.js');
const C = await imp('research/solver/candidate.mjs');
const P = await imp('research/solver/panel-7uf.mjs');
const PIN = await imp('research/solver/e3pcls-pin.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, arm = 'CAND', wArg = '0.02'] = process.argv.slice(2);
const N = Number(process.env.PATHS ?? 200), PTS = Number(process.env.PTS || P.PTS);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const base = { lambda: P.LAMBDA, points: PTS, bequestWeight: Number(wArg), ...(process.env.MEMO === '0' ? { expMemo: false } : {}) };
if (arm !== 'SHIP') PIN.checkE3pclsPin({ ...C.CANDIDATE_OPTS, ...base });   // e3pcls guard: the candidate's solve below
const t0 = process.hrtime.bigint();
// JOINT: the candidate without the tier state (joint worlds alone; the charge needs the tier state, so it goes too), the
// one configuration that reaches solve()'s joint-worlds block
const r = arm === 'SHIP' ? S.solvePlan(E, M, C.candidatePlan(E, plan), base)
  : arm === 'JOINT' ? S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, tierState: false, switchCharge: 0, ...base })
  : S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, ...base });
const solveMs = Number(process.hrtime.bigint() - t0) / 1e6;
const hsh = createHash('sha256'); let arrays = 0, cells = 0;
const walk = (o, depth, seen) => {
  if (!o || typeof o !== 'object' || seen.has(o) || depth > 3) return; seen.add(o);
  if (ArrayBuffer.isView(o)) { hsh.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); arrays++; cells += o.length; return; }
  if (Array.isArray(o)) { o.forEach(x => walk(x, depth + 1, seen)); return; }
  for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; hsh.update(k); walk(o[k], depth + 1, seen); }
};
r.mix.tables.forEach(tab => walk(tab, 0, new Set()));
const tableHash = hsh.digest('hex').slice(0, 16);
// tableHashNoBelow (D28's identity, tier-steps-identity.mjs): the same walk with meta's key `tiersBelow` skipped, which the
// code before the third step does not have, so a table that is the same bit for bit gives the same hash on both
const hsh2 = createHash('sha256');
const walk2 = (o, depth, seen) => {
  if (!o || typeof o !== 'object' || seen.has(o) || depth > 3) return; seen.add(o);
  if (ArrayBuffer.isView(o)) { hsh2.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; }
  if (Array.isArray(o)) { o.forEach(x => walk2(x, depth + 1, seen)); return; }
  for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c' || k === 'tiersBelow') continue; hsh2.update(k); walk2(o[k], depth + 1, seen); }
};
r.mix.tables.forEach(tab => walk2(tab, 0, new Set()));
const tableHashNoBelow = hsh2.digest('hex').slice(0, 16);
// layerHash: every typed array of the solve's own tables at any depth - each world's, and under the tier state every layer
// of every world (tablesW.layW), which tableHash's walk (three levels from each world's view) does not reach
const lh = createHash('sha256'); let layerArrays = 0;
const walkAll = (o, seen) => {
  if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
  if (ArrayBuffer.isView(o)) { lh.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); layerArrays++; return; }
  if (Array.isArray(o)) { o.forEach(x => walkAll(x, seen)); return; }
  for (const k of Object.keys(o).sort()) { lh.update(k); walkAll(o[k], seen); }
};
walkAll(r.tablesW, new Set());
const layerHash = lh.digest('hex').slice(0, 16);
const T = r.m.ctx.totalYears;
function arefHash() {
  const ref = r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref;
  const a = ref && ref.arrays ? ref.arrays() : globalThis.__aref; if (!a) return null;
  const h2 = createHash('sha256');
  const put = o => { if (!o) return; if (ArrayBuffer.isView(o)) { h2.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(put); return; } for (const k of Object.keys(o).sort((x, y) => Number(x) - Number(y))) { h2.update(k); put(o[k]); } };
  put(a.V); put(a.MV); put(a.V0); put(a.MV0); put(a.AST); put(a.ASTY);
  return h2.digest('hex').slice(0, 16);
}
const runEngine = () => {
  const ctx = E.buildContext(B.withTable(r.m.ctx.plan, r));
  const paths = E.pathsForSeed(99001, N, T);
  const ch = createHash('sha256'); let ok = 0;
  const t1 = process.hrtime.bigint();
  for (const zs of paths) { const x = E.runTrial(ctx, Float64Array.from(zs)); if (x.survived) ok++; ch.update([x.survived, x.failAge, x.terminalPot, x.terminalPotNet, x.minPot, x.lifetimeTax, x.unmetTotal, x.realisedSpend, x.cutYears, x.raiseYears].join(':') + ';'); }
  return { ms: Number(process.hrtime.bigint() - t1) / 1e6, ok, hash: ch.digest('hex').slice(0, 16) };
};
let eng = null, engOff = null, checked = null, chooserMemo = null;
if (N > 0) {
  if (S.CHOOSER) {
    S.CHOOSER.share = false; engOff = runEngine();
    S.CHOOSER.share = true; Object.assign(S.SHARE_CHECKED, { hits: 0, miss: 0, fails: 0 }); eng = runEngine(); chooserMemo = S.SHARE_CHECKED.hits !== undefined ? { hits: S.SHARE_CHECKED.hits, miss: S.SHARE_CHECKED.miss, fails: S.SHARE_CHECKED.fails } : null;
    if (process.env.CHECKPATHS) { S.CHOOSER.check = true; const ctx = E.buildContext(B.withTable(r.m.ctx.plan, r)); for (const zs of E.pathsForSeed(99001, Number(process.env.CHECKPATHS), T)) E.runTrial(ctx, Float64Array.from(zs)); checked = S.SHARE_CHECKED.n; S.CHOOSER.check = false; }
  } else eng = runEngine();
}
const engMs = eng ? eng.ms : 0, ok = eng ? eng.ok : 0, choices = eng ? eng.hash : '';
console.log(JSON.stringify({ id, arm, w: Number(wArg), points: PTS, memo: process.env.MEMO !== '0', moves: r.actions.length, years: T + 1, solveS: +(solveMs / 1000).toFixed(2), engineS: +(engMs / 1000).toFixed(2), engineMsPerPath: N ? +(engMs / N).toFixed(3) : null, survival: N ? +(100 * ok / N).toFixed(2) : null,
  tableHash, tableHashNoBelow, layerHash, layerArrays, runHash: choices, ...(engOff ? { engineMsPerPathShareOff: +(engOff.ms / N).toFixed(3), runHashShareOff: engOff.hash } : {}), ...(checked !== null ? { scoresChecked: checked } : {}), ...(chooserMemo ? { chooserMemo } : {}), arrays, cells, memoStats: S.EXP_MEMO_STATS ? { hits: S.EXP_MEMO_STATS.hits, miss: S.EXP_MEMO_STATS.misses } : globalThis.__memoStats || null, arefSecs: r.g && r.g.reader && r.g.reader.adaptive ? r.g.reader.adaptive.secs : null, arefHash: arefHash(), arefMemo: r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref && r.g.reader.adaptive.ref.dupStats ? { hits: r.g.reader.adaptive.ref.dupStats.hits, miss: r.g.reader.adaptive.ref.dupStats.misses } : globalThis.__aref ? { hits: globalThis.__aref.qHits, miss: globalThis.__aref.qMiss, NM: globalThis.__aref.NM } : null, riskAbove: r.meta.riskAbove ? r.meta.riskAbove.decision : null }));
