/*
 * 7AK'S SNAPS (research/solver/snap.mjs; PLAN.md 7ak). Stated before it ran (30 Sep): on bridge 4 under P at a small
 * grid (TS+J with the reader, switchCharge 0.001, margin 0) -
 *   1. nearestOf's cell is nearestIndex's, on every state a forward run meets in years 1 to 5;
 *   2. each single snap moves only its own coordinate (W, a, b, the gain bucket, the lump bucket) and lands it on the
 *      nearest cell's value; the all-snap is the cell's own state (toVec);
 *   3. the reader hook changes the reader's read in a bridge year and is removed after (the read the same before and after);
 *   4. THE CONSISTENCY the attribution rests on: at a live cell's own state (stored survival 0.02 or more), the chooser's
 *      move for a held layer leaves or holds as the stored move for that layer on 99% or more of the cells of years 1 to 3;
 *      planted: the stored move of the neighbouring cell agrees less often, or the check proves nothing.
 *   node research/tests/snap-7ak.test.mjs [points=6]
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, nearestIndex } from '../../src/solver/solve.js';
import { readValues, toVec } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SNAPS, nearestOf, snapState, shares, withReaderSnap } from '../solver/snap.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const PTS = Number(process.argv[2] || 6);
const s126 = buildScenarios().find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const p = JSON.parse(JSON.stringify(s126.plan));
{ const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.85 * Wt) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.15 * Wt) }; return a; });
  const age = E.num(p.demographics.privatePensionAge, 58) - 4; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; }
const plan = E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const r = solvePlan(E, M, plan, { lambda: 0.0223606797749979, points: PTS, switchMargin: 0, switchCharge: 0.001, bridgeRead: 'reader', tierState: true, jointWorlds: true, bequestWeight: 0 });
const g = r.g, T = r.m.ctx.totalYears, acts = r.c.acts, tab = r.mix.tables[0];

// 1 and 2 over the states a forward run meets
const states = [];
E.pathsForSeed(7002, 60, T).forEach(zs => runPolicy(r, zs, { choose: (t, st, held) => { if (t >= 1 && t <= 5) states.push({ t, st: Float64Array.from(st), held: { ...held } }); return chooseAction(r, st, t, held); } }));
let same = 0, only = 0, lands = 0, allCell = 0;
for (const { st } of states) {
  const nc = nearestOf(g, st);
  if (g.index(nc.ip, nc.ii, nc.it, nc.ig, nc.ic) === nearestIndex(g, st)) same++;
  const x = shares(st), sw = shares(snapState(g, st, 'W', nc)), sa = shares(snapState(g, st, 'a', nc)), sb = shares(snapState(g, st, 'b', nc));
  const near = (u, v) => Math.abs(u - v) <= 1e-9 * Math.max(1, Math.abs(u));
  // b (the ISA's share of what is not in the pension) has no meaning when the a-snap lands on a = 1: nothing is left outside it
  if (near(sw.a, x.a) && near(sw.b, x.b) && near(sa.W, x.W) && (sa.a === 1 || near(sa.b, x.b)) && near(sb.W, x.W) && near(sb.a, x.a)) only++;
  if (near(sw.W, g.axes.W.pts[nc.ip]) && near(sa.a, g.axes.a.pts[nc.ii]) && near(sb.b, g.axes.b.pts[nc.it]) && snapState(g, st, 'gain', nc)[3] === g.gain[nc.ig]) lands++;
  const all = snapState(g, st, 'all', nc), cell = toVec(g, nc.ip, nc.ii, nc.it, nc.ig, nc.ic, new Float64Array(7));
  if (all.every((v, i) => v === cell[i])) allCell++;
}
ok(states.length > 100 && same === states.length, `nearestOf's cell is nearestIndex's on all ${states.length} forward states of years 1 to 5`);
ok(only === states.length && lands === states.length, `each single snap moves only its own coordinate and lands on the nearest cell's value (${only}, ${lands} of ${states.length})`);
ok(allCell === states.length, 'the all-snap is the cell\'s own state (toVec)');
ok(SNAPS.join(',') === 'W,a,b,gain,pcls,reader,all', 'the seven snaps');

// 3. the reader hook changes a bridge-year read and is removed after
{ const yr = g.reader.years.findIndex(Boolean), L = tab.tsLayers[0], s = states.find(x => x.st[1] + x.st[2] > 0);
  const read = () => readValues(g, L.lsurv[yr], L.beq[yr], s.st, new Float64Array(4), null, null, yr)[0];
  const before = read(), during = withReaderSnap(r, read), after = read();
  ok(yr >= 0 && s && before === after && !g.readerAcc, `the reader hook is removed after (year ${yr}: ${before} before and after)`);
  ok(during !== before, `the reader hook changes the bridge-year read (${before.toFixed(6)} to ${during.toFixed(6)})`); }

// 4. stored against recomputed at the cells' own states, on live cells (stored survival 0.02 or more: on a dead cell every
// move fails and the stored and recomputed ties fall anywhere - the 30 Sep probe: 100% agreement on live cells at 6 points,
// 44.5% on dead ones), and the planted neighbour
{ let cmp = 0, agree = 0, agreeN = 0, dead = 0;
  const layers = [...new Set(acts.map(a => `${a.tierPen || 0}/${a.tierIsa || 0}`))].map(k => { const [pen, isa] = k.split('/').map(Number); return { held: { pen, isa }, j: tab.tsLayerOf[acts.findIndex(a => (a.tierPen || 0) === pen && (a.tierIsa || 0) === isa)] }; });
  const leaves = (ai, held) => acts[ai].tierPen !== held.pen || acts[ai].tierIsa !== held.isa;
  for (let t = 1; t <= 3; t++) for (const { held, j } of layers) for (let ip = 0; ip < g.np; ip++) for (let ii = 0; ii < g.ni; ii++) for (let it = 0; it < g.nt; it++) {
    const idx = g.index(ip, ii, it, 0, 0), L = tab.tsLayers[j];
    if (L.surv[t][idx] < 0.02) { dead++; continue; }
    const st = toVec(g, ip, ii, it, 0, 0, new Float64Array(7)), ai = chooseAction(r, st, t, { ...held });
    cmp++; if (leaves(ai, held) === leaves(L.pol[t][idx], held)) agree++;
    if (leaves(ai, held) === leaves(L.pol[t][g.index(Math.min(g.np - 1, ip + 1), ii, it, 0, 0)], held)) agreeN++;
  }
  console.log(`      live cells: the chooser at a cell's own state against its stored move (leave or hold) ${agree} of ${cmp} agree; against the next W cell's stored move ${agreeN}; ${dead} dead cells left out`);
  ok(cmp > 100 && agree >= 0.99 * cmp, `stored against recomputed at the live cells' own states: ${(100 * agree / cmp).toFixed(2)}% agree (at least 99%)`);
  ok(agreeN < agree, `planted: the neighbouring cell's stored move agrees less often (${agreeN} against ${agree})`); }
console.log(`\nsnap-7ak: ${n} passed`);
