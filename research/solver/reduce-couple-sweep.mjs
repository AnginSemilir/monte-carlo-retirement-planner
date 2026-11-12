/*
 * WHERE THE SWEEP PUTS A COUPLE'S CASH ISA MONEY: THE READ (COUPLE-SWEEP.md; D87, D88; EXPLORATORY). The stamps first
 * (fair-gate.mjs requireFairLogs), then the gate: every couple in; one code, one audit, one seed, one count of paths, one
 * count of points; both arms on the couple's plan; each arm's sweep, as the unit read it back from each person's solved
 * table, its own (GIA: no move carries it; ISA: every move), and the engine's sweep in step with it (GIA: nothing to the
 * ISA; ISA: something to the ISA wherever the couple holds cash ISA money); the arms' other settings the same. Then ISA-SWEEP.md's rule as written for singles, by its own code (reduce-isasweep.mjs `rule`), on the couples:
 *   1 pooled survival, ISA less GIA: its 95% interval's lower end above -0.2 points; 2 no couple's interval wholly below
 *   -0.5; 3 the mean pot left under ISA, averaged over the couples, not lower than under GIA.
 *   node research/solver/reduce-couple-sweep.mjs [dir] > research/solver/results-couple-sweep.txt
 *   node research/solver/reduce-couple-sweep.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rule, RULE } from './reduce-isasweep.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => { if (typeof b64 !== 'string') return b64; const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };   // a small Buffer sits in Node's shared pool: its own bytes, not the pool's
export const armOf = a => ({ survived: arr(a.survived, Uint8Array), delivered: arr(a.delivered, Float64Array), target: arr(a.target, Float64Array), pot: arr(a.pot, Float64Array), tax: arr(a.tax, Float64Array) });
/* the gate: refusals, each a line. raw: the unit files; ids: the couples; WANT: what each arm's two people should record;
   audit: these files' hash; size: the run's (null in a smoke read) */
export function gate(raw, ids, WANT, audit, size = { N: 4000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !raw.some(u => u.id === id));
  if (missing.length) P.push(`couples missing: ${missing.join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && raw.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of raw) {
    const G = U.arms && U.arms.GIA, I = U.arms && U.arms.ISA;
    if (!G || !I) { P.push(`${U.id}: an arm missing`); continue; }
    for (const [name, x] of [['GIA', G], ['ISA', I]]) {
      if (x.inputs !== U.inputs) P.push(`${U.id} ${name}: not on the couple's plan`);
      if (!(x.sweep && x.sweep.length === 2 && x.sweep.every(s => s === WANT[name]))) P.push(`${U.id} ${name}: its people's tables record the sweep as ${(x.sweep || []).join(' and ') || 'nothing'}, not ${WANT[name]}`);
      for (const k of ['survived', 'pot', 'delivered', 'target', 'tax']) if (arr(x[k], k === 'survived' ? Uint8Array : Float64Array).length !== U.N) P.push(`${U.id} ${name}: ${k} not one a path`);
    }
    if (G.rest !== I.rest) P.push(`${U.id}: the arms' settings differ beyond the sweep`);
    if (G.sweptToIsa !== 0) P.push(`${U.id} GIA: the engine swept £${Math.round(G.sweptToIsa)} a path to the ISA`);
    if (U.cashIsa > 0 && !(I.sweptToIsa > 0)) P.push(`${U.id} ISA: the couple holds cash ISA money and the engine swept none of it to the ISA`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (what, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
  const n = 1000;
  // the rule is reduce-isasweep.mjs's, with its own planted checks there; here, that it is the one read: a couple losing
  // 12 paths of 1,000 under ISA fails part 2, a lower pot fails part 3, nothing moved passes
  const mk = (id, o = {}) => {
    const G = { survived: new Uint8Array(n), delivered: new Float64Array(n).fill(1000), target: new Float64Array(n).fill(1000), pot: new Float64Array(n).fill(500), tax: new Float64Array(n).fill(50) };
    for (let i = 0; i < 900; i++) G.survived[i] = 1;
    const I = { ...G, survived: Uint8Array.from(G.survived), pot: new Float64Array(n).fill(500 + (o.pot || 0)) };
    for (let i = 0; i < (o.lost || 0); i++) I.survived[i] = 0;
    return { id, G, I };
  };
  const four = o => ['A', 'B', 'C', 'D'].map((id, i) => mk(id, i === 0 ? o : {}));
  check('four couples with nothing moved pass the rule', (r => r.part1 && r.part2 && r.part3)(rule(four({}))));
  check('a couple wholly below -0.5 under ISA (20 lost of 1,000) fails part 2, and one losing 3 does not', (r => !r.part2 && r.harmed.length === 1 && r.harmed[0].id === 'A')(rule(four({ lost: 20 }))) && rule(four({ lost: 3 })).part2);
  check('a pooled loss past -0.2 fails part 1 (every couple losing 5 of 1,000)', !rule(['A', 'B', 'C', 'D'].map(id => mk(id, { lost: 5 }))).part1);
  check('a lower mean pot under ISA fails part 3, a higher one holds', !rule(four({ pot: -1 })).part3 && rule(four({ pot: 1 })).part3);
  // the gate
  const WANT = { GIA: 'gia (no move)', ISA: 'isa (every move)' }, b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const armX = (name, o = {}) => ({ sweep: [WANT[name], WANT[name]], rest: 'pts 45', inputs: 'h', sweptToIsa: name === 'ISA' ? 9 : 0, sweptToGia: name === 'GIA' ? 9 : 0, survived: b64(new Uint8Array(2)), pot: b64(new Float64Array(2)), delivered: b64(new Float64Array(2)), target: b64(new Float64Array(2)), tax: b64(new Float64Array(2)), ...o });
  const unit = (id, o = {}) => ({ id, seed: 7002, N: 2, pts: 45, inputs: 'h', cashIsa: 100, stamp: { code: 'c', audit: 'a' }, arms: { GIA: armX('GIA'), ISA: armX('ISA') }, ...o });
  const size = { N: 2, pts: 45, seed: 7002 }, G = (units, ids = ['E', 'F']) => gate(units, ids, WANT, 'a', size);
  { const g0 = G([unit('E'), unit('F')]); check(`the gate passes two whole couples${g0.length ? `: ${g0[0]}` : ''}`, g0.length === 0); }
  check('the gate refuses a missing couple', G([unit('E')]).some(x => /couples missing: F/.test(x)));
  check('the gate refuses units of two codes, and a unit of another size', G([unit('E'), unit('F', { stamp: { code: 'x', audit: 'a' } })]).some(x => /more than one code/.test(x)) && gate([unit('E'), unit('F')], ['E', 'F'], WANT, 'a').some(x => /not 4000 paths/.test(x)));
  check('the gate refuses a GIA arm whose tables carry the sweep to the ISA, and an ISA arm one of whose people does not', G([unit('E', { arms: { GIA: armX('GIA', { sweep: [WANT.ISA, WANT.ISA] }), ISA: armX('ISA') } }), unit('F')]).some(x => /E GIA: its people/.test(x)) && G([unit('E', { arms: { GIA: armX('GIA'), ISA: armX('ISA', { sweep: [WANT.ISA, 'isa (3 of 800 moves)'] }) } }), unit('F')]).some(x => /E ISA: its people/.test(x)));
  check('the gate refuses arms whose settings differ beyond the sweep', G([unit('E', { arms: { GIA: armX('GIA'), ISA: armX('ISA', { rest: 'pts 30' }) } }), unit('F')]).some(x => /beyond the sweep/.test(x)));
  check('the gate refuses a GIA arm whose engine swept to the ISA, and an ISA arm whose engine swept nothing there for a couple holding cash ISA money (the joint move without the sweep)', G([unit('E', { arms: { GIA: armX('GIA', { sweptToIsa: 5 }), ISA: armX('ISA') } }), unit('F')]).some(x => /E GIA: the engine swept/.test(x)) && G([unit('E', { arms: { GIA: armX('GIA'), ISA: armX('ISA', { sweptToIsa: 0 }) } }), unit('F')]).some(x => /E ISA: the couple holds/.test(x)));
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'couple-sweep-7002');
  const { COUPLES, WANT, stampFilesHash } = await import('./audit-couple-sweep.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const ids = smoke ? raw.map(u => u.id) : COUPLES;
  const P = gate(raw, ids, WANT, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`COUPLE-SWEEP GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const units = ids.map(id => raw.find(u => u.id === id)), u0 = units[0];
  const R = rule(units.map(u => ({ id: u.id, G: armOf(u.arms.GIA), I: armOf(u.arms.ISA) })));
  console.log(`COUPLE-SWEEP (EXPLORATORY; D87, D88; COUPLE-SWEEP.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ids.length} couples, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair (one code, audit, seed, count of paths and points; both arms on the couple's plan, their settings the same but the sweep; each arm's sweep, read back from each person's table, its own, and the engine's in step with it)`);
  console.log(`\nBy couple (cash ISA money at the start; years; survival GIA / ISA, d and its interval; spending delivered, points of target, ISA less GIA; the mean pot left GIA / ISA; lifetime tax GIA / ISA; the engine's sweep a path, GIA to the taxable account, ISA to the ISA; the solves' seconds):`);
  for (const h of R.H) { const u = units.find(x => x.id === h.id), G = u.arms.GIA, I = u.arms.ISA;
    console.log(`  ${h.id.padEnd(5)} £${Math.round(u.cashIsa).toLocaleString('en-GB')} | ${u.years} years | ${h.p.sG.toFixed(2)}% / ${h.p.sI.toFixed(2)}%, d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${f(h.delI - h.delG, 4)} | pot £${Math.round(h.potG).toLocaleString('en-GB')} / £${Math.round(h.potI).toLocaleString('en-GB')} (${f(100 * (h.potI / h.potG - 1), 2)}%) | tax £${Math.round(h.taxG).toLocaleString('en-GB')} / £${Math.round(h.taxI).toLocaleString('en-GB')} | swept £${Math.round(G.sweptToGia).toLocaleString('en-GB')} / £${Math.round(I.sweptToIsa).toLocaleString('en-GB')} | solves ${G.solveSecs.toFixed(0)} s / ${I.solveSecs.toFixed(0)} s`); }
  const k = R.H.length, avg = g => R.H.reduce((s, h) => s + g(h), 0) / k;
  console.log(`\nThe rule (ISA-SWEEP.md's, as written for singles; ISA less GIA):`);
  console.log(`  1. pooled survival, the mean of d over ${k} couples: ${f(R.pooled)} (95% ${f(R.lo)} to ${f(R.hi)}, se ${R.se.toFixed(4)}); its lower end above ${RULE.pooledLo}: ${R.part1 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  2. no couple's interval wholly below ${RULE.household}: ${R.harmed.length ? R.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${R.part2 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  3. the mean pot left, ISA less GIA averaged over couples: ${R.potDiff >= 0 ? '+' : '-'}£${Math.round(Math.abs(R.potDiff)).toLocaleString('en-GB')}; not lower: ${R.part3 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  beside, deciding nothing: pooled spending delivered ${f(avg(h => h.delI - h.delG), 4)} points of target; pooled lifetime tax £${Math.round(avg(h => h.taxG)).toLocaleString('en-GB')} to £${Math.round(avg(h => h.taxI)).toLocaleString('en-GB')} (${f(100 * (avg(h => h.taxI) / avg(h => h.taxG) - 1), 2)}%); couples with a lower mean pot under ISA: ${R.H.filter(h => h.potI < h.potG).map(h => h.id).join(', ') || 'none'}; with an observed loss of survival: ${R.H.filter(h => h.p.d < 0).map(h => `${h.id} ${f(h.p.d)}`).join(', ') || 'none'}`);
  const pass = R.part1 && R.part2 && R.part3;
  console.log(`\nCOUPLE-SWEEP OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${pass ? 'PASSES: the sweep to the ISA stands for a couple (the first reading, D87); by D88 the couples\' re-run is launched as registered, the code not having moved' : !R.part1 || !R.part2 ? 'FAILS ON SURVIVAL: STOP; the couples\' re-run is not launched; to the maintainer' : 'FAILS ON THE POT ONLY: STOP; the couples\' re-run is not launched; to the maintainer'}`);
}
