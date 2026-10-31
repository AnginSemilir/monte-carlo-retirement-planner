/*
 * THE BET AUDIT (M14c, record.mjs betAudit) on a tiny solve: it must find the first bets, compare each with the table's best
 * move that does not bet, and simulate both from the same position - and it must REFUSE to report when the solve it is
 * given is not the one the reference record came from (planted: one path's outcome flipped in the reference).
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy } from '../../src/solver/solve.js';
import { makeTrace, writeRecord } from '../solver/record.mjs';
import { betAudit, betSummary } from '../solver/record.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S330');
const raw = { ...sc.plan, accounts: sc.plan.accounts.map(a => (/^Pensions|^S&S ISA/.test(a.category) ? { ...a, risk: 'Medium Risk' } : a)) };
const plan = E.resolveMpaa(E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 0 }, spending: { ...raw.spending, floorSpend: Math.round(0.8 * E.num(raw.spending.targetSpend, 0)) } }));
const m = M.prepare(E, plan), T = m.ctx.totalYears;
const r = solve(E, M, plan, { points: 8, lambda: 0.5, raiseWeight: 0.003, spendLevels: [1.1, 1, 0.95, 0.9, 0.8], tiers: true, tiersAbove: 1, lump: m.ctx.fullLumpSum, resilienceWeight: 0, finalExact: true });
const held = E.pathsForSeed(7011, 200, T);
const tr = makeTrace(held.length, T + 1);
const rs = held.map((zs, i) => { tr.row = i; return runPolicy(r, zs, { trace: tr }); });
const dir = mkdtempSync(join(tmpdir(), 'bet-audit-'));
const meta = { tag: 'test', id: 'S330', held: held.length, seedHeld: 7011, points: 8, arm: 'solver' };
writeRecord(join(dir, 'ref.record.json.gz'), tr, rs, meta);
try {
  const out = betAudit({ E, r, held, solvedRs: rs, trS: tr, id: 'S330', tag: 'test', RESULTS: dir, CODE: null, PREDICTION: null, NPOS: 3, NP: 40, refPath: join(dir, 'ref.record.json.gz'), outDir: dir });
  console.log(`      ${betSummary(out)}`);
  ok(out.reproduced.pathDiff === 0 && out.reproduced.tierDiff === 0, 'the solve reproduces its own reference record, path for path');
  ok(out.betPaths > 0 && out.positions === Math.min(3, out.betPaths), `it finds the paths that bet (${out.betPaths} of 200) and samples ${out.positions} positions`);
  ok(out.rows.every(x => (x.betTier[0] === 3 || x.betTier[1] === 3) && x.stayTier[0] < 3 && x.stayTier[1] < 3), `each bet holds the tier above (index 3) and each stay does not (${out.rows.map(x => `${x.betTier} vs ${x.stayTier}`).join('; ')})`);
  ok(out.rows.every(x => x.stay !== null && Number.isFinite(x.margin)), 'every position has a best move that does not bet, and the table\'s margin between them');
  ok(out.rows.every(x => x.survBet >= 0 && x.survBet <= 100 && x.survStay >= 0 && x.survStay <= 100 && x.se >= 0), 'both moves are simulated to a survival rate, with a paired standard error');
  console.log(`      table ranks the bet first at ${out.rows.filter(x => x.tableBetFirst).length} of ${out.rows.length} positions; margins ${out.rows.map(x => x.margin.toExponential(1)).join(', ')}`);
  // planted: a reference whose one path's outcome differs must stop the audit before anything is reported
  const rs2 = rs.map((o, i) => (i === 0 ? { ...o, survived: !o.survived } : o));
  writeRecord(join(dir, 'planted.record.json.gz'), tr, rs2, meta);
  assert.throws(() => betAudit({ E, r, held, solvedRs: rs, trS: tr, id: 'S330', tag: 'test', RESULTS: dir, CODE: null, PREDICTION: null, NPOS: 1, NP: 5, refPath: join(dir, 'planted.record.json.gz'), outDir: dir }), /NOT M14b's solve - 1 paths differ/);
  n++; console.log('PASS  planted: a reference with one path flipped is refused - nothing is reported');
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log(`\n${n} passed`);
