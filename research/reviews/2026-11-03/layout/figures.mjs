/*
 * THE LAYOUT'S FIGURES (the external review of 3 Nov, LAYOUT.md): what the new planner's screens show for a household of the
 * library, worked out by the agent's own code the way the app works it out, so every figure and sentence in the design is
 * printed here, not typed. EXPLORATORY, deciding nothing: a render of the screens' content, not a measurement.
 *
 * Run from the root of the agent's code with the engine built:
 *   python3 research/build-engine.py && node <this file> S090 [--paths 5000] [--ages 2]
 *
 * For one single household of the library (research/policy-study/scenarios.mjs):
 *   - the app's solve: src/solverApp.js solveForApp (the launch candidate, 45 points, the default aims, the floor at 80% of the
 *     target by prepareForSolve, as the app solves a plan with none);
 *   - the Strategy tab's figures as the worker asks for them: src/solverStrategy.js strategyRuns over both arms on paths 0 to
 *     --paths, strategySummary on the first 2,000 (the first figures shown) and on all of them, aheadOf on those runs (ten
 *     years), actionsOf on 1,000 paths, src/solverDistil.js distilOf on 1,000;
 *   - each put into words by src/solverWords.js, with the app's money format (App.jsx formatGBP: en-GB, pounds, no pence);
 *   - the outlook: the engine's monteCarlo with its paths (the bands the projection's fan draws), for the solved plan and for
 *     your plan, on 2,000 paths;
 *   - the spending outlook (the design's new chart, LAYOUT.md section 3.1): from the same runs as the headline, each year's
 *     spending level as a share of the year's target (runPath's `level`) over the paths still going, its 10th, 25th, 50th,
 *     75th and 90th percentiles by summarizeTrials's quantile (the headline's), for the solved plan and for your plan;
 *   - with --ages k: the retirement-age dial's k nearest ages (src/solverSettings.js ageOptions, atAge), a solve each, the
 *     headline on the first 2,000 paths, in the dial's line (dialLineWords);
 *   - with --dial: the dial's other positions (3, 6, 10), each solved on this solve as its base, as the Config tab's "Show the
 *     four settings" asks for them (atDial; solveForApp's `base`), the headline on the first 2,000 paths, in the dial's line.
 * The seed is the tuning seed 7002 (the review's rule for exploratory runs), not the app's 12345: the design needs the screens'
 * content and its shape, not these exact numbers. One process, one core; the times are wall-clock.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const imp = p => import(pathToFileURL(resolve(ROOT, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const { solveForApp } = await imp('src/solverApp.js');
const S = await imp('src/solverStrategy.js');
const { distilOf } = await imp('src/solverDistil.js');
const W = await imp('src/solverWords.js');
const { ageOptions, atAge, atDial, dialOrder, APP_FLOOR } = await imp('src/solverSettings.js');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : dflt; };
const id = args.find(a => /^S\d+F?$/.test(a)) || 'S090';
// --smoke: light settings and few paths, to check the script runs end to end; its figures are not the design's
const SMOKE = args.includes('--smoke');
const LIGHT = SMOKE ? { points: 4, research: { adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } } } : {};
const PATHS = SMOKE ? 200 : opt('--paths', 5000), AGES = opt('--ages', 0), DIAL = args.includes('--dial'), SEED = 7002;
const FIRST = SMOKE ? 100 : 2000, ACTIONS_N = SMOKE ? 100 : 1000, FAN_N = SMOKE ? 100 : 2000;
if (!(PATHS >= FIRST)) throw new Error(`figures: --paths ${PATHS} is below the first figures' ${FIRST}`);
const h0 = buildScenarios().find(s => s.id === id);
if (!h0) throw new Error(`figures: no household ${id}`);
const plan = E.normalizePlan(h0.plan);
if (plan.demographics.planningMode !== 'single') throw new Error(`figures: ${id} is not a single household`);

const code = execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim();
const dirty = execSync('git status --porcelain -- src research/solver', { cwd: ROOT }).toString().trim() ? ' (with changes)' : '';
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const fmt = v => gbp.format(Number.isFinite(v) ? v : 0);
const secs = t => `${((Date.now() - t) / 1000).toFixed(0)} s`;
const out = (k, v) => console.log(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);

// the household, as its inputs read on the You page
const d = plan.demographics, sp = plan.spending;
const bal = pre => (plan.accounts || []).filter(a => a.id && a.id.startsWith(pre)).reduce((a, x) => a + E.num(x.balance, 0), 0);
const tierOf = pre => ((plan.accounts || []).find(a => a.id && a.id.startsWith(pre) && E.num(a.balance, 0) > 0) || {}).risk || '';
console.log(`# node figures.mjs ${args.join(' ')} (the agent's code at ${code}${dirty}; seed ${SEED}; EXPLORATORY, deciding nothing)${SMOKE ? ' SMOKE: light settings, not the design\'s figures' : ''}`);
out('household', `${id}: age ${d.currentAgeSelf}, retiring at ${d.retireAgeSelf}, pension access ${d.privatePensionAge}, state pension ${fmt(E.num(d.statePensionSelf, 0))} a year from ${d.statePensionAge}, the plan to age ${d.terminalAge}; tax region ${plan.config.taxRegion}; salary ${fmt(E.num(d.salarySelf, 0))}`);
out('money', `pension ${fmt(bal('pen_self'))} (${tierOf('pen_self')}), ISA ${fmt(bal('isa_self'))} (${tierOf('isa_self')}), taxable ${fmt(bal('other_self'))} (${tierOf('other_self')}), cash ${fmt(bal('cash_self'))}, cash ISA ${fmt(bal('cashIsa_self'))}`);
out('spending', `target ${fmt(E.num(sp.targetSpend, 0))} a year; the plan's own floor ${fmt(E.num(sp.floorSpend, 0))}, so the solver's ${Math.round(100 * APP_FLOOR)}% (${fmt(Math.round(APP_FLOOR * E.num(sp.targetSpend, 0)))}); minimum pot ${fmt(E.num(plan.config.solvencyFloor, 0))}; your current approach: the policy ${sp.decumulationPolicy}, ${sp.drawdownStrategy}, guardrails ${plan.config.guardrails ? 'on' : 'off'}`);

// the app's solve
let t = Date.now();
const solved = solveForApp(E, M, plan, LIGHT);
out('solve', `${secs(t)}; the spending levels on its menu ${JSON.stringify(solved.meta.spendLevels)}; the tier above ${solved.meta.riskAbove && solved.meta.riskAbove.decision}`);

// the Strategy tab's figures: the first 2,000 paths, then all of them
t = Date.now();
const runs = S.strategyRuns(E, solved, plan, { seed: SEED, from: 0, to: PATHS });
const first = S.strategySummary(E, solved, S.headRuns(runs, FIRST)), all = S.strategySummary(E, solved, runs);
out('simulate', `${secs(t)} for ${PATHS} paths through both arms`);
for (const [tag, s] of [[`first ${FIRST}`, first], [`all ${PATHS}`, all]]) {
  const h = s.headline, w = W.headlineWords(h, fmt), x = W.explanationWords(h);
  out(`headline (${tag})`, h);
  out(`headline words (${tag})`, w);
  out(`explanation (${tag})`, x);
  out(`raise (${tag})`, W.raiseWords(s.raise));
  out(`dial line (${tag})`, W.dialLineWords(h, fmt));
  const c = s.compare;
  out(`compare (${tag})`, `survival ${c.yours.survival.toFixed(1)}% / ${c.solved.survival.toFixed(1)}%; median pot ${fmt(c.yours.medianPot)} / ${fmt(c.solved.medianPot)}; unlucky tenth ${fmt(c.yours.p10Pot)} / ${fmt(c.solved.p10Pot)}; lifetime tax ${fmt(c.yours.lifetimeTax)} / ${fmt(c.solved.lifetimeTax)}; estate ${fmt(c.yours.estate)} / ${fmt(c.solved.estate)} (your plan / solved)`);
}
const ctx = { target: all.headline.target, fmt };

// the next ten years on the median path, and the audit table's action column for the same years
const ahead = S.aheadOf(E, solved, plan, runs, { years: 10 });
out('ahead path', ahead.path);
for (const r of ahead.rows) { const a = W.aheadWords(r, ctx); console.log(`ahead: ${a.when} | ${a.spend} | ${a.notes} | ledger: ${W.ledgerWords(r.parts, r.spend > 0)}`); }
out('come back', W.COME_BACK);

// this year's actions and their skip costs
t = Date.now();
const act = S.actionsOf(E, solved, plan, { seed: SEED, n: ACTIONS_N });
out('actions', `${secs(t)}; the move "${act.move.label}"; retired ${act.retired}`);
if (!act.actions.length) out('action', 'Nothing to change this year: keep to your plan as it stands.');
for (const x of act.actions) { const a = W.actionWords(x, ctx); console.log(`action: ${x.part} | ${a.what} | ${a.cost}`); }

// the rule of thumb
t = Date.now();
const dist = distilOf(E, solved, plan, { seed: SEED, n: ACTIONS_N });
out('distil', `${secs(t)}; shown ${dist.show}; the cost ${dist.cost}; fidelity ${dist.fidelity}`);
if (dist.show) { const r = W.ruleWords(dist, ctx); out('rule', r); }

// the outlook: the fan's bands, the solved plan and your plan, every fifth year and the last
t = Date.now();
const fan = (c) => E.monteCarlo(c, { trials: FAN_N, seed: SEED, collectPaths: true });
const fs = fan(S.solvedContext(E, solved)), fy = fan(S.yourContext(E, plan));
out('fan', `${secs(t)}; ${FAN_N} paths each; survival ${fs.successRate.toFixed(1)}% solved, ${fy.successRate.toFixed(1)}% your plan`);
const age0 = Number(d.currentAgeSelf);
for (const [tag, st] of [['solved', fs], ['yours', fy]]) {
  const b = st.bands || [];
  const pick = b.filter(x => x.t % 5 === 0 || x.t === b.length - 1);
  console.log(`fan ${tag}: ${pick.map(x => `age ${age0 + x.t} p10 ${fmt(x.p10)} p50 ${fmt(x.p50)} p90 ${fmt(x.p90)}`).join('; ')}`);
  console.log(`fan ${tag} all: ${JSON.stringify(b.map(x => [age0 + x.t, Math.round(x.p10), Math.round(x.p25), Math.round(x.p50), Math.round(x.p75), Math.round(x.p90)]))}`);
}

// the spending outlook: each year's level (% of the year's target) over the paths still going, from the headline's runs
const qq = (a, p) => (a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : null);
for (const tag of ['solved', 'yours']) {
  const rs = runs[tag], T = rs[0].level.length, rows = [];
  for (let y = 0; y < T; y++) {
    const lv = rs.filter(r => r.failT < 0 || r.failT > y).map(r => r.level[y]).sort((a, b) => a - b);
    if (!lv.length || lv[lv.length - 1] === 0) continue;   // no target yet (still working), or every path gone
    rows.push([age0 + y, qq(lv, 0.1), qq(lv, 0.25), qq(lv, 0.5), qq(lv, 0.75), qq(lv, 0.9), lv.length]);
  }
  const pick = rows.filter(r => (r[0] - age0) % 5 === 0 || r === rows[rows.length - 1]);
  console.log(`spend ${tag}: ${pick.map(r => `age ${r[0]} p10 ${r[1]}% p50 ${r[3]}% p90 ${r[5]}% (${r[6]} paths going)`).join('; ')}`);
  console.log(`spend ${tag} all: ${JSON.stringify(rows)}`);
}

// the dial's other positions, each on this solve as its base
if (DIAL) {
  for (const x of dialOrder(1)) {
    t = Date.now();
    const px = atDial(plan, x), rx = solveForApp(E, M, px, { ...LIGHT, base: solved });
    const sx = S.strategySummary(E, rx, S.strategyRuns(E, rx, px, { seed: SEED, from: 0, to: FIRST }));
    out(`dial ${x}`, `${W.dialLineWords(sx.headline, fmt)}; delivered ${sx.headline.delivered.toFixed(1)}% (${secs(t)})`);
  }
}

// the retirement-age dial (a working household only)
if (AGES > 0) {
  const ao = ageOptions(plan, age0);
  if (!ao) out('ages', 'none: the household has retired (ageOptions)');
  else {
    out('ages', `own ${ao.own}; offered ${JSON.stringify(ao.ages)}; solved here, nearest first: ${JSON.stringify(ao.order.slice(0, AGES))}`);
    out(`age ${ao.own} (your plan)`, W.dialLineWords(first.headline, fmt));
    for (const a of ao.order.slice(0, AGES)) {
      t = Date.now();
      const pa = atAge(plan, a), ra = solveForApp(E, M, pa, LIGHT);
      const sa = S.strategySummary(E, ra, S.strategyRuns(E, ra, pa, { seed: SEED, from: 0, to: FIRST }));
      out(`age ${a}`, `${W.dialLineWords(sa.headline, fmt)} (${secs(t)})`);
    }
  }
}
console.log('# done');
