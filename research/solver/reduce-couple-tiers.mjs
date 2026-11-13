/*
 * THE COUPLES' TIER TEST, READ (COUPLE-TIERS.md, its rule committed before launch; the deep review of the couples' read, 13
 * Nov; EXPLORATORY, seed 7002). Reads audit-couple-tiers.mjs's units once: the gate (one code, audit, seed, count of
 * paths and points; every arm's arrays one a path; CANDC with more than one tier pair a person; CANDCNC with exactly one
 * and no tier step held in any year), then the rule's three parts and the figures beside it.
 *   node research/solver/reduce-couple-tiers.mjs [dir] [--smoke]      node research/solver/reduce-couple-tiers.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { tiers: 0.85, not: 0.65 }, ARMS = ['APP', 'CANDC', 'CANDCNC'], Z = 1.959963984540054;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const armOf = x => ({ ...x, survived: dec(x.survived, Uint8Array), failYear: dec(x.failYear, Int16Array), pot: dec(x.pot, Float64Array), tax: dec(x.tax, Float64Array), taxAbove: dec(x.taxAbove, Float64Array), delivered: dec(x.delivered, Float64Array) });
const median = a => { const s = Array.from(a).sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const sum = o => Object.values(o || {}).reduce((s, x) => s + x, 0);

/* the gate over the units (each with its arms decoded): every problem */
export function gate(units, ids, audit, size = { N: 4000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`couples missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && units.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of ['survived', 'failYear', 'pot', 'tax', 'taxAbove', 'delivered']) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
    }
    const A = U.arms.APP, C = U.arms.CANDC, NC = U.arms.CANDCNC;
    if (A && !/^armA /.test(A.ran || '')) P.push(`${U.id} APP: not arm A's pick (${A.ran})`);
    if (C && !(C.pairs && C.pairs.every(p => p > 1))) P.push(`${U.id} CANDC: tier pairs ${(C.pairs || []).join('/')}, not more than one a person`);
    if (NC && !(NC.pairs && NC.pairs.every(p => p === 1))) P.push(`${U.id} CANDCNC: tier pairs ${(NC.pairs || []).join('/')}, not one a person (consent withdrawn)`);
    if (NC && ['selfPen', 'selfIsa', 'partPen', 'partIsa'].some(k => (NC.tiers[k] || []).some(v => v !== 0))) P.push(`${U.id} CANDCNC: a tier step held below the plan's own`);
  }
  return P;
}
/* a ratio of two per-path means with its interval (the linearised standard error by path) */
function ratioOf(num, den) {
  const n = num.length, mn = mean(num), md = mean(den), r = mn / md;
  let v = 0; for (let i = 0; i < n; i++) v += ((num[i] - r * den[i]) / md) ** 2;
  const se = Math.sqrt(v / (n - 1) / n);
  return { m: 100 * r, lo: 100 * (r - Z * se), hi: 100 * (r + Z * se) };
}
/* the rule over the units */
export function rule(units, younger) {
  const H = units.map(U => {
    const A = U.arms.APP, C = U.arms.CANDC, NC = U.arms.CANDCNC, n = U.N;
    const all = []; for (let i = 0; i < n; i++) if (A.survived[i] && C.survived[i] && NC.survived[i]) all.push(i);
    const med = x => median(all.map(i => x.pot[i])), sv = x => 100 * mean(x.survived);
    const tiersHeld = x => { const t = x.tiers, alive = t.alive.reduce((s, v) => s + v, 0); return alive ? ['selfPen', 'selfIsa', 'partPen', 'partIsa'].map(k => t[k].reduce((s, v) => s + v, 0) / alive) : [0, 0, 0, 0]; };
    return { id: U.id, cohort: U.cohort, n, both: all.length, medA: med(A), medC: med(C), medNC: med(NC), rC: med(C) / med(A), rNC: med(NC) / med(A),
      sA: sv(A), sC: sv(C), sNC: sv(NC), taxA: mean(A.tax), taxC: mean(C.tax), taxNC: mean(NC.tax), aboveA: mean(A.taxAbove), aboveC: mean(C.taxAbove), aboveNC: mean(NC.taxAbove),
      held: tiersHeld(C), richNow: C.richFail || {}, richBefore: C.before ? C.before.richFail : null };
  });
  const Y = H.filter(h => younger.includes(h.id)), yC = mean(Y.map(h => h.rC)), yNC = mean(Y.map(h => h.rNC));
  const verdict = !Y.length ? 'NO YOUNGER COUPLE' : yC >= RULE.tiers ? 'NOT REPRODUCED' : yNC >= RULE.tiers ? 'THE TIERS ARE THE CAUSE' : yNC < RULE.not ? 'NOT THE TIERS' : 'BOTH';
  // part 2: the tiers' share of the gain, survival pooled over the couples, by path
  const n = Math.min(...units.map(U => U.N)), num = new Float64Array(n), den = new Float64Array(n);
  for (const U of units) for (let i = 0; i < n; i++) { num[i] += (U.arms.CANDC.survived[i] - U.arms.CANDCNC.survived[i]) / units.length; den[i] += (U.arms.CANDC.survived[i] - U.arms.APP.survived[i]) / units.length; }
  const share = ratioOf(num, den);
  // part 3: the bill's replay on the couples that have it: before the fix, paths failing rich in one year before the last; now, none of them
  const replay = H.filter(h => h.richBefore).map(h => {
    const U = units.find(u => u.id === h.id), last = Math.max(...Array.from(U.arms.CANDC.failYear)), byYear = Object.entries(h.richBefore).filter(([t]) => Number(t) >= 0).sort((a, b) => b[1] - a[1]);
    const top = byYear[0] || null, now = top ? (h.richNow[top[0]] || 0) : 0;
    return { id: h.id, before: sum(h.richBefore), after: sum(h.richNow), year: top ? Number(top[0]) : null, inYearBefore: top ? top[1] : 0, inYearNow: now, last };
  });
  return { H, yC, yNC, verdict, share, replay };
}
export function billVerdict(replay, ids = ['S309F', 'S311F']) {
  const R = replay.filter(r => ids.includes(r.id));
  if (R.length < ids.length) return 'NOT RUN';
  return R.every(r => r.inYearBefore > 0 && r.inYearNow === 0) ? 'THE BILL' : 'NOT SHOWN';
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 400;
  // a couple: every arm surviving all paths but APP's first 60 and CANDCNC's first 30; pots flat at pA, pC, pNC
  const unit = (id, pA, pC, pNC, o = {}) => {
    const arm = (pot, lost, extra = {}) => ({ ran: 'x', survived: Uint8Array.from({ length: N }, (_, i) => (i < lost ? 0 : 1)), failYear: new Int16Array(N).fill(-1), pot: new Float64Array(N).fill(pot), tax: new Float64Array(N).fill(100), taxAbove: new Float64Array(N).fill(10), delivered: new Float64Array(N).fill(1), tiers: { alive: [N, N], selfPen: [0, 0], selfIsa: [0, 0], partPen: [0, 0], partIsa: [0, 0] }, richFail: {}, before: null, ...extra });
    return { id, cohort: 'young', N, pts: 45, seed: 7002, stamp: { code: 'c', audit: 'a' }, arms: { APP: arm(pA, 60, { ran: 'armA X', pairs: null }), CANDC: arm(pC, 0, { pairs: [4, 4], tiers: { alive: [N, N], selfPen: [N, 2 * N], selfIsa: [N, N], partPen: [0, 0], partIsa: [0, 0] }, ...(o.C || {}) }), CANDCNC: arm(pNC, 30, { pairs: [1, 1], ...(o.NC || {}) }) } };
  };
  const ids = ['A', 'B'], V = (pC, pNC) => rule([unit('A', 100, pC, pNC), unit('B', 100, pC, pNC)], ids);
  check('a complete planted set passes the gate', gate([unit('A', 100, 50, 90), unit('B', 100, 50, 90)], ids, 'a', { N, pts: 45, seed: 7002 }).length === 0);
  check(`consent withdrawn restoring the pot (0.90 of APP's against 0.50) reads THE TIERS ARE THE CAUSE (${V(50, 90).verdict})`, V(50, 90).verdict === 'THE TIERS ARE THE CAUSE');
  check(`the edge: exactly 0.85 reads THE TIERS ARE THE CAUSE, 0.84 BOTH, 0.65 BOTH, 0.64 NOT THE TIERS (${[85, 84, 65, 64].map(x => V(50, x).verdict).join(' / ')})`, V(50, 85).verdict === 'THE TIERS ARE THE CAUSE' && V(50, 84).verdict === 'BOTH' && V(50, 65).verdict === 'BOTH' && V(50, 64).verdict === 'NOT THE TIERS');
  check(`the candidate's own pot at 0.85 of APP's or more reads NOT REPRODUCED whatever consent does (${V(90, 95).verdict})`, V(90, 95).verdict === 'NOT REPRODUCED');
  // the share: CANDC saves 60 paths over APP, CANDCNC 30 of them: half
  const s = V(50, 90).share;
  check(`the tiers' share of the gain: 30 of 60 paths, half (${s.m.toFixed(1)}%, ${s.lo.toFixed(1)} to ${s.hi.toFixed(1)})`, Math.abs(s.m - 50) < 1e-9 && s.lo < 50 && s.hi > 50);
  check('the gate refuses a CANDCNC with two tier pairs', gate([unit('A', 100, 50, 90, { NC: { pairs: [2, 1] } })], ['A'], 'a', { N, pts: 45, seed: 7002 }).some(x => /CANDCNC: tier pairs 2\/1/.test(x)));
  check('the gate refuses a CANDCNC holding a tier step', gate([unit('A', 100, 50, 90, { NC: { pairs: [1, 1], tiers: { alive: [N, N], selfPen: [0, 3], selfIsa: [0, 0], partPen: [0, 0], partIsa: [0, 0] } } })], ['A'], 'a', { N, pts: 45, seed: 7002 }).some(x => /a tier step held/.test(x)));
  check('the gate refuses a CANDC with one tier pair, a missing couple and another audit', (() => { const P = gate([unit('A', 100, 50, 90, { C: { pairs: [1, 4] } })], ['A', 'B'], 'b', { N, pts: 45, seed: 7002 }); return P.some(x => /CANDC: tier pairs 1\/4/.test(x)) && P.some(x => /couples missing: B/.test(x)) && P.some(x => /audit is not these files/.test(x)); })());
  // the bill's replay: 12 rich failures in year 23 before, none now
  const fy = (() => { const f = new Int16Array(N).fill(-1); f[0] = 40; return f; })();
  const rep = (now) => rule([unit('S309F', 100, 50, 90, { C: { pairs: [4, 4], failYear: fy, richFail: now, before: { richFail: { 23: 12, 40: 1 } } } }), unit('S311F', 100, 50, 90, { C: { pairs: [4, 4], failYear: fy, richFail: now, before: { richFail: { 23: 5 } } } })], []).replay;
  check(`the bill's replay: paths failing rich in one year before the fix and none of them now reads THE BILL (${billVerdict(rep({ 40: 1 }))}); some still there reads NOT SHOWN (${billVerdict(rep({ 23: 2 }))}); not run reads NOT RUN (${billVerdict([])})`, billVerdict(rep({ 40: 1 })) === 'THE BILL' && billVerdict(rep({ 23: 2 })) === 'NOT SHOWN' && billVerdict([]) === 'NOT RUN');
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'couple-tiers-7002');
  const { COUPLES, YOUNGER, stampFilesHash } = await import('./audit-couple-tiers.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const ids = smoke ? units.map(u => u.id) : COUPLES;
  const P = gate(units, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`COUPLE-TIERS GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = ids.map(id => units.find(u => u.id === id)), u0 = ordered[0], R = rule(ordered, YOUNGER);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 2) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
  console.log(`THE COUPLES' TIER TEST (EXPLORATORY; COUPLE-TIERS.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ids.length} couples of the panel, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, estate weight ${u0.W}; the gate: fair (one code, audit, seed, count of paths and points; CANDC with more than one tier pair a person, CANDCNC with one and no tier step held)`);
  console.log(`\nBy couple (survival APP / CANDC / CANDCNC; the median pot left on the paths all three survive, APP's, then CANDC's and CANDCNC's over it; mean lifetime tax in each, and of it the tax paid in years above the estate cap; CANDC's mean tier steps held below the plan's own, the first person's pension/ISA and the second's):`);
  for (const h of R.H) console.log(`  ${h.id.padEnd(6)} ${String(h.cohort).padEnd(5)} ${h.sA.toFixed(2)}% / ${h.sC.toFixed(2)}% / ${h.sNC.toFixed(2)}% | pot ${gbp(h.medA)} (${h.both} paths), CANDC ${h.rC.toFixed(2)}, CANDCNC ${h.rNC.toFixed(2)} | tax ${gbp(h.taxA)} / ${gbp(h.taxC)} / ${gbp(h.taxNC)}, above the cap ${gbp(h.aboveA)} / ${gbp(h.aboveC)} / ${gbp(h.aboveNC)} | tiers held ${h.held.slice(0, 2).map(x => x.toFixed(2)).join('/')} and ${h.held.slice(2).map(x => x.toFixed(2)).join('/')}`);
  console.log(`\nThe rule:`);
  console.log(`  1. the pot, the mean over the ${YOUNGER.filter(id => ids.includes(id)).length} younger couples of the median pot over APP's: CANDC ${R.yC.toFixed(3)}, CANDCNC ${R.yNC.toFixed(3)} (the tiers are the cause at ${RULE.tiers} or more, not under ${RULE.not}; not reproduced if CANDC's is ${RULE.tiers} or more): ${R.verdict}`);
  console.log(`  2. the tiers' share of the gain, (CANDC less CANDCNC) over (CANDC less APP), survival pooled over the ${ids.length}: ${R.share.m.toFixed(1)}% (${R.share.lo.toFixed(1)} to ${R.share.hi.toFixed(1)}); the singles' 47.5% (46.2 to 48.8)`);
  console.log(`  3. the bill's replay, CANDC's paths failing with more than the household opened with, the engine before the fix and this one: ${R.replay.length ? R.replay.map(r => `${r.id} ${r.before} and ${r.after}${r.year !== null ? ` (most in plan year ${r.year}: ${r.inYearBefore} and ${r.inYearNow})` : ''}`).join('; ') : 'not run'}: ${billVerdict(R.replay)}`);
  const pool = k => mean(R.H.map(h => h[k]));
  console.log(`  beside, deciding nothing: pooled mean lifetime tax APP ${gbp(pool('taxA'))}, CANDC ${gbp(pool('taxC'))}, CANDCNC ${gbp(pool('taxNC'))}; of it paid in years above the cap ${gbp(pool('aboveA'))}, ${gbp(pool('aboveC'))}, ${gbp(pool('aboveNC'))}; pooled survival ${pool('sA').toFixed(2)}%, ${pool('sC').toFixed(2)}%, ${pool('sNC').toFixed(2)}% (CANDC less APP ${f(pool('sC') - pool('sA'))} points, CANDCNC less APP ${f(pool('sNC') - pool('sA'))})`);
  console.log(`\nCOUPLE-TIERS OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: the pot: ${R.verdict}; the lost year: ${billVerdict(R.replay)}`);
}
