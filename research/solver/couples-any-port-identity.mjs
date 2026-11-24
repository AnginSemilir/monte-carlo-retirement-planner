/*
 * EVERY COUPLE ON THE SOLVER, W'S IDENTITY (COUPLES-ANY.md, the test's class W; EXPLORATORY, the tuning seed): the app's route
 * for a couple with one of step 4's shapes, taken by default since D146, on the dress rehearsal's W units
 * (results/couples-any-7002: 4,000 paths of seed 7002, 45 points, its ROUTE the household route taking every shape the
 * household plan takes), against the rehearsal's ROUTE arrays path for path, as couples-open-port-identity.mjs held D144's
 * route to the registered test's pilot. No arm had run these shapes to hold the app's route to (the reviewer on step 4's change
 * of default, finding 4):
 *   - the guard (src/couplesSwitch.js coupleSolverOn), on the plan as the panel landed it and on the plan handed to the solvers
 *     (couples-any-panel.mjs anySolverPlanOf), on and not swapped: where the younger holds 75%, on the household route alone,
 *     lifting Y (D144); at the library's holdings, inside the guard before D143, with no route of its own and nothing lifted, so
 *     the client solves it at the couples' default form (src/solverClient.js, APP_COUPLE.household), on the household route
 *     wherever the household plan takes its shape, which the cut below shows it does at the app's own shapes (guardOk);
 *   - the cut, the table and the assembly as the page's worker makes them (src/solverWorker.js: householdCut at the form with
 *     the app's own shapes, src/solverSettings.js APP_COUPLE.takeShapes, which the cut and the assembly take where none are
 *     named; the table by solveForApp at the app's points inside the cut's bands, src/solver/household.js bandsAt; and
 *     householdSolved with the top three and the couples' joint move's tie-break and hold), the table's digest against the
 *     rehearsal's;
 *   - the paths: the engine's run (audit-phase4.mjs runPath) of the solved couple on the page's own context
 *     (src/solverStrategy.js solvedContext), every key against the rehearsal's ROUTE arrays, bit for bit.
 * A unit IDENTICAL where the guard is as above, the digest the rehearsal's and every array the same. Its first line names the
 * rehearsal's stamp, which reduce-couples-any.mjs reads before it reads W.
 *   node research/solver/couples-any-port-identity.mjs [unit ...] > research/solver/results-couples-any-port-identity.txt
 * CAI_SMOKE=1 runs it at 6 points on a small lattice (its tables the rehearsal's only where that ran at the same settings, as a
 * smoke of the audit at CA_PTS=6 does); CAI_DIR the
 * rehearsal's folder where it is not this tree's; CAI_PART=k/n every n-th unit from the k-th (a part's lines), the parts then
 * put together, each unit's line in the panel's order under part 0's header and one count:
 *   node research/solver/couples-any-port-identity.mjs --combine part0.txt part1.txt ... > research/solver/results-couples-any-port-identity.txt
 * which refuses parts that miss a unit or hold one twice, a part whose own count disagrees with its lines, or no header.
 * THE REGISTERED TEST (REG=1): the same on the registered run's W units (results/couples-any-run, seed 7027, every path the run
 * ran), after the run and before its read, which reads W only with it (reduce-couples-any.mjs, its file naming the run's stamp):
 *   REG=1 CAI_PART=k/n node research/solver/couples-any-port-identity.mjs > part; then --combine as above
 *     > research/solver/results-couples-any-registered-port-identity.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_COUPLE, appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { coupleSolverOn } from '../../src/couplesSwitch.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readAnyPanel, anySolverPlanOf, REG } from './couples-any-panel.mjs';
import { runPath } from './audit-phase4.mjs';
import { KEYS } from './audit-couples-any.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const HEAD = 'EVERY COUPLE ON THE SOLVER, W\'S IDENTITY';
/* the parts put together: part 0's header, every W unit's line once in the panel's order, one count; null and the faults where
   a part misses a unit, holds one twice, names a unit outside W, disagrees with its own count, or the header is not one */
export function combineParts(texts, wIds) {
  const faults = [], lines = new Map(), heads = [];
  texts.forEach((text, i) => {
    const t = text.split('\n').filter(l => l.trim());
    heads.push(...t.filter(l => l.startsWith(HEAD)));
    const own = t.map(l => [l, l.match(/^(\S+)\s+(IDENTICAL|DIFFERS);/)]).filter(([, m]) => m);
    for (const [l, m] of own) { if (lines.has(m[1])) faults.push(`${m[1]} twice`); else if (!wIds.includes(m[1])) faults.push(`${m[1]} not a W unit`); else lines.set(m[1], { l, same: m[2] === 'IDENTICAL' }); }
    const cnt = t.map(l => l.match(/^part \d+\/\d+: (\d+) of (\d+) units IDENTICAL$/)).filter(Boolean);
    if (cnt.length !== 1) faults.push(`part ${i}: ${cnt.length} counts`);
    else if (+cnt[0][1] !== own.filter(([, m]) => m[2] === 'IDENTICAL').length || +cnt[0][2] !== own.length) faults.push(`part ${i}: its count disagrees with its lines`);
  });
  if (heads.length !== 1 || !/stamp code \S+ audit \S+,/.test(heads[0] || '')) faults.push(`${heads.length} headers naming a stamp`);
  for (const id of wIds) if (!lines.has(id)) faults.push(`${id} missing`);
  if (faults.length) return { faults };
  const same = wIds.filter(id => lines.get(id).same).length;
  return { text: [heads[0], ...wIds.map(id => lines.get(id).l), `${same} of ${wIds.length} units IDENTICAL`].join('\n'), same, n: wIds.length };
}
/* the guard as the unit's holding says: on and not swapped; Y75 on the household route alone, lifting Y (D144); the library's
   holdings inside the guard before D143, no route of their own and nothing lifted (the client's default form) */
export const liftedWant = hold => (hold === 'Y75' ? 'Y' : '');
export const guardOk = (g, hold) => !!g && g.on === true && g.why === null && !g.swap && (g.lifted || []).join(',') === liftedWant(hold)
  && (hold === 'Y75' ? g.route === 'household' : !g.route);
if (process.argv[2] === '--planted') {
  // the guard check on planted answers: each holding's own answer, then each fault it refuses
  const own = { on: true, share: 0.6, why: null, swap: false }, y75 = { on: true, share: 0.25, why: null, swap: false, route: 'household', lifted: ['Y'] };
  const guardCases = [
    ['the library\'s holding, inside the guard before D143', guardOk(own, 'own'), true],
    ['Y75, on the household route alone lifting Y', guardOk(y75, 'Y75'), true],
    ['the library\'s holding opened by a class (a route and a lift)', guardOk({ ...own, route: 'household', lifted: ['Y'] }, 'own'), false],
    ['Y75 with no route of its own', guardOk({ ...y75, route: undefined }, 'Y75'), false],
    ['Y75 lifting another class', guardOk({ ...y75, lifted: ['E'] }, 'Y75'), false],
    ['a guard off for its shape', guardOk({ on: false, why: 'shape', shape: 'risks' }, 'own'), false],
    ['a couple swapped', guardOk({ ...own, swap: true }, 'own'), false]];
  let gbad = 0;
  for (const [n, got, want] of guardCases) { const ok = got === want; if (!ok) gbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} the guard: ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  // the combine on planted parts: a clean pair, then each fault it refuses, and a unit that differs counted as such
  const H = `${HEAD} (EXPLORATORY): ..., stamp code c1 audit a1, against its ROUTE arrays; ...`, ids = ['w1', 'w2', 'w3'];
  const ln = (id, s = 'IDENTICAL') => `${id.padEnd(16)} ${s}; the guard on`;
  const p0 = [H, ln('w1'), ln('w3'), 'part 0/2: 2 of 2 units IDENTICAL'].join('\n'), p1 = [ln('w2'), 'part 1/2: 1 of 1 units IDENTICAL'].join('\n');
  const read = c => (c.faults ? `refused: ${c.faults.join('; ')}` : `${c.same} of ${c.n}; ${c.text.split('\n').map(l => l.split(/\s+/)[0]).join(' ')}`);
  const cases = [
    ['two parts combine in the panel\'s order', read(combineParts([p0, p1], ids)), `3 of 3; ${HEAD.split(' ')[0]} w1 w2 w3 3`],
    ['a unit missing', read(combineParts([p0], ids)), 'refused: w2 missing'],
    ['a unit twice', read(combineParts([p0, p1, [ln('w2'), 'part 2/3: 1 of 1 units IDENTICAL'].join('\n')], ids)), 'refused: w2 twice'],
    ['a unit outside W', read(combineParts([p0, [ln('w2'), ln('r9'), 'part 1/2: 2 of 2 units IDENTICAL'].join('\n')], ids)), 'refused: r9 not a W unit'],
    ['a count that disagrees with its lines', read(combineParts([p0, [ln('w2', 'DIFFERS'), 'part 1/2: 1 of 1 units IDENTICAL'].join('\n')], ids)), 'refused: part 1: its count disagrees with its lines'],
    ['no header', read(combineParts([p0.replace(H + '\n', ''), p1], ids)), 'refused: 0 headers naming a stamp'],
    ['a unit that differs, counted', read(combineParts([p0, [ln('w2', 'DIFFERS'), 'part 1/2: 0 of 1 units IDENTICAL'].join('\n')], ids)), `2 of 3; ${HEAD.split(' ')[0]} w1 w2 w3 2`]];
  let bad = gbad;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  const all = guardCases.length + cases.length;
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${all}` : `planted (${all}): all read as they should`);
  process.exit(bad ? 1 : 0);
}
if (process.argv[2] === '--combine') {
  const c = combineParts(process.argv.slice(3).map(f => readFileSync(f, 'utf8')), readAnyPanel().filter(u => u.cls === 'W').map(u => u.id));
  if (c.faults) { console.error(`couples-any-port-identity: the parts do not combine: ${c.faults.join('; ')}`); process.exit(2); }
  console.log(c.text);
  process.exit(c.same === c.n ? 0 : 1);
}
const DIR = process.env.CAI_DIR || join(HERE, 'results', REG ? 'couples-any-run' : 'couples-any-7002'), only = process.argv.slice(2);
if (!existsSync(DIR)) { console.error(`couples-any-port-identity: ${REG ? 'the registered run' : 'the dress rehearsal'} is not here (${DIR})`); process.exit(2); }
const SMOKE = process.env.CAI_SMOKE === '1', joint = appJoint(), FORM = APP_COUPLE.household;
const SOLVE = SMOKE ? { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: APP_POINTS };
const js = x => JSON.stringify(x);
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const [partK, partN] = (process.env.CAI_PART || '0/1').split('/').map(Number);
const all = readAnyPanel().filter(u => u.cls === 'W' && existsSync(join(DIR, `${u.id}.json.gz`)) && (!only.length || only.includes(u.id)));
const units = all.filter((u, i) => i % partN === partK);
const read = U => JSON.parse(gunzipSync(readFileSync(join(DIR, `${U.id}.json.gz`))).toString());
const stamps = new Set(all.map(u => { const s = read(u).stamp; return `code ${s.code} audit ${s.audit}`; }));
if (stamps.size !== 1) { console.error(`couples-any-port-identity: ${REG ? 'the registered run\'s' : 'the rehearsal\'s'} W units are on ${stamps.size} stamps`); process.exit(2); }
if (partK === 0) console.log(`EVERY COUPLE ON THE SOLVER, W'S IDENTITY (${REG ? 'THE REGISTERED TEST' : 'EXPLORATORY'}${SMOKE ? ', A SMOKE: 6 points on a small lattice' : ''}): the app's route for a couple with one of step 4's shapes, on ${REG ? 'the registered run\'s' : 'the dress rehearsal\'s'} ${all.length} W units (seed ${REG ? 7027 : 7002}), stamp ${[...stamps][0]}, against its ROUTE arrays; this code ${(codeId() || {}).hash || 'unknown'}; the couples' form ${FORM}, the app's shapes ${APP_COUPLE.takeShapes.join(', ')}`);
let identical = 0;
for (const U of units) {
  const P = read(U), want = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arms.ROUTE[k], Ty)]));
  const { hp } = anySolverPlanOf(U.plan), gLanded = coupleSolverOn(U.plan), gHanded = coupleSolverOn(hp);
  // the page's worker: the cut and the assembly at the app's own shapes (none named), the table inside the cut's bands
  // a shape the household plan refuses at the app's own shapes goes to today's route in the page (src/solverClient.js): DIFFERS
  const t0 = Date.now();
  let cut;
  try { cut = householdCut(E, M, hp, FORM); } catch (e) { console.log(`${U.id.padEnd(16)} DIFFERS; the household plan refuses it at the app's own shapes (${e.message})`); continue; }
  const b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { ...SOLVE, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const digest = await digestOf(tablesOf(H)), sameTable = digest === P.digests.household;
  const ctx = solvedContext(E, cp), paths = E.pathsForSeed(P.seed, P.N, ctx.totalYears).map(zs => Float64Array.from(zs)), diff = Object.fromEntries(Object.keys(KEYS).map(k => [k, 0]));
  for (let i = 0; i < P.N; i++) {
    const r = runPath(ctx, paths[i], false), got = { survived: r.survived ? 1 : 0, failYear: r.failYear, pot: r.wealth, estate: r.estate, tax: r.tax, delivered: r.delivered, unmet: r.unmet };
    for (const k of Object.keys(KEYS)) if (!Object.is(want[k][i], got[k])) diff[k]++;
  }
  const guards = guardOk(gLanded, U.hold) && guardOk(gHanded, U.hold), clean = Object.values(diff).every(x => x === 0), ok = guards && sameTable && clean;
  if (ok) identical++;
  console.log(`${U.id.padEnd(16)} ${ok ? 'IDENTICAL' : 'DIFFERS'}; the guard on, ${gLanded.route ? `the ${gLanded.route} route` : `no route of its own (the client's default form, ${FORM})`}, lifting ${(gLanded.lifted || []).join('+') || 'none'} (${guards ? 'as its holding says' : `NOT: landed ${js(gLanded)}, handed ${js(gHanded)}`}); the table ${digest.slice(0, 12)} against the rehearsal's ${String(P.digests.household).slice(0, 12)} (${sameTable ? 'the same' : 'DIFFERENT'}); paths differing of ${P.N}: ${Object.entries(diff).map(([k, v]) => `${k} ${v}`).join(', ')}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
if (partN === 1) console.log(`${identical} of ${units.length} units IDENTICAL`);
else console.log(`part ${partK}/${partN}: ${identical} of ${units.length} units IDENTICAL`);
process.exit(identical === units.length && units.length > 0 ? 0 : 1);
