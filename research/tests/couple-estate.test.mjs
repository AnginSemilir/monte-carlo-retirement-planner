/*
 * PART D, D7, STAGE A'S BUILD (D100): A COUPLE'S ESTATE WEIGHED THE SAME WHICHEVER PARTNER IS ENTERED FIRST (solveCouple's
 * opts.estateWeight 'elder'; an option, off in code). The joint move weighs the household's estate at one table's weight,
 * 0.02 of that person's own opening wealth: the first person's, as stage C tested it, or under the option the elder's (by
 * the engine's ages today; equal ages the first person's). couple.js estateFrom; the deep review of stage C, section 2.
 *   1. the option unset: S007's joint value at the start and its engine runs on 20 paths of seed 7002 the code before the
 *      option's, bit for bit (a digest taken there, at 4 points on the light lattice); the joint estate weight the first
 *      person's table's; the record without the option
 *   2. every couple stage C (36 units) and the couples' re-run (40) tested is entered elder first: the option keeps the first
 *      person's weight on each, so each is solved the same with it as without
 *   3. S007 entered the other way round (couple-order.mjs otherOrder: the younger first, the plan ending in the same year):
 *      under the option the joint estate weight is the same in both orders, to the bit, and the elder's table's; without it
 *      the first person's in each, and the two differ
 *   4. estateFrom by hand: equal ages keep the first person's weight; the partner older takes theirs; the first person older
 *      keeps theirs; the option unset the first person's whatever the ages
 *   5. the value at the weight: on the younger-first order, the joint move's score at the start under the option is the score
 *      at the elder's weight, to the bit, and not the score at the first person's
 *   6. otherOrder: twice is the plan itself; the mirrored plan's ages swapped, its horizon and each person's pots the same
 *   7. the refusal: an estateWeight other than 'elder'
 * The plant 'estatefirst' (COUPLE.plant: the option keeps the first person's weight) fails checks 3, 4 and 5. --planted runs
 * it and reads which fail.
 *   node research/tests/couple-estate.test.mjs [--planted]      COUPLE_ESTATE_RECORD=1 prints check 1's digest and stops
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SELF = fileURLToPath(import.meta.url), SOLVER = join(dirname(SELF), '..', 'solver');
if (process.argv.includes('--planted')) {
  const want = ['3', '4', '5'];
  const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_ESTATE_PLANT: 'estatefirst' }, encoding: 'utf8' });
  const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
  const exact = failed.length === want.length && want.every(n => failed.includes(n));
  console.log(`plant estatefirst fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
  if (!exact) console.log(r.stdout + r.stderr);
  process.exit(exact ? 0 : 1);
}
const { solveCouple, withCouple, chooseJoint, COUPLE } = CPL;
const PLANT = process.env.COUPLE_ESTATE_PLANT || '';
COUPLE.plant = PLANT;
const RECORD = !!process.env.COUPLE_ESTATE_RECORD;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
if (!RECORD) console.log(`couple-estate: a couple's estate weighed the same whichever partner is entered first (Part D, D7, stage A's build)${PLANT ? `; planted: ${PLANT}` : ''}`);
const LIGHT = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
const library = buildScenarios();
// each person's table solved once for its plan and partner's age, and handed back whenever the same is asked again
const memo = new Map();
const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: 4, research: LIGHT, ageWith: o.partnerAge0 })); return memo.get(k); };
const start = cp => chooseJoint(cp, cp.M.initialState(cp.m), 0).score;
const S007 = prepareForSolve(E, E.normalizePlan(library.find(s => s.id === 'S007').plan));

// ---- 1. the option unset: the code before it, bit for bit ----
{
  // taken on the code before the option (4380aa81), COUPLE_ESTATE_RECORD=1
  const BEFORE = '4410b47199e2b9207f1ef57b1ef294b97e736c877e950c3309ea860fb9b56954';
  const N = 20, SEED = 7002;
  const cp = solveCouple(E, M, S007, { solveOne });
  const ctx = E.buildContext(withCouple(cp.plan, cp)), paths = E.pathsForSeed(SEED, N, ctx.totalYears);
  const v = new Float64Array(1 + 3 * N);
  v[0] = start(cp);
  paths.forEach((zs, k) => { const o = E.runTrial(ctx, zs); v[1 + 3 * k] = o.survived ? 1 : 0; v[2 + 3 * k] = o.terminalPotNet; v[3 + 3 * k] = o.lifetimeTax; });
  const dig = createHash('sha256').update(Buffer.from(v.buffer)).digest('hex');
  if (RECORD) { console.log(`RECORD S007 ${dig}`); process.exit(0); }
  const surv = paths.length ? v.filter((_, i) => i % 3 === 1).reduce((s, x) => s + x, 0) : 0;
  ok(1, 'the option unset: S007\'s joint value at the start and its engine runs on 20 paths the code before the option\'s, bit for bit; the weight the first person\'s; the record without the option',
    dig === BEFORE && cp.wB === cp.tables.self.wB && cp.meta.estateWeight === undefined && cp.meta.estateFrom === undefined,
    `${dig.slice(0, 16)} against ${BEFORE.slice(0, 16)}; the score at the start ${v[0]}; ${surv} of ${N} paths survive; the weight ${cp.wB} (the first person's ${cp.tables.self.wB})`);
}

// ---- 2. every couple tested is entered elder first ----
{
  const { readSharePanel } = await import(join(SOLVER, 'couples-share-panel.mjs'));
  const { readPanel } = await import(join(SOLVER, 'couple-panel.mjs'));
  const units = [...readSharePanel().map(u => ({ id: `C:${u.id}`, plan: u.plan })), ...readPanel(join(SOLVER, 'couples-panel-d4b.json')).map(u => ({ id: `D4b:${u.id}`, plan: u.plan }))];
  const from = units.map(u => ({ id: u.id, f: CPL.estateFrom(E.buildContext(E.resolveMpaa(E.normalizePlan(u.plan))), 'elder') }));
  const moved = from.filter(x => x.f !== 'self');
  ok(2, 'every couple stage C (36 units) and the couples\' re-run (40) tested is entered elder first: the option keeps the first person\'s weight on each',
    units.length === 76 && moved.length === 0, `${units.length} units, ${moved.length} taking another weight${moved.length ? `: ${moved.slice(0, 5).map(x => x.id).join(', ')}` : ''}`);
}

// ---- 3 and 5. S007 entered the other way round ----
const { otherOrder } = await import(join(SOLVER, 'couple-order.mjs'));
const S007R = otherOrder(E, S007);
{
  const a = { off: solveCouple(E, M, S007, { solveOne }), on: solveCouple(E, M, S007, { solveOne, estateWeight: 'elder' }) };
  const b = { off: solveCouple(E, M, S007R, { solveOne }), on: solveCouple(E, M, S007R, { solveOne, estateWeight: 'elder' }) };
  const elder = a.off.tables.self.wB;   // S007's first person is the elder (68 and 65)
  ok(3, 'S007 entered the other way round: under the option the joint estate weight the same in both orders, to the bit, and the elder\'s table\'s; without it the first person\'s in each, and they differ',
    a.on.wB === b.on.wB && b.on.wB === elder && b.on.meta.estateFrom === 'part' && a.on.meta.estateFrom === 'self' && a.off.wB === a.off.tables.self.wB && b.off.wB === b.off.tables.self.wB && a.off.wB !== b.off.wB,
    `the elder first: off ${a.off.wB}, on ${a.on.wB}; the younger first: off ${b.off.wB}, on ${b.on.wB} (from ${b.on.meta.estateFrom}); the elder's table ${elder}, the younger's ${b.off.tables.self.wB} (${(b.off.wB / elder).toFixed(3)} times)`);
  // 5. the score at the start: under the option, the score at the elder's weight, not the first person's
  const on = start(b.on), atElder = start({ ...b.off, wB: elder }), off = start(b.off);
  ok(5, 'the value at the weight: on the younger-first order the joint move\'s score at the start under the option is the score at the elder\'s weight, to the bit, and not the score at the first person\'s',
    Object.is(on, atElder) && on !== off, `under the option ${on}; at the elder's weight ${atElder}; at the first person's ${off}`);
}

// ---- 4. estateFrom by hand ----
{
  const at = (s, p, rule) => CPL.estateFrom({ ageSelf0: s, agePart0: p }, rule);
  const got = [at(60, 60, 'elder'), at(60, 64, 'elder'), at(64, 60, 'elder'), at(60, 64, undefined), at(64, 60, undefined)];
  const want = ['self', 'part', 'self', 'self', 'self'];
  ok(4, 'estateFrom: equal ages the first person\'s; the partner older theirs; the first person older theirs; the option unset the first person\'s whatever the ages',
    got.every((g, i) => g === want[i]), `60/60 ${got[0]}, 60/64 ${got[1]}, 64/60 ${got[2]}; unset 60/64 ${got[3]}, 64/60 ${got[4]}`);
}

// ---- 6. otherOrder ----
{
  const c0 = E.buildContext(E.resolveMpaa(S007)), c1 = E.buildContext(E.resolveMpaa(S007R));
  const pots = (c, who) => c.accounts.filter(a => a.owner === who).reduce((s, a) => s + a.balance, 0);
  const twice = JSON.stringify(otherOrder(E, S007R)) === JSON.stringify(S007);
  ok(6, 'otherOrder: twice is the plan itself; the mirrored plan\'s ages swapped, its horizon and each person\'s pots the same',
    twice && c1.ageSelf0 === c0.agePart0 && c1.agePart0 === c0.ageSelf0 && c1.totalYears === c0.totalYears && pots(c1, 'self') === pots(c0, 'part') && pots(c1, 'part') === pots(c0, 'self'),
    `twice the plan: ${twice}; ages ${c0.ageSelf0}/${c0.agePart0} to ${c1.ageSelf0}/${c1.agePart0}; years ${c0.totalYears} and ${c1.totalYears}; pots £${pots(c0, 'self')}/£${pots(c0, 'part')} to £${pots(c1, 'self')}/£${pots(c1, 'part')}`);
}

// ---- 7. the refusal ----
{
  let msg = 'no';
  try { solveCouple(E, M, S007, { estateWeight: 'household', solveOne: () => { throw new Error('solved'); } }); } catch (e) { msg = e.message; }
  ok(7, 'the refusal: an estateWeight other than \'elder\', before any solve', /estateWeight 'household'/.test(msg), msg);
}

console.log(`\ncouple-estate: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
