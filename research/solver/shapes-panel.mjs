/*
 * THE SHAPES THE LIBRARY LACKS, THE PANEL (SHAPES.md; PRESCRIPTIVE-PLAN.md step 5; D120; EXPLORATORY). Four bases, each as its
 * panel holds it (S149 and S337F from the couples' re-run panel, couple-panel.mjs planOf at their cohort; S147-db and
 * S061-dbpart from the share rules' panel, share-rules-panel.mjs unitPlan at their variant), and seven shapes of each, the
 * one change SHAPES.md names (shapeOf), so 28 units named <base>@<shape>:
 *   even      the partner the first person's age;
 *   gap8      the partner eight years younger than the first person;
 *   gap12     the partner twelve years younger;
 *   elder2nd  the two ages exchanged, so the first person is the younger (handed to the solvers as its mirror,
 *             src/coupleOrder.js otherOrder, by the audit);
 *   part60    every wrapper re-held so the first person holds 40% of its total (share-rules-panel.mjs reheldAt);
 *   penB90    the two pensions' balances and contributions re-held so the first person holds 10% of each total;
 *   penA100   the partner's pension balance and contribution added to the first person's and set to nil.
 * Each unit landed as the share rules' panel landed its variants: arm A, searched anew at each target, 85 within a point on
 * 1,000 paths of seed 7005 (phase4-panel.mjs landTarget), from its base's landed target; a unit that does not land, or
 * that householdPlanFor refuses on its plan as the audit solves it, is printed and left out.
 *   node research/solver/shapes-panel.mjs list                 the units and what householdPlanFor says of each
 *   node research/solver/shapes-panel.mjs land <k>             land unit k (results/shapes-land/<id>.json)
 *   node research/solver/shapes-panel.mjs combine              shapes-panel.json from the landings
 *   node research/solver/shapes-panel.mjs summary              the panel, each unit's target, arm A and its refusal
 *   node research/solver/shapes-panel.mjs --planted            the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { couplesOf, planOf } from './couple-panel.mjs';
import { unitPlan, reheldAt, PANEL as SHARE_PANEL } from './share-rules-panel.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { solverPlan, PANEL_FILE } from './audit-couples.mjs';   // the couples' re-run panel (couples-panel-d4b.json), as the lead test reads it
import { householdPlanFor } from './household.mjs';
import { otherOrder } from '../../src/coupleOrder.js';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BASES = ['S149', 'S337F', 'S147-db', 'S061-dbpart'];
export const SHAPES = ['even', 'gap8', 'gap12', 'elder2nd', 'part60', 'penB90', 'penA100'];
export const UNIT_IDS = BASES.flatMap(b => SHAPES.map(s => `${b}@${s}`));
export const PANEL = process.env.SHAPES_PANEL || join(HERE, 'shapes-panel.json');
const OUT = process.env.SHAPES_LAND_OUT || join(HERE, 'results', 'shapes-land');
const W = 0.02;

/* a base as its panel holds it: its plan at any target, and the target it landed at */
export function baseOf(id) {
  const all = couplesOf(), byId = Object.fromEntries(all.map(h => [h.id, h]));
  const d4 = JSON.parse(readFileSync(PANEL_FILE, 'utf8')).panel.find(r => r.id === id);
  if (d4) return { id, panel: 'd4b', target: d4.target, planAt: T => planOf(byId[d4.base], d4.cohort, T) };
  const sh = JSON.parse(readFileSync(SHARE_PANEL, 'utf8')).panel.flatMap(c => c.units.map(u => ({ ...u, base: c.base }))).find(u => u.id === id);
  if (sh) return { id, panel: 'share', target: sh.target, planAt: T => unitPlan(byId[sh.base], sh.variant, T) };
  throw new Error(`shapes-panel: no base ${id} in either panel`);
}
const pensions = p => p.accounts.filter(a => a.category === 'Pensions');
/* the one change a shape makes to a plan (SHAPES.md) */
export function shapeOf(plan, shape) {
  const p = JSON.parse(JSON.stringify(plan)), d = p.demographics, a = E.num(d.currentAgeSelf, 40), b = E.num(d.currentAgePart, a);
  if (shape === 'even') d.currentAgePart = a;
  else if (shape === 'gap8') d.currentAgePart = a - 8;
  else if (shape === 'gap12') d.currentAgePart = a - 12;
  else if (shape === 'elder2nd') { d.currentAgeSelf = b; d.currentAgePart = a; }
  else if (shape === 'part60') return reheldAt(plan, 0.4);
  else if (shape === 'penB90') {
    const ps = pensions(p), bal = ps.reduce((t, x) => t + E.num(x.balance, 0), 0), con = ps.reduce((t, x) => t + E.num(x.contrib, 0), 0);
    if (ps.length !== 2) throw new Error(`shapes-panel: penB90 wants two pensions, the plan has ${ps.length}`);
    for (const x of ps) { const f = x.owner === 'Partner' ? 0.9 : 0.1; x.balance = bal * f; x.contrib = con * f; }
  } else if (shape === 'penA100') {
    const self = pensions(p).find(x => x.owner !== 'Partner'), part = pensions(p).find(x => x.owner === 'Partner');
    if (!self || !part) throw new Error('shapes-panel: penA100 wants a pension each');
    self.balance = E.num(self.balance, 0) + E.num(part.balance, 0); self.contrib = E.num(self.contrib, 0) + E.num(part.contrib, 0);
    part.balance = 0; part.contrib = 0;
  } else throw new Error(`shapes-panel: no shape '${shape}'`);
  return E.normalizePlan(p);
}
/* a unit: its base and shape, and its plan at any target */
export function unitOf(id) {
  const [base, shape] = id.split('@');
  if (!BASES.includes(base) || !SHAPES.includes(shape)) throw new Error(`shapes-panel: no unit ${id}`);
  const B = baseOf(base);
  return { id, base, shape, baseTarget: B.target, planAt: T => shapeOf(B.planAt(T), shape) };
}
/* the plan the solvers are handed: arm A's policy on the plan prepared for the solver, and for elder2nd its mirror (the
   elder first, as the app hands such a couple to the solver, D104) */
export function solverPlanOf(plan, shape) {
  const a = armA(appPlan(plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const hp = solverPlan('CANDC', plan, aPol, W);
  return { a, hp: shape === 'elder2nd' ? otherOrder(E, hp) : hp, mirrored: shape === 'elder2nd' };
}
/* what householdPlanFor says of a unit's plan as the solvers are handed it: null where it takes it, its message where not */
export function refusalOf(plan, shape) {
  const { hp } = solverPlanOf(plan, shape);
  try { householdPlanFor(E, hp); return null; } catch (e) { return e.message; }
}
/* the panel's units, each with its plan at its landed target */
export function readShapesPanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  return j.units.map(u => ({ ...u, plan: unitOf(u.id).planAt(u.target) }));
}

function planted() {
  const cases = [], u = unitOf('S149@even').planAt(24000), base = baseOf('S149').planAt(24000), d0 = base.demographics;
  const ages = id => { const d = unitOf(id).planAt(24000).demographics; return `${d.currentAgeSelf}/${d.currentAgePart}`; };
  cases.push(['the ages: even, gap8, gap12, elder2nd against the base', ['S149@even', 'S149@gap8', 'S149@gap12', 'S149@elder2nd'].map(ages).join(' '),
    `${d0.currentAgeSelf}/${d0.currentAgeSelf} ${d0.currentAgeSelf}/${d0.currentAgeSelf - 8} ${d0.currentAgeSelf}/${d0.currentAgeSelf - 12} ${d0.currentAgePart}/${d0.currentAgeSelf}`]);
  const tot = (p, cat, who) => p.accounts.filter(a => a.category === cat && (who === undefined || (who === 'part') === (a.owner === 'Partner'))).reduce((t, a) => t + E.num(a.balance, 0), 0);
  { const p = unitOf('S149@part60').planAt(24000), cats = [...new Set(base.accounts.map(a => a.category))].filter(c => tot(base, c) > 0);
    cases.push(['part60: every wrapper\'s total kept, the first person holding 40% of each', cats.every(c => Math.abs(tot(p, c) - tot(base, c)) < 1e-6 && Math.abs(tot(p, c, 'self') / tot(p, c) - 0.4) < 1e-9), true]); }
  { const p = unitOf('S149@penB90').planAt(24000);
    cases.push(['penB90: the pensions\' total kept, the first person holding 10%; the ISA as it was', Math.abs(tot(p, 'Pensions') - tot(base, 'Pensions')) < 1e-6 && Math.abs(tot(p, 'Pensions', 'self') / tot(p, 'Pensions') - 0.1) < 1e-9 && tot(p, 'S&S ISAs', 'self') === tot(base, 'S&S ISAs', 'self'), true]); }
  { const p = unitOf('S149@penA100').planAt(24000);
    cases.push(['penA100: the partner\'s pension moved whole to the first person', `${tot(p, 'Pensions', 'part')} ${Math.abs(tot(p, 'Pensions', 'self') - tot(base, 'Pensions')) < 1e-6}`, '0 true']); }
  cases.push(['a unit\'s other fields as its base\'s (even: everything but the partner\'s age)', JSON.stringify({ ...u, demographics: { ...u.demographics, currentAgePart: null } }) === JSON.stringify({ ...base, demographics: { ...base.demographics, currentAgePart: null } }), true]);
  cases.push(['a shape or base not in SHAPES.md is refused', (() => { try { unitOf('S149@gap5'); return 'taken'; } catch { return 'refused'; } })(), 'refused']);
  cases.push(['28 units, four bases by seven shapes', `${UNIT_IDS.length} ${new Set(UNIT_IDS).size}`, '28 28']);
  let bad = 0;
  for (const [label, got, want] of cases) { const ok = String(got) === String(want); if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [mode, kArg] = process.argv.slice(2);
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  if (mode === 'list') for (const [k, id] of UNIT_IDS.entries()) { const u = unitOf(id); console.log(`  ${String(k).padStart(2)} ${id.padEnd(20)} base target ${u.baseTarget}; householdPlanFor: ${refusalOf(u.planAt(u.baseTarget), u.shape) || 'takes it'}`); }
  if (mode === 'land') {
    const k = Number(kArg), id = UNIT_IDS[k];
    if (!id) { console.error(`shapes-panel: k must be 0..${UNIT_IDS.length - 1}`); process.exit(2); }
    const u = unitOf(id), t0 = Date.now();
    let label = null;
    const survivalAt = T => { const a = armA(appPlan(u.planAt(T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
    const r = landTarget(survivalAt, u.baseTarget), last = r.steps[r.steps.length - 1];
    if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
    const refusal = refusalOf(u.planAt(r.target), u.shape);
    mkdirSync(OUT, { recursive: true });
    const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, k, base: u.base, shape: u.shape, baseTarget: u.baseTarget, ...r, label, refusal, code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${String(k).padStart(2)} ${id.padEnd(20)} target ${r.target} (base ${u.baseTarget}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}; householdPlanFor: ${refusal || 'takes it'}; ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine' || mode === 'summary') {
    const lands = UNIT_IDS.map(id => { const f = join(OUT, `${id}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { id, missing: true }; });
    const missing = lands.filter(l => l.missing), codes = [...new Set(lands.filter(l => !l.missing).map(l => l.code))];
    if (missing.length) { console.log(`not yet landed: ${missing.map(l => l.id).join(', ')}`); process.exit(1); }
    if (codes.length !== 1) { console.log(`the landings are on ${codes.length} codes (${codes.join(', ')}): land them again on one`); process.exit(1); }
    const units = lands.filter(l => l.landed && !l.refusal), out = lands.filter(l => !l.landed || l.refusal);
    if (mode === 'combine') writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: codes[0], seed: LAND_SEED, paths: LAND_PATHS, units: units.map(l => ({ id: l.id, k: l.k, base: l.base, shape: l.shape, target: l.target, survival: l.survival, label: l.label })), out: out.map(l => ({ id: l.id, landed: l.landed, survival: l.survival, target: l.target, refusal: l.refusal })) }, null, 1) + '\n');
    console.log(`THE SHAPES' PANEL (EXPLORATORY; SHAPES.md): ${units.length} of ${lands.length} units in, landed on 1,000 paths of seed ${LAND_SEED} on code ${codes[0]}`);
    for (const l of lands) console.log(`  ${l.id.padEnd(20)} target ${String(l.target).padStart(6)} (base ${l.baseTarget}), arm A ${l.survival.toFixed(1)} (${l.label}): ${!l.landed ? 'NOT LANDED, left out' : l.refusal ? `refused by householdPlanFor (${l.refusal}), left out` : 'in'}`);
  }
}
