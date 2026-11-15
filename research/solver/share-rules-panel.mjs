/*
 * THE SHARE RULES' TEST, THE PANEL (D104 (5); registrations/share-rules.md, DRAFT): couples on which the two fixed share
 * rules ('potsflat', 'means') and today's ('pots') give different shares, for the registered test of the two against today's.
 *   - touched: held-out.mjs touchedAll run on the day, with the households the tests take by place (couple-panel.mjs
 *     byIndex), taken once and frozen with the order in share-rules-orders.json (freeze), which every later step reads; it
 *     leaves out stage C's twelve, the couples' re-run panel and the couples of every read since (each named in its files);
 *   - the order: the library order of couples-orders.json (D4's, first person older than 44), the touched left out; eight
 *     taken evenly in it (select-7u-broad.mjs pick, as stage C took its twelve), then the rest in library order as reserves;
 *   - each couple four times (units), the first person the elder in every library couple:
 *       45  the elder holding 45% of every wrapper's total (inside the band, below half: today's rule solves at 0.5, the
 *           band dropped at 0.45, the region the share choice's report named);
 *       55  the elder holding 55% (today 0.5, the band dropped 0.55);
 *       90  the elder holding 90% (today and the band dropped 0.9; the means where they fall);
 *       a feature at the library's own holding (60/40), set by the couple's place (FEATURES[i % 3]), where the means and
 *           the pots part: 'db' a £15,000 a year taxable DB pension of the first person's from the state pension age (as
 *           stage C's), 'dbpart' the same of the partner's, 'sppart' the partner's state pension at 60% of the first
 *           person's;
 *     each holding re-held here (reheldAt: every wrapper's total kept, the first person holding that share of it), the
 *     same as audit-share.mjs reheld at the holdings it names (the planted checks hold the two to the bit);
 *   - every unit's plan (unitPlan): the unit's holding or feature, then couple-panel.mjs planOf as D4's library cohort;
 *   - landing: each candidate's six variants landed so arm A, searched anew at each target, survives 85 +/- 1% on 1,000
 *     paths of seed 7005 (phase4-panel.mjs landTarget, D4's procedure), so which feature a couple takes never changes a
 *     landing;
 *   - the panel (combine): the order walked; a couple joins at the next place if its three holdings and the feature of that
 *     place all landed, is passed over (reported) if one did not, and the walk stops at the first candidate not yet landed.
 *   node research/solver/share-rules-panel.mjs freeze              the scan and the order, taken once
 *   node research/solver/share-rules-panel.mjs list                the order
 *   node research/solver/share-rules-panel.mjs land <k>            land candidate k's six variants (results/share-rules-land/)
 *   node research/solver/share-rules-panel.mjs combine             share-rules-panel.json from the landings
 *   node research/solver/share-rules-panel.mjs summary > results-share-rules-panel.txt
 *   node research/solver/share-rules-panel.mjs --planted           the checks on planted inputs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as E from '../engine.mjs';
import { couplesOf, planOf, byIndex, ORDERS_FILE } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { appPlan, landTarget, LAND_SEED, LAND_PATHS } from './phase4-panel.mjs';
import { touchedAll } from './held-out.mjs';
import { pick } from './select-7u-broad.mjs';
import { reheld, holdingOf, CATS } from './audit-share.mjs';
import { shareBy } from '../../src/solver/couple.js';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_COUPLES = 8, FEATURES = ['db', 'dbpart', 'sppart'], DB_AMOUNT = 15000, SP_PART = 0.6;
export const HOLDS = { 45: 0.45, 55: 0.55, 90: 0.9 };
export const VARIANTS = [...Object.keys(HOLDS), ...FEATURES];
export const RULES = ['pots', 'potsflat', 'means'];
export const ORDERS = join(HERE, 'share-rules-orders.json'), PANEL = process.env.SHARE_RULES_PANEL || join(HERE, 'share-rules-panel.json');
const OUT = process.env.SHARE_RULES_LAND_OUT || join(HERE, 'results', 'share-rules-land');
export const unitIdOf = (base, v) => `${base}-${v}`;
export const featureAt = i => FEATURES[i % FEATURES.length];

/* every wrapper's total kept, the first person holding share h of it (audit-share.mjs reheld at any share) */
export function reheldAt(base, h) {
  if (!(h >= 0 && h <= 1)) throw new Error(`share-rules-panel: a holding of ${h}`);
  const tot = c => base.accounts.filter(a => a.id.startsWith(c + '_')).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const accounts = base.accounts.map(a => {
    const c = CATS.find(k => a.id.startsWith(k + '_'));
    if (!c) return a;
    return { ...a, balance: a.id.endsWith('_self') ? tot(c) * h : tot(c) * (1 - h) };
  });
  return E.normalizePlan({ ...base, accounts });
}
/* the plan with one feature where the means and the pots part */
export function withFeature(plan, f) {
  const p = JSON.parse(JSON.stringify(plan));
  if (f === 'db' || f === 'dbpart') {
    const spa = E.num(p.demographics.statePensionAge, 68);
    p.otherIncomes = [...(p.otherIncomes || []), { id: `inc_${f}_share_rules`, name: 'DB pension (the share rules\' test)', owner: f === 'db' ? 'Myself' : 'Partner', startAge: spa, endAge: '', amount: DB_AMOUNT, incomeType: 'otherTaxable', notes: '' }];
  } else if (f === 'sppart') {
    p.demographics = { ...p.demographics, statePensionPart: Math.round(SP_PART * E.num(p.demographics.statePensionSelf, 0)) };
  } else throw new Error(`share-rules-panel: no feature '${f}'`);
  return E.normalizePlan(p);
}
/* the library couple as the unit holds it, before its target is set */
export const variantPlan = (h, v) => (HOLDS[v] !== undefined ? reheldAt(h.plan, HOLDS[v]) : withFeature(h.plan, v));
/* the unit's plan at a target, as every arm runs it */
export const unitPlan = (h, v, target) => planOf({ ...h, plan: variantPlan(h, v) }, 'lib', target);
/* the share each rule gives the unit's plan (src/solver/couple.js shareBy) */
export const sharesOf = plan => Object.fromEntries(RULES.map(r => [r, shareBy(E, plan, r)]));

/* the order: the library order, the touched left out; eight evenly, then the rest in library order */
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
    const f = featureAt(panel.length), need = [...Object.keys(HOLDS), f], bad = need.filter(v => !(L.variants[v] && L.variants[v].landed));
    if (bad.length) { passed.push({ base, feature: f, notLanded: bad }); continue; }
    panel.push({ base, place: panel.length, feature: f, units: need.map(v => ({ id: unitIdOf(base, v), variant: v, target: L.variants[v].target, survival: L.variants[v].survival, label: L.variants[v].label })) });
  }
  return { panel, passed, gap };
}
/* the panel's units, each with its plan at its landed target */
export function readSharePanel(file = PANEL) {
  const j = JSON.parse(readFileSync(file, 'utf8')), byId = Object.fromEntries(couplesOf().map(h => [h.id, h]));
  return j.panel.flatMap(c => c.units.map(u => ({ ...u, base: c.base, place: c.place, feature: c.feature, kind: HOLDS[u.variant] !== undefined ? 'reheld' : 'feature', plan: unitPlan(byId[c.base], u.variant, u.target) })));
}
const firstShare = p => { const s = p.accounts.filter(a => a.id.endsWith('_self')).reduce((t, a) => t + (Number(a.balance) || 0), 0), all = p.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0); return all > 0 ? s / all : NaN; };

function planted() {
  const cases = [], all = couplesOf();
  const h = all.find(x => x.plan.accounts.some(a => a.id.startsWith('other_') && Number(a.balance) > 0) && x.age > 44 && x.age < 60);
  // the holdings: the same as stage C's re-holding where it names one, and every total kept at the panel's own
  for (const [name, x] of [['seventyfive', 0.75], ['ninety-ten', 0.9]]) {
    cases.push([`reheldAt(${x}) the same as audit-share.mjs reheld('${name}') to the bit`, JSON.stringify(reheldAt(h.plan, x)) === JSON.stringify(reheld(h.plan, name)) ? 'same' : 'DIFFERENT', 'same']);
  }
  for (const v of Object.keys(HOLDS)) {
    const p = variantPlan(h, v), H = holdingOf(p), H0 = holdingOf(h.plan), want = HOLDS[v];
    const kept = CATS.every(c => Math.abs(H[c].total - H0[c].total) < 1e-6), share = CATS.filter(c => H[c].total > 0).every(c => Math.abs(H[c].self / H[c].total - want) < 1e-9);
    cases.push([`re-held ${v}: every wrapper's total kept, the first person holding ${want} of each`, `${kept} ${share} ${firstShare(p).toFixed(4)}`, `true true ${want.toFixed(4)}`]);
  }
  // the features, each seen by the engine
  for (const [f, who] of [['db', 'self'], ['dbpart', 'part']]) {
    const p = unitPlan(h, f, 30000), ctx = E.buildContext(E.resolveMpaa(p)), inc = ctx.otherIncomes.filter(i => i.amount === DB_AMOUNT);
    cases.push([`'${f}': one taxable income of £15,000, the ${who === 'self' ? 'first person' : 'partner'}'s, from the state pension age (68)`, `${inc.length} ${inc[0] && inc[0].owner} ${inc[0] && inc[0].taxFree} ${inc[0] && inc[0].startAge}`, `1 ${who} false 68`]);
  }
  { const p = unitPlan(h, 'sppart', 30000), d = p.demographics;
    cases.push(['\'sppart\': the partner\'s state pension 60% of the first person\'s, rounded to the pound', `${d.statePensionPart} ${Math.round(0.6 * E.num(h.plan.demographics.statePensionSelf, 0))}`, `${Math.round(0.6 * E.num(h.plan.demographics.statePensionSelf, 0))} ${Math.round(0.6 * E.num(h.plan.demographics.statePensionSelf, 0))}`]); }
  // the shares the three rules give: today's half inside the band, the band dropped at the holding, the means elsewhere
  { const s45 = sharesOf(unitPlan(h, '45', 30000)), s90 = sharesOf(unitPlan(h, '90', 30000));
    cases.push(['the rules\' shares at 45: today 0.5, the band dropped 0.45; at 90: today and the band dropped 0.9', `${s45.pots} ${s45.potsflat.toFixed(4)} ${s90.pots.toFixed(4)} ${s90.potsflat.toFixed(4)}`, '0.5 0.4500 0.9000 0.9000']);
    const sDb = sharesOf(unitPlan(h, 'db', 30000)), sDp = sharesOf(unitPlan(h, 'dbpart', 30000));
    cases.push(['the means move with a DB pension: higher when it is the first person\'s than when it is the partner\'s', `${sDb.means > sDp.means}`, 'true']); }
  cases.push(['a feature the panel does not know is refused', (() => { try { withFeature(h.plan, 'rent'); return 'no'; } catch { return 'threw'; } })(), 'threw']);
  cases.push(['a holding outside 0 to 1 is refused', (() => { try { reheldAt(h.plan, 1.2); return 'no'; } catch { return 'threw'; } })(), 'threw']);
  // the order and the walk
  { const ids = Array.from({ length: 30 }, (_, i) => `T${String(2 * i + 1).padStart(3, '0')}`), fake = Object.fromEntries(ids.map(id => [id, { id, age: 60 }]));
    const o = orderOf(ids, new Set(['T001', 'T007']), fake, 4);
    cases.push(['the order: the touched left out, four taken evenly (of 28: places 0, 7, 14, 21), then the rest in library order', o.slice(0, 7).join(','), 'T003,T019,T033,T047,T005,T009,T011']);
    const land = (vs = {}) => ({ variants: Object.fromEntries(VARIANTS.map(v => [v, { landed: vs[v] !== false, target: 1000, survival: 85, label: 'x' }])) });
    const lands = { T003: land(), T019: land({ dbpart: false }), T033: land({ db: false }), T047: land(), T005: land() };
    const w = walk(o, lands, 4);
    cases.push(['the walk: T019 lands all but the partner\'s DB pension, which place 1 takes, so it is passed over; T033 takes place 1 though its own DB pension did not land; T047 place 2, T005 place 3',
      `${w.panel.map(c => `${c.base}:${c.feature}`).join(',')} passed ${w.passed.map(x => x.base).join(',')}`, 'T003:db,T033:dbpart,T047:sppart,T005:db passed T019']);
    const w2 = walk(o, { T003: land() }, 4);
    cases.push(['the walk stops at the first candidate not yet landed', `${w2.panel.length} ${w2.gap}`, '1 T019']);
    cases.push(['each place\'s feature: 0 db, 1 dbpart, 2 sppart, 3 db', [0, 1, 2, 3].map(featureAt).join(','), 'db,dbpart,sppart,db']); }
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
    if (!existsSync(ORDERS)) { console.error('share-rules-panel: no share-rules-orders.json; run freeze first'); process.exit(2); }
    return JSON.parse(readFileSync(ORDERS, 'utf8'));
  };
  const landsOf = order => Object.fromEntries(order.filter(id => existsSync(join(OUT, `${id}.json`))).map(id => [id, JSON.parse(readFileSync(join(OUT, `${id}.json`), 'utf8'))]));
  if (mode === 'freeze') {
    if (existsSync(ORDERS)) { console.error('share-rules-panel: share-rules-orders.json exists; the order is taken once'); process.exit(2); }
    const o = JSON.parse(readFileSync(ORDERS_FILE, 'utf8')), used = touchedAll(); for (const id of byIndex()) used.add(id);
    const ids = [...used].sort(), hash = createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 12), order = orderOf(o.lib, used, byId);
    writeFileSync(ORDERS, JSON.stringify({ built: new Date().toISOString(), from: 'couples-orders.json lib (D4\'s library order)', touched: { count: ids.length, hash, ids }, order }, null, 1) + '\n');
    console.log(`frozen: touched ${ids.length} ids (hash ${hash}); the order ${order.length}: the eight ${order.slice(0, N_COUPLES).join(', ')}, then ${order.length - N_COUPLES} reserves`);
  }
  if (mode === 'list') {
    const { order } = orders();
    order.forEach((id, k) => { const d = byId[id].plan.demographics; console.log(`  ${String(k).padStart(3)}  ${id} ages ${d.currentAgeSelf}/${d.currentAgePart}, retiring ${d.retireAgeSelf}/${d.retireAgePart}${k < N_COUPLES ? '' : ' (reserve)'}`); });
  }
  if (mode === 'land') {
    const k = Number(process.argv[3]), { order } = orders();
    if (!(k >= 0 && k < order.length)) { console.error(`share-rules-panel: k must be 0..${order.length - 1}`); process.exit(2); }
    const h = byId[order[k]], t0 = Date.now(), variants = {};
    for (const v of VARIANTS) {
      let label = null;
      const survivalAt = T => { const a = armA(appPlan(unitPlan(h, v, T)), { tournament: false }); label = a.label; return E.monteCarlo(E.buildContext(E.resolveMpaa(a.planState)), { trials: LAND_PATHS, seed: LAND_SEED }).successRate; };
      const r = landTarget(survivalAt, E.num(h.plan.spending.targetSpend, 0)), last = r.steps[r.steps.length - 1];
      if (last.target !== r.target) survivalAt(r.target);   // arm A's label at the target taken
      variants[v] = { ...r, label, firstShare: firstShare(variantPlan(h, v)), shares: sharesOf(unitPlan(h, v, r.target)) };
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
    writeFileSync(PANEL, JSON.stringify({ built: new Date().toISOString(), code: codes[0], touched: { count: o.touched.count, hash: o.touched.hash }, passed: w.passed, panel: w.panel }, null, 1) + '\n');
    const S = w.panel.flatMap(c => c.units.map(u => u.survival));
    console.log(`panel: ${w.panel.length} couples, ${S.length} units, to ${PANEL} on code ${codes[0]}; arm A from ${Math.min(...S).toFixed(1)}% to ${Math.max(...S).toFixed(1)}%`);
  }
  if (mode === 'summary') {
    const j = JSON.parse(readFileSync(PANEL, 'utf8')), units = readSharePanel(), o = orders(), lands = landsOf(o.order);
    console.log(`THE SHARE RULES' TEST, THE PANEL (share-rules-panel.json, built ${j.built}, code ${j.code}; the scan ${j.touched.count} ids, hash ${j.touched.hash}; the order frozen ${o.built})`);
    console.log(`${j.panel.length} couples taken evenly over the untouched library order (${o.order.length} couples), ${units.length} units; passed over: ${j.passed.length ? j.passed.map(x => `${x.base} (${x.notLanded.join(', ')})`).join(', ') : 'none'}`);
    const f = x => x.toFixed(3);
    for (const c of j.panel) {
      const h = byId[c.base], d = h.plan.demographics, L = lands[c.base];
      console.log(`  place ${String(c.place).padStart(2)} ${c.base} ages ${d.currentAgeSelf}/${d.currentAgePart}, retiring ${d.retireAgeSelf}/${d.retireAgePart}; library target ${L.libraryTarget}; its feature: ${c.feature}`);
      for (const u of units.filter(x => x.base === c.base)) {
        const s = sharesOf(u.plan);
        console.log(`      ${u.id.padEnd(11)} target ${u.target}, arm A ${u.survival.toFixed(1)}% (${u.label}); the first person holds ${(100 * firstShare(u.plan)).toFixed(1)}% of the pots; the shares: today ${f(s.pots)}, the band dropped ${f(s.potsflat)}, the means ${f(s.means)}`);
      }
    }
    const differ = r => units.filter(u => { const s = sharesOf(u.plan); return Math.abs(s[r] - s.pots) > 1e-12; }).length;
    console.log(`the units where a rule's share differs from today's: the band dropped ${differ('potsflat')} of ${units.length}, the means ${differ('means')} of ${units.length}`);
    const lump = units.filter(u => /lump sum/.test(u.label));
    console.log(`arm A's pick takes the full lump sum on ${lump.length} of ${units.length} units (by its label)`);
  }
}
