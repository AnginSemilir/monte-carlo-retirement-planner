/*
 * L5'S COST-YEAR TRACE (EXPLORATORY, seed 7002; the maintainer's go-ahead of 2 Nov for the trace after L4; the reviewer at
 * L5's read, reviews/2026-11-01-read-L5.md, MINORs 1 and 3). L5 recorded the cost year's tax and not which wrapper paid
 * the cost, so the candidate's higher cost-year tax on S368 c30y10 and S188 c30y3 is a lead, not a cause. This trace
 * re-runs those two cells as audit-costs.mjs runs them (the same plans, arms, solve and paths) and records, in the cost
 * year, under each arm:
 *   - what each step of the cost order paid (net), and the pension's gross draw for it;
 *   - the wrappers' balances at the end of the year before (what the cost could be paid from);
 *   - the year's tax (income tax and CGT), all of the year's gross pension draw and its taxable part;
 *   - under CANDD, the move chosen that year and its cost order.
 * The record comes from a copy of research/engine.mjs with one hook in its one-off cost loop (step 5 of stepYear),
 * loaded from a scratch folder; the copy is checked against the engine itself on every path of both arms (E.runTrial's
 * survival, unmet total and terminal pot the same), so the hook changes nothing it measures. Beside it, runPolicy against
 * the engine on CANDD's first 1,000 paths (MINOR 3: the solver's own forward run of the table, survival compared).
 * Figures over the paths where both arms survive (Phase 4's rule, audit-phase4.mjs runPath), and over the paths alive at
 * the cost year under both. It decides nothing.
 *   node research/solver/trace-costs.mjs [paths] [cell ...]      (3000 and S368:c30y10 S188:c30y3 unless given)
 *   TRACE_PTS the points (smoke only)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, CANDIDATE_HASH } from './candidate.mjs';
import { readPanel, appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { SEED, W, CELLS, cellName, withCost } from './audit-costs.mjs';
import { codeId } from './code-id.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// e3pcls guard: CANDD solves through solveCandidate (the pin checked there)

const HERE = dirname(fileURLToPath(import.meta.url));
/* the engine with one hook in its cost loop: each step's net payment and the pension's gross draw for it */
export async function tracedEngine() {
  const src = readFileSync(join(HERE, '..', 'engine.mjs'), 'utf8');
  const head = '    for (const step of ctx.costSteps) {\n      if (rem <= 0) break;\n';
  const tail = '\n    }\n    unmetCost = Math.max(0, rem);';
  if (src.split(head).length !== 2 || src.split(tail).length !== 2) throw new Error('trace-costs: the engine\'s cost loop is not where the hook expects it');
  const hooked = src.replace(head, `${head}      const __rem0 = rem, __g0 = drawdownPensions;\n`)
    .replace(tail, `\n      if (globalThis.__costTrace) globalThis.__costTrace(step, __rem0 - rem, drawdownPensions - __g0);${tail}`);
  const f = join(mkdtempSync(join(tmpdir(), 'trace-costs-')), 'engine-traced.mjs');
  writeFileSync(f, hooked);
  return import(pathToFileURL(f).href);
}

const pct = (xs, q) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const gbp = x => (Number.isFinite(x) ? `£${Math.round(x).toLocaleString('en-GB')}` : '-');
const spread = xs => `${gbp(mean(xs))} (median ${gbp(pct(xs, 0.5))}, 10th to 90th ${gbp(pct(xs, 0.1))} to ${gbp(pct(xs, 0.9))})`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const N = Number(process.argv[2]) || 3000, PTS = Number(process.env.TRACE_PTS) || CAND_PTS;
  const want = (process.argv.slice(3).length ? process.argv.slice(3) : ['S368:c30y10', 'S188:c30y3']).map(s => { const [id, c] = s.split(':'); const cell = CELLS.find(x => cellName(x) === c); if (!cell) throw new Error(`trace-costs: no cell ${c}`); return [id, cell]; });
  const byId = Object.fromEntries(readPanel().map(h => [h.id, h])), E2 = await tracedEngine(), cid = codeId();
  console.log(`L5'S COST-YEAR TRACE (EXPLORATORY): ${want.map(([id, c]) => `${id} ${cellName(c)}`).join(', ')}; seed ${SEED}, ${N} paths, ${PTS} points; code ${cid ? cid.hash : 'unknown'}, candidate ${CANDIDATE_HASH}`);
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  for (const [id, cell] of want) {
    const h = byId[id], t0 = Date.now();
    if (!h) throw new Error(`trace-costs: ${id} is not in Phase 4's panel`);
    const { plan: costed, t: tc, amount, wealth } = withCost(h.plan, cell);
    const a = armA(appPlan(costed), { tournament: false });
    const planA = E.resolveMpaa(a.planState);
    const r = solveCandidate(E, M, structuredClone(prep(solverPlanOf(costed, { decumulationPolicy: a.planState.spending.decumulationPolicy }))), { lambda: LAMBDA, points: PTS, bequestWeight: W });
    const planC = withTable(r.m.ctx.plan, r);
    const ctx = { APP: E.buildContext(planA), CANDD: E.buildContext(planC) }, ctx2 = { APP: E2.buildContext(planA), CANDD: E2.buildContext(planC) };
    const T = ctx.CANDD.totalYears, paths = E.pathsForSeed(SEED, N, T), n = paths.length;
    console.log(`\n${id} ${cellName(cell)}: a cost of ${gbp(amount)} (${Math.round(100 * cell[0])}% of ${gbp(wealth)}) in year ${tc}; APP "${a.label}", cost order ${ctx.APP.costSteps.join(' > ')}; CANDD solved in ${Math.round((Date.now() - t0) / 1000)} s`);
    const rec = {};
    for (const arm of ['APP', 'CANDD']) {
      const c = ctx[arm], c2 = ctx2[arm], R = rec[arm] = { survived: new Uint8Array(n), alive: new Uint8Array(n), rows: [] };
      let differ = 0;
      paths.forEach((zs0, k) => {
        const zs = Float64Array.from(zs0), o = runPath(c, zs);
        R.survived[k] = o.survived ? 1 : 0;
        const q = E.runTrial(c, zs), q2 = E2.runTrial(c2, zs);
        if (q.survived !== q2.survived || q.unmetTotal !== q2.unmetTotal || q.terminalPotNet !== q2.terminalPotNet) differ++;
        // the year by year run on the traced copy, the cost year's record kept
        const state = E2.freshState(c2), zPath = zs.length > T + 1 ? zs[T + 1] : 0, steps = {};
        let before = null, row = null, unmetBefore = 0;
        for (let t = 0; t <= tc; t++) {
          globalThis.__costTrace = t === tc ? (step, net, gross) => { const s = steps[step] || (steps[step] = { net: 0, gross: 0 }); s.net += net; s.gross += gross; } : null;
          const y = E2.stepYear(c2, state, t, { z: zs[t], zPath });
          if (t < tc) { before = y; unmetBefore += y.unmetDemand > 0.5 ? 1 : 0; } else row = y;
        }
        globalThis.__costTrace = null;
        R.alive[k] = unmetBefore === 0 ? 1 : 0;
        R.rows.push({ steps, row, before });
      });
      if (differ) { console.error(`trace-costs: ${id} ${arm}: the traced engine differs from the engine on ${differ} of ${n} paths`); process.exit(3); }
      console.log(`  ${arm}: the traced engine the same as the engine on ${n} of ${n} paths; survival ${(100 * R.survived.reduce((x, v) => x + v, 0) / n).toFixed(2)}%`);
    }
    const NB = Math.min(n, 1000);
    let engineOnly = 0, policyOnly = 0;
    for (let k = 0; k < NB; k++) { const p = runPolicy(r, Float64Array.from(paths[k])).survived ? 1 : 0; if (rec.CANDD.survived[k] && !p) engineOnly++; if (p && !rec.CANDD.survived[k]) policyOnly++; }
    console.log(`  runPolicy beside the engine on CANDD's first ${NB} paths: the engine alone ${engineOnly}, runPolicy alone ${policyOnly}`);
    for (const [label, keep] of [['both arms survive', k => rec.APP.survived[k] && rec.CANDD.survived[k]], [`both alive at the cost year (no shortfall before year ${tc})`, k => rec.APP.alive[k] && rec.CANDD.alive[k]]]) {
      const ks = [...Array(n).keys()].filter(keep);
      console.log(`  Paths where ${label}: ${ks.length} of ${n}`);
      for (const arm of ['APP', 'CANDD']) {
        const rows = ks.map(k => rec[arm].rows[k]), stepNames = [...new Set(rows.flatMap(x => Object.keys(x.steps)))];
        console.log(`    ${arm}:`);
        const b = f => rows.map(x => (x.before ? f(x.before) : NaN)).filter(Number.isFinite);
        console.log(`      the year before, at its end: pension ${spread(b(y => y.pensions))}; ISAs ${spread(b(y => y.isas))}; the GIA ${spread(b(y => y.other))}; cash ${spread(b(y => y.cash))}`);
        for (const s of stepNames) console.log(`      the cost paid from ${s}: ${spread(rows.map(x => (x.steps[s] ? x.steps[s].net : 0)))}${/^pen/.test(s) || /pen/i.test(s) ? `; its gross pension draw ${spread(rows.map(x => (x.steps[s] ? x.steps[s].gross : 0)))}` : ''}`);
        console.log(`      the cost unpaid: ${spread(rows.map(x => { const paid = Object.values(x.steps).reduce((t, v) => t + v.net, 0); return Math.max(0, amount - paid); }))}`);
        console.log(`      the year: gross pension drawn ${spread(rows.map(x => x.row.drawdownPensions))}, its taxable part ${spread(rows.map(x => x.row.taxablePensionSelf))}; income tax and CGT ${spread(rows.map(x => x.row.taxPaid + (x.row.cgtPaid || 0)))}`);
        if (arm === 'CANDD') {
          const acts = {}; rows.forEach(x => { const key = `${x.row.action || '-'}`; acts[key] = (acts[key] || 0) + 1; });
          const top = Object.entries(acts).sort((p, q) => q[1] - p[1]).slice(0, 5);
          console.log(`      the moves chosen in the cost year (the five most common, of ${rows.length}): ${top.map(([m, c]) => `${m} ${c}`).join('; ')}`);
        }
      }
    }
  }
}
