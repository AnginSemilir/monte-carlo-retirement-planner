/*
 * THE COUPLES' RE-RUN, THE STAGE GATE'S REFUSAL OF 13 NOV: WHICH INPUT DIFFERS BETWEEN THE ARMS, FROM THE PLANS ALONE (EXPLORATORY).
 * stage-couples.mjs refused with "S293: SHIPC and APP on different plans" and the same for CANDC, at both weights, and decided
 * nothing. This reads no file of the run and no path of seed 7021: it builds each arm's plan as audit-couples.mjs builds it
 * (arm A's pick on the couple's plan, guardrails on and the lookahead at 5; the solver arms' plan under arm A's policy name
 * with guardrails and the lookahead off, CANDC's prepared as the app prepares it), on the code of the tree named, and compares
 * what audit-phase4.mjs inputsHash hashes. Then, for a couple whose arms differ, arm A's plan run by the engine on the tuning
 * seed with each of the differing values, to see whether the difference moves any money.
 * Added 13 Nov after the review of amendment 1 (reviews/2026-11-13-couples-d4b-amendment-1.md, findings 1 and 2), still from
 * the plans alone: where the differing age comes from (each plan's MPAA ages resolved with the guardrails and the lookahead
 * as the arm has them and with both off: it is the policy that moves the age, not those two); and the solver arms' own
 * plan under either age: the household's engine context compared field by field, every field and not only the hashed ones
 * (a function by its source), and each person's own plan (couple.js singlePlanFor), whose table the solve is made on.
 *   D4B_ROOT=<the launch worktree> node research/solver/d4b-plan-check.mjs [ids] > research/solver/results-d4b-plan-check.txt
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const R = process.env.D4B_ROOT;
if (!R) { console.error('d4b-plan-check: D4B_ROOT=<the tree the run was launched from>'); process.exit(2); }
const at = p => import(pathToFileURL(join(R, p)).href);
const E = await at('research/engine.mjs'), AC = await at('research/solver/audit-couples.mjs');
const { singlePlanFor } = await at('src/solver/couple.js');
const { readPanel, appPlan } = await at('research/solver/couple-panel.mjs'), { armA } = await at('research/solver/select-phase4.mjs'), { inputsHash } = await at('research/solver/audit-phase4.mjs');
const commit = execFileSync('git', ['-C', R, 'rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
const only = process.argv[2] ? process.argv[2].split(',') : null, SEED = 7002, NP = 2000;
const panel = readPanel(AC.PANEL_FILE).filter(h => !only || only.includes(h.id));
console.log(`THE COUPLES' RE-RUN'S PLANS, ARM BY ARM (EXPLORATORY; the plans' inputs alone, on the code of the tree at ${commit}; no file of the run and no path of seed 7021 read): ${panel.length} couple${panel.length === 1 ? '' : 's'}${only ? ` (${only.join(', ')})` : ' of the panel'}`);
const ownerOf = o => ({ age0: o.age0, retireAge: o.retireAge, salary: o.salary, salaryGrowth: o.salaryGrowth, selfEmployed: o.selfEmployed, cgtGainsUsed: o.cgtGainsUsed, cfBroughtForward: o.cfBroughtForward, mpaaAge: o.mpaaAge, statePension: o.statePension, cashIsa0: o.cashIsa0, cashIsaContrib: o.cashIsaContrib });
/* every field of two values that differs, by its path: objects, arrays and typed arrays walked, a function by its source */
function diffAll(x, y, at, out, seen = new Set()) {
  const leaf = v => v === null || typeof v !== 'object';
  if (typeof x === 'function' || typeof y === 'function') { out.n++; if (String(x) !== String(y)) out.d.push(`${at}: a function's source`); return; }
  if (leaf(x) || leaf(y)) { out.n++; if (!Object.is(x, y)) out.d.push(`${at}: ${JSON.stringify(x)} | ${JSON.stringify(y)}`); return; }
  if (seen.has(x)) return; seen.add(x);
  if (ArrayBuffer.isView(x) || ArrayBuffer.isView(y)) { out.n++; if (!(ArrayBuffer.isView(x) && ArrayBuffer.isView(y) && x.length === y.length && x.every((v, i) => Object.is(v, y[i])))) out.d.push(`${at}: a typed array`); return; }
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) diffAll(x[k], y[k], `${at}.${k}`, out, seen);
}
const withAges = (plan, mp) => { const p = JSON.parse(JSON.stringify(plan)); p.demographics.mpaaAgeSelf = mp[0]; p.demographics.mpaaAgePart = mp[1]; return p; };
const quiet = plan => ({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } });
const agesOf = plan => { const d = E.resolveMpaa(E.normalizePlan(plan)).demographics; return `${d.mpaaAgeSelf}/${d.mpaaAgePart}`; };
const polOf = plan => { const q = E.normalizePlan(plan); return `policy ${q.spending.decumulationPolicy}, drawdown ${q.spending.drawdownStrategy}, guardrails ${q.config.guardrails}, lookahead ${q.config.lookaheadYears}`; };
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
  // where the age comes from: each plan's ages (self/part) as the engine resolves them, with the guardrails and the lookahead
  // as the plan has them and with both off
  const routed = AC.solverPlan('SHIPC', h.plan, aPol, 0.02), entered = { ...h.plan, spending: { ...h.plan.spending, decumulationPolicy: E.normalizePlan(routed).spending.decumulationPolicy } };
  console.log(`    where the age comes from (the MPAA ages self/part as the engine resolves them):`);
  console.log(`      arm A's plan (${polOf(a.planState)}): ${agesOf(a.planState)}; with the guardrails and the lookahead off: ${agesOf(quiet(a.planState))}`);
  console.log(`      the plan the solver arms take (${polOf(entered)}): ${agesOf(entered)}; with the guardrails and the lookahead off: ${agesOf(quiet(entered))}`);
  // the solver arms' own plan under either age: the household's context the engine steps, and each person's own plan
  const mine = ages(ctx.SHIPC), theirs = ages(ctx.APP);
  for (const arm of ['SHIPC', 'CANDC']) for (const W of [0.02, 0.01]) {
    const plan = AC.solverPlan(arm, h.plan, aPol, W), o = { n: 0, d: [] };
    diffAll(E.buildContext(withAges(plan, mine)), E.buildContext(withAges(plan, theirs)), 'ctx', o);
    console.log(`    ${arm} W${W}: the household's context with the MPAA ages ${mine.join(' and ')} against ${theirs.join(' and ')}: ${o.n} fields compared, ${o.d.length} differ${o.d.length ? `: ${o.d.join('; ')}` : ''}`);
    for (const who of ['self', 'part']) {
      const q = { n: 0, d: [] }, one = mp => E.resolveMpaa(E.normalizePlan(singlePlanFor(withAges(plan, mp), who, 0.5)));
      const pa = one(mine), pb = one(theirs);
      diffAll(E.buildContext(pa), E.buildContext(pb), 'ctx', q);
      console.log(`      ${who}'s own plan (its MPAA age resolved afresh: ${pa.demographics.mpaaAgeSelf} and ${pb.demographics.mpaaAgeSelf}): ${q.n} fields compared, ${q.d.length} differ${q.d.length ? `: ${q.d.join('; ')}` : ''}`);
    }
  }
}
console.log(`${differ} of ${panel.length} couple${panel.length === 1 ? '' : 's'} with arms on different plans`);
