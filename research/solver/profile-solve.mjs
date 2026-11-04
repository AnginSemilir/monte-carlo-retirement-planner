/*
 * P0, THE PROFILE (the launch plan's step P: "the reference's build; the backward pass year by year: the expectation, the
 * bridge reader, the chooser; the store and the restore; the simulation per path and year: the chooser, the engine's step;
 * the workers' start-up"). EXPLORATORY: a measurement, deciding nothing. This is its Node half, on V8 as Chromium runs it;
 * profile-browser.cjs times the same solves in the container's Chromium, one worker and split, with the browser's store.
 *
 * On gate 5's four households (bridge 4, S126, S370, share 0.50) and S090, each with its floor at 80% of its target, and
 * S188, and S188 with its pension one tier lower (a thin plan with a tier above, so the 'auto' rule solves it twice), at the app's
 * settings (solveForApp, 45 points), on one thread:
 *   1. the solve, its phases timed by its own progress reports (the reference's build; the backward pass, each year; each
 *      pass where the 'auto' rule solves twice), and under V8's sampling profiler its self time put into the parts the plan
 *      names, by the file and function it was spent in: the reference (src/solver/adaptive.js), the bridge reader
 *      (reader.js), the expectation (grid.js's reads and fast.js's growth), the moves' flows (fast.js), the chooser's
 *      scoring and best move (solve.js), the engine (engine.mjs), the rest; the top functions beside them;
 *   2. the store and the restore: the record the worker stores (solverCache.js cacheOf), its bytes, and a solve restored from
 *      it (solveForApp with `restore`), timed;
 *   3. the simulation: the Strategy tab's paths of the solved plan, the table's choice and the engine's step a year apart;
 *   4. the workers' start-up: a worker thread that loads the solver's modules, from its creation to its first message.
 *   node research/solver/profile-solve.mjs [--paths N] [id ...]    (N 200)
 * Run with nothing else on the machine; its output is research/solver/results-profile.txt (with the browser half's).
 */
import { Session } from 'node:inspector/promises';
import { Worker } from 'node:worker_threads';
import { cpus, loadavg } from 'node:os';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { cacheOf, recordBytes } from '../../src/solverCache.js';
import { runPath, solvedContext } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
const N = opt('--paths', 200), SEED = 12345, TOP = 8;
const ids = args.length ? args : ['bridge 4', 'S126', 'S370', 'share 0.50', 'S090', 'S188', 'S188 pension one tier down'];
const cid = codeId();
const now = () => performance.now();
console.log(`P0, THE PROFILE, ITS NODE HALF (step P; EXPLORATORY): ${ids.join(', ')}; the floor at 80%; one thread; ${N} paths of seed ${SEED}; code ${cid ? cid.hash : 'unknown'}; ${cpus().length} cores (${cpus()[0].model}), load ${loadavg().map(x => x.toFixed(2)).join(' ')} at the start`);

// perf-step.mjs's households (audit-e2x.mjs's variant(), copied)
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0);
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
const BUILT = { 'bridge 4': { bridge: 4 }, 'share 0.50': { a0: 0.5 } };
// the thin plan where the 'auto' rule solves twice: no single household of the library has a tier above its pension at the
// app's settings, so S188 (a thin plan) with its pension one tier lower, Medium/High Risk
const S188_DOWN = () => { const p = JSON.parse(JSON.stringify(all.find(s => s.id === 'S188').plan)); p.accounts = p.accounts.map(a => (/^Pensions/.test(a.category) ? { ...a, risk: 'Medium/High Risk' } : a)); return { id: 'S188 pension one tier down', plan: p }; };
const caseOf = id => (id === 'S188 pension one tier down' ? S188_DOWN() : BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
const withFloor = p => E.normalizePlan({ ...p, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } });

// the parts the plan names, by the file and function the time was spent in
const PART = [
  ['the reference (adaptive.js)', (fn, f) => /solver\/adaptive\.js/.test(f)],
  ['the bridge reader (reader.js)', (fn, f) => /solver\/reader\.js/.test(f)],
  ['the expectation (grid.js reads, growth)', (fn, f) => /solver\/grid\.js/.test(f) || /^(grow|expit|realAt)$/.test(fn) || /^(stepExpect|finalYearExact|expectAt|expMemo)/.test(fn)],
  ["the moves' flows (fast.js)", (fn, f) => /solver\/fast\.js/.test(f)],
  ["the chooser's scoring and best move (solve.js)", (fn, f) => /solver\/solve\.js/.test(f)],
  ['the engine (engine.mjs)', (fn, f) => /engine\.mjs/.test(f)],
  ['the garbage collector', fn => fn === '(garbage collector)'],
];
function profileParts(profile) {
  const dt = profile.timeDeltas.reduce((a, b) => a + b, 0) / Math.max(1, profile.timeDeltas.length) / 1000;
  const parts = new Map(PART.map(([k]) => [k, 0])), byFn = new Map();
  let total = 0, rest = 0;
  for (const nd of profile.nodes) {
    const ms = nd.hitCount * dt; if (!ms) continue;
    const cf = nd.callFrame, fn = cf.functionName || '(anonymous)', f = (cf.url || '').replace(/^.*\/(src|research)\//, '$1/');
    total += ms;
    const p = PART.find(([, test]) => test(fn, f));
    if (p) parts.set(p[0], parts.get(p[0]) + ms); else rest += ms;
    const key = `${fn} ${f ? `${f}:${cf.lineNumber + 1}` : ''}`.trim();
    byFn.set(key, (byFn.get(key) || 0) + ms);
  }
  return { total, parts, rest, top: [...byFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP) };
}
const pc = (a, b) => `${(100 * a / b).toFixed(1)}%`;

const session = new Session();
session.connect();
for (const id of ids) {
  const c = caseOf(id);
  if (!c) throw new Error(`no household ${id}`);
  const plan = withFloor(c.plan);
  // 1. the solve, its phases by its own reports, under the sampling profiler
  const marks = [];
  await session.post('Profiler.enable');
  await session.post('Profiler.setSamplingInterval', { interval: 500 });
  await session.post('Profiler.start');
  const t0 = now();
  const r = solveForApp(E, M, plan, { progress: x => marks.push({ ...x, at: now() - t0 }) });
  const solveMs = now() - t0;
  const { profile } = await session.post('Profiler.stop');
  await session.post('Profiler.disable');
  const pr = profileParts(profile);
  const passes = [...new Set(marks.map(m => m.pass || 1))];
  const ra = r.meta.riskAbove ? (r.meta.riskAbove.decision || JSON.stringify(r.meta.riskAbove)).toString().slice(0, 60) : 'none';
  console.log(`\n== ${id}: the solve ${(solveMs / 1000).toFixed(1)} s on one thread; ${passes.length} pass${passes.length > 1 ? 'es' : ''} (the tier above: ${ra}); the moves ${r.actions.length}`);
  // each stretch between two reports is the work of the report that ends it: the reference is built inside the backward pass,
  // on its first bridge year, so its reports fall between two years' (the year it falls in keeps only its own stretches)
  let prev = 0;
  const spans = marks.map(m => { const d = m.at - prev; prev = m.at; return { ...m, d }; });
  const between = passes.length > 1 ? spans.filter((s, i) => i && (s.pass || 1) !== (spans[i - 1].pass || 1)).map(s => s.d) : [];
  for (const pass of passes) {
    // a pass's first stretch after another pass is the 'auto' rule's test, printed on its own below, not a year
    const ms = spans.filter((m, i) => (m.pass || 1) === pass && !(i && (spans[i - 1].pass || 1) !== pass));
    const ref = ms.filter(m => m.phase === 'reference'), refMs = ref.reduce((a, m) => a + m.d, 0);
    const byYear = []; let acc = 0;
    for (const m of ms) { if (m.phase === 'years') { byYear.push(acc + m.d); acc = 0; } else if (m.phase !== 'reference') acc += m.d; }
    const sorted = [...byYear].sort((a, b) => a - b), sum = byYear.reduce((a, b) => a + b, 0);
    console.log(`   pass ${pass}: the backward pass ${(sum / 1000).toFixed(1)} s over ${byYear.length} years, a year ${(sorted[0] / 1000).toFixed(2)} to ${(sorted[sorted.length - 1] / 1000).toFixed(2)} s (median ${(sorted[Math.floor(sorted.length / 2)] / 1000).toFixed(2)}); the reference's build inside it ${(refMs / 1000).toFixed(1)} s (${ref.length} reports)`);
  }
  if (between.length) console.log(`   between the passes (the first pass's 1,000 simulated paths, the 'auto' rule's test): ${(between[0] / 1000).toFixed(1)} s`);
  console.log(`   the solve's self time by part (${(pr.total / 1000).toFixed(1)} s sampled): ${[...pr.parts.entries()].map(([k, v]) => `${k} ${pc(v, pr.total)}`).join('; ')}; the rest ${pc(pr.rest, pr.total)}`);
  console.log(`   its top functions: ${pr.top.map(([k, v]) => `${k.split(' ')[0]} ${pc(v, pr.total)}`).join(', ')}`);
  // 2. the store and the restore
  let t = now();
  const rec = cacheOf(r);
  const recMs = now() - t, bytes = recordBytes(rec);
  t = now(); const copy = structuredClone(rec); const cloneMs = now() - t;
  t = now(); solveForApp(E, M, plan, { restore: copy }); const restoreMs = now() - t;
  console.log(`   the store: the record ${(bytes / 1048576).toFixed(0)} MB, made in ${recMs.toFixed(0)} ms, copied (structuredClone, as postMessage does) in ${cloneMs.toFixed(0)} ms; the restore: a solve from it ${(restoreMs / 1000).toFixed(2)} s (${(restoreMs / solveMs * 100).toFixed(1)}% of the solve)`);
  // 3. the simulation: the table's choice and the engine's step, a path and a year
  const sc = solvedContext(E, r), paths = E.pathsForSeed(SEED, N, sc.totalYears), orig = sc.policyOverride;
  for (let i = 0; i < Math.min(20, N); i++) runPath(E, sc, paths[i]);
  let chooseMs = 0, decisions = 0;
  const timed = { ...sc, policyOverride: { ...orig, choose(state, tt, held) { const a = now(); const x = orig.choose(state, tt, held); chooseMs += now() - a; decisions++; return x; } } };
  t = now(); for (const zs of paths) runPath(E, timed, zs); const pathMs = (now() - t) / N;
  const years = sc.totalYears + 1;
  console.log(`   the simulation: ${pathMs.toFixed(1)} ms a path, ${(pathMs / years).toFixed(2)} ms a year: the table's choice ${(chooseMs / N / years).toFixed(2)} ms (${pc(chooseMs / N, pathMs)}), the engine's step ${((pathMs - chooseMs / N) / years).toFixed(3)} ms; ${(decisions / N).toFixed(1)} decisions a path`);
}
session.disconnect();
// 4. the workers' start-up: a worker that loads the solver's modules, from its creation to its first message
{
  const src = new URL('./profile-solve-worker.mjs', import.meta.url), ts = [];
  for (let k = 0; k < 4; k++) {
    const t = now();
    await new Promise((res, rej) => { const w = new Worker(src); w.once('message', () => { ts.push(now() - t); w.terminate().then(res); }); w.once('error', rej); });
  }
  console.log(`\nthe workers' start-up (a worker thread loading the engine and the solver, to its first message), four in turn: ${ts.map(x => x.toFixed(0)).join(', ')} ms`);
}
console.log('\nEXPLORATORY: a measurement for step P, deciding nothing.');
