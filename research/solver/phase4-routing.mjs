/*
 * PHASE 4'S WINDFALL ROUTING (STATE.md D37; EXPLORATORY, no seed of Phase 4's). Where arm A's policy search picks Windfall to
 * ISA (Bracket Fill Basic's draws and harvest, an unassigned windfall filling the ISA first), the solver arms solve the plan
 * under that policy's name (audit-phase4.mjs solverPlanOf), so every arm routes the windfall alike. Two checks that this
 * changes the windfall's routing and nothing else:
 *   1. under a table (bridge.js withTable: the override carries no draw steps, so the engine routes by the plan's named
 *      policy) the engine's windfall is the one the solver solved, on each household the rule re-routes;
 *   2. the policy's name reaches a solve only through the routed deposits: on households with no windfall, SHIP's and the
 *      candidate's tables, layers and engine runs are the same bit for bit under Bracket Fill Basic and Windfall to ISA; on
 *      S290 (a windfall) the deposit moves and the table follows it.
 *   node research/solver/phase4-routing.mjs > research/solver/results-phase4-routing.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan } from './candidate.mjs';
import { readPanel } from './phase4-panel.mjs';
import { solverPlanOf } from './audit-phase4.mjs';
import { codeId } from './code-id.mjs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PANEL = readPanel(), byId = Object.fromEntries(PANEL.map(h => [h.id, h]));
const off = plan => ({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } });
const prep = plan => E.resolveMpaa(E.normalizePlan(off(plan)));
const deposits = ctx => [...ctx.oneOffContribs.entries()].map(([y, xs]) => `${y}: ${xs.map(x => `${x.id} £${x.amount.toFixed(2)}`).join(' + ')}`).join('; ') || 'none';
const arraysHash = roots => {
  const h = createHash('sha256'), seen = new Set();
  const walk = o => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (ArrayBuffer.isView(o)) { h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(walk); return; } for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; walk(o[k]); } };
  roots.forEach(walk); return h.digest('hex').slice(0, 16);
};

/* one solve of a household under a policy name: its table, its layers, the engine's run of it on 200 paths, its deposits */
export function solveUnder(id, arm, pol) {
  const base = byId[id].plan, plan = prep({ ...base, spending: { ...base.spending, decumulationPolicy: pol } });
  const opts = { lambda: 0.0223606797749979, points: 6, bequestWeight: 0.02 };
  const r = arm === 'CAND' ? solveCandidate(E, M, plan, opts) : solvePlan(E, M, candidatePlan(E, plan), opts);
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), h = createHash('sha256');
  for (const zs of E.pathsForSeed(99001, 200, ctx.totalYears)) { const x = E.runTrial(ctx, Float64Array.from(zs)); h.update([x.survived, x.terminalPotNet, x.lifetimeTax, x.unmetTotal].join(':') + ';'); }
  return { table: arraysHash(r.mix ? r.mix.tables : [r.table]), layers: arraysHash([r.tablesW]), run: h.digest('hex').slice(0, 16), deposits: deposits(ctx) };
}

const MAIN = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (MAIN && process.argv[2] === 'one') { console.log(JSON.stringify(solveUnder(process.argv[3], process.argv[4], process.argv[5].replace(/_/g, ' ')))); process.exit(0); }
if (MAIN) {
  const cid = codeId();
  console.log(`PHASE 4'S WINDFALL ROUTING (D37), EXPLORATORY; code ${cid ? cid.hash : 'unknown'}`);
  let bad = 0;
  // 1. the engine under a table routes the windfall as the solver solved it
  const rerouted = PANEL.filter(h => solverPlanOf(h.plan, { decumulationPolicy: h.label.split(',')[0].replace(/ \(harvest off\)$/, '') }) !== h.plan);
  for (const h of rerouted) {
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: 'Windfall to ISA' })), solver = E.buildContext(plan);
    const table = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => null, switchCost: 0, tiersBelow: 2, meta: {} } } });
    const ok = deposits(solver) === deposits(table); if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  1. ${h.id} (arm A ${h.label}): the solver solves ${deposits(solver)}; the engine under its table runs ${deposits(table)}; under the plan's own ${h.plan.spending.decumulationPolicy} ${deposits(E.buildContext(prep(h.plan)))}`);
  }
  // 2. the name reaches a solve only through the routed deposits (each solve in its own process, one after another)
  const jobs = [['S272', 'SHIP'], ['S304F', 'SHIP'], ['S272', 'CAND'], ['S304F', 'CAND'], ['S290', 'SHIP']].flatMap(([id, arm]) => ['Bracket Fill Basic', 'Windfall to ISA'].map(p => [id, arm, p]));
  const run = ([id, arm, p]) => JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'one', id, arm, p.replace(/ /g, '_')], { encoding: 'utf8', maxBuffer: 1 << 26 }).trim().split('\n').pop());
  const out = {}; for (const j of jobs) out[j.join('|')] = run(j);
  for (const [id, arm] of [['S272', 'SHIP'], ['S304F', 'SHIP'], ['S272', 'CAND'], ['S304F', 'CAND'], ['S290', 'SHIP']]) {
    const a = out[`${id}|${arm}|Bracket Fill Basic`], b = out[`${id}|${arm}|Windfall to ISA`], same = a.table === b.table && a.layers === b.layers && a.run === b.run, windfall = a.deposits !== 'none';
    const ok = windfall ? !same && a.deposits !== b.deposits : same; if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  2. ${id} ${arm} at 6 points: Bracket Fill Basic table ${a.table} layers ${a.layers} run ${a.run} (deposits ${a.deposits}) | Windfall to ISA table ${b.table} layers ${b.layers} run ${b.run} (deposits ${b.deposits}): ${windfall ? (same ? 'the same, though the deposit moved' : 'the deposit moves and the table with it') : (same ? 'the same bit for bit' : 'DIFFERENT with no windfall')}`);
  }
  console.log(bad ? `FAILED: ${bad} checks` : 'ALL PASS');
  process.exit(bad ? 1 : 0);
}
