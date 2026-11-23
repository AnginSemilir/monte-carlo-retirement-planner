/*
 * THE COUPLES TRADE, THE READ (COUPLES-TRADE.md; the deep review of the guard's own units, section 3; EXPLORATORY, seed 7002):
 * read once when all thirteen units are in, by the rule committed before any unit ran:
 *   THE TRADE: pooled over TRADE_UNITS (S037's nine distinct household-route units other than G12P), L keeps at most TRADE_BAR
 *     (a half) of ROUTE's survival gain over APP, in whole paths summed over the units (the share: L's surviving paths less APP's,
 *     over ROUTE's less APP's); and on each control L keeps at least CONTROL_BAR (three-quarters) of its own gain. A control below
 *     its bar, or with no gain: A CONTROL FAILS, and THE TRADE is not read. Otherwise THE TRADE HOLDS, or NOT THE TRADE.
 *   THE PRICING: over PRICING_UNITS (Y90, Y100, E95, E100), PA2's shortfall below Y75's at most PRICING_BAR (a half) of ROUTE's.
 *     A unit's figure for an arm: its spending on the paths it and APP both keep, less APP's, in pounds a year (the mean over those
 *     paths of the lifetime spending's difference, over the unit's years with a demand); an arm's shortfall: the mean over the
 *     four of its Y75 figure less the unit's. ROUTE's shortfall not above nought: NO SHORTFALL, and THE PRICING is not read.
 *     Otherwise THE PRICING HOLDS, or DOES NOT HOLD.
 * Beside, deciding nothing: G12P's share and each unit's; each pooled share's interval by path (a bootstrap over the paths, the
 * units resampled together, as they share seed 7002's paths); each arm's survival and change against APP; spending on the paths
 * both keep (% and pounds a year) and over all paths; the mean pot capped at the route's estate cap; lifetime tax; the worst fifth's
 * accounting (APP's end pot ranks the paths); D34 for L and for PA2, each against ROUTE (whole paths).
 *   node research/solver/reduce-couples-trade.mjs [dir]       (dir results/couples-trade-7002 unless given; SMOKE=1 for a smoke)
 *   node research/solver/reduce-couples-trade.mjs --planted   the rule's parts on planted units, each side of each bar
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { harmExact } from './reduce-share-rules.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { spendingItem } from './reduce-phase4.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { KEYS } from './audit-couples-open.mjs';
import { SEED, N_DEFAULT, UNITS, S037_UNITS, CONTROLS, ARMS, configOf, OUT_DEFAULT, stampFilesHash } from './audit-couples-trade.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TRADE_UNITS = Object.freeze(S037_UNITS.filter(id => id !== 'S037-G12P'));
export const PRICING_UNITS = Object.freeze(['S037-Y90', 'S037-Y100', 'S037-E95', 'S037-E100']), PRICING_REF = 'S037-Y75';
export const TRADE_BAR = 0.5, CONTROL_BAR = 0.75, PRICING_BAR = 0.5;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir) {
  return readdirSync(dir).filter(f => f.endsWith('.json.gz')).map(f => { const u = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); return { ...u, arms: Object.fromEntries(Object.entries(u.arms).map(([k, v]) => [k, armOf(v)])) }; });
}
const kept = X => sum(X.survived);
/* the share of ROUTE's gain over APP that L keeps, in whole paths over the units */
export function shareOf(units) {
  const l = sum(units.map(u => kept(u.arms.L) - kept(u.arms.APP))), r = sum(units.map(u => kept(u.arms.ROUTE) - kept(u.arms.APP)));
  return { l, r, share: r > 0 ? l / r : NaN };
}
/* an arm's spending against APP on the paths both keep, in pounds a year */
export function keptGBP(u, arm) {
  const A = u.arms.APP, X = u.arms[arm];
  let s = 0, c = 0;
  for (let i = 0; i < A.survived.length; i++) if (A.survived[i] && X.survived[i]) { s += X.delivered[i] - A.delivered[i]; c++; }
  return c ? s / c / u.yearsWith : NaN;
}
export function shortfallOf(byId, arm) {
  const ref = keptGBP(byId[PRICING_REF], arm), each = PRICING_UNITS.map(id => ({ id, d: ref - keptGBP(byId[id], arm) }));
  return { ref, each, mean: sum(each.map(x => x.d)) / each.length };
}
export function rule(units) {
  const byId = Object.fromEntries(units.map(u => [u.id, u]));
  const T = shareOf(TRADE_UNITS.map(id => byId[id])), C = CONTROLS.map(id => ({ id, ...shareOf([byId[id]]) }));
  const cFail = C.filter(c => !(c.r > 0) || !(c.share >= CONTROL_BAR));
  const trade = cFail.length ? 'A CONTROL FAILS' : T.share <= TRADE_BAR ? 'THE TRADE HOLDS' : 'NOT THE TRADE';
  const PR = shortfallOf(byId, 'ROUTE'), PQ = shortfallOf(byId, 'PA2');
  const pricing = !(PR.mean > 0) ? 'NO SHORTFALL' : PQ.mean <= PRICING_BAR * PR.mean ? 'THE PRICING HOLDS' : 'THE PRICING DOES NOT HOLD';
  return { T, C, cFail, trade, PR, PQ, pricing };
}
/* a seeded draw for the bootstrap (mulberry32), so a read prints the same interval every time */
const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function shareInterval(units, B = 2000) {
  const n = units[0].N, draw = rng(7002), out = [];
  for (let b = 0; b < B; b++) {
    let l = 0, r = 0;
    for (let j = 0; j < n; j++) { const i = Math.floor(draw() * n); for (const u of units) { const a = u.arms.APP.survived[i]; l += u.arms.L.survived[i] - a; r += u.arms.ROUTE.survived[i] - a; } }
    if (r > 0) out.push(l / r);
  }
  out.sort((x, y) => x - y);
  return out.length ? [out[Math.floor(0.025 * out.length)], out[Math.ceil(0.975 * out.length) - 1]] : [NaN, NaN];
}
const surv = X => 100 * kept(X) / X.survived.length;
const capPct = (cap, A, X) => { if (!(cap > 0)) return NaN; let a = 0, x = 0; for (let i = 0; i < A.pot.length; i++) { a += Math.min(A.pot[i], cap); x += Math.min(X.pot[i], cap); } return 100 * (x - a) / a; };
const mean = a => sum(a) / (a.length || 1);
function worstFifth(u, arm) {
  const A = u.arms.APP, X = u.arms[arm], n = A.pot.length, idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => A.pot[i] - A.pot[j] || i - j).slice(0, Math.floor(n / 5));
  return { pot: mean(idx.map(i => X.pot[i] - A.pot[i])), spend: mean(idx.map(i => X.delivered[i] - A.delivered[i])), tax: mean(idx.map(i => X.tax[i] - A.tax[i])), saved: idx.filter(i => X.survived[i] && !A.survived[i]).length, lost: idx.filter(i => !X.survived[i] && A.survived[i]).length };
}
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : 'n/a'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : 'n/a'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : 'n/a'), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : 'n/a');
const sg = (x, f) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${f(x)}` : 'n/a');
const gbp = x => (Number.isFinite(x) ? `${x < 0 ? '-' : '+'}£${Math.round(Math.abs(x)).toLocaleString('en-GB')}` : 'n/a');
export function report(units) {
  const R = rule(units), byId = Object.fromEntries(units.map(u => [u.id, u])), out = [];
  const iv = shareInterval(TRADE_UNITS.map(id => byId[id]));
  out.push(`THE TRADE (pooled over ${TRADE_UNITS.length} of S037's units, G12P beside): L keeps ${f3(R.T.share)} of ROUTE's gain over APP (${R.T.l} of ${R.T.r} paths net; by path ${f3(iv[0])} to ${f3(iv[1])}), the bar at most ${TRADE_BAR}`);
  for (const c of R.C) out.push(`  control ${c.id}: L keeps ${f3(c.share)} (${c.l} of ${c.r} paths net), the bar at least ${CONTROL_BAR}: ${c.r > 0 && c.share >= CONTROL_BAR ? 'holds' : 'FAILS'}`);
  { const g = shareOf([byId['S037-G12P']]); out.push(`  beside: S037-G12P, L keeps ${f3(g.share)} (${g.l} of ${g.r} paths net)`); }
  out.push(`  => ${R.trade}${R.cFail.length ? ` (${R.cFail.map(c => c.id).join(', ')}): THE TRADE is not read` : ''}`);
  out.push(`THE PRICING (${PRICING_UNITS.join(', ')} against ${PRICING_REF}): spending on the paths both keep, less APP's, a year: ROUTE's shortfall ${gbp(R.PR.mean)} (${PRICING_REF} ${gbp(R.PR.ref)}), PA2's ${gbp(R.PQ.mean)} (${PRICING_REF} ${gbp(R.PQ.ref)}); the bar PA2's at most ${PRICING_BAR} of ROUTE's`);
  for (let j = 0; j < PRICING_UNITS.length; j++) out.push(`  ${PRICING_UNITS[j].padEnd(10)} ROUTE ${gbp(R.PR.each[j].d)} below ${PRICING_REF}, PA2 ${gbp(R.PQ.each[j].d)}`);
  out.push(`  => ${R.pricing}${R.pricing === 'NO SHORTFALL' ? ': THE PRICING is not read' : ''}`);
  out.push(`OUTCOME: ${R.trade}; ${R.pricing}`);
  out.push('');
  out.push('Beside, deciding nothing. Each unit (survival; the arm less APP in paths net of N):');
  for (const id of UNITS) {
    const u = byId[id], A = u.arms.APP, net = arm => kept(u.arms[arm]) - kept(A), sh = shareOf([u]);
    out.push(`  ${id.padEnd(10)} k ${f4(u.split.k)}: APP ${f2(surv(A))}% ROUTE ${f2(surv(u.arms.ROUTE))}% L ${f2(surv(u.arms.L))}% PA2 ${f2(surv(u.arms.PA2))}%; net ROUTE ${sg(net('ROUTE'), String)}, L ${sg(net('L'), String)}, PA2 ${sg(net('PA2'), String)} of ${u.N}; L keeps ${f3(sh.share)}`);
  }
  out.push('Spending against APP (on the paths both keep, %, and pounds a year; over all paths, %), each unit:');
  for (const id of UNITS) {
    const u = byId[id], cell = arm => { const kp = keptSpend([u], 'APP', arm, u.N), al = spendingItem([[u.arms[arm], u.arms.APP]], u.N); return `${arm} ${sg(kp.d, f4)}% (${gbp(keptGBP(u, arm))}), all ${sg(al.d, f3)}%`; };
    out.push(`  ${id.padEnd(10)} ${['ROUTE', 'L', 'PA2'].map(cell).join('; ')}`);
  }
  out.push('The mean pot capped at the route\'s estate cap, against APP (%), and lifetime tax a path (APP / ROUTE / L / PA2):');
  for (const id of UNITS) {
    const u = byId[id], A = u.arms.APP, cap = sum(u.caps || []), capQ = sum(u.capsPA2 || []);
    out.push(`  ${id.padEnd(10)} capped ROUTE ${sg(capPct(cap, A, u.arms.ROUTE), f2)}%, L ${sg(capPct(cap, A, u.arms.L), f2)}%, PA2 ${sg(capPct(capQ, A, u.arms.PA2), f2)}%; tax £${['APP', 'ROUTE', 'L', 'PA2'].map(a => Math.round(mean(Array.from(u.arms[a].tax))).toLocaleString('en-GB')).join(' / £')}`);
  }
  out.push('The worst fifth by APP\'s end pot, the arm less APP a path (pot, spending, tax; paths saved / lost there):');
  for (const id of UNITS) { const u = byId[id]; out.push(`  ${id.padEnd(10)} ${['ROUTE', 'L', 'PA2'].map(arm => { const w = worstFifth(u, arm); return `${arm} ${gbp(w.pot)}, ${gbp(w.spend)}, ${gbp(w.tax)} (${w.saved}/${w.lost})`; }).join('; ')}`); }
  out.push('D34 against ROUTE (whole paths; lost, saved, the threshold), L and PA2:');
  for (const id of UNITS) { const u = byId[id], h = arm => { const x = harmExact(u.arms[arm], u.arms.ROUTE, u.N); return `${arm} ${x.lost} lost, ${x.saved} saved, ${x.j}${x.flag ? ' FLAGGED' : ''}`; }; out.push(`  ${id.padEnd(10)} ${h('L')}; ${h('PA2')}`); }
  return out.join('\n');
}
/* the gate: every unit in, one stamp, one seed, one size, the app's points, each arm's configuration, every check recorded */
export function gate(units, { smoke = false } = {}) {
  const bad = [], ids = new Set(units.map(u => u.id));
  for (const id of UNITS) if (!ids.has(id)) bad.push(`${id} missing`);
  if (units.length !== UNITS.length) bad.push(`${units.length} unit files, not ${UNITS.length}`);
  const stamps = new Set(units.map(u => `code ${u.stamp.code} audit ${u.stamp.audit}`));
  if (stamps.size !== 1) bad.push(`${stamps.size} stamps: ${[...stamps].join(' | ')}`);
  if (!smoke && units.length && units[0].stamp.audit !== stampFilesHash()) bad.push(`the audit stamp ${units[0].stamp.audit}, the files now ${stampFilesHash()}`);
  for (const u of units) {
    if (u.seed !== SEED) bad.push(`${u.id} seed ${u.seed}`);
    if (!smoke && (u.N !== N_DEFAULT || u.pts !== APP_POINTS)) bad.push(`${u.id} ${u.N} paths at ${u.pts} points`);
    for (const arm of ARMS) if (!u.arms[arm] || u.arms[arm].config !== configOf(arm)) bad.push(`${u.id} ${arm} config ${u.arms[arm] ? u.arms[arm].config : 'missing'}`);
    if (!smoke && !['1 ', '2 ', '3 ', '4 ', '5 ', '6 '].every(p => (u.checks || []).some(c => c.startsWith(p) && !c.includes('not checked')))) bad.push(`${u.id}: not every check recorded`);
  }
  return bad;
}

function planted() {
  const cases = [], N = 1000;
  const arm = (k, d = 0) => { const s = new Uint8Array(N); for (let i = 0; i < k; i++) s[i] = 1; const del = new Float64Array(N).fill(100000 + d), z = new Float64Array(N); return { survived: s, failYear: new Int16Array(N), pot: Float64Array.from(z), estate: z, tax: z, delivered: del, unmet: z }; };
  // a unit: APP keeps 850, ROUTE 990; L keeps lk; PA2 keeps 990; spending on kept paths ROUTE dR, PA2 dQ pounds a year (x 28 years)
  const unit = (id, lk, dR = 0, dQ = 0) => ({ id, N, split: { k: 1 }, yearsWith: 28, caps: [1e6, 0], capsPA2: [1e6, 0], arms: { APP: arm(850), ROUTE: arm(990, 28 * dR), L: arm(lk), PA2: arm(990, 28 * dQ) } });
  // 140 paths of gain on each; L's share = (lk - 850) / 140
  const panel = (sharesS037, shareCtl, pricing = {}) => [
    ...S037_UNITS.map(id => unit(id, id === 'S037-G12P' ? 990 : 850 + Math.round(140 * sharesS037), pricing[id] ? pricing[id][0] : 0, pricing[id] ? pricing[id][1] : 0)),
    ...CONTROLS.map(id => unit(id, 850 + Math.round(140 * shareCtl)))];
  const priced = (r, q) => ({ 'S037-Y75': [0, 0], 'S037-Y90': [-r, -q], 'S037-Y100': [-r, -q], 'S037-E95': [-r, -q], 'S037-E100': [-r, -q] });
  { const R = rule(panel(0.45, 0.9, priced(400, 100))); cases.push(['the trade at 0.45 with the controls at 0.9 holds; PA2 a quarter of the shortfall holds', `${R.trade}; ${R.pricing}`, 'THE TRADE HOLDS; THE PRICING HOLDS']); }
  { const R = rule(panel(0.55, 0.9, priced(400, 210))); cases.push(['the trade at 0.55 is not the trade; PA2 at 0.525 of the shortfall does not hold', `${R.trade}; ${R.pricing}`, 'NOT THE TRADE; THE PRICING DOES NOT HOLD']); }
  { const R = rule(panel(0.45, 0.7)); cases.push(['a control at 0.7 fails, the trade not read; no shortfall, the pricing not read', `${R.trade} ${R.cFail.length}; ${R.pricing}`, 'A CONTROL FAILS 3; NO SHORTFALL']); }
  { const R = rule(panel(0.45, 0.8, priced(400, 190))); cases.push(['the controls at 0.8 hold; PA2 at 0.475 of the shortfall holds', `${R.trade}; ${R.pricing}`, 'THE TRADE HOLDS; THE PRICING HOLDS']); }
  { const P = panel(0.45, 0.9); P.find(u => u.id === 'S037-G12P').arms.L = arm(850); const R = rule(P); cases.push(['G12P is beside: its L at nought leaves the trade at 0.45', `${f3(R.T.share)} ${R.trade}`, '0.450 THE TRADE HOLDS']); }
  { const full = ['1 a', '2 b', '3 c', '4 d', '5 e', '6 f'], P = panel(0.45, 0.9);
    const as = checks => P.map(u => ({ ...u, seed: SEED, stamp: { code: 'c', audit: stampFilesHash() }, pts: APP_POINTS, N: N_DEFAULT, checks, arms: Object.fromEntries(Object.entries(u.arms).map(([k, v]) => [k, { ...v, config: configOf(k) }])) }));
    cases.push(['the gate passes units with every check recorded and refuses them with check 2 not checked', `${gate(as(full)).length} ${gate(as([...full.slice(0, 1), '2 not checked at a smoke\'s points', ...full.slice(2)])).length > 0}`, '0 true']); }
  let fails = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(fails ? `FAILED: ${fails} of ${cases.length}` : `ALL PASS: ${cases.length} planted checks`);
  process.exit(fails ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) planted();
  const smoke = process.env.SMOKE === '1', dir = process.argv[2] || OUT_DEFAULT;
  if (!existsSync(dir)) { console.error(`reduce-couples-trade: no ${dir}`); process.exit(2); }
  const units = loadDir(dir), bad = gate(units, { smoke });
  if (bad.length) { console.log(`THE GATE: REFUSED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const logs = readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(dir, f), 'utf8'));
  if (!smoke) requireFairLogs(logs, 'none', { blob: () => '-' });
  const u0 = units[0];
  console.log(`THE COUPLES TRADE, EXPLORATORY (COUPLES-TRADE.md; the deep review of the guard's own units, section 3): ${units.length} units, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, code ${u0.stamp.code}, audit ${u0.stamp.audit}${smoke ? ', A SMOKE' : ''}`);
  console.log(`THE GATE: fair (every unit, one stamp, each arm's configuration${smoke ? '' : ', every check recorded, the logs\' stamps'})`);
  console.log(report(units));
}
