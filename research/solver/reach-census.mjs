/*
 * O200's REACH ON THE FROZEN CANDIDATE (the external review of 21 Oct, Part B Step 1, item 4). Every 7u household
 * (panel-7u.mjs's 55), solved as 7u's CAND arm solved it (candidate.mjs: CANDIDATE_OPTS on candidatePlan, 7u's plan
 * preparation, lambda and 30 points, estate weight 0.02), tables only, no paths: per household, the cells of every table
 * (every world, every tier-state layer) where no move was chosen (survival left below 0) and the non-finite cells. Run on
 * the code before the fix (a copy of src/solver, given as the folder) and after it (src/solver, where the guards throw on
 * a non-finite score instead: the throw is printed). An exploratory count, no seed: the maintainer's go-ahead of 21 Oct.
 *   node research/solver/reach-census.mjs <solverDir> [part k/n]
 * The e3pcls pin is checked against the folder's own code: the candidate's e3pcls is exact only on pinned code.
 */
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { CANDIDATE_OPTS, candidatePlan } from './candidate.mjs';
import { PANEL } from './panel-7u.mjs';
import { codeFiles, fingerprintOf, readPin, ROOT } from './e3pcls-pin.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const dir = resolve(process.argv[2] || join(HERE, '../../src/solver'));
const [pk, pn] = process.argv[3] === 'part' ? process.argv[4].split('/').map(Number) : [0, 1];
const M = await import(pathToFileURL(join(dir, 'model.js')).href);
const S = await import(pathToFileURL(join(dir, 'solve.js')).href);
const LAMBDA = 0.0223606797749979, POINTS = 30, W = 0.02;   // audit-7u.mjs l.57 and its defaults; the candidate's estate weight

// the pin, over this folder's src/solver texts and the repository's research files (e3pcls-pin.mjs's file list)
const texts = Object.fromEntries(codeFiles(ROOT).map(f => [f, readFileSync(f.startsWith('src/solver/') ? join(dir, f.slice('src/solver/'.length)) : join(ROOT, f), 'utf8')]));
const fp = fingerprintOf(texts), pin = readPin();
if (!pin || pin.fingerprint !== fp) { console.error(`reach-census: the e3pcls pin (${pin ? pin.fingerprint : 'none'}) is not this code's fingerprint ${fp}: re-pin first`); process.exit(2); }

// the households: audit-7u.mjs's builders (l.69-89, copied: 7aw's S126 variants and the library's singles)
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2, scale = 1, cost = null } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  if (cost) {
    const y = E.buildContext(E.normalizePlan(p)).baseYear + cost[0];
    p.oneOffCosts = [...(p.oneOffCosts || []), { id: 'f1cost', date: `${y}-06-01`, year: y, owner: 'Myself', amount: cost[1], desc: 'One-off cost (test)' }];
  }
  return { id: name, plan: p };
}
const F1_VARIANTS = [['S126', {}], ['share 0.50', { a0: 0.5 }], ['share 0.70', { a0: 0.7 }], ['share 0.78', { a0: 0.78 }], ['share 0.90', { a0: 0.9 }], ['share 0.95', { a0: 0.95 }],
  ['bridge 0', { bridge: 0 }], ['bridge 1', { bridge: 1 }], ['bridge 4', { bridge: 4 }], ['bridge 6', { bridge: 6 }], ['wealth x0.5', { scale: 0.5 }], ['wealth x2', { scale: 2 }]];
const known = [...F1_VARIANTS.map(([id, o]) => [id, () => variant(id, o)]), ['bridge 4+cost', () => variant('bridge 4+cost', { bridge: 4, cost: [2, 30000] })]];
const byId = id => { const k = known.find(x => x[0] === id); return k ? k[1]() : all.find(s => s.id === id); };
if (PANEL.some(id => !byId(id))) { console.error('reach-census: a 7u household has no builder'); process.exit(2); }
console.log(`REACH CENSUS: ${dir}, fingerprint ${fp} (pinned), the candidate at ${POINTS} points, lambda ${LAMBDA}, estate weight ${W}; ${PANEL.length} households; part ${pk}/${pn}`);
PANEL.forEach((id, i) => {
  if (i % pn !== pk) return;
  const h = byId(id);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  let r;
  try { r = S.solvePlan(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, lambda: LAMBDA, points: POINTS, bequestWeight: W }); }
  catch (e) { console.log(`${id.padEnd(16)} THREW after ${((Date.now() - t0) / 1000).toFixed(0)} s: ${e.message.split('\n')[0]}`); return; }
  const T = r.m.ctx.totalYears, tabs = r.mix ? r.mix.tables : [r];
  let cells = 0, unchosen = 0, nonFinite = 0;
  tabs.forEach(tab => (tab.tsLayers || [tab]).forEach(L => {
    for (let t = 0; t <= T; t++) for (let j = 0; j < L.surv[t].length; j++) {
      cells++;
      const sv = L.surv[t][j];
      if (!(sv >= 0)) unchosen++;
      if (![sv, L.beq[t][j], L.resil[t][j], L.short[t][j]].every(Number.isFinite)) nonFinite++;
    }
  }));
  console.log(`${id.padEnd(16)} cells ${cells} no move chosen ${unchosen} non-finite ${nonFinite} | worlds ${tabs.length} layers ${tabs[0].tsLayers ? tabs[0].tsLayers.length : 1} | solve ${((Date.now() - t0) / 1000).toFixed(0)} s`);
});
console.log('DONE');
