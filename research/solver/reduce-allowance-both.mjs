/*
 * THE ALLOWANCE'S STEP AT BOTH PLACES, READ (ALLOWANCE-BOTH.md, its rule committed before launch; D98; EXPLORATORY, seed 7002).
 * Reads audit-allowance-both.mjs's units once: the gate (every household in every arm; one code, audit, seed, count of paths
 * and points; each arm's menu as named, BOTH's half as long again as NOW's and RAWPA's NOW's; RAWPA's allowance read back as
 * given, NOW's and BOTH's adjusted; every arm on the household's plan), then the rule, BOTH against NOW, and the figures
 * beside it.
 *   node research/solver/reduce-allowance-both.mjs [dir] [--smoke]      node research/solver/reduce-allowance-both.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pairOf } from './reduce-isasweep.mjs';
import { wholeScore, byPath } from './reduce-phase4.mjs';
import { zFor } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooledLo: -0.1, household: -0.3, spend: -0.05, pot: -0.5, capped: -0.1 };
export const ARMS = ['NOW', 'BOTH', 'RAWPA'];
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => { if (typeof b64 !== 'string') return b64; const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const TYPES = { survived: Uint8Array, failYear: Int16Array, delivered: Float64Array, target: Float64Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, level: Uint8Array };
export const armOf = a => ({ ...a, ...Object.fromEntries(Object.entries(TYPES).map(([k, T]) => [k, arr(a[k], T)])) });
const mean = a => { let s = 0; for (let k = 0; k < a.length; k++) s += a[k]; return s / a.length; };
const capMean = (x, cap) => { let s = 0; for (let k = 0; k < x.length; k++) s += Math.min(x[k], cap); return s / x.length; };
const del = x => { let d = 0, t = 0; for (let k = 0; k < x.delivered.length; k++) { d += x.delivered[k]; t += x.target[k]; } return (100 * d) / Math.max(1e-9, t); };

/* one comparison, B against A, over the units (each { id, cap, W, arms }): the rule's five parts and the figures beside */
export function compare(units, a, b) {
  const H = units.map(u => {
    const A = u.arms[a], B = u.arms[b], p = pairOf(A.survived, B.survived);
    const below = k => A.pot[k] <= u.cap && B.pot[k] <= u.cap;
    let tA = 0, tB = 0, nb = 0; for (let k = 0; k < A.tax.length; k++) if (below(k)) { tA += A.tax[k]; tB += B.tax[k]; nb++; }
    return { id: u.id, p, potA: mean(A.pot), potB: mean(B.pot), capA: capMean(A.pot, u.cap), capB: capMean(B.pot, u.cap), delA: del(A), delB: del(B), taxA: mean(A.tax), taxB: mean(B.tax),
      taxBelowA: nb ? tA / nb : NaN, taxBelowB: nb ? tB / nb : NaN, nBelow: nb, sA: p.sG, sB: p.sI, secsA: A.solveSecs, secsB: B.solveSecs, menuA: A.menu, menuB: B.menu, seenB: B.seen };
  });
  const k = H.length, z = zFor(0.05), avg = g => H.reduce((s, h) => s + g(h), 0) / k;
  const pooled = avg(h => h.p.d), se = Math.sqrt(H.reduce((s, h) => s + h.p.v, 0)) / k, lo = pooled - z * se, hi = pooled + z * se;
  const harmed = H.filter(h => h.p.hi < RULE.household);
  const spend = avg(h => h.delB - h.delA), pot = 100 * (avg(h => h.potB) / Math.max(1e-9, avg(h => h.potA)) - 1), capped = 100 * (avg(h => h.capB) / Math.max(1e-9, avg(h => h.capA)) - 1);
  // the whole score, path by path over the households (reduce-phase4.mjs wholeScore and byPath), at each arm's own inputs
  const n = units[0].arms[a].survived.length;
  const score = byPath(units.map(u => { const sa = wholeScore(u.arms[a], u.arms[a].Y, u.W, u.arms[a].score), sb = wholeScore(u.arms[b], u.arms[b].Y, u.W, u.arms[b].score); return i => sb[i] - sa[i]; }), n);
  const part1 = lo > RULE.pooledLo, part2 = harmed.length === 0, part3 = spend >= RULE.spend, part4 = pot >= RULE.pot && capped >= RULE.capped, part5 = score.lo > 0 || lo > 0;
  return { a, b, H, pooled, se, lo, hi, harmed, spend, pot, capped, score, part1, part2, part3, part4, part5, holds: part1 && part2 && part3 && part4 };
}
export const verdictOf = R => (!R.holds ? 'FAILS' : R.part5 ? 'PASSES' : 'NO GAIN');

/* the gate: refusals, each a line */
export function gate(raw, ids, audit, size = { N: 16000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !raw.some(u => u.id === id));
  if (missing.length) P.push(`households missing: ${missing.join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && raw.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of raw) {
    const missingArm = ARMS.filter(a => !U.arms || !U.arms[a]);
    if (missingArm.length) { P.push(`${U.id}: arm ${missingArm.join(', ')} missing`); continue; }
    for (const a of ARMS) {
      const x = U.arms[a];
      if (x.inputs !== U.inputs) P.push(`${U.id} ${a}: not on the household's plan`);
      for (const k of Object.keys(TYPES)) if (arr(x[k], TYPES[k]).length !== (k === 'level' ? U.N * x.Y : U.N)) P.push(`${U.id} ${a}: ${k} not one a path`);
    }
    const { NOW, BOTH, RAWPA } = U.arms;
    if (JSON.stringify(NOW.menuPlus) !== '["hr"]' || JSON.stringify(RAWPA.menuPlus) !== '["hr"]' || JSON.stringify(BOTH.menuPlus) !== '["hr","paraw"]') P.push(`${U.id}: an arm's menu is not as named`);
    if (2 * BOTH.menu !== 3 * NOW.menu || RAWPA.menu !== NOW.menu) P.push(`${U.id}: the menus' sizes ${NOW.menu}, ${BOTH.menu} and ${RAWPA.menu}, not NOW's, half as long again and NOW's`);
    if (!(RAWPA.probe.pa === RAWPA.probe.rawPa) || !(NOW.probe.pa < NOW.probe.rawPa) || !(BOTH.probe.pa < BOTH.probe.rawPa) || NOW.probe.pa !== BOTH.probe.pa) P.push(`${U.id}: an arm's pensionCeiling is not as named (RAWPA the allowance as given; NOW and BOTH adjusted)`);
    if (NOW.rest !== BOTH.rest || NOW.rest !== RAWPA.rest) P.push(`${U.id}: the arms' settings differ`);
    if (NOW.Y !== BOTH.Y || NOW.Y !== RAWPA.Y) P.push(`${U.id}: the arms' horizons differ`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (what, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
  const N = 4000, Y = 3;
  const mk = (surv, extra = {}) => ({ survived: Uint8Array.from(surv), failYear: Int16Array.from(surv, s => (s ? -1 : 1)), delivered: new Float64Array(N).fill(100), target: new Float64Array(N).fill(100),
    pot: new Float64Array(N).fill(1000), estate: new Float64Array(N).fill(1000), tax: new Float64Array(N).fill(10), level: new Uint8Array(N * Y).fill(100), Y, solveSecs: 1, menu: 40, seen: { years: 0, lead: 0, wrap: 0 },
    score: { lambda: 0.02236, floor: 0.8, scale: 1000, cap: 4000 }, ...extra });
  const base = Array.from({ length: N }, (_, i) => (i % 10 ? 1 : 0));
  const flip = (s, nSave, nLose) => { const o = s.slice(); let a = nSave, b = nLose; for (let i = 0; i < N && (a || b); i++) { if (!o[i] && a) { o[i] = 1; a--; } else if (o[i] && b && i % 7 === 3) { o[i] = 0; b--; } } return o; };
  const unit = (id, B, A = mk(base)) => ({ id, cap: 4000, W: 0.02, arms: { NOW: A, BOTH: B } });
  // no change anywhere: holds 1 to 4, no gain
  const same = [1, 2, 3].map(k => unit(`U${k}`, mk(base)));
  check('the same arms: NO GAIN', verdictOf(compare(same, 'NOW', 'BOTH')) === 'NO GAIN');
  // survival up beyond noise on every unit: PASSES
  const up = [1, 2, 3].map(k => unit(`U${k}`, mk(flip(base, 60, 0))));
  check('survival up beyond noise: PASSES', verdictOf(compare(up, 'NOW', 'BOTH')) === 'PASSES');
  // the whole score up through the estate alone (survival the same): PASSES
  const est = [1, 2, 3].map(k => unit(`U${k}`, mk(base, { estate: new Float64Array(N).fill(1300) })));
  const E1 = compare(est, 'NOW', 'BOTH');
  check(`the estate up, survival the same: the whole score beyond noise (${f(E1.score.d)}): PASSES`, verdictOf(E1) === 'PASSES' && Math.abs(E1.pooled) < 1e-9);
  // one unit losing beyond the household bar: FAILS on part 2
  const lose = [unit('U1', mk(flip(base, 0, 60))), unit('U2', mk(flip(base, 30, 0))), unit('U3', mk(flip(base, 30, 0)))];
  const L = compare(lose, 'NOW', 'BOTH');
  check(`a unit wholly below -0.3: FAILS (part 2 ${L.part2})`, verdictOf(L) === 'FAILS' && !L.part2);
  // spending lower by more than the bar: FAILS on part 3
  const sp = [1, 2, 3].map(k => unit(`U${k}`, mk(flip(base, 60, 0), { delivered: new Float64Array(N).fill(99.9) })));
  const S = compare(sp, 'NOW', 'BOTH');
  check(`spending lower by 0.1 points of target: FAILS (part 3 ${S.part3})`, verdictOf(S) === 'FAILS' && !S.part3);
  // the capped pot lower by more than its bar, the mean pot within its own: FAILS on part 4
  // (NOW's pot £5,000 on every path, over the £4,000 cap; BOTH's £3,000 and £7,000 in turn: the same mean, the capped mean 12.5% lower)
  const cp = [1, 2, 3].map(k => unit(`U${k}`, mk(flip(base, 60, 0), { pot: Float64Array.from({ length: N }, (_, i) => (i % 2 ? 3000 : 7000)) }), mk(base, { pot: new Float64Array(N).fill(5000) })));
  const C = compare(cp, 'NOW', 'BOTH');
  check(`the capped pot lower, the mean pot the same: FAILS (part 4 ${C.part4}; the pot ${f(C.pot)}%, the capped pot ${f(C.capped)}%)`, verdictOf(C) === 'FAILS' && !C.part4 && Math.abs(C.pot) < 1e-9);
  // the gate
  const g = (id, arms) => ({ id, seed: 7002, N: 16000, pts: 45, inputs: 'p', stamp: { code: 'c', audit: 'a' }, arms });
  const arm = (menuPlus, menu, pa, extra = {}) => ({ menuPlus, menu, probe: { pa, rawPa: 12570 }, inputs: 'p', rest: 'r', Y: 3, ...Object.fromEntries(Object.entries(TYPES).map(([k, T]) => [k, new T(k === 'level' ? 16000 * 3 : 16000)])), ...extra });
  const good = g('S1', { NOW: arm(['hr'], 40, 4000), BOTH: arm(['hr', 'paraw'], 60, 4000), RAWPA: arm(['hr'], 40, 12570) });
  check('the gate passes a fair unit', gate([good], ['S1'], 'a').length === 0);
  const P1 = gate([g('S1', { ...good.arms, BOTH: arm(['hr'], 40, 4000) })], ['S1'], 'a');
  check(`the gate refuses BOTH without 'paraw' (${P1.length} refusals)`, P1.some(x => /menu/.test(x)));
  const P2 = gate([g('S1', { ...good.arms, RAWPA: arm(['hr'], 40, 4000) })], ['S1'], 'a');
  check('the gate refuses a RAWPA whose allowance is adjusted', P2.some(x => /pensionCeiling/.test(x)));
  const P3 = gate([g('S1', { ...good.arms, BOTH: arm(['hr', 'paraw'], 60, 4000, { rest: 'other' }) })], ['S1'], 'a');
  check("the gate refuses arms whose settings differ", P3.some(x => /settings/.test(x)));
  const P4 = gate([good, { ...good, id: 'S2', stamp: { code: 'd', audit: 'a' } }], ['S1', 'S2', 'S3'], 'a');
  check('the gate refuses a missing household and a second code', P4.some(x => /missing: S3/.test(x)) && P4.some(x => /more than one code/.test(x)));
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) { const bad = planted(); console.log(bad ? `PLANTED CHECKS: ${bad} FAILED` : 'all planted checks pass'); process.exit(bad ? 1 : 0); }
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'allowance-both-7002');
  const { HOUSEHOLDS, stampFilesHash } = await import('./audit-allowance-both.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const ids = smoke ? raw.map(u => u.id) : HOUSEHOLDS;
  const P = gate(raw, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`ALLOWANCE-BOTH GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const units = ids.map(id => raw.find(u => u.id === id)).map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const u0 = units[0], gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, iv = (d, lo, hi) => `${f(d)} (${f(lo)} to ${f(hi)})`;
  console.log(`THE ALLOWANCE'S STEP AT BOTH PLACES (EXPLORATORY; ALLOWANCE-BOTH.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${units.length} households, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, the candidate ${u0.candidate}; the gate: fair (every household in every arm; one code, audit, seed, count of paths and points; each arm's menu and engine as named; one plan and one setting across the arms)`);
  const say = (R, label) => {
    console.log(`\n${label}, ${R.b} against ${R.a}, paired on the same paths:`);
    console.log(`  1. pooled survival ${iv(R.pooled, R.lo, R.hi)} points; its lower end above ${RULE.pooledLo}: ${R.part1 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  2. no household wholly below ${RULE.household}: ${R.harmed.length ? R.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${R.part2 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  3. pooled spending delivered ${f(R.spend, 4)} points of target; not lower by more than ${-RULE.spend}: ${R.part3 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  4. pooled mean pot left ${f(R.pot)}% (not lower by more than ${-RULE.pot}%), the capped pot ${f(R.capped)}% (not lower by more than ${-RULE.capped}%): ${R.part4 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  5. a gain: the pooled whole score ${iv(R.score.d, R.score.lo, R.score.hi)} points, or pooled survival's lower end above nought: ${R.part5 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  by household (survival ${R.a} / ${R.b}; the change; spending delivered; the mean pot; the capped pot; lifetime tax, over all paths and over those at or below the cap in both; the solve's seconds and the menu's size):`);
    for (const h of R.H) console.log(`    ${h.id.padEnd(6)} ${h.sA.toFixed(2)}% / ${h.sB.toFixed(2)}%, ${iv(h.p.d, h.p.lo, h.p.hi)}; spending ${h.delA.toFixed(3)} / ${h.delB.toFixed(3)}; pot ${gbp(h.potA)} / ${gbp(h.potB)}; capped ${gbp(h.capA)} / ${gbp(h.capB)}; tax ${gbp(h.taxA)} / ${gbp(h.taxB)}, at or below the cap ${gbp(h.taxBelowA)} / ${gbp(h.taxBelowB)} (${h.nBelow} paths); solve ${h.secsA.toFixed(0)} s / ${h.secsB.toFixed(0)} s, ${h.menuA} / ${h.menuB} moves${h.seenB && h.seenB.years ? `; ${R.b} over its first 200 paths: ${h.seenB.years} decision-years, drawing first through penPAr in ${h.seenB.lead}, re-wrapping to 'paraw' in ${h.seenB.wrap}` : ''}`);
  };
  const R = compare(units, 'NOW', 'BOTH');
  say(R, 'THE RULE');
  const taxAll = (r, side) => r.H.reduce((s, h) => s + h[side], 0) / r.H.length;
  console.log(`  beside the rule: pooled lifetime tax ${gbp(taxAll(R, 'taxA'))} / ${gbp(taxAll(R, 'taxB'))}; the solve's seconds, BOTH over NOW, the median over households x${[...R.H.map(h => h.secsB / h.secsA)].sort((x, y) => x - y)[Math.floor(R.H.length / 2)].toFixed(2)}`);
  say(compare(units, 'NOW', 'RAWPA'), 'BESIDE THE RULE, deciding nothing');
  say(compare(units, 'RAWPA', 'BOTH'), 'BESIDE THE RULE, deciding nothing');
  console.log(`\nALLOWANCE-BOTH OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${verdictOf(R)}${verdictOf(R) === 'FAILS' ? ` (${['part1', 'part2', 'part3', 'part4'].filter(k => !R[k]).map(k => k.slice(4)).join(', ')})` : ''}`);
}
