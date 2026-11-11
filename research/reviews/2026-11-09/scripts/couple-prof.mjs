// EXPLORATORY: where a couple's solved path spends its time under the engine: self time by function, and the time under
// each part of the joint move (the review's item 11). Seed 4242.
//   REPO_ROOT=<the branch, or a copy with prototype/couple-flat.diff> [FLAT=0] [TOP=22] [INCL=name,name] node couple-prof.mjs <couple> [points 4] [paths 30]
// FLAT=0 on a patched copy profiles the path as it was. <couple>: plan-of.mjs's names.
import inspector from 'node:inspector';
import { repoRoot } from './root.mjs';
import { planOf } from './plan-of.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const CJ = await import(R + '/src/solver/couple.js');
const { solveCouple, withCouple, COUPLE } = CJ;
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const id = process.argv[2] || 'S127';
const { plan } = planOf(E, buildScenarios, id);
const pts = Number(process.argv[3] || 4), nP = Number(process.argv[4] || 30);
if (process.env.FLAT === '0') COUPLE.flat = false;
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t00 = Date.now();
const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
const solveS = (Date.now() - t00) / 1000;
const ctx = E.buildContext(withCouple(cp.plan, cp)), paths = E.pathsForSeed(4242, nP + 3, ctx.totalYears);
for (let i = 0; i < 3; i++) E.runTrial(ctx, paths[nP + i]);
const session = new inspector.Session(); session.connect();
const post = (m, p) => new Promise((res, rej) => session.post(m, p, (e, r) => (e ? rej(e) : res(r))));
await post('Profiler.enable'); await post('Profiler.setSamplingInterval', { interval: 500 }); await post('Profiler.start');
const t0 = Date.now(); let surv = 0;
for (let i = 0; i < nP; i++) if (E.runTrial(ctx, paths[i]).survived) surv++;
const ms = (Date.now() - t0) / nP;
const { profile } = await post('Profiler.stop');
const self = new Map(), dt = profile.timeDeltas, byId = new Map(profile.nodes.map(n => [n.id, n]));
let total = 0;
profile.samples.forEach((sid, i) => { const n = byId.get(sid), k = `${n.callFrame.functionName || '(anonymous)'} ${n.callFrame.url.split('/').slice(-1)[0]}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + dt[i]); total += dt[i]; });
const br = (tab) => (tab.g && tab.g.reader ? tab.g.reader.years.reduce((a, b) => a + (b ? 1 : 0), 0) : 0);
console.log(`${id} at ${pts} points (solve ${solveS.toFixed(0)} s): a couple's path ${ms.toFixed(0)} ms over ${ctx.totalYears + 1} years (${(ms / (ctx.totalYears + 1)).toFixed(1)} ms a decision), ${surv} of ${nP} surviving; bridge years self ${br(cp.tables.self)}, partner ${br(cp.tables.part)}; mixture ${cp.tables.self.mix ? cp.tables.self.mix.tables.length : 1}, nodes ${(cp.tables.self.quadNodes || []).length || 5}, moves ${cp.tables.self.actions.length}; self time by function:`);
[...self].sort((a, b) => b[1] - a[1]).slice(0, Number(process.env.TOP || 22)).forEach(([k, v]) => console.log(`  ${(100 * v / total).toFixed(1)}%  ${k}`));
const kids = new Map(profile.nodes.map(n => [n.id, n.children || []])), selfById = new Map(); profile.samples.forEach((sid, i) => selfById.set(sid, (selfById.get(sid) || 0) + dt[i]));
const incl = nid => (selfById.get(nid) || 0) + kids.get(nid).reduce((s, c) => s + incl(c), 0);
for (const name of (process.env.INCL || 'chooseJoint,rankFor,chooseAction,expectedValue,shareBridge,step,grow,cloneState,ownerState,vecOf,value,cutAhead,readValues,movedState,profileOf').split(',')) { let v = 0; const walk = (nid, inside) => { const n = byId.get(nid), hit = n.callFrame.functionName === name; if (hit && !inside) v += incl(nid); for (const c of kids.get(nid)) walk(c, inside || hit); }; walk(profile.nodes[0].id, false); console.log(`  inclusive ${name}: ${(100 * v / total).toFixed(1)}%`); }
