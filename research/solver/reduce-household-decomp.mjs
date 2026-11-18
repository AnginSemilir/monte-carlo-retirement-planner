/*
 * THE DECOMPOSITION'S READ (HOUSEHOLD-DECOMP.md; D129 (1); EXPLORATORY): on each of the lead test's three units to place,
 * which of the household plan's two doubled allowances its loss to K2 rests on. The gate first (fair-gate.mjs on the units'
 * logs; one code, audit, seed, size and candidate; every arm whole, its chunks covering its paths in order; each variant's
 * plan its groups single (half HS's) and every other doubled entry HS's; each household table's band for gains one person's
 * with the bands single and two people's otherwise; the variants' tables not HS's; K2 and HS the lead test's arrays byte for
 * byte, as each unit recorded and as read again here from the lead test's unit files). Then, on each unit:
 *   L, the loss: the paths K2 keeps and HS loses;
 *   a variant's recovery: the paths of L it keeps, less the paths HS keeps that it loses, as a share of L;
 *   beyond noise: the variant less HS, paired by path (stats.mjs survivalChange), its interval wholly above nought;
 *   a variant recovers the loss where its recovery is half of L or more and it is beyond noise.
 * The outcome on each unit, the first that holds: RESTS ON THE BANDS (HSB recovers it, HSC does not); RESTS ON THE CAP (HSC
 * does, HSB does not); EITHER (both do); TOGETHER (neither alone, HSBC does); NOT THESE TWO (HSBC does not). Beside, deciding
 * nothing: each arm's survival; each variant less HS and less K2; each arm's lost paths by kind; spending on the paths both
 * keep; the end pot and the capped pot; lifetime tax; each table's opening forecast; CEIL less HS for each table; the three
 * units pooled.
 *   node research/solver/reduce-household-decomp.mjs [--smoke] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { armOf, cells, spendOn } from './reduce-household.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const UNIT_IDS = ['S191-90', 'S333F', 'S335F'];
export const HOUSES = { HS: [], HSB: ['bands'], HSC: ['cap'], HSBC: ['bands', 'cap'] };
export const CEIL_OF = { CEIL: 'HS', CEILB: 'HSB', CEILC: 'HSC', CEILBC: 'HSBC' };
export const ARMS = ['K2', ...Object.keys(HOUSES), ...Object.keys(CEIL_OF)];
export const VARIANTS = ['HSB', 'HSC', 'HSBC'];
/* the groups as HOUSEHOLD-DECOMP.md names them (household.mjs SINGLE_GROUPS) */
export const GROUPS = { bands: ['personalAllowance', 'paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit', 'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit'], cap: ['pclsMaxCap'] };
export const RULE = { half: 0.5 }, CANDIDATE = 'af001697ce1b', FAIL_TOLERANCE = 1;
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const LEAD_ARM = { K2: 'K2', HS: 'HS1' };
export const wantOptions = arm => (arm === 'K2' ? { ...JOINT } : HOUSES[arm] ? { move: 'single', split: 'even', single: HOUSES[arm] } : { ceil: CEIL_OF[arm], single: HOUSES[CEIL_OF[arm]] });
const KEYS = ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet'];
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => (a.length ? sum(a) / a.length : NaN);
const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k ? (k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2) : NaN; };
const js = x => JSON.stringify(x);

/* THE GATE: what each unit recorded, against the design; leadOf(id) the lead test's unit file (its arms raw), or null */
export function gate(units, audit, leadOf, size = { N: 4000, seed: 7002, pts: 45 }, partial = false) {
  const P = [], missing = partial ? [] : UNIT_IDS.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const k = UNIT_IDS.indexOf(U.id);
    if (k < 0) { P.push(`${U.id}: not in the design`); continue; }
    if (U.k !== k) P.push(`${U.id}: unit ${U.k}, not unit ${k}`);
    if (js(U.houses) !== js(HOUSES) || js(U.ceilOf) !== js(CEIL_OF) || js(U.joint) !== js(JOINT)) P.push(`${U.id}: the arms recorded as ${js(U.houses)} ${js(U.ceilOf)} on ${js(U.joint)}, not the design's`);
    if (!(U.cap > 0) || !(U.floor >= 0) || !(U.T > 0)) P.push(`${U.id}: no cap, minimum pot or horizon recorded`);
    // each variant's plan: its groups' entries half HS's, every other doubled entry HS's
    const hs = U.plans && U.plans.HS;
    if (!hs) P.push(`${U.id}: no plan recorded for HS`);
    else for (const v of VARIANTS) {
      const pv = U.plans[v], singles = new Set(HOUSES[v].flatMap(g => GROUPS[g]));
      if (!pv || js(Object.keys(pv)) !== js(Object.keys(hs))) { P.push(`${U.id} ${v}: no plan recorded, or not HS's entries`); continue; }
      const off = Object.keys(hs).filter(key => (singles.has(key) ? !(pv[key] > 0 && 2 * pv[key] === hs[key]) : pv[key] !== hs[key]));
      if (off.length) P.push(`${U.id} ${v}: the plan's ${off.join(', ')} not as its groups want them`);
    }
    for (const [arm, single] of Object.entries(HOUSES)) {
      const want = (single.includes('bands') ? 1 : 2) * U.personBand;
      if (!(U.bands && Math.abs(U.bands[arm] - want) < 1e-6)) P.push(`${U.id} ${arm}: its band for gains ${U.bands && U.bands[arm]}, not ${want}`);
    }
    for (const v of VARIANTS) if (!U.digests || !U.digests[v] || U.digests[v] === U.digests.HS) P.push(`${U.id} ${v}: its household table not recorded, or HS's`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of KEYS) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a))}`);
      if (!(x.cpuUs > 0) || !(x.solveSecs > 0) || !(x.forecast >= 0 && x.forecast <= 1)) P.push(`${U.id} ${a}: no time, no solve time or no forecast`);
      const ch = x.chunks || [];
      if (!ch.length || ch[0].from !== 0 || ch[ch.length - 1].to !== U.N || ch.some((c, i) => i > 0 && c.from !== ch[i - 1].to) || ch.some(c => !c.proc || !c.cpu)) P.push(`${U.id} ${a}: its chunks do not cover its paths in order, each with its process and machine`);
    }
    for (const [ce, arm] of Object.entries(CEIL_OF)) if (U.arms[ce] && U.arms[arm] && U.arms[ce].forecast !== U.arms[arm].forecast) P.push(`${U.id} ${ce}: not ${arm}'s table`);
    // the identity: K2 and HS the lead test's, as recorded and as read again
    if (leadOf) {
      const L = leadOf(U.id);
      if (!L) P.push(`${U.id}: no lead test unit to hold K2 and HS to`);
      else if (L.seed !== U.seed || L.N !== U.N || L.pts !== U.pts) P.push(`${U.id}: the lead test's unit is another size`);
      else for (const [arm, la] of Object.entries(LEAD_ARM)) {
        if (!U.arms[arm]) continue;
        if (U.arms[arm].leadSame !== la) P.push(`${U.id} ${arm}: not recorded as the lead test's ${la}`);
        const differ = KEYS.filter(key => L.arms[la][key] !== U.arms[arm].raw[key]);
        if (differ.length) P.push(`${U.id} ${arm}: ${differ.join(', ')} differ from the lead test's ${la}`);
      }
    }
  }
  return P;
}

/* a variant against HS on one unit: L, its recovery, its share of L, and the variant less HS paired by path */
export function recoveryOf(K, H, V) {
  let L = 0, keptL = 0, lostHs = 0;
  for (let i = 0; i < K.survived.length; i++) {
    if (K.survived[i] && !H.survived[i]) { L++; if (V.survived[i]) keptL++; }
    if (H.survived[i] && !V.survived[i]) lostHs++;
  }
  const c = cells(H, V), ch = survivalChange(c.lost, c.saved, c.N), rec = keptL - lostHs, share = L > 0 ? rec / L : 0;
  return { L, keptL, lostHs, rec, share, ch, cells: c, recovers: L > 0 && share >= RULE.half && ch.lo > 0 };
}
/* the outcome on one unit, the first that holds */
export function outcomeOf(r) {
  if (r.HSB.recovers && !r.HSC.recovers) return 'RESTS ON THE BANDS';
  if (r.HSC.recovers && !r.HSB.recovers) return 'RESTS ON THE CAP';
  if (r.HSB.recovers && r.HSC.recovers) return 'EITHER';
  if (r.HSBC.recovers) return 'TOGETHER';
  return 'NOT THESE TWO';
}
export function rule(units) {
  return units.map(U => {
    const K = U.arms.K2, H = U.arms.HS, r = Object.fromEntries(VARIANTS.map(v => [v, recoveryOf(K, H, U.arms[v])]));
    return { id: U.id, U, r, outcome: outcomeOf(r) };
  });
}
/* each arm's lost paths by kind: at the minimum pot at the end, or a year unfunded */
export function kinds(A, T) {
  let floor = 0, unfunded = 0;
  for (let i = 0; i < A.survived.length; i++) if (!A.survived[i]) { if (A.failYear[i] === T && A.unmet[i] <= FAIL_TOLERANCE) floor++; else unfunded++; }
  return { floor, unfunded };
}
/* the pot counted up to the cap, the arm's mean against the base's, in percent and in pounds a path */
export function cappedOf(cap, b, x) {
  let sb = 0, sx = 0; const n = b.pot.length;
  for (let i = 0; i < n; i++) { sb += Math.min(b.pot[i], cap); sx += Math.min(x.pot[i], cap); }
  return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / n };
}

/* the planted checks: units built by hand, each outcome and each gate refusal shown on a case made to give it */
function planted() {
  const N = 4000, T = 40;
  const arm = (surv, extra = {}) => ({ survived: Uint8Array.from(surv), failYear: Int16Array.from(surv.map(s => (s ? -1 : T))), pot: Float64Array.from(surv.map(s => (s ? 5e5 : 0))), estate: new Float64Array(surv.length), tax: new Float64Array(surv.length), delivered: Float64Array.from(surv.map(() => 1e6)), unmet: new Float64Array(surv.length), ...extra });
  // K2 keeps every path; HS loses the first L of them
  const base = L => { const k = Array(N).fill(1), h = k.map((_, i) => (i < L ? 0 : 1)); return { K: arm(k), H: arm(h) }; };
  // a variant keeping `keep` of HS's L lost paths, and losing `lose` paths HS keeps
  const variant = (L, keep, lose) => arm(Array.from({ length: N }, (_, i) => (i < L ? (i < keep ? 1 : 0) : (i < L + lose ? 0 : 1))));
  const unitOf = (L, b, c, bc) => { const { K, H } = base(L); return { K2: K, HS: H, HSB: variant(L, ...b), HSC: variant(L, ...c), HSBC: variant(L, ...bc) }; };
  const out = A => outcomeOf(Object.fromEntries(VARIANTS.map(v => [v, recoveryOf(A.K2, A.HS, A[v])])));
  const checks = [];
  const t = (label, got, want) => checks.push([label, got, want]);
  t('the bands recover all of 800 lost paths, the cap none: RESTS ON THE BANDS', out(unitOf(800, [800, 0], [0, 0], [800, 0])), 'RESTS ON THE BANDS');
  t('the cap recovers 60 of 100, the bands 10: RESTS ON THE CAP', out(unitOf(100, [10, 0], [60, 0], [70, 0])), 'RESTS ON THE CAP');
  t('each recovers 80 of 100: EITHER', out(unitOf(100, [80, 0], [80, 0], [90, 0])), 'EITHER');
  t('each alone 40 of 100, both 80: TOGETHER', out(unitOf(100, [40, 0], [40, 0], [80, 0])), 'TOGETHER');
  t('both together 30 of 100: NOT THESE TWO', out(unitOf(100, [20, 0], [20, 0], [30, 0])), 'NOT THESE TWO');
  t('the bands keep 80 of 100 lost but lose 40 HS keeps (a recovery of 40): not half, so NOT THESE TWO with the rest nought', out(unitOf(100, [80, 40], [0, 0], [0, 0])), 'NOT THESE TWO');
  { const r = recoveryOf(base(100).K, base(100).H, variant(100, 50, 0)); t('exactly half of 100 lost paths, beyond noise, recovers', `${r.share} ${r.ch.lo > 0} ${r.recovers}`, '0.5 true true'); }
  { const r = recoveryOf(base(100).K, base(100).H, variant(100, 49, 0)); t('49 of 100 does not', r.recovers, false); }
  { const r = recoveryOf(base(2).K, base(2).H, variant(2, 2, 0)); t('all of two lost paths is within noise, so does not recover', `${r.share} ${r.ch.lo > 0} ${r.recovers}`, '1 false false'); }
  { const r = recoveryOf(base(0).K, base(0).H, variant(0, 0, 0)); t('no loss, no recovery', `${r.L} ${r.recovers}`, '0 false'); }
  // the gate
  const unitFile = id => {
    const A = unitOf(100, [80, 0], [0, 0], [80, 0]), raw = x => Object.fromEntries(KEYS.map(k => [k, Buffer.from(x[k].buffer).toString('base64')]));
    const arms = {};
    for (const a of ARMS) { const x = A[a] || A[CEIL_OF[a]]; arms[a] = { ...x, raw: raw(x), options: wantOptions(a), cpuUs: 1, solveSecs: 1, forecast: 0.9, chunks: [{ from: 0, to: N, cpuUs: 1, proc: 'p', cpu: 'c' }], ...(LEAD_ARM[a] ? { leadSame: LEAD_ARM[a] } : {}) }; }
    const hsPlan = { personalAllowance: 25140, paTaperThreshold: 200000, basicBandLimit: 100540, higherBandLimit: 250280, scotStarterLimit: 30000, scotBasicLimit: 50000, scotIntermediateLimit: 90000, scotHigherLimit: 150000, scotAdvancedLimit: 250280, pclsMaxCap: 536550, isaAnnualAllowance: 40000 };
    const half = ks => Object.fromEntries(Object.entries(hsPlan).map(([k, v]) => [k, ks.includes(k) ? v / 2 : v]));
    return {
      k: UNIT_IDS.indexOf(id), id, seed: 7002, N, pts: 45, candidate: CANDIDATE, stamp: { code: 'c', audit: 'a' }, houses: HOUSES, ceilOf: CEIL_OF, joint: JOINT, cap: 1e6, floor: 0, T,
      plans: { HS: hsPlan, HSB: half(GROUPS.bands), HSC: half(GROUPS.cap), HSBC: half([...GROUPS.bands, ...GROUPS.cap]) },
      bands: { HS: 75400, HSB: 37700, HSC: 75400, HSBC: 37700 }, personBand: 37700, digests: { HS: 'h', HSB: 'b', HSC: 'c', HSBC: 'bc' }, arms
    };
  };
  const leadFrom = units => id => { const U = units.find(u => u.id === id); return { seed: U.seed, N: U.N, pts: U.pts, arms: { K2: U.arms.K2.raw, HS1: U.arms.HS.raw } }; };
  const clean = UNIT_IDS.map(unitFile);
  t('the gate passes three clean units', gate(clean, 'a', leadFrom(clean)).length, 0);
  { const us = UNIT_IDS.map(unitFile), lead = leadFrom(UNIT_IDS.map(unitFile)); us[0].arms.HS.raw = { ...us[0].arms.HS.raw, survived: Buffer.from(new Uint8Array(N)).toString('base64') }; t('HS not the lead test\'s: refused', gate(us, 'a', lead).some(p => /differ from the lead test's HS1/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile); us[1].plans.HSC = { ...us[1].plans.HSC, basicBandLimit: us[1].plans.HSC.basicBandLimit / 2 }; t('a variant with an entry outside its groups single: refused', gate(us, 'a', leadFrom(us)).some(p => /S333F HSC: the plan's basicBandLimit/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile); us[2].plans.HSB = { ...us[2].plans.HSB, personalAllowance: us[2].plans.HS.personalAllowance }; t('a variant leaving one of its group doubled: refused', gate(us, 'a', leadFrom(us)).some(p => /S335F HSB: the plan's personalAllowance/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile); us[0].bands = { ...us[0].bands, HSB: 75400 }; t('the bands single with two people\'s band for gains: refused', gate(us, 'a', leadFrom(us)).some(p => /S191-90 HSB: its band for gains/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile); us[1].digests = { ...us[1].digests, HSBC: 'h' }; t('a variant on HS\'s table: refused', gate(us, 'a', leadFrom(us)).some(p => /HSBC: its household table/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile).slice(0, 2); t('a unit missing: refused', gate(us, 'a', leadFrom(us)).some(p => /units missing: S335F/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile); us[2].stamp = { code: 'c', audit: 'other' }; t('two audit stamps: refused', gate(us, 'a', leadFrom(us)).some(p => /more than one audit/.test(p)), true); }
  { const us = UNIT_IDS.map(unitFile); us[0].arms.CEILB = { ...us[0].arms.CEILB, forecast: 0.5 }; t('a CEIL arm not its household arm\'s table: refused', gate(us, 'a', leadFrom(us)).some(p => /CEILB: not HSB's table/.test(p)), true); }
  let bad = 0;
  for (const [label, got, want] of checks) { const ok = String(got) === String(want); if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${checks.length} FAILED` : `PLANTED: ALL PASS (${checks.length})`);
  return bad;
}

const f2 = x => (x >= 0 ? '+' : '') + x.toFixed(2), f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const pct = x => `${(100 * x).toFixed(2)}%`, gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { stampFilesHash, LEAD_DIR } = await import('./audit-household-decomp.mjs');
  const DIR = process.env.HD_OUT || join(HERE, 'results', 'household-decomp-7002'), smoke = args.includes('--smoke');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)) : [];
  if (!files.length) { console.error(`reduce-household-decomp: no units in ${DIR}`); process.exit(2); }
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
    requireFairLogs(logs, 'none', { blob: () => '-' });
  }
  const units = files.map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
  const leadOf = smoke ? null : id => { const f = join(LEAD_DIR, `${id}.json.gz`); return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };
  const problems = gate(units, stampFilesHash(), leadOf, smoke ? null : undefined, smoke);
  console.log(`WHY THE HOUSEHOLD PLAN LOSES ON THREE COUPLES: THE DECOMPOSITION (EXPLORATORY; HOUSEHOLD-DECOMP.md, D129 (1)): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths, ${units[0].pts} points; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
  if (problems.length) { console.log(`THE GATE: REFUSED\n  ${problems.join('\n  ')}`); process.exit(3); }
  console.log(`THE GATE: fair; K2 and HS the lead test's K2 and HS1 byte for byte on ${smoke ? 'no unit (a smoke)' : `all ${units.length} units`}; each variant's plan its groups single, every other doubled entry as HS's`);
  if (smoke) { console.log('a smoke: the gate read, no figure printed'); process.exit(0); }
  units.sort((p, q) => UNIT_IDS.indexOf(p.id) - UNIT_IDS.indexOf(q.id));
  const X = rule(units);
  console.log('\nTHE RULE, on each unit (L: the paths K2 keeps and HS loses; a variant\'s recovery: the paths of L it keeps, less the paths HS keeps that it loses; recovers: half of L or more, and the variant less HS beyond noise):');
  for (const x of X) {
    console.log(`  ${x.id}: L ${x.r.HSB.L} (HS less K2 ${iv(survivalChange(cells(x.U.arms.K2, x.U.arms.HS).lost, cells(x.U.arms.K2, x.U.arms.HS).saved, x.U.N))})`);
    for (const v of VARIANTS) { const r = x.r[v]; console.log(`    ${v.padEnd(5)} keeps ${r.keptL} of L, loses ${r.lostHs} HS keeps: recovery ${r.rec} (${(100 * r.share).toFixed(1)}% of L); ${v} less HS ${iv(r.ch)} (${r.cells.saved} saved, ${r.cells.lost} lost): ${r.recovers ? 'RECOVERS' : 'does not recover'}`); }
    console.log(`    OUTCOME: ${x.outcome}`);
  }
  console.log('\nBESIDE THE RULE, deciding nothing:');
  for (const x of X) {
    const U = x.U, A = U.arms, surv = a => sum(A[a].survived) / U.N;
    console.log(`  ${x.id}:`);
    console.log(`    survival: ${ARMS.map(a => `${a} ${pct(surv(a))}`).join(', ')}`);
    console.log(`    the lost paths by kind (at the minimum pot at the end / a year unfunded): ${ARMS.map(a => { const k = kinds(A[a], U.T); return `${a} ${k.floor}/${k.unfunded}`; }).join(', ')}`);
    for (const v of VARIANTS) {
      const cK = cells(A.K2, A[v]), sH = spendOn([[A.HS, A[v]]], true).pooled, sK = spendOn([[A.K2, A[v]]], true).pooled, cpH = cappedOf(U.cap, A.HS, A[v]), cpK = cappedOf(U.cap, A.K2, A[v]);
      console.log(`    ${v}: less K2 ${iv(survivalChange(cK.lost, cK.saved, cK.N))}; spending on the paths both keep against HS ${iv(sH, f4)}%, against K2 ${iv(sK, f4)}%; the capped pot against HS ${f3(cpH.pct)}% (${gbp(cpH.gbp)} a path), against K2 ${f3(cpK.pct)}% (${gbp(cpK.gbp)} a path)`);
    }
    console.log(`    the end pot, mean / median: ${ARMS.slice(0, 5).map(a => `${a} ${gbp(mean(A[a].pot))} / ${gbp(median(A[a].pot))}`).join(', ')}`);
    console.log(`    lifetime tax, mean: ${ARMS.slice(0, 5).map(a => `${a} ${gbp(mean(A[a].tax))}`).join(', ')}`);
    console.log(`    each household table's opening forecast against its survival on the couple and on its own plan: ${Object.entries(CEIL_OF).map(([ce, h]) => `${h} ${pct(A[h].forecast)} against ${pct(surv(h))} and ${pct(surv(ce))}`).join('; ')}`);
    console.log(`    CEIL less HS, paired by path, each table: ${Object.entries(CEIL_OF).map(([ce, h]) => { const c = cells(A[h], A[ce]); return `${ce} less ${h} ${iv(survivalChange(c.lost, c.saved, c.N))}`; }).join('; ')}`);
  }
  const pooled = v => { const L = sum(X.map(x => x.r[v].L)), rec = sum(X.map(x => x.r[v].rec)); return `${v} ${rec} of ${L} (${(100 * rec / L).toFixed(1)}%)`; };
  console.log(`  the three units pooled, each variant's recovery: ${VARIANTS.map(pooled).join('; ')}`);
  console.log(`  the solves and the paths: ${X.map(x => `${x.id} ${ARMS.slice(0, 5).map(a => `${a} ${(x.U.arms[a].cpuUs / 1e3 / x.U.N).toFixed(1)} ms a path`).join(', ')}`).join('; ')}`);
}
