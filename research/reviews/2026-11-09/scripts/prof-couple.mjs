// EXPLORATORY: where a couple's solved path spends its time (self time by function), S091 at light settings, 30 paths of seed 4242.
import inspector from 'node:inspector';
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple } = await import(R + '/src/solver/couple.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S091').plan);
const pts = Number(process.argv[2] || 4), nP = Number(process.argv[3] || 30);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
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
profile.samples.forEach((id, i) => { const n = byId.get(id), k = `${n.callFrame.functionName || '(anonymous)'} ${n.callFrame.url.split('/').slice(-1)[0]}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + dt[i]); total += dt[i]; });
console.log(`S091 at ${pts} points: a couple's path ${ms.toFixed(0)} ms over ${ctx.totalYears + 1} years (${(ms / (ctx.totalYears + 1)).toFixed(1)} ms a decision), ${surv} of ${nP} surviving; self time by function:`);
[...self].sort((a, b) => b[1] - a[1]).slice(0, 16).forEach(([k, v]) => console.log(`  ${(100 * v / total).toFixed(1)}%  ${k}`));
// inclusive time under the two halves of the joint move
const kids = new Map(profile.nodes.map(n => [n.id, n.children || []])), selfById = new Map(); profile.samples.forEach((id, i) => selfById.set(id, (selfById.get(id) || 0) + dt[i]));
const incl = id => (selfById.get(id) || 0) + kids.get(id).reduce((s, c) => s + incl(c), 0);
for (const name of ['rankFor', 'expectedValue', 'step', 'chooseJoint', 'scoreMoves', 'shareBridge']) { let v = 0; const seen = new Set(); const walk = (id, inside) => { const n = byId.get(id), hit = n.callFrame.functionName === name; if (hit && !inside) v += incl(id); for (const c of kids.get(id)) walk(c, inside || hit); }; walk(profile.nodes[0].id, false); console.log(`  inclusive ${name}: ${(100 * v / total).toFixed(1)}%`); }
