/*
 * THE LEAD TEST'S READ (HOUSEHOLD.md section 5; D113; EXPLORATORY): HOUSE (design A, one plan for the whole household)
 * against K2 (the couples' default) on audit-household.mjs's 28 units, by the rule committed before any launch. The gate
 * first (fair-gate.mjs on the units' logs; one code, audit, seed, size and candidate; each unit's arms whole, timed and
 * recorded), then THE IDENTITY (each unit's K2 arrays equal JOINT-WIDE's K2 arrays byte for byte, or STOP), then the rule:
 *   1. pooled survival over the 28 units, HOUSE less K2, paired by path (stats.mjs pooledSummed);
 *   2. by unit: a unit whose interval (stats.mjs survivalChangeU) lies wholly below -0.3 points is lost beyond the bar;
 *   3. pooled spending delivered, as a percentage of K2's, with its paired standard error;
 *   4. the time: HOUSE over K2, the solve and the CPU a path (the median over the units whose two arms ran in one process).
 * A LEAD: pooled survival's interval wholly above 0, or its interval reaching 0 or above and pooled spending's wholly above
 * 0; and no unit where design A is nearest exact lost beyond the bar. NO LEAD otherwise. Nearest exact: at most one plan
 * year in which the household spends with one person's pension open and the other's locked, and the first person's share of
 * the two pensions between 0.25 and 0.75 (HOUSEHOLD.md section 2's two biases, recorded by the audit for each unit). Beside the
 * rule, deciding nothing: each group, each unit, the forecasts, the times, the replay along K2's path, and where a biased
 * unit's lost paths fail against its locked years.
 *   node research/solver/reduce-household.mjs [--smoke] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));

export const RULE = { unit: -0.3, exactShare: [0.25, 0.75], exactLocked: 1 }, CANDIDATE = 'af001697ce1b';
export const JOINT = { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2 };
export const ARMS = ['K2', 'HOUSE'];
export const wantOptions = arm => (arm === 'HOUSE' ? { household: 'A', topK: 3, tieJoint: 1e-4, holdPast: 2 } : { shareRule: 'pots', tieJoint: 1e-4, tieLook: true, holdPast: 2, topK: 2 });
export const orderOf = k => (k % 2 ? ['HOUSE', 'K2'] : ['K2', 'HOUSE']);
const Z = 1.959963984540054;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, unmet: Float64Array };
export const armOf = x => ({ ...x, raw: x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0, n = 0; for (const x of a) { s += x; n++; } return n ? s / n : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const sdOf = (a, m) => { let s = 0, n = 0; for (const x of a) { s += (x - m) ** 2; n++; } return n > 1 ? Math.sqrt(s / (n - 1)) : 0; };
const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const js = x => JSON.stringify(x);
export const exactOf = U => U.bias.lockedYears <= RULE.exactLocked && U.bias.penShareSelf >= RULE.exactShare[0] && U.bias.penShareSelf <= RULE.exactShare[1];

/* the gate over the units (each with its arms decoded), against the design's units: every problem */
export function gate(units, ids, audit, size = { N: 4000, seed: 7002, pts: 45 }, partial = false) {
  const P = [], missing = partial ? [] : ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate (${CANDIDATE})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const k = ids.indexOf(U.id);
    if (k < 0) { P.push(`${U.id}: not in the design`); continue; }
    if (U.k !== k || js(U.order) !== js(orderOf(k))) P.push(`${U.id}: unit ${U.k} with the arms in the order ${js(U.order)}, not unit ${k}'s ${js(orderOf(k))}`);
    const d = U.digests || {};
    if (!d.before || ['self', 'part', 'household'].some(w => !d.before[w] || d.before[w] !== d.after[w])) P.push(`${U.id}: a table changed between the first arm and the last`);
    if (!(U.cap > 0) || !(U.houseCap > 0)) P.push(`${U.id}: no cap recorded`);
    if (U.shareRule !== 'pots' || js(U.joint) !== js(JOINT) || U.topK !== 3) P.push(`${U.id}: the joint move ${js(U.joint)} on ${U.shareRule}, the household's top ${U.topK}`);
    if (!U.bias || !Number.isInteger(U.bias.lockedYears) || !Array.isArray(U.bias.lockedAt) || !(U.bias.penShareSelf >= 0 && U.bias.penShareSelf <= 1)) P.push(`${U.id}: no biases recorded`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const key of Object.keys(KEYS)) if (!x[key] || x[key].length !== U.N) P.push(`${U.id} ${a}: ${key} not one a path`);
      if (js(x.options) !== js(wantOptions(a))) P.push(`${U.id} ${a}: the options read back ${js(x.options)}, not ${js(wantOptions(a))}`);
      if (!(x.cpuUs > 0) || x.place !== U.order.indexOf(a) || !(x.solveSecs > 0) || !(x.forecast >= 0 && x.forecast <= 1)) P.push(`${U.id} ${a}: no time, no solve time or no forecast, or not timed in its place`);
      const ch = x.chunks || [];
      if (!ch.length || ch[0].from !== 0 || ch[ch.length - 1].to !== U.N || ch.some((c, i) => i > 0 && c.from !== ch[i - 1].to) || ch.some(c => !c.proc || !c.cpu)) P.push(`${U.id} ${a}: its chunks do not cover its paths in order, each with its process and CPU`);
      else if (Math.abs(ch.reduce((t, c) => t + c.cpuUs, 0) - x.cpuUs) > 0.5) P.push(`${U.id} ${a}: its time is not its chunks' sum`);
    }
    if (!U.along || !(U.along.decisions > 0)) P.push(`${U.id}: no replay`);
  }
  return P;
}
/* THE IDENTITY: each unit's K2 against JOINT-WIDE's K2 (its unit file's arms.K2), every array byte for byte */
export function identity(units, jwOf) {
  const P = [];
  for (const U of units) {
    const J = jwOf(U.id);
    if (!J) { P.push(`${U.id}: no JOINT-WIDE unit to hold K2 to`); continue; }
    if (J.seed !== U.seed || J.N !== U.N || J.pts !== U.pts) { P.push(`${U.id}: JOINT-WIDE's unit is another size`); continue; }
    const differ = Object.keys(KEYS).filter(k => J.arms.K2[k] !== U.arms.K2.raw[k]);
    if (differ.length) P.push(`${U.id}: K2's ${differ.join(', ')} differ from JOINT-WIDE's`);
  }
  return P;
}
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
export function spendOf(pairs) {
  let D = 0, B = 0, V = 0;
  const by = pairs.map(([b, x]) => {
    const n = b.delivered.length, d = Array.from(b.delivered, (y, i) => x.delivered[i] - y), dm = mean(d), s = sdOf(d, dm), Bu = sum(b.delivered), Du = dm * n, Vu = n * s * s;
    D += Du; B += Bu; V += Vu;
    const p = 100 * Du / Bu, se = 100 * Math.sqrt(Vu) / Bu;
    return { d: p, se, lo: p - Z * se, hi: p + Z * se };
  });
  const p = 100 * D / B, se = 100 * Math.sqrt(V) / B;
  return { pooled: { d: p, se, lo: p - Z * se, hi: p + Z * se }, by };
}
/* the typical path's pot: each path's own change in percent where both arms leave a pot, averaged */
function typicalPot(b, x) {
  const v = [];
  for (let i = 0; i < b.pot.length; i++) if (b.pot[i] > 0 && x.pot[i] > 0) v.push(100 * (x.pot[i] / b.pot[i] - 1));
  const m = v.length ? mean(v) : 0, se = v.length > 1 ? sdOf(v, m) / Math.sqrt(v.length) : 0;
  return { d: m, se, lo: m - Z * se, hi: m + Z * se };
}
/* where a unit's paths lost under HOUSE (K2 keeps them) fail: within the locked years, or not */
function lostWhere(U, b, x) {
  const set = new Set(U.bias.lockedAt), out = { lost: 0, inLocked: 0, years: {} };
  for (let i = 0; i < b.survived.length; i++) if (b.survived[i] && !x.survived[i]) { out.lost++; const y = x.failYear[i]; if (set.has(y)) out.inLocked++; out.years[y] = (out.years[y] || 0) + 1; }
  return out;
}
/* the rule, and everything beside it */
export function rule(units) {
  const sp = spendOf(units.map(U => [U.arms.K2, U.arms.HOUSE]));
  const H = units.map((U, i) => {
    const b = U.arms.K2, x = U.arms.HOUSE, c = cells(b, x), ch = survivalChangeU(c.a, c.lost, c.saved, c.d), procs = new Set(ARMS.flatMap(a => (U.arms[a].chunks || []).map(k => k.proc)));
    const surv = A => 100 * sum(A.survived) / A.survived.length;
    return { id: U.id, group: U.group, exact: exactOf(U), bias: U.bias, cells: c, ch, spend: sp.by[i], typical: typicalPot(b, x), tax: [mean(b.tax), mean(x.tax)],
      surv: [surv(b), surv(x)], forecast: [100 * b.forecast, 100 * x.forecast], solve: [b.solveSecs, x.solveSecs], path: [b.cpuUs / 1e3 / U.N, x.cpuUs / 1e3 / U.N], slower: x.cpuUs / b.cpuUs, oneProc: procs.size === 1, along: U.along, lostWhere: lostWhere(U, b, x) };
  });
  const pooled = pooledSummed(H.map(h => h.cells)), spend = sp.pooled;
  const exactLost = H.filter(h => h.exact && h.ch.hi < RULE.unit), anyLost = H.filter(h => h.ch.hi < RULE.unit);
  const gain = pooled.lo > 0 ? 'SURVIVAL' : pooled.hi >= 0 && spend.lo > 0 ? 'SPENDING' : null;
  const verdict = gain && !exactLost.length ? `A LEAD (${gain})` : 'NO LEAD';
  const clean = H.filter(h => h.oneProc);
  return { H, pooled, spend, gain, exactLost, anyLost, verdict, slowerMedian: clean.length ? median(clean.map(h => h.slower)) : NaN, slowerClean: clean.length, slowerAll: median(H.map(h => h.slower)),
    solveRatio: median(H.map(h => h.solve[1] / h.solve[0])) };
}

/* the planted checks: synthetic units the read must read as the rule says */
function planted() {
  const n = 1000, ids = ['A1', 'A2', 'A3', 'A4'], checks = [];
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const armWith = (surv, deliv = 100) => {
    const A = Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, new T(n)]));
    for (let i = 0; i < n; i++) { A.survived[i] = surv(i) ? 1 : 0; A.failYear[i] = surv(i) ? -1 : 5; A.pot[i] = 100; A.estate[i] = 100; A.tax[i] = 10; A.delivered[i] = typeof deliv === 'function' ? deliv(i) : deliv; A.unmet[i] = 0; }
    return Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)]));
  };
  const unitOf = (id, k, base, house, bias = { lockedYears: 0, lockedAt: [], penShareSelf: 0.6 }) => {
    const ch = [{ from: 0, to: n, cpuUs: 1e6, wallMs: 1, cpu: 'x', proc: 'p' }];
    const arm = (A, a, f) => ({ options: wantOptions(a), cpuUs: f * 1e6, chunks: [{ ...ch[0], cpuUs: f * 1e6 }], place: orderOf(k).indexOf(a), solveSecs: 10 * f, forecast: 0.9, ...A });
    return { id, k, order: orderOf(k), group: 'g', N: n, seed: 7002, pts: 45, candidate: CANDIDATE, stamp: { code: 'c', audit: 'a' }, digests: { before: { self: 's', part: 'p', household: 'h' }, after: { self: 's', part: 'p', household: 'h' } }, cap: 1, houseCap: 1, shareRule: 'pots', joint: JOINT, topK: 3, bias, along: { decisions: 1 },
      arms: { K2: armOf(arm(base, 'K2', 1)), HOUSE: armOf(arm(house, 'HOUSE', 0.5)) } };
  };
  // fewer: 25 paths of 1,000 lost (2.5 points, beyond the bar), against three units each saving 50: the pool still gains
  const base = armWith(i => i % 10 !== 0), more = armWith(i => i % 10 !== 0 || i % 20 === 0), fewer = armWith(i => i % 10 !== 0 && i % 40 !== 1);
  const gainUnits = ids.map((id, k) => unitOf(id, k, base, more));
  const r1 = rule(gainUnits);
  checks.push(['a survival gain on every unit reads A LEAD (SURVIVAL)', r1.verdict === 'A LEAD (SURVIVAL)', r1.verdict]);
  const r2 = rule([...gainUnits.slice(0, 3), unitOf('A4', 3, base, fewer)]);
  checks.push(['the pool gaining with a nearest-exact unit lost beyond the bar reads NO LEAD', r2.verdict === 'NO LEAD' && r2.exactLost.length === 1 && r2.pooled.lo > 0, `${r2.verdict}; ${r2.exactLost.map(h => h.id).join(',')}; pooled from ${r2.pooled.lo.toFixed(3)}`]);
  const r3 = rule([...gainUnits.slice(0, 3), unitOf('A4', 3, base, fewer, { lockedYears: 2, lockedAt: [4, 5], penShareSelf: 0.6 })]);
  checks.push(['a biased unit lost beyond the bar, the pool gaining, reads A LEAD, its losses placed in its locked years', r3.verdict === 'A LEAD (SURVIVAL)' && r3.anyLost.length === 1 && r3.H[3].lostWhere.inLocked === r3.H[3].lostWhere.lost && r3.H[3].lostWhere.lost > 0, `${r3.verdict}; in the locked years ${r3.H[3].lostWhere.inLocked} of ${r3.H[3].lostWhere.lost}`]);
  const spendUp = armWith(i => i % 10 !== 0, i => 100 + (i % 3)), r4 = rule(ids.map((id, k) => unitOf(id, k, base, spendUp)));
  checks.push(['survival level and spending up reads A LEAD (SPENDING)', r4.verdict === 'A LEAD (SPENDING)', r4.verdict]);
  const r5 = rule(ids.map((id, k) => unitOf(id, k, base, base)));
  checks.push(['nothing changed reads NO LEAD', r5.verdict === 'NO LEAD', r5.verdict]);
  checks.push(['the gate takes the planted units and refuses one missing', gate(gainUnits, ids, 'a', null).length === 0 && gate(gainUnits.slice(1), ids, 'a', null).some(p => /missing/.test(p))]);
  const jw = id => ({ seed: 7002, N: n, pts: 45, arms: { K2: base } }), jwOff = id => ({ seed: 7002, N: n, pts: 45, arms: { K2: id === 'A2' ? more : base } });
  checks.push(['THE IDENTITY holds on K2 as JOINT-WIDE\'s, and fails where one unit\'s K2 differs', identity(gainUnits, jw).length === 0 && identity(gainUnits, jwOff).length === 1]);
  checks.push(['the time: the household arm planted at half K2\'s CPU reads x0.50', Math.abs(r1.slowerMedian - 0.5) < 1e-9, `x${r1.slowerMedian}`]);
  let bad = 0;
  for (const [label, ok, detail] of checks) { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`); }
  console.log(bad ? `PLANTED: ${bad} of ${checks.length} FAILED` : `PLANTED: ALL PASS (${checks.length})`);
  return bad;
}

const f2 = x => (x >= 0 ? '+' : '') + x.toFixed(2), f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--planted')) process.exit(planted() ? 1 : 0);
  const { UNITS, stampFilesHash } = await import('./audit-household.mjs');
  const DIR = process.env.HH_OUT || join(HERE, 'results', 'household-7002'), JW = join(HERE, 'results', 'joint-wide-7002'), smoke = args.includes('--smoke');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)) : [];
  if (!files.length) { console.error(`reduce-household: no units in ${DIR}`); process.exit(2); }
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
    requireFairLogs(logs, 'none', { blob: () => '-' });
  }
  const units = files.map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) U.arms[a] = armOf(U.arms[a]); return U; });
  // a smoke reads the units it ran, each against its place in the design
  const ids = UNITS.map(u => u.id), problems = gate(units, ids, stampFilesHash(), smoke ? null : undefined, smoke);
  console.log(`ONE PLAN FOR THE WHOLE HOUSEHOLD, THE LEAD TEST (EXPLORATORY; HOUSEHOLD.md section 5): ${units.length} units, seed ${units[0].seed}, ${units[0].N} paths, ${units[0].pts} points; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
  if (problems.length) { console.log(`THE GATE: REFUSED\n  ${problems.join('\n  ')}`); process.exit(3); }
  console.log('THE GATE: fair');
  if (smoke) { console.log('a smoke: the gate read, no figure printed'); process.exit(0); }
  const jwOf = id => { const f = join(JW, `${id}.json.gz`); return existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };
  const idp = identity(units, jwOf);
  if (idp.length) { console.log(`THE IDENTITY: STOP\n  ${idp.join('\n  ')}`); process.exit(4); }
  console.log(`THE IDENTITY: each unit's K2 equals JOINT-WIDE's K2, all seven arrays byte for byte, on ${units.length} units`);
  units.sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
  const R = rule(units);
  console.log('\nTHE RULE, HOUSE less K2:');
  console.log(`  1. pooled survival ${f3(R.pooled.d)} points (${f3(R.pooled.lo)} to ${f3(R.pooled.hi)})`);
  console.log(`  2. units lost beyond the bar (interval wholly below ${RULE.unit}): ${R.anyLost.map(h => `${h.id}${h.exact ? ' (nearest exact)' : ''} ${f3(h.ch.d)} (${f3(h.ch.lo)} to ${f3(h.ch.hi)})`).join('; ') || 'none'}; nearest exact among them: ${R.exactLost.length}`);
  console.log(`  3. pooled spending delivered ${f3(R.spend.d)}% (${f3(R.spend.lo)} to ${f3(R.spend.hi)})`);
  console.log(`  4. the time, HOUSE over K2: the solve x${R.solveRatio.toFixed(2)} (the median over the units); the CPU a path x${R.slowerMedian.toFixed(2)} (the median over the ${R.slowerClean} units whose two arms ran in one process; over all x${R.slowerAll.toFixed(2)})`);
  console.log(`OUTCOME: ${R.verdict}`);
  console.log('\nBESIDE THE RULE, deciding nothing:');
  for (const g of ['younger', 'library', '90/10', 'feature']) {
    const hs = R.H.filter(h => h.group === g); if (!hs.length) continue;
    const p = pooledSummed(hs.map(h => h.cells)), s = spendOf(units.filter(U => U.group === g).map(U => [U.arms.K2, U.arms.HOUSE])).pooled;
    console.log(`  ${g.padEnd(8)} (${hs.length}): survival ${f3(p.d)} (${f3(p.lo)} to ${f3(p.hi)}); spending ${f3(s.d)}% (${f3(s.lo)} to ${f3(s.hi)})`);
  }
  const ex = R.H.filter(h => h.exact), pe = ex.length ? pooledSummed(ex.map(h => h.cells)) : null;
  if (pe) console.log(`  the ${ex.length} nearest exact (${ex.map(h => h.id).join(', ')}): survival ${f3(pe.d)} (${f3(pe.lo)} to ${f3(pe.hi)})`);
  console.log('  by unit: survival K2 / HOUSE (%), the change (interval; saved/lost), spending %, the typical pot %, lifetime tax K2 / HOUSE, the forecast K2 / HOUSE (%), the solve K2 / HOUSE (s), CPU a path K2 / HOUSE (ms), design A\'s biases, the replay along K2\'s path');
  for (const h of R.H) console.log(`    ${h.id.padEnd(12)} ${h.group.padEnd(8)} ${h.surv[0].toFixed(2)} / ${h.surv[1].toFixed(2)}; ${f3(h.ch.d)} (${f3(h.ch.lo)} to ${f3(h.ch.hi)}; ${h.cells.saved}/${h.cells.lost}); ${f3(h.spend.d)}%; ${f2(h.typical.d)}%; £${Math.round(h.tax[0]).toLocaleString('en-GB')} / £${Math.round(h.tax[1]).toLocaleString('en-GB')}; ${h.forecast[0].toFixed(1)} / ${h.forecast[1].toFixed(1)}; ${h.solve[0].toFixed(0)} / ${h.solve[1].toFixed(0)}; ${h.path[0].toFixed(1)} / ${h.path[1].toFixed(1)}; locked ${h.bias.lockedYears}, pension share ${h.bias.penShareSelf.toFixed(2)}${h.exact ? ' (nearest exact)' : ''}; differs ${h.along.differ} of ${h.along.decisions} (level ${h.along.level}: up ${h.along.higher}, down ${h.along.lower}; split ${h.along.split}; tiers ${h.along.tiers})${h.lostWhere.lost && h.bias.lockedYears ? `; of its ${h.lostWhere.lost} lost paths ${h.lostWhere.inLocked} fail in its locked years` : ''}`);
}
