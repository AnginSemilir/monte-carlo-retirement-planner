/*
 * REF-S'S S364 FIXTURE (PLAN.md REF-S: "S364's fifteen ledger states against NE-REF's own-pots counts"). NE-REF's ledger
 * (results/diagneref/case0.txt, the L job) prints, per world, S364's five year-1 states (acc, isa, gia, cash) and the
 * own-pots counts at 1,000,000 draws in each of the menu's orders, but not the schedule's rates. This solves S364 as
 * NE-REF's L job did (the candidate's unit at 4 wealth points, RS), with readerRef 'order' so that each year-1 read
 * carries its schedule's rates and orders (solve.js; the rates are the plan's compiled ones, the same under either
 * reference), reads P's (ai 12) five year-1 states per world through the reader probe, checks them against NE-REF's
 * ledger states, and writes the schedule, the year's cash (model.cashAt at year 1) and NE-REF's states and counts to
 * research/tests/refs-s364-fixture.json for research/tests/ref-state.test.mjs.
 *   node research/solver/fixture-refs-s364.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { READER_PROBE } from '../../src/solver/grid.js';
import { solveCandidate } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), P = 12;
const h = buildScenarios().find(s => s.id === 'S364' && s.plan.demographics.planningMode === 'single');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const cand = solveCandidate(E, M, plan, { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, readerSplit: 'rs', readerRef: 'order' });
const m = cand.m, T = m.ctx.totalYears, n = cand.actions.length;
let s0 = null;
runPolicy(cand, E.pathsForSeed(7002, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n);
// NE-REF's ledger lines
const led = readFileSync(join(HERE, 'results/diagneref/case0.txt'), 'utf8').split('\n').map(l => /ledger L\/P4S6Q5 (\d) (\d): z \S+ w \S+ acc ([\d.]+) isa ([\d.]+) gia ([\d.]+) cash ([\d.]+) pr \S+ form \S+ ow \S+ os ([\d,]+)\/(\d+)/.exec(l)).filter(Boolean)
  .map(x => ({ k: +x[1], j: +x[2], acc: +x[3], isa: +x[4], gia: +x[5], cash: +x[6], os: x[7].split(',').map(Number), draws: +x[8] }));
if (led.length !== 15) { console.error(`fixture-refs-s364: ${led.length} NE-REF ledger states, not 15`); process.exit(3); }
const worlds = [];
for (let k = 0; k < cand.mix.nodes.length; k++) {
  const tab = cand.mix.tables[k], reads = [];
  READER_PROBE.fn = (W, IDX, NC, RD, pr, yr, acc, s) => { reads.push({ acc, yr, s: Float64Array.from(s), sc: RD.chance.schedule }); };
  try { scoreMoves(tab, s0, 0, SC, TX, BQ, { pen: 0, isa: 0, gia: 0 }, { ai: P, act: tab.c.acts[P], nr: tab.nodeRealOfAt[0][P] }, SV); } finally { READER_PROBE.fn = null; }
  if (reads.length !== 5 || reads.some(r => r.yr !== 1 || !r.sc || !r.sc.rate)) { console.error(`fixture-refs-s364: world ${k}: not five year-1 reads with the order reference's schedule`); process.exit(3); }
  const mine = led.filter(x => x.k === k);
  const worst = Math.max(...reads.map((r, j) => Math.abs(r.acc / mine[j].acc - 1)));
  console.log(`world ${k}: the five year-1 states' money against NE-REF's ledger: worst relative difference ${worst.toExponential(2)}`);
  if (!(worst < 1e-6)) { console.error(`fixture-refs-s364: world ${k}: the states are not NE-REF's`); process.exit(3); }
  const sc = reads[0].sc;
  worlds.push({ k, bills: sc.bills, rate: sc.rate, orders: sc.orders, cash1: M.cashAt(m, 1, 1e12), states: mine });
}
writeFileSync(join(HERE, '../tests/refs-s364-fixture.json'), JSON.stringify({ source: 'research/solver/fixture-refs-s364.mjs over results/diagneref/case0.txt', worlds }, null, 1) + '\n');
console.log(`wrote research/tests/refs-s364-fixture.json: ${worlds.length} worlds; cash at year 1 ${worlds[0].cash1.toFixed(2)}; orders ${worlds[0].orders.map(o => o.join('>')).join(', ')}`);
