/*
 * THE HOUSEHOLD PLAN'S PRICE OF A PARTNER'S INCOME, THE READ (PRICING-FIX.md; D143; EXPLORATORY, seed 7002): read once when all
 * fourteen units are in, by the rule committed before any unit ran:
 *   THE SHORTFALL CLOSES: over SHORT_UNITS (S037's Y90, Y100, E95 and E100), FIX's shortfall below Y75's at most SHORT_BAR (a
 *     half) of ROUTE's, each as the couples trade measured ROUTE's (reduce-couples-trade.mjs shortfallOf: a unit's figure for an
 *     arm its spending on the paths it and APP both keep, less APP's, in pounds a year; an arm's shortfall the mean over the four
 *     of its Y75 figure less the unit's). ROUTE's shortfall not above nought: NO SHORTFALL, a STOP (check 2 holds ROUTE to the
 *     trade's, whose shortfall was above nought).
 *   NO HARM: D34 flags FIX against ROUTE on no unit, in whole paths (reduce-share-rules.mjs harmExact), S191-90 among them; and
 *     FIX less ROUTE's pooled survival over the fourteen, the units weighted equally, its interval by path (reduce-phase4.mjs
 *     survivalItem: the units share seed 7002's paths), has its lower end above POOL_BAR (-0.1 points).
 *   Both: FIX HOLDS; otherwise FIX DOES NOT HOLD.
 * Beside, deciding nothing: each unit's survival in each arm and FIX less ROUTE in paths saved and lost; spending on the paths
 * both keep, FIX against ROUTE and each against APP (% and pounds a year); each unit's shortfall; the mean pot capped at the
 * route's estate cap against ROUTE; lifetime tax a path; the worst fifth by ROUTE's end pot, FIX less ROUTE; the checks' lines.
 *   node research/solver/reduce-pricing-fix.mjs [dir]       (dir results/pricing-fix-7002 unless given; SMOKE=1 for a smoke)
 *   node research/solver/reduce-pricing-fix.mjs --planted   the rule's parts on planted units, each side of each bar
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { harmExact } from './reduce-share-rules.mjs';
import { keptSpend } from './reduce-household-hsp.mjs';
import { survivalItem } from './reduce-phase4.mjs';
import { shortfallOf, keptGBP, PRICING_UNITS, PRICING_REF } from './reduce-couples-trade.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { KEYS } from './audit-couples-open.mjs';
import { SEED, N_DEFAULT, UNITS, ARMS, S191, configOf, OUT_DEFAULT, stampFilesHash } from './audit-pricing-fix.mjs';
import { APP_POINTS } from '../../src/solverSettings.js';

export const SHORT_UNITS = PRICING_UNITS, SHORT_REF = PRICING_REF, SHORT_BAR = 0.5, POOL_BAR = -0.1;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, dec(x[k], Ty)])) });
export function loadDir(dir) {
  return readdirSync(dir).filter(f => f.endsWith('.json.gz')).map(f => { const u = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString()); return { ...u, arms: Object.fromEntries(Object.entries(u.arms).map(([k, v]) => [k, armOf(v)])) }; });
}
const kept = X => sum(X.survived);
export function rule(units) {
  const byId = Object.fromEntries(units.map(u => [u.id, u])), n = units[0].N;
  const SR = shortfallOf(byId, 'ROUTE'), SF = shortfallOf(byId, 'FIX');
  const shortfall = !(SR.mean > 0) ? 'NO SHORTFALL' : SF.mean <= SHORT_BAR * SR.mean ? 'THE SHORTFALL CLOSES' : 'THE SHORTFALL DOES NOT CLOSE';
  const harms = units.map(u => ({ id: u.id, ...harmExact(u.arms.FIX, u.arms.ROUTE, u.N) })), flagged = harms.filter(h => h.flag);
  const pooled = survivalItem(units.map(u => [u.arms.FIX, u.arms.ROUTE]), n);
  const noHarm = !flagged.length && pooled.lo > POOL_BAR;
  const outcome = shortfall === 'NO SHORTFALL' ? 'STOP: NO SHORTFALL' : shortfall === 'THE SHORTFALL CLOSES' && noHarm ? 'FIX HOLDS' : 'FIX DOES NOT HOLD';
  return { SR, SF, shortfall, harms, flagged, pooled, noHarm, outcome };
}
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : 'n/a'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : 'n/a'), f4 = x => (Number.isFinite(x) ? x.toFixed(4) : 'n/a');
const sg = (x, f) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${f(x)}` : 'n/a');
const gbp = x => (Number.isFinite(x) ? `${x < 0 ? '-' : '+'}£${Math.round(Math.abs(x)).toLocaleString('en-GB')}` : 'n/a');
const surv = X => 100 * kept(X) / X.survived.length;
const mean = a => sum(a) / (a.length || 1);
const capPct = (cap, B, X) => { if (!(cap > 0)) return NaN; let b = 0, x = 0; for (let i = 0; i < B.pot.length; i++) { b += Math.min(B.pot[i], cap); x += Math.min(X.pot[i], cap); } return 100 * (x - b) / b; };
function worstFifth(u) {
  const B = u.arms.ROUTE, X = u.arms.FIX, n = B.pot.length, idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => B.pot[i] - B.pot[j] || i - j).slice(0, Math.floor(n / 5));
  return { pot: mean(idx.map(i => X.pot[i] - B.pot[i])), spend: mean(idx.map(i => X.delivered[i] - B.delivered[i])), tax: mean(idx.map(i => X.tax[i] - B.tax[i])), saved: idx.filter(i => X.survived[i] && !B.survived[i]).length, lost: idx.filter(i => !X.survived[i] && B.survived[i]).length };
}
export function report(units) {
  const R = rule(units), byId = Object.fromEntries(units.map(u => [u.id, u])), out = [];
  out.push(`THE SHORTFALL (${SHORT_UNITS.join(', ')} against ${SHORT_REF}; spending on the paths both keep, less APP's, a year): ROUTE's ${gbp(R.SR.mean)} (${SHORT_REF} ${gbp(R.SR.ref)}), FIX's ${gbp(R.SF.mean)} (${SHORT_REF} ${gbp(R.SF.ref)}); FIX's at most ${SHORT_BAR} of ROUTE's${R.SR.mean > 0 ? ` (FIX's ${f3(R.SF.mean / R.SR.mean)} of it)` : ''}`);
  for (let j = 0; j < SHORT_UNITS.length; j++) out.push(`  ${SHORT_UNITS[j].padEnd(10)} ROUTE ${gbp(R.SR.each[j].d)} below ${SHORT_REF}, FIX ${gbp(R.SF.each[j].d)}`);
  out.push(`  => ${R.shortfall}`);
  out.push(`NO HARM (FIX against ROUTE): D34 in whole paths flags ${R.flagged.length ? R.flagged.map(h => h.id).join(', ') : 'no unit'}; the pooled survival over the ${units.length} units ${sg(R.pooled.d, f3)} (${sg(R.pooled.lo, f3)} to ${sg(R.pooled.hi, f3)} by path, se ${f4(R.pooled.se)}), its lower end above ${POOL_BAR}: ${R.pooled.lo > POOL_BAR ? 'holds' : 'FAILS'}`);
  out.push(`  => ${R.noHarm ? 'NO HARM' : 'HARM'}`);
  out.push(`OUTCOME: ${R.outcome}`);
  out.push('');
  out.push('Beside, deciding nothing. Each unit (k; survival; FIX less ROUTE in paths saved / lost of N; D34 against ROUTE: lost, saved, the threshold):');
  for (const id of UNITS) {
    const u = byId[id], h = R.harms.find(x => x.id === id);
    out.push(`  ${id.padEnd(10)} k ${f4(u.split.k)}: APP ${f2(surv(u.arms.APP))}% ROUTE ${f2(surv(u.arms.ROUTE))}% FIX ${f2(surv(u.arms.FIX))}%; FIX less ROUTE ${h.saved} saved, ${h.lost} lost of ${u.N}; D34 ${h.lost} lost, ${h.saved} saved, ${h.j}${h.flag ? ' FLAGGED' : ''}`);
  }
  out.push('Spending on the paths both keep (%, and pounds a year): FIX against ROUTE; ROUTE and FIX each against APP:');
  for (const id of UNITS) {
    const u = byId[id], fr = keptSpend([u], 'ROUTE', 'FIX', u.N), ra = keptSpend([u], 'APP', 'ROUTE', u.N), fa = keptSpend([u], 'APP', 'FIX', u.N);
    out.push(`  ${id.padEnd(10)} FIX less ROUTE ${sg(fr.d, f4)}% (se ${f4(fr.se)}); against APP: ROUTE ${sg(ra.d, f4)}% (${gbp(keptGBP(u, 'ROUTE'))}), FIX ${sg(fa.d, f4)}% (${gbp(keptGBP(u, 'FIX'))})`);
  }
  { const p = keptSpend(units, 'ROUTE', 'FIX', units[0].N); out.push(`  pooled, the units weighted equally: FIX less ROUTE ${sg(p.d, f4)}% (${sg(p.lo, f4)} to ${sg(p.hi, f4)} by path)`); }
  out.push('The mean pot capped at the route\'s estate cap, FIX against ROUTE (%), and lifetime tax a path (APP / ROUTE / FIX):');
  for (const id of UNITS) {
    const u = byId[id], cap = sum(u.caps || []);
    out.push(`  ${id.padEnd(10)} capped ${sg(capPct(cap, u.arms.ROUTE, u.arms.FIX), f3)}%; tax £${ARMS.map(a => Math.round(mean(Array.from(u.arms[a].tax))).toLocaleString('en-GB')).join(' / £')}`);
  }
  out.push('The worst fifth by ROUTE\'s end pot, FIX less ROUTE a path (pot, spending, tax; paths saved / lost there):');
  for (const id of UNITS) { const w = worstFifth(byId[id]); out.push(`  ${id.padEnd(10)} ${gbp(w.pot)}, ${gbp(w.spend)}, ${gbp(w.tax)} (${w.saved}/${w.lost})`); }
  out.push('The checks, each unit:');
  for (const id of UNITS) out.push(`  ${id.padEnd(10)} ${(byId[id].checks || []).join(' | ')}`);
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
    if (!smoke && !['1 ', '2 ', '3 ', '4 '].every(p => (u.checks || []).some(c => c.startsWith(p) && !c.includes('not checked')))) bad.push(`${u.id}: not every check recorded`);
  }
  return bad;
}

function planted() {
  const cases = [], N = 1000;
  // an arm keeping k paths, each delivering 100,000 plus d over the unit's 28 years
  const arm = (k, d = 0) => { const s = new Uint8Array(N); for (let i = 0; i < k; i++) s[i] = 1; const del = new Float64Array(N).fill(100000 + d), z = new Float64Array(N); return { survived: s, failYear: new Int16Array(N), pot: Float64Array.from(z), estate: z, tax: Float64Array.from(z), delivered: del, unmet: Float64Array.from(z) }; };
  // a unit: APP keeps 850, ROUTE 990; FIX keeps fk; spending on kept paths ROUTE dR, FIX dF pounds a year (x 28 years)
  const unit = (id, fk = 990, dR = 0, dF = 0) => ({ id, N, split: { k: 1 }, yearsWith: 28, caps: [1e6, 0], arms: { APP: arm(850), ROUTE: arm(990, 28 * dR), FIX: arm(fk, 28 * dF) } });
  const short = (r, f) => ({ 'S037-Y90': [-r, -f], 'S037-Y100': [-r, -f], 'S037-E95': [-r, -f], 'S037-E100': [-r, -f] });
  const panel = (sh = {}, fix = {}) => UNITS.map(id => unit(id, fix[id] ?? 990, sh[id] ? sh[id][0] : 0, sh[id] ? sh[id][1] : 0));
  { const R = rule(panel(short(400, 190))); cases.push(['FIX at 0.475 of the shortfall closes it; no unit flagged, the pooled change nought: FIX HOLDS', `${R.shortfall}; ${R.noHarm}; ${R.outcome}`, 'THE SHORTFALL CLOSES; true; FIX HOLDS']); }
  { const R = rule(panel(short(400, 210))); cases.push(['FIX at 0.525 of the shortfall does not close it: FIX DOES NOT HOLD', `${R.shortfall}; ${R.outcome}`, 'THE SHORTFALL DOES NOT CLOSE; FIX DOES NOT HOLD']); }
  { const R = rule(panel()); cases.push(['no shortfall in ROUTE: a STOP', `${R.shortfall}; ${R.outcome}`, 'NO SHORTFALL; STOP: NO SHORTFALL']); }
  { const R = rule(panel(short(400, 100), { [S191]: 960 })); cases.push(['S191-90 losing 30 paths of 1,000 to FIX is flagged: FIX DOES NOT HOLD', `${R.flagged.map(h => h.id).join(',')}; ${R.outcome}`, `${S191}; FIX DOES NOT HOLD`]); }
  { const R = rule(panel(short(400, 100), { [S191]: 988 })); cases.push(['S191-90 losing 2 paths is not flagged, the pooled change above the bar: FIX HOLDS', `${R.flagged.length}; ${R.pooled.lo > POOL_BAR}; ${R.outcome}`, '0; true; FIX HOLDS']); }
  { // every unit losing 2 paths of 1,000 to FIX, each on its own paths so the pooled loss is 0.2 points, past the bar
    const P = panel(short(400, 100)); P.forEach((u, j) => { const s = new Uint8Array(N); for (let i = 0; i < 990; i++) s[i] = 1; s[(2 * j) % 990] = 0; s[(2 * j + 1) % 990] = 0; u.arms.FIX.survived = s; });
    const R = rule(P); cases.push(['every unit losing 2 paths: none flagged, the pooled change -0.2 below the bar: FIX DOES NOT HOLD', `${R.flagged.length}; ${R.pooled.lo > POOL_BAR}; ${R.outcome}`, '0; false; FIX DOES NOT HOLD']); }
  { const full = ['1 a', '2 b', '3 c', '4 d'], P = panel();
    const as = checks => P.map(u => ({ ...u, seed: SEED, stamp: { code: 'c', audit: stampFilesHash() }, pts: APP_POINTS, N: N_DEFAULT, checks, arms: Object.fromEntries(Object.entries(u.arms).map(([k, v]) => [k, { ...v, config: configOf(k) }])) }));
    cases.push(['the gate passes units with every check recorded and refuses them with check 2 not checked', `${gate(as(full)).length} ${gate(as([full[0], '2 not checked at a smoke\'s points', ...full.slice(2)])).length > 0}`, '0 true']); }
  let fails = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(fails ? `FAILED: ${fails} of ${cases.length}` : `ALL PASS: ${cases.length} planted checks`);
  process.exit(fails ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) planted();
  const smoke = process.env.SMOKE === '1', dir = process.argv[2] || OUT_DEFAULT;
  if (!existsSync(dir)) { console.error(`reduce-pricing-fix: no ${dir}`); process.exit(2); }
  const units = loadDir(dir), bad = gate(units, { smoke });
  if (bad.length) { console.log(`THE GATE: REFUSED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const logs = readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(dir, f), 'utf8'));
  if (!smoke) requireFairLogs(logs, 'none', { blob: () => '-' });
  const u0 = units[0];
  console.log(`THE PRICING FIX, EXPLORATORY (PRICING-FIX.md; D143): ${units.length} units, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, code ${u0.stamp.code}, audit ${u0.stamp.audit}${smoke ? ', A SMOKE' : ''}`);
  console.log(`THE GATE: fair (every unit, one stamp, each arm's configuration${smoke ? '' : ', every check recorded, the logs\' stamps'})`);
  console.log(report(units));
}
