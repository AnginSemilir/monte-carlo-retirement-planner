/*
 * WHAT KEYS THE GUARD, THE PANEL (GUARD-KEY.md; D129 (4); EXPLORATORY). Step 5's four couples 8 or 12 years apart without
 * a DB pension (S149 and S337F at gap8 and gap12, shapes-panel.mjs unitOf), each given one income, both the first person's
 * and taxed as other taxable income, so eight units named <step 5 unit>+<income>:
 *   +db    S147-db's DB pension: £15,000 a year from the state pension age to the plan's end (share-rules-panel.mjs
 *          withFeature 'db');
 *   +rent  £15,000 a year of rent, from plan year 0 (the first person's age now) to the plan's end.
 * Each landed as step 5 landed its units: arm A, searched anew at each target, 85 within a point on 1,000 paths of seed 7005
 * (phase4-panel.mjs landTarget), from its step 5 unit's landed target (shapes-panel.json). A unit that does not land is
 * printed and left out.
 *   node research/solver/guard-panel.mjs list               the units, each with its step 5 target and its income
 *   node research/solver/guard-panel.mjs land <k>           land unit k (results/guard-land/<id>.json)
 *   node research/solver/guard-panel.mjs combine            guard-panel.json from the landings
 *   node research/solver/guard-panel.mjs --planted          the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { unitOf as shapeUnitOf, PANEL as SHAPES_PANEL } from './shapes-panel.mjs';
import { withFeature, DB_AMOUNT } from './share-rules-panel.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SHAPE_UNITS = ['S149@gap8', 'S149@gap12', 'S337F@gap8', 'S337F@gap12'];
export const INCOMES = ['db', 'rent'];
export const UNIT_IDS = SHAPE_UNITS.flatMap(s => INCOMES.map(i => `${s}+${i}`));
export const RENT = 15000;
export const PANEL = process.env.GUARD_PANEL || join(HERE, 'guard-panel.json');
const OUT = process.env.GUARD_LAND_OUT || join(HERE, 'results', 'guard-land');

/* the plan with one income of the first person's (GUARD-KEY.md) */
export function withIncome(plan, kind) {
  if (kind === 'db') return withFeature(plan, 'db');
  if (kind !== 'rent') throw new Error(`guard-panel: no income '${kind}'`);
  const p = JSON.parse(JSON.stringify(plan)), age = E.num(p.demographics.currentAgeSelf, 40);
  p.otherIncomes = [...(p.otherIncomes || []), { id: 'inc_rent_guard', name: 'Rent (the guard test)', owner: 'Myself', startAge: age, endAge: '', amount: RENT, incomeType: 'otherTaxable', notes: '' }];
  return E.normalizePlan(p);
}
/* step 5's landed target for a shape unit */
export function step5Target(shapeId) {
  const u = JSON.parse(readFileSync(SHAPES_PANEL, 'utf8')).units.find(x => x.id === shapeId);
  if (!u) throw new Error(`guard-panel: ${shapeId} is not in step 5's panel`);
  return u.target;
}
/* a unit: its step 5 unit, its income, and its plan at any target */
export function unitOf(id) {
  const [shapeId, kind] = String(id).split('+');
  if (!SHAPE_UNITS.includes(shapeId) || !INCOMES.includes(kind)) throw new Error(`guard-panel: no unit ${id}`);
  const S = shapeUnitOf(shapeId);
  return { id, shapeId, base: S.base, shape: S.shape, kind, step5: step5Target(shapeId), planAt: T => withIncome(S.planAt(T), kind) };
}
/* the panel's units, each with its plan at its landed target */
export function readGuardPanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  return j.units.map(u => ({ ...u, plan: unitOf(u.id).planAt(u.target) }));
}

function planted() {
  const cases = [];
  const T = 23000, s = shapeUnitOf('S149@gap8').planAt(T);
  const incs = p => (p.otherIncomes || []).filter(i => Number(i.amount) > 0);
  { const p = unitOf('S149@gap8+db').planAt(T), add = incs(p).filter(i => !incs(s).some(j => j.id === i.id));
    cases.push(['+db adds exactly one income: the first person\'s, £15,000 a year, other taxable, from the state pension age to the end', add.map(i => `${i.owner} ${i.amount} ${i.incomeType} ${i.startAge} ${i.endAge === '' ? 'end' : i.endAge}`).join('; '), `Myself ${DB_AMOUNT} otherTaxable ${E.num(s.demographics.statePensionAge, 68)} end`]); }
  { const p = unitOf('S149@gap8+rent').planAt(T), add = incs(p).filter(i => !incs(s).some(j => j.id === i.id));
    cases.push(['+rent adds exactly one income: the first person\'s, £15,000 a year, other taxable, from now to the end', add.map(i => `${i.owner} ${i.amount} ${i.incomeType} ${i.startAge} ${i.endAge === '' ? 'end' : i.endAge}`).join('; '), `Myself ${RENT} otherTaxable ${s.demographics.currentAgeSelf} end`]); }
  { const p = unitOf('S337F@gap12+rent').planAt(T), q = shapeUnitOf('S337F@gap12').planAt(T);
    cases.push(['a unit\'s other fields its step 5 unit\'s', JSON.stringify({ ...p, otherIncomes: null }) === JSON.stringify({ ...q, otherIncomes: null }), true]); }
  { const d = unitOf('S337F@gap12+db').planAt(T).demographics; cases.push(['gap12: the partner twelve years younger', d.currentAgeSelf - d.currentAgePart, 12]); }
  cases.push(['eight units, four couples by two incomes', `${UNIT_IDS.length} ${new Set(UNIT_IDS).size}`, '8 8']);
  cases.push(['an income or a couple not in GUARD-KEY.md is refused', ['S149@gap8+annuity', 'S147-db@gap8+db', 'S149@even+db'].map(id => { try { unitOf(id); return 'taken'; } catch { return 'refused'; } }).join(' '), 'refused refused refused']);
  let bad = 0;
  for (const [label, got, want] of cases) { const ok = String(got) === String(want); if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [mode, kArg] = process.argv.slice(2);
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  if (mode === 'list') for (const [k, id] of UNIT_IDS.entries()) { const u = unitOf(id); console.log(`  ${k} ${id.padEnd(20)} step 5 target ${u.step5}; the income ${u.kind}`); }
  if (mode === 'land') {
    const k = Number(kArg), id = UNIT_IDS[k];
    if (!id) { console.error(`guard-panel: k must be 0..${UNIT_IDS.length - 1}`); process.exit(2); }
    const u = unitOf(id), t0 = Date.now();
    let label = null;
    const survivalAt = T => { const a = armA(appPlan(u.planAt(T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
    const r = landTarget(survivalAt, u.step5), last = r.steps[r.steps.length - 1];
    if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
    mkdirSync(OUT, { recursive: true });
    const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, k, shapeId: u.shapeId, kind: u.kind, step5: u.step5, ...r, label, code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${k} ${id.padEnd(20)} target ${r.target} (step 5 ${u.step5}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}`);
  }
  if (mode === 'combine') {
    const lands = UNIT_IDS.map(id => { const f = join(OUT, `${id}.json`); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { id, missing: true }; });
    const codes = [...new Set(lands.filter(l => !l.missing).map(l => l.code))];
    if (codes.length !== 1) { console.error(`guard-panel: the landings are on ${codes.length} codes (${codes.join(', ')})`); process.exit(3); }
    for (const l of lands) console.log(`  ${l.id.padEnd(20)} ${l.missing ? 'MISSING' : `target ${l.target} (step 5 ${l.step5}), arm A ${l.survival.toFixed(1)} (${l.label}): ${l.landed ? 'in' : 'NOT LANDED, left out'}`}`);
    const units = lands.filter(l => !l.missing && l.landed).map(l => ({ id: l.id, k: l.k, shapeId: l.shapeId, kind: l.kind, target: l.target, step5: l.step5, survival: l.survival, label: l.label }));
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: codes[0], seed: LAND_SEED, paths: LAND_PATHS, units, out: lands.filter(l => l.missing || !l.landed).map(l => l.id) }, null, 1) + '\n');
    console.log(`guard-panel: ${units.length} of ${UNIT_IDS.length} units in ${PANEL}`);
  }
}
