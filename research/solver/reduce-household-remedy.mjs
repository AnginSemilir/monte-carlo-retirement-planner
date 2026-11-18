/*
 * THE REMEDY'S READ (HOUSEHOLD-REMEDY-READ.md; HOUSEHOLD-REMEDY.md; D129 (3); EXPLORATORY): the household plan with its
 * allowances priced at the pensions' split (HSP, the even split; HSPS, the split at the pensions' share too) against today's
 * couples' default (K2) and the household plan as built (HS) on the lead test's 28 units, by the rule committed before any
 * unit ran. The gate first (fair-gate.mjs on the units' logs; one code, audit, seed, size and candidate; every unit there
 * with its four arms whole; K2 and HS the lead test's arrays, checked on their first 200 paths by the audit and here against
 * the lead test's unit files whole; each remedy plan part 1's, recomputed from HS's own entries; its band for gains k
 * times one person's). Then for each of HSP and HSPS, against K2, paired by path (stats.mjs survivalChange):
 *   1. THE THREE MENDED: on S191-90, S333F and S335F the interval does not lie wholly below -0.3 points;
 *   2. THE GAIN KEPT: pooled survival's interval has its lower end above nought, no unit's interval lies wholly below
 *      -0.3, and pooled spending on the paths both keep is not lower than K2's by more than 0.05%.
 * Each arm: MENDS (1 and 2), MENDS THE THREE, NOT THE GAIN (1 alone), DOES NOT MEND (1 fails). The arm taken: HSP if it
 * MENDS, else HSPS if it MENDS, else none. Beside, deciding nothing: each arm less HS; the capped pot; lifetime tax; each
 * unit's k; the forecasts; the three couples' lost paths by kind; the pooled figures without their largest unit.
 *   node research/solver/reduce-household-remedy.mjs [--smoke] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChange } from './stats.mjs';
import { armOf, cells, spendOn } from './reduce-household.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ARMS = ['K2', 'HS', 'HSP', 'HSPS'], NEW = ['HSP', 'HSPS'], THREE = ['S191-90', 'S333F', 'S335F'];
export const RULE = { unit: -0.3, spend: -0.05 }, CANDIDATE = 'af001697ce1b', FAIL_TOLERANCE = 1;
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const SCALED = ['paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit', 'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit'];
export const LEAD_ARM = { K2: 'K2', HS: 'HS1' };
export const wantOptions = (arm, k) => (arm === 'K2' ? { ...JOINT } : arm === 'HS' ? { move: 'single', split: 'even' } : { move: 'single', split: arm === 'HSP' ? 'even' : 'pensions', scale: 'pensions', k });
const KEYS = ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet'];
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => (a.length ? sum(a) / a.length : NaN);
const js = x => JSON.stringify(x);

/* part 1's plan from HS's own entries (each doubled: one person's is half), as HOUSEHOLD-REMEDY.md has it */
export function wantPlan(hs, k) {
  const pa = hs.personalAllowance / 2, out = {};
  for (const key of Object.keys(hs)) out[key] = key === 'personalAllowance' ? hs[key] : SCALED.includes(key) ? 2 * pa + k * (hs[key] / 2 - pa) : key === 'pclsMaxCap' ? k * (hs[key] / 2) : hs[key];
  return out;
}
/* THE GATE: each unit against the design; leadOf(id) the lead test's unit file, or null (a smoke) */
export function gate(units, ids, audit, leadOf, size = { N: 4000, seed: 7002, pts: 45 }, partial = false) {
  const P = [], missing = partial ? [] : ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const kU = ids.indexOf(U.id);
    if (kU < 0) { P.push(`${U.id}: not in the design`); continue; }
    if (U.k !== kU) P.push(`${U.id}: unit ${U.k}, not unit ${kU}`);
    if (js(U.joint) !== js(JOINT)) P.push(`${U.id}: the joint move ${js(U.joint)}`);
    const k = U.split && U.split.k;
    if (!(k >= 1 - 1e-12 && k <= 2 + 1e-12) || !(Math.abs(k - 1 / U.split.s) < 1e-12)) P.push(`${U.id}: k ${k} not 1/s in [1, 2]`);
    if (!U.plans || !U.plans.HS || !U.plans.remedy) P.push(`${U.id}: the plans not recorded`);
    else { const want = wantPlan(U.plans.HS, k), off = Object.keys(want).filter(key => U.plans.remedy[key] !== want[key]); if (off.length || js(Object.keys(U.plans.remedy)) !== js(Object.keys(want))) P.push(`${U.id}: the remedy's plan's ${off.join(', ') || 'entries'} not part 1's`); }
    if (!(U.bands && Math.abs(U.bands.remedy - k * U.bands.person) < 1e-6)) P.push(`${U.id}: the remedy's band for gains ${U.bands && U.bands.remedy}, not k x ${U.bands && U.bands.person}`);
    if (!(U.cap > 0) || !(U.T > 0)) P.push(`${U.id}: no cap or horizon recorded`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of KEYS) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a, k))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a, k))}`);
      if (NEW.includes(a)) {
        const ch = x.chunks || [];
        if (!ch.length || ch[0].from !== 0 || ch[ch.length - 1].to !== U.N || ch.some((c, i) => i > 0 && c.from !== ch[i - 1].to) || ch.some(c => !c.proc || !c.cpu)) P.push(`${U.id} ${a}: its chunks do not cover its paths in order, each with its process and machine`);
      }
    }
    if (U.arms.HSP && U.arms.HSPS && U.arms.HSP.forecast !== U.arms.HSPS.forecast) P.push(`${U.id}: HSP and HSPS do not read one table`);
    if (leadOf) {
      const L = leadOf(U.id);
      if (!L) P.push(`${U.id}: no lead test unit to hold K2 and HS to`);
      else for (const [arm, la] of Object.entries(LEAD_ARM)) {
        const x = U.arms[arm];
        if (!x || !x.stored || x.stored.arm !== la || !(x.stored.checked >= 200)) { P.push(`${U.id} ${arm}: not recorded as the lead test's ${la}, checked on its first 200 paths`); continue; }
        const differ = KEYS.filter(key => L.arms[la][key] !== x.raw[key]);
        if (differ.length) P.push(`${U.id} ${arm}: ${differ.join(', ')} not the lead test's ${la}`);
      }
    }
  }
  return P;
}
const pooled = H => survivalChange(sum(H.map(h => h.cells.lost)), sum(H.map(h => h.cells.saved)), sum(H.map(h => h.cells.N)));
/* one arm against a base over the units */
export function compare(units, base, arm) {
  const H = units.map(U => { const c = cells(U.arms[base], U.arms[arm]); return { id: U.id, U, cells: c, ch: survivalChange(c.lost, c.saved, c.N) }; });
  const kept = spendOn(units.map(U => [U.arms[base], U.arms[arm]]), true);
  return { H, pooled: pooled(H), kept };
}
/* the rule for one arm */
export function armRule(units, arm) {
  const R = compare(units, 'K2', arm), three = R.H.filter(h => THREE.includes(h.id));
  const mended = three.length === THREE.length && three.every(h => h.ch.hi >= RULE.unit);
  const below = R.H.filter(h => h.ch.hi < RULE.unit);
  const gain = R.pooled.lo > 0 && below.length === 0 && R.kept.pooled.d >= RULE.spend;
  return { arm, R, three, mended, below, gain, outcome: !mended ? 'DOES NOT MEND' : gain ? 'MENDS' : 'MENDS THE THREE, NOT THE GAIN' };
}
export function rule(units) {
  const out = Object.fromEntries(NEW.map(a => [a, armRule(units, a)]));
  const taken = out.HSP.outcome === 'MENDS' ? 'HSP' : out.HSPS.outcome === 'MENDS' ? 'HSPS' : null;
  return { out, taken };
}
export const kinds = (A, T) => { let floor = 0, unfunded = 0; for (let i = 0; i < A.survived.length; i++) if (!A.survived[i]) { if (A.failYear[i] === T && A.unmet[i] <= FAIL_TOLERANCE) floor++; else unfunded++; } return { floor, unfunded }; };
export function cappedOf(cap, b, x) { let sb = 0, sx = 0; for (let i = 0; i < b.pot.length; i++) { sb += Math.min(b.pot[i], cap); sx += Math.min(x.pot[i], cap); } return { pct: sb > 0 ? 100 * (sx / sb - 1) : 0, gbp: (sx - sb) / b.pot.length, sb, sx, n: b.pot.length }; }

/* the planted checks: units built by hand, each outcome and gate refusal shown on a case made to give it */
function planted() {
  const N = 4000, T = 40, ids = [...THREE, ...Array.from({ length: 25 }, (_, i) => `U${String(i).padStart(2, '0')}`)];
  const arr = surv => ({ survived: Uint8Array.from(surv), failYear: Int16Array.from(surv.map(s => (s ? -1 : T))), pot: Float64Array.from(surv.map(s => (s ? 5e5 : 0))), estate: new Float64Array(N), tax: new Float64Array(N), delivered: Float64Array.from(surv.map(() => 1e6)), unmet: new Float64Array(N) });
  const raw = x => Object.fromEntries(KEYS.map(key => [key, Buffer.from(x[key].buffer).toString('base64')]));
  // K2 keeps paths [0, 3600); an arm keeping [0, keep) and the extra [3600, 3600 + extra)
  const run = (keep, extra) => arr(Array.from({ length: N }, (_, i) => (i < 3600 ? (i < keep ? 1 : 0) : (i < 3600 + extra ? 1 : 0))));
  const hsPlan = { personalAllowance: 25140, paTaperThreshold: 200000, basicBandLimit: 100540, higherBandLimit: 250280, scotStarterLimit: 33074, scotBasicLimit: 59052, scotIntermediateLimit: 87324, scotHigherLimit: 150000, scotAdvancedLimit: 250280, pclsMaxCap: 536550, isaAnnualAllowance: 40000 };
  const unit = (id, k, arms) => {
    const A = { K2: run(3600, 0), HS: arms.HS, HSP: arms.HSP, HSPS: arms.HSPS }, kk = 1.25;
    return { k, id, seed: 7002, N, pts: 45, candidate: CANDIDATE, stamp: { code: 'c', audit: 'a' }, joint: JOINT, split: { s: 0.8, k: kk }, plans: { HS: hsPlan, remedy: wantPlan(hsPlan, kk) }, bands: { remedy: kk * 37700, person: 37700 }, cap: 1e6, T,
      arms: Object.fromEntries(ARMS.map(a => [a, { ...A[a], raw: raw(A[a]), options: wantOptions(a, kk), forecast: 0.9, ...(LEAD_ARM[a] ? { stored: { arm: LEAD_ARM[a], checked: 200 } } : { chunks: [{ from: 0, to: N, cpuUs: 1, proc: 'p', cpu: 'c' }] }) }])) };
  };
  // the three lose 400 paths under HS; elsewhere HS gains 40
  const build = (hsp, hsps) => ids.map((id, k) => unit(id, k, THREE.includes(id) ? { HS: run(3200, 0), HSP: hsp.three, HSPS: hsps.three } : { HS: run(3600, 40), HSP: hsp.rest, HSPS: hsps.rest }));
  const mend = { three: run(3600, 0), rest: run(3600, 40) }, noMend = { three: run(3300, 0), rest: run(3600, 40) }, loseRest = { three: run(3600, 0), rest: run(3560, 0) };
  const checks = [], t = (label, got, want) => checks.push([label, got, want]);
  { const r = rule(build(mend, mend)); t('both arms mend the three and keep the gain: both MENDS, HSP taken', `${r.out.HSP.outcome} | ${r.out.HSPS.outcome} | ${r.taken}`, 'MENDS | MENDS | HSP'); }
  { const r = rule(build(noMend, mend)); t('HSP leaves the three 7.5 points below, HSPS mends: HSP DOES NOT MEND, HSPS taken', `${r.out.HSP.outcome} | ${r.taken}`, 'DOES NOT MEND | HSPS'); }
  { const r = rule(build(loseRest, loseRest)); t('the three mended, the other 25 each losing a point: MENDS THE THREE, NOT THE GAIN, none taken', `${r.out.HSP.outcome} | ${r.taken}`, 'MENDS THE THREE, NOT THE GAIN | null'); }
  { const r = rule(build({ three: run(3592, 0), rest: run(3600, 40) }, noMend)); t('a unit of the three 0.2 points below K2 counts as mended', `${r.out.HSP.mended} ${r.out.HSP.three[0].ch.d.toFixed(2)}`, 'true -0.20'); }
  // the gate
  const leadFrom = us => id => { const U = us.find(x => x.id === id); return { arms: { K2: U.arms.K2.raw, HS1: U.arms.HS.raw } }; };
  const clean = build(mend, mend);
  t('the gate passes 28 clean units', gate(clean, ids, 'a', leadFrom(clean)).length, 0);
  { const us = build(mend, mend), lead = leadFrom(build(mend, mend)); us[5].arms.HS.raw = { ...us[5].arms.HS.raw, survived: Buffer.from(new Uint8Array(N)).toString('base64') }; t('HS not the lead test\'s: refused', gate(us, ids, 'a', lead).some(p => /U02 HS: survived not the lead test's HS1/.test(p)), true); }
  { const us = build(mend, mend); us[0].plans.remedy = { ...us[0].plans.remedy, basicBandLimit: 100540 }; t('a remedy plan with a band still doubled: refused', gate(us, ids, 'a', leadFrom(us)).some(p => /S191-90: the remedy's plan's basicBandLimit/.test(p)), true); }
  { const us = build(mend, mend); us[1].plans.remedy = { ...us[1].plans.remedy, personalAllowance: 1.25 * 12570 }; t('a remedy plan with the allowance scaled: refused', gate(us, ids, 'a', leadFrom(us)).some(p => /S333F: the remedy's plan's personalAllowance/.test(p)), true); }
  { const us = build(mend, mend); us[2].bands = { remedy: 75400, person: 37700 }; t('the remedy\'s band for gains two people\'s: refused', gate(us, ids, 'a', leadFrom(us)).some(p => /S335F: the remedy's band for gains/.test(p)), true); }
  { const us = build(mend, mend); us[3].arms.HSPS = { ...us[3].arms.HSPS, forecast: 0.5 }; t('HSP and HSPS on two tables: refused', gate(us, ids, 'a', leadFrom(us)).some(p => /U00: HSP and HSPS do not read one table/.test(p)), true); }
  { const us = build(mend, mend).slice(0, 27); t('a unit missing: refused', gate(us, ids, 'a', leadFrom(us)).some(p => /units missing: U24/.test(p)), true); }
  { const us = build(mend, mend); us[4].arms.K2 = { ...us[4].arms.K2, stored: { arm: 'K2', checked: 0 } }; t('K2 not checked on its first 200 paths: refused', gate(us, ids, 'a', leadFrom(us)).some(p => /U01 K2: not recorded as the lead test's K2/.test(p)), true); }
  let bad = 0;
  for (const [label, got, want] of checks) { const ok = String(got) === String(want); if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${checks.length} FAILED` : `PLANTED: ALL PASS (${checks.length})`);
  return bad;
}

const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const pct = x => `${(100 * x).toFixed(2)}%`, gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { UNITS, stampFilesHash, LEAD_DIR } = await import('./audit-household-remedy.mjs');
  const DIR = process.env.HR_OUT || join(HERE, 'results', 'household-remedy-7002'), smoke = args.includes('--smoke');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)) : [];
  if (!files.length) { console.error(`reduce-household-remedy: no units in ${DIR}`); process.exit(2); }
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
    requireFairLogs(logs, 'none', { blob: () => '-' });
  }
  const units = files.map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) if (U.arms[a]) U.arms[a] = armOf(U.arms[a]); return U; });
  const ids = UNITS.map(u => u.id), leadOf = smoke ? null : id => { const f = join(LEAD_DIR, `${id}.json.gz`); return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };
  const problems = gate(units, ids, stampFilesHash(), leadOf, smoke ? null : undefined, smoke);
  console.log(`THE REMEDY'S READ (EXPLORATORY; HOUSEHOLD-REMEDY-READ.md, D129 (3)): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths, ${units[0].pts} points; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
  if (problems.length) { console.log(`THE GATE: REFUSED\n  ${problems.join('\n  ')}`); process.exit(3); }
  console.log(`THE GATE: fair; K2 and HS the lead test's K2 and HS1 arrays (each checked on its first 200 paths run again); each remedy plan part 1's`);
  if (smoke) { console.log('a smoke: the gate read, no figure printed'); process.exit(0); }
  units.sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
  const X = rule(units), say = ok => (ok ? 'HOLDS' : 'FAILS');
  console.log('\nTHE RULE, each arm against K2, paired by path (stats.mjs survivalChange):');
  for (const a of NEW) {
    const r = X.out[a];
    console.log(`  ${a}:`);
    console.log(`    1. the three: ${r.three.map(h => `${h.id} ${iv(h.ch)} (${h.cells.saved} saved, ${h.cells.lost} lost)`).join('; ')}; none wholly below ${RULE.unit}: ${say(r.mended)}`);
    console.log(`    2. pooled survival ${iv(r.R.pooled)} over ${units.length} units, its lower end above 0: ${say(r.R.pooled.lo > 0)}; units wholly below ${RULE.unit}: ${r.below.map(h => `${h.id} ${iv(h.ch)}`).join('; ') || 'none'}: ${say(!r.below.length)}; pooled spending on the paths both keep ${iv(r.R.kept.pooled, f4)}% of K2's, not lower by more than ${-RULE.spend}%: ${say(r.R.kept.pooled.d >= RULE.spend)}`);
    console.log(`    OUTCOME: ${r.outcome}`);
  }
  console.log(`THE ARM TAKEN: ${X.taken || 'none'}${X.taken ? ': step 8\'s registration is drafted on it, put to the design reviewer and brought to the maintainer before launch (D129 (3))' : ': back to the maintainer with the read'}`);
  console.log('\nBESIDE THE RULE, deciding nothing:');
  for (const a of NEW) {
    const S = compare(units, 'HS', a), cK = units.map(U => cappedOf(U.cap, U.arms.K2, U.arms[a])), cH = units.map(U => cappedOf(U.cap, U.arms.HS, U.arms[a]));
    const capPct = cs => 100 * (sum(cs.map(c => c.sx)) / sum(cs.map(c => c.sb)) - 1), capGbp = cs => (sum(cs.map(c => c.sx)) - sum(cs.map(c => c.sb))) / sum(cs.map(c => c.n));
    const net = X.out[a].R.H.map(h => h.cells.saved - h.cells.lost), iL = net.indexOf(Math.max(...net)), without = pooled(X.out[a].R.H.filter((h, i) => i !== iL));
    console.log(`  ${a} less HS: pooled survival ${iv(S.pooled)}; units wholly below ${RULE.unit}: ${S.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} ${iv(h.ch)}`).join('; ') || 'none'}; spending on the paths both keep ${iv(S.kept.pooled, f4)}%`);
    console.log(`  ${a}: the capped pot against K2 ${f3(capPct(cK))}% (${gbp(capGbp(cK))} a path), against HS ${f3(capPct(cH))}% (${gbp(capGbp(cH))} a path); lifetime tax, mean a unit, K2 ${gbp(mean(units.map(U => mean(U.arms.K2.tax))))}, HS ${gbp(mean(units.map(U => mean(U.arms.HS.tax))))}, ${a} ${gbp(mean(units.map(U => mean(U.arms[a].tax))))}; pooled survival against K2 without its largest unit (${X.out[a].R.H[iL].id}) ${iv(without)}`);
  }
  console.log('  by unit (k; survival K2 / HS / HSP / HSPS; HSP less K2; HSPS less K2; the table\'s forecast against HSP\'s survival):');
  for (const U of units) {
    const s = a => pct(sum(U.arms[a].survived) / U.N), d = a => { const c = cells(U.arms.K2, U.arms[a]); return iv(survivalChange(c.lost, c.saved, c.N)); };
    console.log(`    ${U.id.padEnd(12)} k ${U.split.k.toFixed(3)}; ${s('K2')} / ${s('HS')} / ${s('HSP')} / ${s('HSPS')}; ${d('HSP')}; ${d('HSPS')}; ${pct(U.arms.HSP.forecast)} against ${s('HSP')}`);
  }
  for (const U of units.filter(x => THREE.includes(x.id))) console.log(`  ${U.id}: the lost paths by kind (at the minimum pot at the end / a year unfunded): ${ARMS.map(a => { const kd = kinds(U.arms[a], U.T); return `${a} ${kd.floor}/${kd.unfunded}`; }).join(', ')}`);
}
