/*
 * THE SPEED WORK AFTER D138, ITS TIME (D137 (1), research/solver/SPEED-D138.md; EXPLORATORY, a guide, deciding nothing).
 * One household on one code tree, in a fresh process: the page's solve of it (src/solverApp.js solveForApp at the app's
 * points, the candidate as it stands: the savings split on, the ISA first held back for an employee, the 2029 cap), then the
 * engine's run of its table (research/solver/audit-phase4.mjs runPath, as save-default-identity.mjs runs it) on the first N
 * paths of the tuning seed 7002, the default and the speed mode (the chooser's shortlist, `chooserShortlist: 'order'`, set on
 * the solved table as the solve's option sets it: the backward pass never reads it), after a warm-up of each, in four rounds
 * taken in turn (default, speed, speed, default), each arm's CPU a path over its two rounds. Beside, each arm's outcomes as a
 * digest: the default's must be the same on both trees (P1's memo is exact) and in both of its rounds; the speed mode's need
 * not be the same on both trees (the shortlist now acts in a working saver's years after work).
 * The units: save-default-identity.mjs's four working savers from the savings split's v2 panel (two employees, two
 * self-employed), each at the default, and one household with no working year, S090, from the library, its plan as entered
 * (the speed work changes nothing on its path: the noise of the measure).
 *   node research/solver/speed-d138-time.mjs <before|after> <tree> <id> [N]   one JSON line on stdout
 *   node research/solver/speed-d138-time.mjs --read <lines file>     the guide, as results-speed-d138.txt holds it
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const SAVERS = [['S300F', 'employee'], ['S270', 'employee'], ['S280', 'self-employed'], ['S196', 'self-employed']];
const CONTROL = ['S090', 'no working year'];
const SEED = 7002, WARM = 10;

if (process.argv[2] === '--read') {
  const rows = readFileSync(process.argv[3], 'utf8').split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l));
  const at = (id, which) => rows.find(r => r.id === id && r.which === which);
  const med = v => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const x = v => `x${v.toFixed(2)}`, ms = us => `${(us / 1000).toFixed(1)} ms`;
  const mean = a => (a[0] + a[1]) / 2;
  const b0 = rows.find(r => r.which === 'before'), a0 = rows.find(r => r.which === 'after');
  console.log(`THE SPEED WORK AFTER D138, ITS TIME (EXPLORATORY; D137 (1), SPEED-D138.md): a guide, one process at a time on quiet cores; before, code ${b0.code}; after, code ${a0.code}; ${b0.N} paths of seed ${SEED} a unit, each arm twice (default, speed, speed, default) after a warm-up of ${WARM}, its CPU a path the mean of its two rounds`);
  const dRat = [], sRat = [], sOverD = [], sOverDBefore = [];
  let exact = true;
  for (const [id, kind] of [...SAVERS, CONTROL]) {
    const b = at(id, 'before'), a = at(id, 'after');
    if (!b || !a) { console.log(`${id}: missing (${b ? '' : 'before '}${a ? '' : 'after'})`); exact = false; continue; }
    const bd = mean(b.cpu.default), bs = mean(b.cpu.speed), ad = mean(a.cpu.default), as = mean(a.cpu.speed);
    const same = b.digest.default === a.digest.default && b.digest.default2 === b.digest.default && a.digest.default2 === a.digest.default;
    if (!same) exact = false;
    if (id !== CONTROL[0]) { dRat.push(ad / bd); sRat.push(as / bs); sOverD.push(as / ad); sOverDBefore.push(bs / bd); }
    console.log(`${id} (${kind}; ${a.moves} moves, copies live in ${a.live} of ${a.years} years): the solve ${b.solve} s before, ${a.solve} s after; a path, the default ${ms(bd)} to ${ms(ad)} (${x(ad / bd)}), the speed mode ${ms(bs)} to ${ms(as)} (${x(as / bs)}); the speed mode over the default ${x(bs / bd)} before, ${x(as / ad)} after; the default's outcomes ${same ? 'the same on both trees and in both rounds' : 'DIFFERENT'} (${a.digest.default}), the speed mode's ${b.digest.speed === a.digest.speed ? 'the same on both trees' : 'different on the two trees'}`);
  }
  console.log(`the four working savers, the median: a path at the default ${x(med(dRat))} (${x(Math.min(...dRat))} to ${x(Math.max(...dRat))}), in the speed mode ${x(med(sRat))} (${x(Math.min(...sRat))} to ${x(Math.max(...sRat))}); the speed mode over the default ${x(med(sOverDBefore))} before, ${x(med(sOverD))} after`);
  console.log(`P1's memo exact on every unit (the default's outcomes the same on both trees, bit for bit): ${exact ? 'YES' : 'NO'}`);
  process.exit(exact ? 0 : 1);
}

const WHICH = process.argv[2], TREE = process.argv[3] && resolve(process.argv[3]), ID = process.argv[4], N = Number(process.argv[5]) || 150;
if (!['before', 'after'].includes(WHICH) || !TREE || !ID) { console.error('speed-d138-time: <before|after> <tree> <id> [N] | --read <file>'); process.exit(2); }
const from = p => import(pathToFileURL(join(TREE, p)).href);
const E = await from('research/engine.mjs'), M = await from('src/solver/model.js');
const { solveForApp } = await from('src/solverApp.js');
const { APP_POINTS } = await from('src/solverSettings.js');
const { withTable } = await from('src/solver/bridge.js');
const { appPlan: panelPlan } = await from('research/solver/phase4-panel.mjs');
const { armA } = await from('research/solver/select-phase4.mjs');
const { runPath, solverPlanOf } = await from('research/solver/audit-phase4.mjs');
const { readSaveV2Panel } = await from('research/solver/save-v2-panel.mjs');
const { buildScenarios } = await from('research/policy-study/scenarios.mjs');
const { codeId } = await from('research/solver/code-id.mjs');

const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
let plan, kind;
if (ID === CONTROL[0]) { plan = prep(structuredClone(buildScenarios().find(s => s.id === ID).plan)); kind = CONTROL[1]; }
else {
  const U = readSaveV2Panel().find(u => u.id === ID), a = armA(panelPlan(U.plan), { tournament: false });
  plan = prep(solverPlanOf(U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy }));
  kind = SAVERS.find(s => s[0] === ID)[1];
}
const t0 = Date.now(), r = solveForApp(E, M, plan, { points: APP_POINTS }), solve = Math.round((Date.now() - t0) / 1000);
const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears;
const paths = E.pathsForSeed(SEED, N, T).map(z => Float64Array.from(z));
const live = r.nAt ? Array.from({ length: T + 1 }, (_, t) => r.nAt[Math.min(t, r.nAt.length - 1)] === r.actions.length).filter(Boolean).length : 0;
const round = (speed, upTo = N) => {
  const n = Math.min(upTo, N);
  r.chooserShortlist = speed ? 'order' : undefined;
  const h = createHash('sha256'), c0 = process.cpuUsage();
  for (let i = 0; i < n; i++) { const q = runPath(ctx, paths[i], false); h.update(JSON.stringify([q.survived, q.failYear, q.wealth, q.estate, q.tax, q.delivered, q.unmet])); }
  const c = process.cpuUsage(c0);
  r.chooserShortlist = undefined;
  return { us: (c.user + c.system) / n, digest: h.digest('hex').slice(0, 12) };
};
round(false, WARM); round(true, WARM);
const d1 = round(false), s1 = round(true), s2 = round(true), d2 = round(false);
const cid = codeId();
console.log(JSON.stringify({ which: WHICH, tree: TREE, code: cid ? cid.hash : '?', id: ID, kind, N, solve, moves: r.actions.length, live, years: T + 1,
  cpu: { default: [d1.us, d2.us], speed: [s1.us, s2.us] }, digest: { default: d1.digest, default2: d2.digest, speed: s1.digest, speed2: s2.digest } }));
