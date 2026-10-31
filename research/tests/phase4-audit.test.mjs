/*
 * PHASE 4'S AUDIT: THE INPUTS HASH AND THE SEED GUARDS (the design re-review of 27 Oct, minor 4; CHECKLIST 5). The checks:
 *   1. audit-phase4.mjs inputsHash, on a panel household's engine context, moves with what a household's arms must share (a
 *      pound of balance, a pound of contribution, a hundred pounds of target) and stays put under the policy's own choices
 *      (another draw order, the lump sum, the harvest off, the guardrails and lookahead off); the plant: a hash blind to the
 *      balances, which the first check must catch;
 *   2. the audit refuses seeds 7003 and 7018 outside the registered run, and the registered run outside its registration
 *      (no PREDICTION_FILE, or another); the plant: a run the audit allows (--units) must not read as refused. No run here
 *      reaches a solve or a path: each refusal comes before the units start.
 *   node research/tests/phase4-audit.test.mjs
 */
import * as E from '../engine.mjs';
import { readPanel } from '../solver/phase4-panel.mjs';
import { inputsHash } from '../solver/audit-phase4.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const AUDIT = join(dirname(fileURLToPath(import.meta.url)), '../solver/audit-phase4.mjs');
const base = readPanel().find(h => h.id === 'S272').plan;
const ctxOf = f => { const p = JSON.parse(JSON.stringify(base)); f(p); return E.buildContext(E.resolveMpaa(E.normalizePlan(p))); };
const same = ctxOf(() => {});

// 1. what moves the hash, and what does not; the same checks against a planted hash blind to the balances
const moves = [
  ['a pound of balance', p => { p.accounts[0].balance = E.num(p.accounts[0].balance, 0) + 1; }],
  ['a pound of contribution', p => { const a = p.accounts.find(x => E.num(x.contrib, 0) > 0) || p.accounts[0]; a.contrib = E.num(a.contrib, 0) + 1; }],
  ['a hundred pounds of target', p => { p.spending.targetSpend = E.num(p.spending.targetSpend, 0) + 100; }]];
const stays = [
  ['another draw order (ISA First)', p => { p.spending.decumulationPolicy = 'ISA First'; }],
  ['the full lump sum', p => { p.spending.drawdownStrategy = 'Full 25% Lump Sum'; }],
  ['the harvest off', p => { p.config.harvestPersonalAllowance = false; }],
  ['the guardrails and the lookahead off', p => { p.config.guardrails = false; p.config.lookaheadYears = 0; }]];
const checks = h => [...moves.map(([nm, f]) => [`moves with ${nm}`, h(ctxOf(f)) !== h(same)]), ...stays.map(([nm, f]) => [`stays under ${nm}`, h(ctxOf(f)) === h(same)])];
for (const [nm, c] of checks(inputsHash)) ok(c, `inputsHash ${nm} (S272)`);
const blind = ctx => inputsHash({ ...ctx, accounts: ctx.accounts.map(a => ({ ...a, balance: 0 })) });
ok(checks(blind).some(([, c]) => !c) && !checks(blind)[0][1], 'the plant: a hash blind to the balances fails the check on a pound of balance');

// 2. the refusals, each before any unit starts
const env = { ...process.env }; delete env.PREDICTION_FILE; delete env.PREDICTION_SHA;
const runAudit = (args, extra = {}) => spawnSync(process.execPath, [AUDIT, ...args], { env: { ...env, ...extra }, encoding: 'utf8', timeout: 120000 });
const refused = (r, re) => r.status === 2 && re.test(r.stderr);
ok(refused(runAudit(['300', 'part', '0/1', '7003']), /7003 and 7018 run only as the registered run/), 'seed 7003 outside the registered run: refused');
ok(refused(runAudit(['300', 'part', '0/1', '7018']), /7003 and 7018 run only as the registered run/), 'seed 7018 outside the registered run: refused');
ok(refused(runAudit(['registered', 'part', '0/1']), /runs only under its registration/), 'the registered run with no PREDICTION_FILE: refused');
ok(refused(runAudit(['registered', 'part', '0/1'], { PREDICTION_FILE: 'research/solver/registrations/fresh-7uf.md' }), /runs only under its registration/), 'the registered run under another registration: refused');
{ const r = runAudit(['--units']); ok(r.status === 0 && !refused(r, /run only/), `the plant: a run the audit allows (--units, ${String(r.stdout).trim().split('\n').pop()} units) does not read as refused`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
