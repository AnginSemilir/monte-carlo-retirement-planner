/*
 * THE SAVINGS SPLIT'S CHANGE OF DEFAULT, THE IDENTITY (D138; the reviewer at the savings split's v2 read, MINOR 4 (b),
 * reviews/2026-11-21-read-save-v2.md; EXPLORATORY). The app's route for a working single on the code the change lands on,
 * against the tested arm (the registered CANDSA, on anchors) path for path, as D99's, D109's and D136's identities held
 * theirs:
 *   - the plan: the one the registered audit handed the solvers (audit-save-v2.mjs: arm A's policy, guardrails off, the
 *     lookahead off, the MPAA resolved), handed to the page's solve;
 *   - the table: solved as the page solves it (src/solverApp.js solveForApp at the app's 45 points), its digest against the
 *     registered CANDSA's;
 *   - the paths: the engine's run of it (audit-phase4.mjs runPath, as the registered audit ran it) on the first N paths of
 *     seed 7025, already read by the registered read (D137 (4)), every array against the registered CANDSA's, bit for bit.
 * Two kinds of unit: an employee with the hold unset and the split's routes priced without the 2029 cap on salary sacrifice's
 * NIC relief (`saveIsaFirst` off, src/App.jsx SAVE_NIC_CAP.on false: the configuration and the price the split's v2
 * registered), and a self-employed saver at the default itself (the hold offers the ISA first to the self-employed and the
 * cap is an employee's, so neither changes anything there). At the default an employee's split holds the ISA first back and
 * prices its routes with the cap from 2029 (D137 (4)), which no run has measured; nothing here says otherwise. It prints each
 * unit's verdict and the paths that differ, no outcome.
 * Then (2.) the 2029 route on the panel's 30 employees, from their plans alone (no solve).
 *   node research/solver/save-default-identity.mjs <the read's tree> [N] > research/solver/results-save-default-identity.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { solveForApp } from '../../src/solverApp.js';
import { APP_POINTS } from '../../src/solverSettings.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { withTable } from '../../src/solver/bridge.js';
import { appPlan as panelPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath, solverPlanOf } from './audit-phase4.mjs';
import { KEYS } from './audit-save-v2.mjs';
import { readSaveV2Panel } from './save-v2-panel.mjs';
import { codeId } from './code-id.mjs';

const TREE = process.argv[2] && resolve(process.argv[2]), N = Number(process.argv[3]) || 1000;
if (!TREE) { console.error('save-default-identity: <the read\'s tree> [N]'); process.exit(2); }
const UNITS = [['S300F', 'employee, the hold and the cap unset'], ['S270', 'employee, the hold and the cap unset'], ['S280', 'self-employed, the default'], ['S196', 'self-employed, the default']];
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const panel = readSaveV2Panel(), cid = codeId();
console.log(`THE SAVINGS SPLIT'S CHANGE OF DEFAULT, THE IDENTITY (EXPLORATORY; D138): the app's route for a working single on this code ${cid ? cid.hash : '?'} against the registered CANDSA (the read's code 71fb4271c681), on the first ${N} paths of seed 7025, at ${APP_POINTS} points`);
let same = 0;
for (const [id, kind] of UNITS) {
  const U = panel.find(u => u.id === id), R = JSON.parse(gunzipSync(readFileSync(join(TREE, 'research/solver/results/save-v2-run', `${id}.json.gz`))).toString()), S = R.arms.CANDSA;
  const reg = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(S[k], Ty)]));
  const a = armA(panelPlan(U.plan), { tournament: false });
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  const plan = prep(solverPlanOf(U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy }));
  const registered = /unset/.test(kind), hold = registered ? { research: { saveIsaFirst: undefined } } : {};
  E.SAVE_NIC_CAP.on = !registered;   // an employee's routes at the registered price; the self-employed's at the default's
  const t0 = Date.now(), r = solveForApp(E, M, plan, { points: APP_POINTS, ...hold }), secs = Math.round((Date.now() - t0) / 1000);
  const digest = await digestOf(tablesOf(r)), ctx = E.buildContext(withTable(r.m.ctx.plan, r)), paths = E.pathsForSeed(7025, N, ctx.totalYears).map(z => Float64Array.from(z));
  const D = Object.fromEntries(Object.keys(KEYS).map(k => [k, 0]));
  for (let i = 0; i < N; i++) {
    const q = runPath(ctx, paths[i], false), got = { survived: q.survived ? 1 : 0, failYear: q.failYear, pot: q.wealth, estate: q.estate, tax: q.tax, delivered: q.delivered, unmet: q.unmet };
    for (const k of Object.keys(KEYS)) if (!Object.is(got[k], reg[k][i])) D[k]++;
  }
  const ok = digest === S.digest && Object.values(D).every(v => v === 0);
  if (ok) same++;
  console.log(`${id} (${kind}): ${ok ? 'IDENTICAL' : 'DIFFERENT'}; the menu ${r.actions.length} moves (${r.actions.filter(x => x.save === 2).length} ISA-first copies), its record saveSplit '${r.meta.saveSplit}' saveIsaFirst '${r.meta.saveIsaFirst}'; the table ${digest.slice(0, 12)} against the registered CANDSA's ${S.digest.slice(0, 12)} (${digest === S.digest ? 'the same' : 'DIFFERENT'}); paths differing of ${N}: ${JSON.stringify(D)}; the solve ${secs} s`);
}
E.SAVE_NIC_CAP.on = true;
console.log(`${same} of ${UNITS.length} units IDENTICAL`);
/*
 * 2. THE 2029 ROUTE (the reviewer at test K's read, finding 1, reviews/2026-11-21-read-save-k.md): from April 2029, under the
 * cap, an employee whose plan pays more than the £2,000 the cap relieves into the pension (every one of the panel's 30) is
 * priced on each further pound as test K priced it, so the pension first's route (save 1: the pension, the ISA and the
 * overflow) must be the flipped plan's (employmentSelf 'self-employed', K's lever) to the penny; the ISA first (save 2) is
 * not, its budget the NIC relief on the first £2,000 lower, and is held back for an employee at the default (D137 (4)).
 * No solve: each plan's context and its routes, year by year.
 */
{
  const prepP = plan => E.resolveMpaa(E.normalizePlan(plan)), flip = plan => ({ ...plan, demographics: { ...plan.demographics, employmentSelf: 'self-employed' } });
  let years = 0, same1 = 0, worst = 0, differ2 = 0, units = 0;
  for (const U of panel.filter(u => u.plan.demographics.employmentSelf !== 'self-employed')) {
    units++;
    const a = E.buildContext(prepP(structuredClone(U.plan))), b = E.buildContext(prepP(flip(structuredClone(U.plan)))), ids = a.owners[0].ids;
    for (let t = 0; t <= a.totalYears; t++) {
      if (a.baseYear + t < E.SAVE_NIC_CAP.from) continue;
      const ra = a.saveSplitAt(t), rb = b.saveSplitAt(t);
      if (!ra && !rb) continue;
      years++;
      if (!ra || !rb) continue;
      const g = Math.max(...[ids.pen, ids.isa, ids.other].map(id => Math.abs(ra.variants[1][id] - rb.variants[1][id])));
      worst = Math.max(worst, g); if (g < 0.01) same1++;
      if (Math.abs(ra.variants[2][ids.isa] - rb.variants[2][ids.isa]) >= 0.01) differ2++;
    }
  }
  console.log(`\n2. THE 2029 ROUTE: on the panel's ${units} employees, the working years from ${E.SAVE_NIC_CAP.from} with a saving to place: ${years}; the pension first's route under the cap the flipped plan's (K's price) to the penny in ${same1} of them (the largest gap £${worst.toExponential(2)}); the ISA first's ISA different in ${differ2} (held back for an employee at the default)`);
}
