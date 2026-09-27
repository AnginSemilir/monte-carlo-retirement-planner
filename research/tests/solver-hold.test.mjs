/*
 * `holdTier` (PLAN.md 7x): ONE TIER HELD FOR THE WHOLE PLAN, research only. The menu keeps one tier pair from the
 * household's joint tier menu, so the tables value holding it for life, not a future of free switching.
 *
 *   A. off is untouched: the option absent gives the full tier menu, and meta says no tier is held
 *   B. on, every move on the menu carries the held pair, and meta names it
 *   C. forward, the held table holds its tier in every year run (one change at most, the opening switch from the plan's tier)
 *   D. free switching can only add value: at the opening state the free table's score (value().score) is at least each
 *      held table's, in every world; and the two held tables differ somewhere (else D would be vacuous). Survival alone
 *      need not: the tables maximise the score, and the free table gave up 0.02 of a point of survival in one world on S004
 *   E. planted: the same check with the free and held tables swapped fails - D can fail
 *   F. the option refuses a pair not on the menu; with the bridge reader a held table off the plan's tier still solves
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveMixture, runPolicy, tierCombos } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(singles.find(x => x.id === 'S004').plan);
const m = M.prepare(E, plan);
const menu = tierCombos(m, true);
const deep = menu.reduce((a, b) => (b[0] + b[1] > a[0] + a[1] ? b : a));
const o = { points: 10, lump: m.ctx.fullLumpSum, tiers: tiersFor(m), mix: 3, spendLevels: [1, 0.95, 0.9, 0.8], lambda: 0.05 };
const free = solveMixture(E, M, plan, o);
const h0 = solveMixture(E, M, plan, { ...o, holdTier: [0, 0] });
const hd = solveMixture(E, M, plan, { ...o, holdTier: deep });
const s0 = M.initialState(free.m);
const surv = (r, k) => r.worlds[k].value(s0, 0).survival;
const score = (r, k) => r.worlds[k].value(s0, 0).score;

console.log(`the joint menu: ${menu.map(x => x.join('/')).join(', ')}; the deepest pair held: ${deep.join('/')}`);
console.log('=========== A. OFF IS UNTOUCHED ===========');
ok('A  the menu has more than one tier pair (else the test is vacuous)', menu.length > 1 && deep[0] + deep[1] > 0);
ok('A  without the option the moves span the whole menu, and meta holds no tier', new Set(free.c.acts.map(a => `${a.tierPen}/${a.tierIsa}`)).size === menu.length && free.meta.holdTier === null);

console.log('=========== B. ON, ONE PAIR ===========');
ok('B  every move carries the held pair', hd.c.acts.every(a => a.tierPen === deep[0] && a.tierIsa === deep[1]) && h0.c.acts.every(a => !a.tierPen && !a.tierIsa));
ok('B  meta names the held pair', hd.meta.holdTier === deep.join('/') && h0.meta.holdTier === '0/0');
ok('B  the menu keeps every move and level of one tier', hd.c.acts.length * menu.length === free.c.acts.length, `${hd.c.acts.length} of ${free.c.acts.length}`);

console.log('=========== C. FORWARD, THE TIER IS HELD ===========');
{ const paths = E.pathsForSeed(7002, 40, m.ctx.totalYears);
  const runs = paths.map(zs => runPolicy(hd, zs));
  ok('C  the held table never changes tier after the opening switch', runs.every(x => x.tierChanges === 0));
  ok('C  it holds the deep pair in every year it runs', runs.every(x => (deep[0] > 0 ? x.tierPenYears > 0 : x.tierPenYears === 0)));
  const r0 = paths.map(zs => runPolicy(h0, zs));
  ok('C  the plan\'s tier held: no year below the plan\'s tier', r0.every(x => x.tierPenYears === 0 && x.tierIsaYears === 0 && x.tierChanges === 0)); }

console.log('=========== D, E. FREE SWITCHING CAN ONLY ADD VALUE ===========');
const K = free.worlds.length, EPS = 1e-9;
const atLeast = (a, b) => Array.from({ length: K }, (_, k) => score(a, k) >= score(b, k) - EPS).every(Boolean);
ok('D  at the opening state the free table\'s score is at least the plan-tier-held table\'s, in every world', atLeast(free, h0));
ok('D  and at least the deep-held table\'s', atLeast(free, hd));
ok('D  the two held tables differ at the opening state (the check is not vacuous; survival, held at the plan\'s tier/held deep/free)', Array.from({ length: K }, (_, k) => surv(h0, k) !== surv(hd, k)).some(Boolean),
  Array.from({ length: K }, (_, k) => `${(100 * surv(h0, k)).toFixed(2)}/${(100 * surv(hd, k)).toFixed(2)}/${(100 * surv(free, k)).toFixed(2)}`).join(' '));
ok('E  planted: swapped (a held table read as the free one), the check fails somewhere', !(atLeast(h0, free) && atLeast(hd, free)));

console.log('=========== F. REFUSALS, AND THE READER ===========');
let threw = null; try { solveMixture(E, M, plan, { ...o, holdTier: [9, 9] }); } catch (e) { threw = e.message; }
ok('F  a pair not on the menu is refused', !!threw && /not on this household's tier menu/.test(threw), threw || 'no error');
threw = null; try { solveMixture(E, M, plan, { points: 10, lump: m.ctx.fullLumpSum, mix: 3, spendLevels: [1], lambda: 0.05, holdTier: [0, 0] }); } catch (e) { threw = e.message; }
ok('F  with no tier menu (tiers off) it is refused', !!threw && /no tiers/.test(threw), threw || 'no error');
{ const bridge = singles.find(x => x.id === 'S126');
  const bp = prep(bridge.plan), bm = M.prepare(E, bp), bdeep = tierCombos(bm, true).reduce((a, b) => (b[0] + b[1] > a[0] + a[1] ? b : a));
  let res = null, err = null; try { res = solveMixture(E, M, bp, { points: 6, lump: bm.ctx.fullLumpSum, tiers: tiersFor(bm), mix: 3, spendLevels: [1], lambda: 0.05, bridgeRead: 'reader', holdTier: bdeep }); } catch (e) { err = e.message; }
  ok('F  the reader with a held table off the plan\'s tier solves (it reads the bridge at the held tier)', !!res && res.meta.bridgeRead === 'reader' && res.meta.holdTier === bdeep.join('/'), err || `S126 held at ${bdeep.join('/')}`); }

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
