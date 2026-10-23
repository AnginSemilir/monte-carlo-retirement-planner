// SPEED REVIEW (exploratory): one household, one arm, as 7u-F's audit solves it; times the solve and the engine's run of
// the solved table, and prints a hash over every table array so that two code versions can be compared bit for bit.
// usage (from the repository root): node profile-run.mjs <household> <SHIP|CAND|DECOMP> [paths] [weight]; profiled as
//   node --cpu-prof --cpu-prof-interval 2000 profile-run.mjs S224 SHIP 200 (and S362 CAND 200), then profsum.mjs
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
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, arm = 'CAND', nArg = '2000', wArg = '0.02'] = process.argv.slice(2);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const base = { lambda: P.LAMBDA, points: P.PTS, bequestWeight: Number(wArg) };
const t0 = process.hrtime.bigint();
const r = arm === 'SHIP' ? S.solvePlan(E, M, C.candidatePlan(E, plan), base)
  : C.solveCandidate(E, M, plan, arm === 'CAND' ? base : { ...base, readerRef: undefined, adaptiveLattice: undefined });
const solveMs = Number(process.hrtime.bigint() - t0) / 1e6;
// a hash over every typed array reachable from each world's table (survival, estate, policy, ...), in a fixed key order
const hsh = createHash('sha256'); let arrays = 0, cells = 0;
const walk = (o, depth, seen) => {
  if (!o || typeof o !== 'object' || seen.has(o) || depth > 3) return; seen.add(o);
  if (ArrayBuffer.isView(o)) { hsh.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); arrays++; cells += o.length; return; }
  if (Array.isArray(o)) { o.forEach(x => walk(x, depth + 1, seen)); return; }
  for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; hsh.update(k); walk(o[k], depth + 1, seen); }
};
r.mix.tables.forEach(tab => walk(tab, 0, new Set()));
const T = r.m.ctx.totalYears, N = Number(nArg);
const ctx = E.buildContext(B.withTable(r.m.ctx.plan, r));
const paths = E.pathsForSeed(99001, N, T);
const t1 = process.hrtime.bigint(); let ok = 0;
for (const zs of paths) if (E.runTrial(ctx, Float64Array.from(zs)).survived) ok++;
const engMs = Number(process.hrtime.bigint() - t1) / 1e6;
const rd = r.mix.tables[0].g.reader;
console.log(JSON.stringify({ id, arm, w: Number(wArg), moves: r.actions.length, years: T + 1, solveS: +(solveMs / 1000).toFixed(2), engineS: +(engMs / 1000).toFixed(2), engineMsPerPath: +(engMs / N).toFixed(3), survival: +(100 * ok / N).toFixed(2),
  adaptive: !!(rd && rd.adaptive && rd.adaptive.lattice), tableHash: hsh.digest('hex').slice(0, 16), arrays, cells }));
