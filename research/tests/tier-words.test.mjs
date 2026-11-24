/*
 * A TIER ABOVE THE RISK THE PLAN CHOSE, IN THE PAGE'S WORDS (CHECKLIST 7). Under the 'auto' rule (D16; src/solver/solve.js
 * solvePlanAuto) a thin plan, one whose simulated survival without it is below 85%, can be offered the tier above its own,
 * which a table holds at index 1 + its steps below. The page read a move's tier index as its steps below the risk chosen
 * (src/solverStrategy.js partsOf; src/solverWords.js), so a pension moved one tier riskier read "Move your pension 3 steps
 * lower in risk" and the audit's "pension 3 steps safer", the opposite of the move (found on 24 Nov: S008 with its pension
 * and ISA at Medium Risk and its target raised by a third, survival without the tier above 51.5% and with it 58.3%, held at
 * Medium/High from its first year). Now a move's tier part is its steps below the risk chosen by the tiers' names, negative
 * for a tier above, and the words say a step up as one:
 *   1. a single's tiers: for each risk a plan can hold, two and three steps below, with the tier above offered and not, every
 *      tier of its table's ladder taken apart (partsOf with the table's tiers) is its steps by name; the first year's words
 *      (aheadWords), the next years' words for every change between two of its tiers, the action's words (PART_WORDS) and
 *      the audit's (ledgerWords) each name the move's direction and its count of steps, and where it ends against the risk
 *      chosen;
 *   2. a couple's parts (src/solverCouple.js personParts): on today's two-table route by each person's own table's tiers, on
 *      the household route by the household table's, and where the household's two people's ladders differ (COUPLES-ANY.md
 *      A) by each person's own; and the couple's words (coupleAheadWords, coupleLedgerWords, PARTNER_WORDS) as a single's;
 *   3. end to end: S008 as found, solved at light settings, takes the tier above, holds it in its first year on the expected
 *      market (src/solverStrategy.js rowsOf), and the words for those years say it is higher in risk, none of them lower.
 * Plants (TIER_WORDS_PLANT; --planted): 'aboveindex' (partsOf reads the index, as before) fails checks 1 to 3; 'abovewords'
 * (the words drop the sign, a single's and a couple's alike) fails 1 to 3.
 *   node research/tests/tier-words.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { tiersFor, TIER_ORDER } from '../../src/solver/fast.js';
import { partsOf, rowsOf, PLANT as STRATEGY_PLANT } from '../../src/solverStrategy.js';
import { aheadWords, ledgerWords, PART_WORDS, PARTNER_WORDS, coupleAheadWords, coupleLedgerWords, WORDS_PLANT } from '../../src/solverWords.js';
import { personParts } from '../../src/solverCouple.js';
import { solveForApp } from '../../src/solverApp.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PLANTS = { aboveindex: ['1', '2', '3'], abovewords: ['1', '2', '3'] };
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, TIER_WORDS_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  console.log(bad ? `PLANTED: ${bad} plant(s) not failing exactly their checks` : 'PLANTED: EACH PLANT FAILS EXACTLY ITS OWN CHECKS');
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.TIER_WORDS_PLANT || '';
if (PLANT === 'aboveindex') STRATEGY_PLANT.rule = PLANT; else if (PLANT === 'abovewords') WORDS_PLANT.rule = PLANT;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const fmt = v => E.formatGBP(v);
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const S = singles.find(s => s.id === 'S008');
/* the plan as a table reads it (the one-off cost lookahead and the guardrails off, as src/solverSettings.js prepareForSolve leaves them) */
const tableable = p => ({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } });
/* the steps by name: positive safer, negative riskier */
const stepsBy = (list, k) => TIER_ORDER.indexOf(list[k].name) - TIER_ORDER.indexOf(list[0].name);
const n = d => `${Math.abs(d)} step${Math.abs(d) > 1 ? 's' : ''}`;
/* what a first year's words must say of a move to d steps from the risk chosen */
const firstWant = (what, d) => (d > 0 ? `Move your ${what} ${n(d)} lower in risk` : `Move your ${what} ${n(d)} higher in risk`);
/* a change from w to d: its direction, its count and where it ends */
const changeOk = (line, w, d) => {
  if (d === 0) return /back to the risk you chose/.test(line);
  if (w === 0) return line.includes(firstWant(line.includes('pension and ISA') ? 'pension and ISA' : line.includes('ISA') && !line.includes('pension') ? 'ISA' : 'pension', d));
  const up = d < w, count = line.includes(` ${n(d - w)} `), dir = up ? / up in risk/.test(line) : / down in risk/.test(line);
  const end = d > 0 ? line.includes(`(${d} below the risk you chose)`) : line.includes(`(${-d} above the risk you chose)`);
  return count && dir && end;
};
const mk = (pen, isa) => ({ parts: { level: 1, draw: 'none', harvest: null, tierPen: pen, tierIsa: isa }, year: 2026, age: 60, spend: 30000 });

// ---- 1. a single's tiers ----
{ let ladders = 0, tiers = 0, above = 0, bad = [];
  for (const risk of TIER_ORDER) for (const below of [2, 3]) for (const up of [0, 1]) {
    const plan = structuredClone(S.plan);
    for (const a of plan.accounts) if (/^(pen|isa)_self$/.test(a.id)) a.risk = risk;
    const m = M.prepare(E, tableable(plan)); m.tiersBelow = below; m.tiersAbove = up;
    const L = tiersFor(m, below);
    ladders++;
    for (let k = 0; k < L.pen.length; k++) {
      tiers++;
      const d = stepsBy(L.pen, k), p = partsOf({ steps: ['cash'], harvest: false, spendLevel: 1 }, { tierPen: k, tierIsa: Math.min(k, L.isa.length - 1) }, L);
      if (d < 0) above++;
      if (p.tierPen !== d) { bad.push(`${risk} ${below}/${up} tier ${k} (${L.pen[k].name}): parts ${p.tierPen}, by name ${d}`); continue; }
      if (d === 0) continue;
      const first = aheadWords(mk(d, 0), { fmt }, null).lines.join('; ');
      if (!first.includes(firstWant('pension', d))) bad.push(`${risk} tier ${k}: first year "${first}"`);
      const act = PART_WORDS.tierPen(d);
      if (act !== firstWant('pension', d)) bad.push(`${risk} tier ${k}: action "${act}"`);
      const led = ledgerWords({ level: 1, draw: 'none', harvest: null, tierPen: d, tierIsa: 0 }, false);
      if (!led.includes(d > 0 ? `pension ${n(d)} safer` : `pension ${n(d)} riskier`)) bad.push(`${risk} tier ${k}: ledger "${led}"`);
      // every change from another of the ladder's tiers
      for (let j = 0; j < L.pen.length; j++) {
        const w = stepsBy(L.pen, j); if (w === d) continue;
        const line = aheadWords(mk(d, 0), { fmt }, { tierPen: w, tierIsa: 0 }).lines.find(l => /in risk|risk you chose/.test(l)) || '';
        if (!changeOk(line, w, d)) bad.push(`${risk} ${w} to ${d}: "${line}"`);
      }
    }
  }
  ok('1. a single\'s tiers: every tier of a table\'s ladder, for each risk, two and three steps below, the tier above offered or not, taken apart as its steps by name, and its first year\'s, the next years\', the action\'s and the audit\'s words naming its direction, its steps and where it ends',
    tiers > 0 && above > 0 && !bad.length, `${ladders} ladders, ${tiers} tiers, ${above} above the risk chosen${bad.length ? `; wrong ${bad.length}: ${bad.slice(0, 3).join('; ')}` : ''}`); }

// ---- 2. a couple's parts ----
{ const bad = [];
  const plan = structuredClone(S.plan);
  for (const a of plan.accounts) if (/^(pen|isa)_self$/.test(a.id)) a.risk = 'Medium Risk';
  const m = M.prepare(E, tableable(plan)); m.tiersBelow = 2; m.tiersAbove = 1;
  const L = tiersFor(m, 2), up = L.pen.findIndex(x => x.above), below = 1;
  const po = k => ({ steps: ['cash'], harvest: false, harvestCeil: 'pa', tierPen: k, tierIsa: k, tierPenName: L.pen[k].name, tierIsaName: L.isa[k].name });
  const joint = k => ({ spendLevel: 1, split: 0.5, perOwner: { self: po(k), part: po(k) } });
  // today's route: each person's own table
  const pair = { tables: { self: { c: { tiers: L } }, part: { c: { tiers: L } } } };
  for (const who of ['self', 'part']) { const q = personParts(joint(up), who, pair); if (q.tierPen !== -1) bad.push(`today's route, ${who}'s tier above read ${q.tierPen}`); const r = personParts(joint(below), who, pair); if (r.tierPen !== 1) bad.push(`today's route, ${who}'s step below read ${r.tierPen}`); }
  // the household route: the household table's tiers
  const hh = { household: true, H: { c: { tiers: L } } };
  for (const who of ['self', 'part']) { const q = personParts(joint(up), who, hh); if (q.tierPen !== -1) bad.push(`the household route, ${who}'s tier above read ${q.tierPen}`); }
  // the household route with two ladders (A): the partner held at High Risk, their ladder their own
  const own = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk'];
  const hm = { household: true, H: { c: { tiers: L } }, tierMap: { own: { self: { pen: L.pen.map(x => x.name), isa: L.isa.map(x => x.name) }, part: { pen: own, isa: own } } } };
  const j2 = { spendLevel: 1, split: 0.5, perOwner: { self: po(up), part: { ...po(up), tierPen: 1, tierIsa: 1 } } };
  const q2 = personParts(j2, 'part', hm), q1 = personParts(j2, 'self', hm);
  if (q2.tierPen !== 1 || q1.tierPen !== -1) bad.push(`two ladders: the partner's Medium/High read ${q2.tierPen} (want 1), the first person's read ${q1.tierPen} (want -1)`);
  // the couple's words read the parts as a single's
  const rows = coupleAheadWords({ parts: { level: 1, split: 0.5, self: { draw: 'none', harvest: null, tierPen: -1, tierIsa: -1 }, part: { draw: 'none', harvest: null, tierPen: 1, tierIsa: 1 } }, year: 2026, age: 60, spend: 30000 }, { fmt }, null).lines.join('; ');
  if (!rows.includes('You: Move your pension and ISA 1 step higher in risk') || !rows.includes('Your partner: Move their pension and ISA 1 step lower in risk')) bad.push(`the couple's words "${rows}"`);
  const led = coupleLedgerWords({ level: 1, split: 0.5, self: { draw: 'none', harvest: null, tierPen: -1, tierIsa: 0 }, part: { draw: 'none', harvest: null, tierPen: 0, tierIsa: 0 } }, false);
  if (!led.includes('pension 1 step riskier')) bad.push(`the couple's ledger "${led}"`);
  if (PARTNER_WORDS.tierPen(-1) !== 'Move their pension 1 step higher in risk') bad.push(`the partner's action "${PARTNER_WORDS.tierPen(-1)}"`);
  ok('2. a couple\'s parts: each person\'s tier by their own table\'s names on today\'s route, by the household table\'s on the household route, by their own ladder\'s where the two ladders differ; the couple\'s words reading them as a single\'s',
    !bad.length, bad.length ? bad.join('; ') : 'today\'s route, the household route and two ladders each read the tier above as one step up'); }

// ---- 3. end to end: S008 as found ----
{ const plan = structuredClone(S.plan);
  plan.spending.targetSpend = Math.round(E.num(plan.spending.targetSpend, 0) * 1.35);
  for (const a of plan.accounts) if (/^(pen|isa)_self$/.test(a.id)) a.risk = 'Medium Risk';
  const r = solveForApp(E, M, plan, { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
  const on = !!(r.meta.riskAbove && /^on/.test(r.meta.riskAbove.decision));
  const rr = rowsOf(E, r, 'expected');
  let held = 0, said = 0, wrong = [];
  rr.parts.forEach((q, t) => {
    if (!q) return;
    if (q.tierPen < 0 || q.tierIsa < 0) held++;
    const prev = t ? rr.parts[t - 1] : null, line = aheadWords({ parts: q, year: 2026 + t, age: 60 + t, spend: 1 }, { fmt }, prev).lines.join('; ');
    const led = ledgerWords(q, false);
    if ((q.tierPen < 0 || q.tierIsa < 0) && (t === 0 || (prev && (prev.tierPen !== q.tierPen || prev.tierIsa !== q.tierIsa)))) { said++; if (!/higher in risk|up in risk/.test(line) || /lower in risk/.test(line)) wrong.push(`year ${t}: "${line}"`); }
    if ((q.tierPen < 0 && !/pension 1 step riskier/.test(led)) || (q.tierPen < 0 && /pension \d+ steps? safer/.test(led))) wrong.push(`year ${t} ledger: "${led}"`);
  });
  ok('3. end to end: S008 as found takes the tier above, holds it from its first year on the expected market, and every year that moves to it is worded as a move up in risk, none as lower',
    on && held > 0 && rr.parts[0] && (rr.parts[0].tierPen < 0 || rr.parts[0].tierIsa < 0) && said > 0 && !wrong.length,
    `the tier above ${r.meta.riskAbove ? r.meta.riskAbove.decision : '-'}; years held ${held}, moves to it worded ${said}${wrong.length ? `; wrong: ${wrong.slice(0, 2).join('; ')}` : ''}`); }

console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
