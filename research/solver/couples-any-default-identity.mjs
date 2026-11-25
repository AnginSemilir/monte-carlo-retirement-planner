/*
 * EVERY COUPLE ON THE SOLVER, THE CHANGE OF DEFAULT HELD TO THE TESTED ARM (COUPLES-ANY's change of default, D148; EXPLORATORY,
 * the tuning seed): the app's route for a couple with one of the shapes the change takes ('risks' and 'limits', R and L; 'salaries',
 * P), on the registered test's pilot (results/couples-any-pilot: 1,000 paths of seed 7002 on every registered unit, 45 points, its
 * ROUTE the household route taking every shape the household plan takes; read already, for the sizing), against the pilot's ROUTE
 * arrays path for path, as couples-open-port-identity.mjs held D144's route to that test's pilot and couples-any-port-identity.mjs
 * holds W's:
 *   - the guard (src/couplesSwitch.js coupleSolverOn), on the plan as the panel landed it and on the plan handed to the solvers
 *     (couples-any-panel.mjs anySolverPlanOf), on and not swapped: where the younger holds 75%, on the household route alone,
 *     lifting Y (D144); at the library's holdings, inside the guard before D143, with no route of its own and nothing lifted, so the
 *     client solves it at the couples' default form on the household route wherever the household plan takes its shape, which the
 *     cut below shows it does at the app's own shapes;
 *   - the cut, the table and the assembly as the page's worker makes them (src/solverWorker.js: householdCut at the form with the
 *     app's own shapes, src/solverSettings.js APP_COUPLE.takeShapes, none named; the table by solveForApp at the app's points inside
 *     the cut's bands; householdSolved with the top three and the couples' joint move's tie-break and hold), the table's digest
 *     against the pilot's;
 *   - the paths: the engine's run (audit-phase4.mjs runPath) of the solved couple on the page's own context (solvedContext), every
 *     key against the pilot's ROUTE arrays, bit for bit.
 * A unit IDENTICAL where the guard is as above, the digest the pilot's and every array the same. Before the change (the plants
 * 'beforeany' on the guard and 'cutbeforeany' on the cut, the code before it) every unit DIFFERS: the guard keeps R, L and P off
 * for their shape, and the cut refuses them at the app's own shapes.
 *   node research/solver/couples-any-default-identity.mjs [unit ...] > research/solver/results-couples-any-default-identity.txt
 * CAD_CLASSES the classes (default R,L,P); CAD_DIR the pilot's folder where it is not this tree's; CAD_PART=k/n every n-th unit
 * from the k-th, the parts then put together with --combine, as couples-any-port-identity.mjs's; CAD_PLANT=beforeany or
 * cutbeforeany runs under that plant (each unit should then DIFFER).
 * Its record (results-couples-any-default-identity.txt, 25 Nov 06:45 to 07:38 UTC, 112 of 112 IDENTICAL) was run on the change's
 * draft (drafts/couples-any-default.patch at 3fd451c0, from a scratch tree), and its header says so ("A DRAFT"): D148's code is the
 * draft's but for comments and the limits card's words (src/limitsCard.js householdLimits, src/SolverConfig.jsx), which no solve
 * reads.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved, PLANT as CUT_PLANT } from '../../src/solverCouple.js';
import { bandsAt } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_COUPLE, appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { coupleSolverOn, PLANT as SWITCH_PLANT } from '../../src/couplesSwitch.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readAnyPanel, anySolverPlanOf } from './couples-any-panel.mjs';
import { runPath } from './audit-phase4.mjs';
import { KEYS } from './audit-couples-any.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const HEAD = 'EVERY COUPLE ON THE SOLVER, THE CHANGE OF DEFAULT HELD TO THE TESTED ARM';
const CLASSES = (process.env.CAD_CLASSES || 'R,L,P').split(',').filter(Boolean);
const PLANTED = process.env.CAD_PLANT || '';
if (PLANTED === 'beforeany') SWITCH_PLANT.rule = 'beforeany';
else if (PLANTED === 'cutbeforeany') CUT_PLANT.rule = 'cutbeforeany';
else if (PLANTED) { console.error(`couples-any-default-identity: CAD_PLANT '${PLANTED}' (want beforeany or cutbeforeany)`); process.exit(2); }
const liftedWant = hold => (hold === 'Y75' ? 'Y' : '');
const guardOk = (g, hold) => !!g && g.on === true && g.why === null && !g.swap && (g.lifted || []).join(',') === liftedWant(hold)
  && (hold === 'Y75' ? g.route === 'household' : !g.route);
const panelIds = () => readAnyPanel(join(HERE, 'couples-any-registered-panel.json')).filter(u => CLASSES.includes(u.cls)).map(u => u.id);
/* the parts put together, as couples-any-port-identity.mjs combineParts: one header, every unit's line once in the panel's order,
   one count; the faults where a part misses a unit, holds one twice, or disagrees with its own count */
function combineParts(texts, ids) {
  const faults = [], lines = new Map(), heads = [];
  texts.forEach((text, i) => {
    const t = text.split('\n').filter(l => l.trim());
    heads.push(...t.filter(l => l.startsWith(HEAD)));
    const own = t.map(l => [l, l.match(/^(\S+)\s+(IDENTICAL|DIFFERS);/)]).filter(([, m]) => m);
    for (const [l, m] of own) { if (lines.has(m[1])) faults.push(`${m[1]} twice`); else if (!ids.includes(m[1])) faults.push(`${m[1]} not a unit of ${CLASSES.join(', ')}`); else lines.set(m[1], { l, same: m[2] === 'IDENTICAL' }); }
    const cnt = t.map(l => l.match(/^part \d+\/\d+: (\d+) of (\d+) units IDENTICAL/)).filter(Boolean);
    if (cnt.length !== 1) faults.push(`part ${i}: ${cnt.length} counts`);
    else if (+cnt[0][1] !== own.filter(([, m]) => m[2] === 'IDENTICAL').length || +cnt[0][2] !== own.length) faults.push(`part ${i}: its count disagrees with its lines`);
  });
  if (heads.length !== 1) faults.push(`${heads.length} headers`);
  for (const id of ids) if (!lines.has(id)) faults.push(`${id} missing`);
  if (faults.length) return { faults };
  const same = ids.filter(id => lines.get(id).same).length;
  return { text: [heads[0], ...ids.map(id => lines.get(id).l), `${same} of ${ids.length} units IDENTICAL`].join('\n'), same, n: ids.length };
}
if (process.argv[2] === '--combine') {
  const c = combineParts(process.argv.slice(3).map(f => readFileSync(f, 'utf8')), panelIds());
  if (c.faults) { console.error(`couples-any-default-identity: the parts do not combine: ${c.faults.join('; ')}`); process.exit(2); }
  console.log(c.text);
  process.exit(c.same === c.n ? 0 : 1);
}
const DIR = process.env.CAD_DIR || join(HERE, 'results', 'couples-any-pilot'), only = process.argv.slice(2);
if (!existsSync(DIR)) { console.error(`couples-any-default-identity: the pilot is not here (${DIR})`); process.exit(2); }
const joint = appJoint(), FORM = APP_COUPLE.household;
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const [partK, partN] = (process.env.CAD_PART || '0/1').split('/').map(Number);
const panel = readAnyPanel(join(HERE, 'couples-any-registered-panel.json'));
const all = panel.filter(u => CLASSES.includes(u.cls) && existsSync(join(DIR, `${u.id}.json.gz`)) && (!only.length || only.includes(u.id)));
const units = all.filter((u, i) => i % partN === partK);
const read = U => JSON.parse(gunzipSync(readFileSync(join(DIR, `${U.id}.json.gz`))).toString());
const seeds = new Set(all.map(u => read(u).seed));
if (seeds.size !== 1 || !seeds.has(7002)) { console.error(`couples-any-default-identity: the pilot's units are on seeds ${[...seeds].join(', ')}, not 7002 alone`); process.exit(2); }
if (partK === 0) console.log(`${HEAD} (EXPLORATORY${PLANTED ? `, UNDER THE PLANT '${PLANTED}'` : ''}): the app's route at the app's own shapes (${(APP_COUPLE.takeShapes || []).join(', ')}) for a couple of class ${CLASSES.join(', ')}, on the registered test's pilot (${DIR.split('/').slice(-2).join('/')}: ${all.length} units, seed 7002, already read), against its ROUTE arrays path for path; this tree: code ${(codeId() || {}).hash || 'unknown'}`);
let identical = 0;
for (const U of units) {
  const P = read(U), want = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(P.arms.ROUTE[k], Ty)]));
  const { hp } = anySolverPlanOf(U.plan), gLanded = coupleSolverOn(U.plan), gHanded = coupleSolverOn(hp);
  const t0 = Date.now();
  let cut;
  try { cut = householdCut(E, M, hp, FORM); } catch (e) { console.log(`${U.id.padEnd(18)} DIFFERS; the household plan refuses it at the app's own shapes (${e.message}); the guard ${gLanded.on ? 'on' : `off (${gLanded.why}${gLanded.shape ? `: ${gLanded.shape}` : ''})`}`); continue; }
  const b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { points: APP_POINTS, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const digest = await digestOf(tablesOf(H)), sameTable = digest === P.digests.household;
  const ctx = solvedContext(E, cp), paths = E.pathsForSeed(P.seed, P.N, ctx.totalYears).map(zs => Float64Array.from(zs)), diff = Object.fromEntries(Object.keys(KEYS).map(k => [k, 0]));
  for (let i = 0; i < P.N; i++) {
    const r = runPath(ctx, paths[i], false), got = { survived: r.survived ? 1 : 0, failYear: r.failYear, pot: r.wealth, estate: r.estate, tax: r.tax, delivered: r.delivered, unmet: r.unmet };
    for (const k of Object.keys(KEYS)) if (!Object.is(want[k][i], got[k])) diff[k]++;
  }
  const guards = guardOk(gLanded, U.hold) && guardOk(gHanded, U.hold), clean = Object.values(diff).every(x => x === 0), ok = guards && sameTable && clean;
  if (ok) identical++;
  const gTxt = g => (g.on ? `on, ${g.route ? `the ${g.route} route` : `no route of its own (the client's default form, ${FORM})`}, lifting ${(g.lifted || []).join('+') || 'none'}` : `off (${g.why}${g.shape ? `: ${g.shape}` : ''})`);
  console.log(`${U.id.padEnd(18)} ${ok ? 'IDENTICAL' : 'DIFFERS'}; the guard ${gTxt(gLanded)} (${guards ? 'as the holding says' : 'NOT as the holding says'}); the table ${sameTable ? 'the pilot\'s' : 'NOT the pilot\'s'}; ${clean ? `all ${P.N} paths the same` : `paths differing ${Object.entries(diff).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(', ')}`} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
if (partN === 1) console.log(`${identical} of ${units.length} units IDENTICAL`);
else console.log(`part ${partK}/${partN}: ${identical} of ${units.length} units IDENTICAL`);
process.exit(identical === units.length && units.length > 0 ? 0 : 1);
