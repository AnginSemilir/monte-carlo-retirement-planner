/*
 * A COUPLE'S TIE RULE ABOVE THE ESTATE CAPS, STAGE A, READ (TIE-C.md, its rule committed before launch; D97 (2); EXPLORATORY,
 * seed 7002). Reads audit-tie-couple.mjs's units once: the gate (every unit in every arm; one code, audit, seed, count of paths
 * and points; the couples' candidate stage C ran; each arm's margin as named; each person's table the same before the first
 * arm and after the last), then the rule and the figures beside it.
 *   node research/solver/reduce-tie-couple.mjs [dir] [--smoke]      node research/solver/reduce-tie-couple.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooled: -0.1, unit: -0.3, spend: 0.05, capped: -0.1, cappedUnit: -0.5, pot: -0.1, near: 0.5 }, CANDIDATE = 'af001697ce1b';
export const MARGINS = { CANDS: null, TIE5: 1e-5, TIE4: 1e-4 }, ARMS = Object.keys(MARGINS), TIES = ['TIE5', 'TIE4'];
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, tax: Float64Array, delivered: Float64Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };

/* the gate over the units (each with its arms decoded), against the design's couples: every problem */
export function gate(units, ids, audit, size = { N: 8000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate stage C ran (${CANDIDATE}): ${[...new Set(units.map(u => u.candidate))].join(', ')}`);
  if (size && units.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    if (!ids.includes(U.id)) { P.push(`${U.id}: not in the design`); continue; }
    if (!U.digests || U.digests.before.self !== U.digests.after.self || U.digests.before.part !== U.digests.after.part) P.push(`${U.id}: a person's table changed between the first arm and the last`);
    if (!(U.cap > 0)) P.push(`${U.id}: no household cap recorded`);
    if (U.shareRule !== 'pots') P.push(`${U.id}: not on the pots' share`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of Object.keys(KEYS)) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      if (x.margin !== MARGINS[a] || x.metaMargin !== MARGINS[a]) P.push(`${U.id} ${a}: the margin ${x.margin} (recorded ${x.metaMargin}), not ${MARGINS[a]}`);
    }
    if (!U.replay || !(U.replay.decisions > 0) || TIES.some(a => !U.replay[a])) P.push(`${U.id}: no replay`);
  }
  return P;
}
/* the paired cells of B against A: a both survive, lost (A only), saved (B only), d neither */
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
const pct = (x, b) => 100 * (x / b - 1);
/* the rule over the units, each tie arm against CANDS */
export function rule(units) {
  const R = Object.fromEntries(TIES.map(arm => {
    const H = units.map(U => {
      const b = U.arms.CANDS, x = U.arms[arm], c = cells(b, x), ch = survivalChangeU(c.a, c.lost, c.saved, c.d);
      const capped = X => mean(Array.from(X.pot, v => Math.min(v, U.cap)));
      return { id: U.id, cohort: U.cohort, cells: c, ch, pot: pct(mean(x.pot), mean(b.pot)), capped: pct(capped(x), capped(b)), tax: [mean(b.tax), mean(x.tax)], replay: U.replay[arm] };
    });
    const pooled = pooledSummed(H.map(h => h.cells));
    const spend = pct(sum(units.map(U => sum(U.arms[arm].delivered))), sum(units.map(U => sum(U.arms.CANDS.delivered))));
    const potP = mean(H.map(h => h.pot)), cappedP = mean(H.map(h => h.capped)), taxB = mean(H.map(h => h.tax[0])), taxX = mean(H.map(h => h.tax[1]));
    const rep = { differ: sum(H.map(h => h.replay.differ)), level: sum(H.map(h => h.replay.level)), tiers: sum(H.map(h => h.replay.tiers)), below: sum(H.map(h => h.replay.below)), moreTax: sum(H.map(h => h.replay.moreTax)) };
    const parts = [
      pooled.lo > RULE.pooled,
      !H.some(h => h.ch.hi < RULE.unit),
      Math.abs(spend) <= RULE.spend,
      cappedP >= RULE.capped && !H.some(h => h.capped < RULE.cappedUnit),
      !H.some(h => h.pot < RULE.pot),
      taxX <= taxB,
      rep.level === 0 && rep.tiers === 0 && rep.below === 0
    ];
    return [arm, { H, pooled, spend, potP, cappedP, taxB, taxX, rep, parts, passes: parts.every(Boolean), stop: !parts[6] }];
  }));
  let verdict, taken = null;
  if (TIES.some(a => R[a].stop)) verdict = 'STOP';
  else if (R.TIE4.passes && R.TIE5.passes) { taken = Math.abs(R.TIE4.potP - R.TIE5.potP) <= RULE.near ? 'TIE5' : 'TIE4'; verdict = `PASSES (${taken})`; }
  else if (R.TIE4.passes || R.TIE5.passes) { taken = R.TIE4.passes ? 'TIE4' : 'TIE5'; verdict = `PASSES (${taken})`; }
  else verdict = 'FAILS';
  return { R, verdict, taken };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 8000, ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const arm = (lost, o = {}) => ({ margin: o.margin === undefined ? null : o.margin, metaMargin: o.margin === undefined ? null : o.margin, T: 30, survived: Uint8Array.from({ length: N }, (_, i) => (i % 2 === 1 && i < 2 * lost ? 0 : 1)), failYear: new Int16Array(N).fill(-1),
    pot: new Float64Array(N).fill(o.pot || 1e6), tax: new Float64Array(N).fill(o.tax || 1e5), delivered: new Float64Array(N).fill(o.sp || 1e6) });
  const rp = (o = {}) => ({ differ: 10, level: 0, tiers: 0, below: 0, moreTax: 0, ...o });
  // a unit: CANDS loses 400 paths; each tie arm `o[arm]` its own figures; the cap 2e6 unless given
  const unit = (id, o = {}) => ({ id, cohort: 'x', N, pts: 45, seed: 7002, candidate: o.candidate || CANDIDATE, stamp: { code: 'c', audit: 'a' }, cap: o.cap || 2e6, shareRule: 'pots',
    digests: { before: { self: 'a', part: 'b' }, after: { self: 'a', part: o.changed ? 'z' : 'b' } },
    replay: { decisions: 100, above: 50, TIE5: rp(o.rp5), TIE4: rp(o.rp4) },
    arms: { CANDS: arm(400), TIE5: arm(o.l5 === undefined ? 400 : o.l5, { margin: 1e-5, pot: o.pot5 || 1.01e6, tax: o.tax5 || 0.9e5, sp: o.sp5 }), TIE4: arm(o.l4 === undefined ? 400 : o.l4, { margin: 1e-4, pot: o.pot4 || 1.02e6, tax: o.tax4 || 0.8e5, sp: o.sp4 }) } });
  const set = (f = () => ({})) => ids.map((id, k) => unit(id, f(k)));
  const V = s => rule(s).verdict;
  check('a complete planted set passes the gate', gate(set(), ids, 'a').length === 0);
  check(`more pot and less tax at both margins, survival unchanged, the pots 1% apart: PASSES (TIE4) (${V(set())})`, V(set()) === 'PASSES (TIE4)');
  check(`the two pooled pots within 0.5%: PASSES (TIE5) (${V(set(() => ({ pot4: 1.012e6 })))})`, V(set(() => ({ pot4: 1.012e6 }))) === 'PASSES (TIE5)');
  check(`TIE4 two points worse on one couple, beyond noise, fails part 2 and does not pass (${V(set(k => (k === 0 ? { l4: 560 } : {})))})`, (() => { const r = rule(set(k => (k === 0 ? { l4: 560 } : {}))).R.TIE4; return !r.parts[1] && !r.passes; })());
  check('TIE4 with more tax pooled fails part 6, and TIE5 passing is taken', (() => { const r = rule(set(() => ({ tax4: 1.1e5 }))); return !r.R.TIE4.parts[5] && r.verdict === 'PASSES (TIE5)'; })());
  check('a capped pot 1% lower on one couple fails part 4; a mean pot 0.2% lower fails part 5', (() => { const r1 = rule(set(k => (k === 0 ? { pot4: 0.99e6, cap: 0.5e6 * 2 } : {}))).R.TIE4, r2 = rule(set(k => (k === 0 ? { pot4: 0.998e6, cap: 5e6 } : {}))).R.TIE4; return !r1.parts[3] && !r2.parts[4] && r2.parts[3]; })());
  check('spending 0.1% lower pooled fails part 3', (() => { const r = rule(set(() => ({ sp4: 0.999e6 }))).R.TIE4; return !r.parts[2]; })());
  check('a replay decision at another level is a STOP', V(set(k => (k === 0 ? { rp4: { level: 1 } } : {}))) === 'STOP');
  check('neither passing reads FAILS', V(set(() => ({ tax4: 1.1e5, tax5: 1.1e5 }))) === 'FAILS');
  check('the gate refuses a changed table, another margin, a missing arm and a missing unit', (() => {
    const s = set(); s[0] = unit('A', { changed: true }); s[1].arms.TIE4.margin = 1e-3; delete s[2].arms.TIE5; const t = s.slice(0, 7);
    const P = gate(t, ids, 'a'); return P.some(x => /A: a person's table changed/.test(x)) && P.some(x => /B TIE4: the margin/.test(x)) && P.some(x => /C: no TIE5 arm/.test(x)) && P.some(x => /units missing: H/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'tie-couple-7002');
  const { COUPLES, stampFilesHash } = await import('./audit-tie-couple.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const ids = COUPLES.filter(id => !smoke || units.some(u => u.id === id));
  const P = gate(units, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`TIE-C GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = ids.map(id => units.find(u => u.id === id)), u0 = ordered[0], R = rule(ordered);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
  console.log(`A COUPLE'S TIE RULE ABOVE THE ESTATE CAPS, STAGE A (EXPLORATORY; TIE-C.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} couples of the couples' tier test, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, estate weight ${u0.W}, the couples' candidate ${u0.candidate}; the gate: fair (every unit in every arm; one code, audit, seed, count of paths and points; each arm's margin as named; each person's table the same before the first arm and after the last)`);
  for (const arm of TIES) {
    const r = R.R[arm], say = k => (r.parts[k] ? 'HOLDS' : 'FAILS');
    console.log(`\n${arm} (within ${MARGINS[arm]} of score) against CANDS:`);
    console.log(`  1. pooled survival ${iv(r.pooled)} points; its lower end above ${RULE.pooled}: ${say(0)}`);
    console.log(`  2. no couple wholly below ${RULE.unit}: ${r.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join(', ') || 'none'}: ${say(1)}`);
    console.log(`  3. pooled spending delivered ${f(r.spend, 4)}%; within ${RULE.spend}% either way: ${say(2)}`);
    console.log(`  4. the capped pot ${f(r.cappedP)}% pooled (not lower by more than ${-RULE.capped}%); a couple lower by more than ${-RULE.cappedUnit}%: ${r.H.filter(h => h.capped < RULE.cappedUnit).map(h => `${h.id} ${f(h.capped)}%`).join(', ') || 'none'}: ${say(3)}`);
    console.log(`  5. a couple's mean pot left lower by more than ${-RULE.pot}%: ${r.H.filter(h => h.pot < RULE.pot).map(h => `${h.id} ${f(h.pot)}%`).join(', ') || 'none'} (pooled ${f(r.potP)}%): ${say(4)}`);
    console.log(`  6. pooled lifetime tax ${gbp(r.taxB)} to ${gbp(r.taxX)} (${f(pct(r.taxX, r.taxB), 2)}%); not higher: ${say(5)}`);
    console.log(`  7. the replay: ${ordered.reduce((s, u) => s + u.replay.decisions, 0)} decisions (${ordered.reduce((s, u) => s + u.replay.above, 0)} above both caps), a different move at ${r.rep.differ}; at another level ${r.rep.level}, at another tier pair ${r.rep.tiers}, at or below a cap ${r.rep.below} (beside the rule: with more tax that year ${r.rep.moreTax}): ${say(6)}`);
    console.log(`  ${r.passes ? `PASSES 1 to 7` : `FAILS ${r.parts.map((p, k) => (p ? null : k + 1)).filter(Boolean).join(', ')}`}`);
    console.log(`  by couple: ${r.H.map(h => `${h.id} survival ${f(h.ch.d)}, pot ${f(h.pot)}%, capped ${f(h.capped)}%, tax ${gbp(h.tax[0])} to ${gbp(h.tax[1])}, replay ${h.replay.differ} differing`).join('; ')}`);
  }
  console.log(`\nTIE-C OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}`);
}
