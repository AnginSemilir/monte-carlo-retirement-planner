/*
 * THE COUPLES' RE-RUN, THE STAGE GATE'S REFUSAL OF 13 NOV: WHICH INPUT DIFFERS BETWEEN THE ARMS, FROM THE PLANS ALONE (EXPLORATORY).
 * stage-couples.mjs refused with "S293: SHIPC and APP on different plans" and the same for CANDC, at both weights, and decided
 * nothing. This reads no file of the run and no path of seed 7021: it builds each arm's plan as audit-couples.mjs builds it
 * (arm A's pick on the couple's plan, guardrails on and the lookahead at 5; the solver arms' plan under arm A's policy name
 * with guardrails and the lookahead off, CANDC's prepared as the app prepares it), on the code of the tree named, and compares
 * what audit-phase4.mjs inputsHash hashes. Then, for a couple whose arms differ, arm A's plan run by the engine on the tuning
 * seed with each of the differing values, to see whether the difference moves any money.
 *   D4B_ROOT=<the launch worktree> node research/solver/d4b-plan-check.mjs [ids] > research/solver/results-d4b-plan-check.txt
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const R = process.env.D4B_ROOT;
if (!R) { console.error('d4b-plan-check: D4B_ROOT=<the tree the run was launched from>'); process.exit(2); }
const at = p => import(pathToFileURL(join(R, p)).href);
const E = await at('research/engine.mjs'), AC = await at('research/solver/audit-couples.mjs');
const { readPanel, appPlan } = await at('research/solver/couple-panel.mjs'), { armA } = await at('research/solver/select-phase4.mjs'), { inputsHash } = await at('research/solver/audit-phase4.mjs');
const commit = execFileSync('git', ['-C', R, 'rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
const only = process.argv[2] ? process.argv[2].split(',') : null, SEED = 7002, NP = 2000;
const panel = readPanel(AC.PANEL_FILE).filter(h => !only || only.includes(h.id));
console.log(`THE COUPLES' RE-RUN'S PLANS, ARM BY ARM (EXPLORATORY; the plans' inputs alone, on the code of the tree at ${commit}; no file of the run and no path of seed 7021 read): ${panel.length} couple${panel.length === 1 ? '' : 's'}${only ? ` (${only.join(', ')})` : ' of the panel'}`);
const ownerOf = o => ({ age0: o.age0, retireAge: o.retireAge, salary: o.salary, salaryGrowth: o.salaryGrowth, selfEmployed: o.selfEmployed, cgtGainsUsed: o.cgtGainsUsed, cfBroughtForward: o.cfBroughtForward, mpaaAge: o.mpaaAge, statePension: o.statePension, cashIsa0: o.cashIsa0, cashIsaContrib: o.cashIsaContrib });
let differ = 0;
for (const h of panel) {
  const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const ctx = { APP: E.buildContext(E.resolveMpaa(a.planState)), SHIPC: E.buildContext(AC.solverPlan('SHIPC', h.plan, aPol, 0.02)), CANDC: E.buildContext(AC.solverPlan('CANDC', h.plan, aPol, 0.02)) };
  const hash = Object.fromEntries(Object.entries(ctx).map(([k, c]) => [k, inputsHash(c)]));
  const same = hash.APP === hash.SHIPC && hash.APP === hash.CANDC;
  console.log(`  ${h.id} (${a.label}): APP ${hash.APP}, SHIPC ${hash.SHIPC}, CANDC ${hash.CANDC}: ${same ? 'one plan' : 'DIFFERENT PLANS'}`);
  if (same) continue;
  differ++;
  // what differs, field by field: each owner's hashed fields, and the rest of the hash with the owners' MPAA ages left out
  for (const arm of ['SHIPC', 'CANDC']) ctx.APP.owners.forEach((o, k) => { const x = ownerOf(o), y = ownerOf(ctx[arm].owners[k]); for (const f of Object.keys(x)) if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) console.log(`    ${arm} against APP, ${o.key}: ${f} ${JSON.stringify(y[f])} against ${JSON.stringify(x[f])}`); });
  const noMpaa = c => inputsHash({ ...c, owners: c.owners.map(o => ({ ...o, mpaaAge: 0 })) });
  console.log(`    with every owner's MPAA age left out of the hash: APP ${noMpaa(ctx.APP)}, SHIPC ${noMpaa(ctx.SHIPC)}, CANDC ${noMpaa(ctx.CANDC)}: ${noMpaa(ctx.APP) === noMpaa(ctx.SHIPC) && noMpaa(ctx.APP) === noMpaa(ctx.CANDC) ? 'the same, so the MPAA age is the only difference' : 'STILL DIFFERENT'}`);
  // does it move money? Each person's yearly pension contribution against the MPAA's limit, and arm A's plan run with each age
  const P = ctx.APP.P, pens = a.planState.accounts.filter(x => /^pen_/.test(x.id)).map(x => `${x.id} £${E.num(x.contrib, 0)}${E.num(x.employerContrib, 0) ? ` and the employer's £${E.num(x.employerContrib, 0)}` : ''}`);
  console.log(`    the MPAA's limit £${P.mpaaLimit}; the plan's yearly pension contributions: ${pens.join('; ')}`);
  const ages = c => c.owners.map(o => o.mpaaAge), run = (mp) => { const p = JSON.parse(JSON.stringify(E.resolveMpaa(a.planState))); p.demographics.mpaaAgeSelf = mp[0]; p.demographics.mpaaAgePart = mp[1]; const c = E.buildContext(p); return { ages: ages(c), out: E.pathsForSeed(SEED, NP, c.totalYears).map(zs => { const q = E.runTrial(c, Float64Array.from(zs)); return `${q.survived ? 1 : 0}|${q.terminalPotNet}|${q.lifetimeTax}|${q.unmetTotal}`; }) }; };
  const A = run(ages(ctx.APP)), S = run(ages(ctx.SHIPC));
  let n = 0; for (let i = 0; i < NP; i++) if (A.out[i] !== S.out[i]) n++;
  console.log(`    arm A's plan run by the engine on ${NP} paths of seed ${SEED} with the MPAA ages ${A.ages.join(' and ')} (arm A's) and ${S.ages.join(' and ')} (the solver arms'): ${n} paths differ in survival, estate, lifetime tax or unmet spending`);
}
console.log(`${differ} of ${panel.length} couple${panel.length === 1 ? '' : 's'} with arms on different plans`);
