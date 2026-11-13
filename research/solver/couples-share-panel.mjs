/*
 * ITEM 6'S STAGE C, THE PANEL (the review of 9 Nov, item 6 stage C and item 8 part 1, EXPERIMENTS-AND-PORTS.md on
 * review/external-2026-10-21; D66, D91, D93): couples who hold their money unevenly, and couples with a feature the
 * library never holds, for the registered test of `shareRule: 'pots'` (registrations/couples-share.md).
 *   - touched: held-out.mjs touchedAll run on the day, with the households the tests take by place (couple-panel.mjs
 *     byIndex), taken once and frozen with the order in couples-share-orders.json (freeze), which every later step reads;
 *   - the order: the library order of couples-orders.json (D4's, first person older than 44), the touched left out; twelve
 *     taken evenly in it (select-7u-broad.mjs pick, as D4 took its library cohort), then the rest of it in library order as
 *     reserves. The review's words were "the next 12 in couples-orders.json's library order"; read literally they are
 *     twelve couples of one age pattern (68 and 65, retired and past pension access), so the even pick is taken instead,
 *     which spreads them over the library's six age patterns (the registration says so);
 *   - each couple three times (units): re-held 75/25 and re-held 90/10 (audit-share.mjs reheld: every wrapper's total kept,
 *     the first person holding that share of it), and as the library holds it with one feature the library lacks, set by
 *     the couple's place in the panel (place i takes FEATURES[i % 3]): a £15,000 a year DB pension of the first person's
 *     from the state pension age (taxable, held constant in real terms as every figure is); half of each taxable account
 *     already a gain; a state pension age of 67, not 68;
 *   - every unit's plan (unitPlan): the unit's holding or feature, then couple-panel.mjs planOf as D4's library cohort (the
 *     landed target, the floor at 80% of it, the couple's minimum pot or one year's target, the one-off costs as the library
 *     has them, the candidate's return assumptions);
 *   - landing: each candidate's five variants (75/25, 90/10 and each of the three features) landed so arm A, searched anew at
 *     each target, survives 85 +/- 1% on 1,000 paths of seed 7005 (phase4-panel.mjs landTarget, D4's procedure), so that
 *     which feature a couple takes never changes a landing;
 *   - the panel (combine): the order walked; a couple joins at the next place if its two re-held units and the feature of
 *     that place all landed, is passed over (reported) if one did not, and the walk stops at the first candidate not yet
 *     landed; twelve couples, 36 units, written with the scan's count and hash and the one code they were landed on.
 *   node research/solver/couples-share-panel.mjs freeze              the scan and the order, taken once
 *   node research/solver/couples-share-panel.mjs list                the order
 *   node research/solver/couples-share-panel.mjs land <k>            land candidate k's five variants (results/share-c-land/)
 *   node research/solver/couples-share-panel.mjs combine             couples-share-panel.json from the landings
 *   node research/solver/couples-share-panel.mjs summary > results-couples-share-panel.txt
 *   node research/solver/couples-share-panel.mjs --planted           the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { couplesOf, planOf, byIndex, ORDERS_FILE, PRIOR_FILES } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { touchedAll } from './held-out.mjs';
import { pick } from './select-7u-broad.mjs';
import { reheld, holdingOf, CATS } from './audit-share.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_COUPLES = 12, FEATURES = ['db', 'gain', 'spa67'], DB_AMOUNT = 15000, GAIN_SHARE = 0.5, SPA_FEATURE = 67;
export const VARIANTS = ['75', '90', ...FEATURES];
const HOLDING = { 75: 'seventyfive', 90: 'ninety-ten' };
export const SHARE_ORDERS = join(HERE, 'couples-share-orders.json'), SHARE_PANEL = process.env.SHARE_C_PANEL || join(HERE, 'couples-share-panel.json');
const OUT = process.env.SHARE_C_LAND_OUT || join(HERE, 'results', 'share-c-land');
export const unitIdOf = (base, v) => `${base}-${v}`;
export const featureAt = i => FEATURES[i % FEATURES.length];

/* the plan with one feature the library lacks (item 8, part 1) */
export function withFeature(plan, f) {
  const p = JSON.parse(JSON.stringify(plan));
  if (f === 'db') {
    const spa = E.num(p.demographics.statePensionAge, 68);
    p.otherIncomes = [...(p.otherIncomes || []), { id: 'inc_db_stage_c', name: 'DB pension (item 8)', owner: 'Myself', startAge: spa, endAge: '', amount: DB_AMOUNT, incomeType: 'otherTaxable', notes: '' }];
  } else if (f === 'gain') {
    p.accounts = p.accounts.map(a => (a.id.startsWith('other_') ? { ...a, unrealisedGain: GAIN_SHARE * (Number(a.balance) || 0) } : a));
  } else if (f === 'spa67') {
    p.demographics = { ...p.demographics, statePensionAge: SPA_FEATURE };
  } else throw new Error(`couples-share-panel: no feature '${f}'`);
  return E.normalizePlan(p);
}
/* the library couple as the unit holds it, before its target is set */
export function variantPlan(h, v) {
  if (HOLDING[v]) return reheld(h.plan, HOLDING[v]);
  return withFeature(h.plan, v);
}
/* the unit's plan at a target, as every arm runs it */
export const unitPlan = (h, v, target) => planOf({ ...h, plan: variantPlan(h, v) }, 'lib', target);

/* the order: the library order, the touched left out; twelve evenly, then the rest in library order */
export function orderOf(libIds, used, byId, n = N_COUPLES) {
  const pool = libIds.filter(id => !used.has(id)).map(id => byId[id]).filter(Boolean);
  const r = pick(pool, new Set(), n), chosen = new Set(r.panel.map(h => h.id));
  return [...r.panel.map(h => h.id), ...pool.filter(h => !chosen.has(h.id)).map(h => h.id)];
}
/* the walk over the landings (lands: id -> landing record, or absent): the panel, those passed over, and where it stopped */
export function walk(order, lands, n = N_COUPLES) {
  const panel = [], passed = []; let gap = null;
  for (const base of order) {
    if (panel.length === n) break;
    const L = lands[base];
    if (!L) { gap = base; break; }
    const f = featureAt(panel.length), need = ['75', '90', f], bad = need.filter(v => !(L.variants[v] && L.variants[v].landed));
    if (bad.length) { passed.push({ base, feature: f, notLanded: bad }); continue; }
    panel.push({ base, place: panel.length, feature: f, units: need.map(v => ({ id: unitIdOf(base, v), variant: v, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label })) });
  }
  return { panel, passed, gap };
}
/* the panel's units, each with its plan at its landed target */
export function readSharePanel(file = SHARE_PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  return j.panel.flatMap(c => c.units.map(u => ({ ...u, base: c.base, place: c.place, feature: c.feature, kind: HOLDING[u.variant] ? 'reheld' : 'feature', plan: unitPlan(byId[c.base], u.variant, u.target) })));
}
const sum = (p, pre) => p.accounts.filter(a => a.id.startsWith(pre)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
const firstShare = p => { const s = p.accounts.filter(a => a.id.endsWith('_self')).reduce((t, a) => t + (Number(a.balance) || 0), 0), all = p.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0); return all > 0 ? s / all : NaN; };
/* what a feature does to the unit, for the summary */
export function featureSize(p, f) {
  if (f === 'db') { const i = (p.otherIncomes || []).find(x => x.id === 'inc_db_stage_c'); return i ? `£${i.amount} a year from ${i.startAge}` : 'missing'; }
  if (f === 'gain') { const g = p.accounts.filter(a => a.id.startsWith('other_')).reduce((t, a) => t + E.num(a.unrealisedGain, 0), 0); return `a gain of £${Math.round(g)} on £${Math.round(sum(p, 'other_'))} in the taxable accounts`; }
  if (f === 'spa67') return `the state pension from ${p.demographics.statePensionAge}`;
  return '';
}

function planted() {
  const cases = [], all = couplesOf(), byId = Object.fromEntries(all.map(h => [h.id, h]));
  const h = all.find(x => sum(x.plan, 'other_') > 0 && x.age > 44 && x.age < 60);
  // the holdings
  for (const v of ['75', '90']) {
    const p = variantPlan(h, v), H = holdingOf(p), H0 = holdingOf(h.plan), want = v === '75' ? 0.75 : 0.9;
    const kept = CATS.every(c => Math.abs(H[c].total - H0[c].total) < 1e-6), share = CATS.filter(c => H[c].total > 0).every(c => Math.abs(H[c].self / H[c].total - want) < 1e-9);
    cases.push([`re-held ${v}: every wrapper's total kept, the first person holding ${want} of each`, `${kept} ${share} ${firstShare(p).toFixed(4)}`, `true true ${want.toFixed(4)}`]);
  }
  // the features, each seen by the engine
  { const p = unitPlan(h, 'db', 30000), ctx = E.buildContext(E.resolveMpaa(p)), inc = ctx.otherIncomes.filter(i => i.amount === DB_AMOUNT);
    cases.push(['the DB pension: one income of the first person\'s, £15,000, taxable, from the state pension age (68)', `${inc.length} ${inc[0] && inc[0].owner} ${inc[0] && inc[0].taxFree} ${inc[0] && inc[0].startAge}`, `1 self false ${Math.max(68, Number(h.plan.demographics.retireAgeSelf))}`]); }
  { const p = unitPlan(h, 'gain', 30000), ctx = E.buildContext(E.resolveMpaa(p)), g = ctx.accounts.filter(a => a.cat === 'other');
    cases.push(['the gain: each taxable account half a gain, as the engine reads it (its basis half its balance)', `${g.length > 0} ${g.every(a => Math.abs(a.unrealisedGain - 0.5 * a.balance) < 1e-6)}`, 'true true']); }
  { const p = unitPlan(h, 'spa67', 30000);
    cases.push(['the state pension age 67 in the plan; the library\'s is 68', `${p.demographics.statePensionAge} ${h.plan.demographics.statePensionAge}`, '67 68']); }
  { const p = unitPlan(h, '90', 31234);
    cases.push(['a unit\'s plan at its target as D4\'s library cohort: the target, the floor at 80%, a couple, the candidate\'s returns', `${p.spending.targetSpend} ${p.spending.floorSpend} ${p.demographics.planningMode} ${p.riskProfiles['High Risk'].real}`, '31234 24987 couple 4.97']); }
  cases.push(['a feature the panel does not know is refused', (() => { try { withFeature(h.plan, 'rent'); return 'no'; } catch { return 'threw'; } })(), 'threw']);
  // the order and the walk
  { const ids = Array.from({ length: 30 }, (_, i) => `T${String(2 * i + 1).padStart(3, '0')}`), fake = Object.fromEntries(ids.map(id => [id, { id, age: 60 }]));
    const o = orderOf(ids, new Set(['T001', 'T007']), fake, 4);
    cases.push(['the order: the touched left out, four taken evenly (of 28: places 0, 7, 14, 21), then the rest in library order', o.slice(0, 7).join(','), 'T003,T019,T033,T047,T005,T009,T011']);
    const land = (vs = {}) => ({ variants: Object.fromEntries(VARIANTS.map(v => [v, { landed: vs[v] !== false, target: 1000, survival: 85, label: 'x' }])) });
    const lands = { T003: land(), T019: land({ gain: false }), T033: land({ db: false }), T047: land(), T005: land() };
    const w = walk(o, lands, 4);
    cases.push(['the walk: T019 lands all but the gain, which place 1 takes, so it is passed over; T033 takes place 1 (the gain) though its DB pension did not land; T047 place 2, T005 place 3', `${w.panel.map(c => `${c.base}:${c.feature}`).join(',')} | ${w.passed.map(x => `${x.base}:${x.notLanded.join('+')}`).join(',')} | ${w.gap}`, 'T003:db,T033:gain,T047:spa67,T005:db | T019:gain | null']);
    const w2 = walk(o, { T003: land() }, 4);
    cases.push(['the walk stops at the first candidate not yet landed', `${w2.panel.length} ${w2.gap}`, '1 T019']);
    cases.push(['each place\'s feature: 0 db, 1 gain, 2 spa67, 3 db', [0, 1, 2, 3].map(featureAt).join(','), 'db,gain,spa67,db']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const mode = process.argv[2] || 'list';
  if (mode === '--planted') process.exit(planted() ? 1 : 0);
  const all = couplesOf(), byId = Object.fromEntries(all.map(h => [h.id, h]));
  const orders = () => {
    if (!existsSync(SHARE_ORDERS)) { console.error('couples-share-panel: no couples-share-orders.json; run freeze first'); process.exit(2); }
    return JSON.parse(readFileSync(SHARE_ORDERS, 'utf8'));
  };
  const landsOf = order => Object.fromEntries(order.filter(id => existsSync(join(OUT, `${id}.json`))).map(id => [id, JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8'))]));
  if (mode === 'freeze') {
    if (existsSync(SHARE_ORDERS)) { console.error('couples-share-panel: couples-share-orders.json exists; the order is taken once'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS_FILE, 'utf8')), used = touchedAll(); for (const id of byIndex()) used.add(id);
    const ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12), order = orderOf(o.lib, used, byId);
    writeFileSync(SHARE_ORDERS, JSON.stringify({ built: new Date().toISOString(), from: 'couples-orders.json lib (D4\'s library order)', touched: { count: ids.length, hash, ids }, order }, null, 1) + '\n');
    console.log(`frozen: touched ${ids.length} ids (hash ${hash}); the order ${order.length}: the twelve ${order.slice(0, N_COUPLES).join(', ')}, then ${order.length - N_COUPLES} reserves`);
  }
  if (mode === 'list') {
    const { order } = orders();
    order.forEach((id, k) => { const d = byId[id].plan.demographics; console.log(`  ${String(k).padStart(3)}  ${id} ages ${d.currentAgeSelf}/${d.currentAgePart}, retiring ${d.retireAgeSelf}/${d.retireAgePart}${k < N_COUPLES ? '' : '  (reserve)'}`); });
  }
  if (mode === 'land') {
    const k = Number(process.argv[3]), { order } = orders();
    if (!(k >= 0 && k < order.length)) { console.error(`couples-share-panel: k must be 0..${order.length - 1}`); process.exit(2); }
    const h = byId[order[k]], t0 = Date.now(), variants = {};
    for (const v of VARIANTS) {
      let label = null;
      const survivalAt = T => { const a = armA(appPlan(unitPlan(h, v, T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
      const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0)), last = r.steps[r.steps.length - 1];
      if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
      variants[v] = { ...r, label, firstShare: firstShare(variantPlan(h, v)) };
      console.log(`  ${unitIdOf(h.id, v).padEnd(11)} target ${r.target} (library ${E.num(h.plan.spending.targetSpend, 0)}) arm A ${r.survival.toFixed(1)} ${r.landed ? 'LANDED' : 'NOT LANDED'} in ${r.steps.length} steps, ${label}`);
    }
    mkdirSync(OUT, { recursive: true });
    const cid = codeId(), head = execSync('git rev-parse --short=12 HEAD', { cwd: HERE }).toString().trim();
    writeFileSync(join(OUT, `${h.id}.json`), JSON.stringify({ base: h.id, k, name: h.name, libraryTarget: E.num(h.plan.spending.targetSpend, 0), variants, code: cid ? cid.hash : 'unknown', head, secs: (Date.now() - t0) / 1000 }));
    console.log(`${String(k).padStart(3)} ${h.id} landed in ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (mode === 'combine') {
    const o = orders(), lands = landsOf(o.order), w = walk(o.order, lands), codes = [...new Set(w.panel.map(c => lands[c.base].code))];
    console.log(`the walk: ${w.panel.length} couples${w.passed.length ? `; passed over ${w.passed.map(x => `${x.base} (${x.notLanded.join(', ')} not landed)`).join('; ')}` : ''}${w.gap ? `; stopped at the first not yet landed, ${w.gap}` : ''}`);
    if (w.panel.length < N_COUPLES) { console.log('panel: INCOMPLETE, land more candidates'); process.exit(1); }
    if (codes.length !== 1) { console.log(`panel: the landings are on ${codes.length} codes (${codes.join(', ')}): land them again on one`); process.exit(1); }
    writeFileSync(SHARE_PANEL, JSON.stringify({ built: new Date().toISOString(), code: codes[0], touched: { count: o.touched.count, hash: o.touched.hash }, passed: w.passed, panel: w.panel }, null, 1) + '\n');
    const S = w.panel.flatMap(c => c.units.map(u => u.survival));
    console.log(`panel: ${w.panel.length} couples, ${S.length} units, to ${SHARE_PANEL} on code ${codes[0]}; arm A from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(SHARE_PANEL, 'utf8')), units = readSharePanel(), o = orders(), lands = landsOf(o.order);
    const prior = Object.fromEntries(PRIOR_FILES.map(f => [f, new Set(readFileSync(join(HERE, f), 'utf8').match(/S\d{3}/g) || [])]));
    console.log(`ITEM 6'S STAGE C, THE PANEL (couples-share-panel.json, built ${j.built}, code ${j.code}; the scan ${j.touched.count} ids, hash ${j.touched.hash}; the order frozen ${o.built})`);
    console.log(`${j.panel.length} couples taken evenly over the untouched library order (${o.order.length} couples), ${units.length} units; passed over: ${j.passed.length ? j.passed.map(x => `${x.base} (${x.notLanded.join(', ')})`).join(', ') : 'none'}`);
    for (const c of j.panel) {
      const h = byId[c.base], d = h.plan.demographics, L = lands[c.base];
      console.log(`  place ${String(c.place).padStart(2)} ${c.base} ages ${d.currentAgeSelf}/${d.currentAgePart}, retiring ${d.retireAgeSelf}/${d.retireAgePart}; library target ${L.libraryTarget}; its feature: ${c.feature}`);
      for (const u of units.filter(x => x.base === c.base)) {
        const ctx = E.buildContext(E.resolveMpaa(u.plan));
        console.log(`      ${u.id.padEnd(11)} target ${u.target}, arm A ${u.survival.toFixed(1)}% (${u.label}); the first person holds ${(100 * firstShare(u.plan)).toFixed(1)}% of the pots; ${ctx.totalYears + 1} years${u.kind === 'feature' ? `; ${featureSize(u.plan, u.variant)}` : ''}`);
      }
    }
    const named = j.panel.filter(c => Object.values(prior).some(s => s.has(c.base)));
    console.log(`named outside the scan (${PRIOR_FILES.join(', ')}): ${named.length} of ${j.panel.length}${named.length ? `, ${named.map(c => c.base).join(', ')}` : ''}`);
    const lump = units.filter(u => /lump sum/.test(u.label));
    console.log(`arm A's pick takes the full lump sum on ${lump.length} of ${units.length} units (by its label)`);
  }
}
