/*
 * THE HARVEST CEILING ON THE YEAR'S WHOLE TAXABLE INCOME, STEP 4: THE READ (HARVEST-CEILING.md; ANSWERS.md section 5; D91,
 * D93; EXPLORATORY). The stamps first (fair-gate.mjs requireFairLogs), then the gate: every household in; one code, one
 * audit, one seed, one count of paths, one count of points; both arms on the household's plan and at the same settings; the
 * BEFORE arm's engine without the ceiling and the AFTER arm's with it, as each unit read them back; one BEFORE commit. Then
 * HARVEST-CEILING.md's rule (SPEED-A.md's four parts, the pot one-sided), AFTER against BEFORE:
 *   1 pooled survival: its 95% interval's lower end above -0.1 points; 2 no household's interval wholly below -0.3;
 *   3 pooled spending delivered within 0.05 points of target; 4 the pooled mean pot left not lower by more than 0.5%.
 *   node research/solver/reduce-ceiling.mjs [dir] > research/solver/results-harvest-ceiling-solved.txt
 *   node research/solver/reduce-ceiling.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pairOf } from './reduce-isasweep.mjs';
import { zFor } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooledLo: -0.1, household: -0.3, spend: 0.05, pot: -0.5 };
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => { if (typeof b64 !== 'string') return b64; const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
export const armOf = a => ({ survived: arr(a.survived, Uint8Array), delivered: arr(a.delivered, Float64Array), target: arr(a.target, Float64Array), pot: arr(a.pot, Float64Array), tax: arr(a.tax, Float64Array) });
const mean = a => { let s = 0; for (let k = 0; k < a.length; k++) s += a[k]; return s / a.length; };
/* the rule over the units (each { id, B, A }: the arms' arrays) */
export function rule(units) {
  const del = x => { let d = 0, t = 0; for (let k = 0; k < x.delivered.length; k++) { d += x.delivered[k]; t += x.target[k]; } return (100 * d) / Math.max(1e-9, t); };
  const H = units.map(u => ({ id: u.id, p: pairOf(u.B.survived, u.A.survived), potB: mean(u.B.pot), potA: mean(u.A.pot), delB: del(u.B), delA: del(u.A), taxB: mean(u.B.tax), taxA: mean(u.A.tax) }));
  const k = H.length, z = zFor(0.05), avg = g => H.reduce((s, h) => s + g(h), 0) / k;
  const pooled = avg(h => h.p.d), se = Math.sqrt(H.reduce((s, h) => s + h.p.v, 0)) / k, lo = pooled - z * se, hi = pooled + z * se;
  const harmed = H.filter(h => h.p.hi < RULE.household);
  const spend = avg(h => h.delA - h.delB), pot = 100 * (avg(h => h.potA) / Math.max(1e-9, avg(h => h.potB)) - 1);
  const part1 = lo > RULE.pooledLo, part2 = harmed.length === 0, part3 = Math.abs(spend) <= RULE.spend, part4 = pot >= RULE.pot;
  return { H, pooled, se, lo, hi, harmed, spend, pot, part1, part2, part3, part4, pass: part1 && part2 && part3 && part4, avg };
}
/* the gate: refusals, each a line */
export function gate(raw, ids, audit, size = { N: 16000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !raw.some(u => u.id === id));
  if (missing.length) P.push(`households missing: ${missing.join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  one('BEFORE commit', u => u.arms && u.arms.BEFORE && u.arms.BEFORE.commit);
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && raw.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of raw) {
    const B = U.arms && U.arms.BEFORE, A = U.arms && U.arms.AFTER;
    if (!B || !A) { P.push(`${U.id}: an arm missing`); continue; }
    for (const [name, x] of [['BEFORE', B], ['AFTER', A]]) {
      if (x.inputs !== U.inputs) P.push(`${U.id} ${name}: not on the household's plan`);
      for (const k of ['survived', 'pot', 'delivered', 'target', 'tax']) if (arr(x[k], k === 'survived' ? Uint8Array : Float64Array).length !== U.N) P.push(`${U.id} ${name}: ${k} not one a path`);
    }
    if (B.ceiling !== false) P.push(`${U.id} BEFORE: its engine has the ceiling`);
    if (A.ceiling !== true) P.push(`${U.id} AFTER: its engine has no ceiling`);
    if (B.rest !== A.rest) P.push(`${U.id}: the arms' settings differ`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (what, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
  const n = 1000;
  const mk = (id, o = {}) => {
    const B = { survived: new Uint8Array(n), delivered: new Float64Array(n).fill(1000), target: new Float64Array(n).fill(1000), pot: new Float64Array(n).fill(500), tax: new Float64Array(n).fill(50) };
    for (let i = 0; i < 900; i++) B.survived[i] = 1;
    const A = { ...B, survived: Uint8Array.from(B.survived), pot: new Float64Array(n).fill(500 * (1 + (o.pot || 0) / 100)), delivered: new Float64Array(n).fill(1000 + 10 * (o.spend || 0)) };
    for (let i = 0; i < (o.lost || 0); i++) A.survived[i] = 0;
    return { id, B, A };
  };
  const four = o => ['A', 'B', 'C', 'D'].map((id, i) => mk(id, i === 0 ? o : {})), all = o => ['A', 'B', 'C', 'D'].map(id => mk(id, o));
  check('four households with nothing moved pass the rule', rule(four({})).pass);
  check('a pooled loss past -0.1 fails part 1 (every household losing 4 of 1,000), and none losing passes it', !rule(all({ lost: 4 })).part1 && rule(all({})).part1);
  check('a household wholly below -0.3 (15 lost of 1,000) fails part 2, and one losing 2 does not', (r => !r.part2 && r.harmed.length === 1 && r.harmed[0].id === 'A')(rule(four({ lost: 15 }))) && rule(four({ lost: 2 })).part2);
  check('pooled spending 0.06 points of target away fails part 3 either way, 0.04 holds', !rule(all({ spend: 0.06 })).part3 && !rule(all({ spend: -0.06 })).part3 && rule(all({ spend: 0.04 })).part3);
  check('a pooled pot 0.6% lower fails part 4; 0.4% lower and 5% higher hold (one-sided)', !rule(all({ pot: -0.6 })).part4 && rule(all({ pot: -0.4 })).part4 && rule(all({ pot: 5 })).part4);
  // the gate
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const armX = (name, o = {}) => ({ commit: name === 'BEFORE' ? 'aaaa' : 'snapshot', ceiling: name === 'AFTER', inputs: 'h', rest: 'pts 45', survived: b64(new Uint8Array(2)), pot: b64(new Float64Array(2)), delivered: b64(new Float64Array(2)), target: b64(new Float64Array(2)), tax: b64(new Float64Array(2)), ...o });
  const unit = (id, o = {}) => ({ id, seed: 7002, N: 2, pts: 45, inputs: 'h', stamp: { code: 'c', audit: 'a' }, arms: { BEFORE: armX('BEFORE'), AFTER: armX('AFTER') }, ...o });
  const size = { N: 2, pts: 45, seed: 7002 }, G = (units, ids = ['E', 'F']) => gate(units, ids, 'a', size);
  { const g0 = G([unit('E'), unit('F')]); check(`the gate passes two whole households${g0.length ? `: ${g0[0]}` : ''}`, g0.length === 0); }
  check('the gate refuses a missing household', G([unit('E')]).some(x => /households missing: F/.test(x)));
  check('the gate refuses units of two codes, and a unit of another size', G([unit('E'), unit('F', { stamp: { code: 'x', audit: 'a' } })]).some(x => /more than one code/.test(x)) && gate([unit('E'), unit('F')], ['E', 'F'], 'a').some(x => /not 16000 paths/.test(x)));
  check('the gate refuses a BEFORE arm whose engine has the ceiling, and an AFTER arm whose engine has not', G([unit('E', { arms: { BEFORE: armX('BEFORE', { ceiling: true }), AFTER: armX('AFTER') } }), unit('F')]).some(x => /E BEFORE: its engine has the ceiling/.test(x)) && G([unit('E', { arms: { BEFORE: armX('BEFORE'), AFTER: armX('AFTER', { ceiling: false }) } }), unit('F')]).some(x => /E AFTER: its engine has no ceiling/.test(x)));
  check('the gate refuses arms at different settings, an arm on another plan, and two BEFORE commits', G([unit('E', { arms: { BEFORE: armX('BEFORE'), AFTER: armX('AFTER', { rest: 'pts 30' }) } }), unit('F')]).some(x => /settings differ/.test(x)) && G([unit('E', { arms: { BEFORE: armX('BEFORE', { inputs: 'x' }), AFTER: armX('AFTER') } }), unit('F')]).some(x => /not on the household's plan/.test(x)) && G([unit('E'), unit('F', { arms: { BEFORE: armX('BEFORE', { commit: 'bbbb' }), AFTER: armX('AFTER') } })]).some(x => /more than one BEFORE commit/.test(x)));
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'ceiling-7002');
  const { HOUSEHOLDS, stampFilesHash } = await import('./audit-ceiling.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const ids = smoke ? raw.map(u => u.id) : HOUSEHOLDS;
  const P = gate(raw, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`HARVEST-CEILING GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const units = ids.map(id => raw.find(u => u.id === id)), u0 = units[0];
  const R = rule(units.map(u => ({ id: u.id, B: armOf(u.arms.BEFORE), A: armOf(u.arms.AFTER) })));
  console.log(`HARVEST-CEILING, STEP 4 (EXPLORATORY; D91, D93; HARVEST-CEILING.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ids.length} households, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; BEFORE the tree at ${u0.arms.BEFORE.commit}; the gate: fair (one code, audit, seed, count of paths and points; both arms on the household's plan at the same settings; BEFORE's engine without the ceiling, AFTER's with it)`);
  console.log(`\nBy household (survival BEFORE / AFTER, d and its interval; spending delivered, points of target, AFTER less BEFORE; the mean pot left BEFORE / AFTER; lifetime tax BEFORE / AFTER; whether the tables differ; the solves' seconds):`);
  for (const h of R.H) { const u = units.find(x => x.id === h.id), B = u.arms.BEFORE, A = u.arms.AFTER;
    console.log(`  ${h.id.padEnd(6)} ${h.p.sG.toFixed(2)}% / ${h.p.sI.toFixed(2)}%, d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${f(h.delA - h.delB, 4)} | pot £${Math.round(h.potB).toLocaleString('en-GB')} / £${Math.round(h.potA).toLocaleString('en-GB')} (${f(100 * (h.potA / Math.max(1e-9, h.potB) - 1), 2)}%) | tax £${Math.round(h.taxB).toLocaleString('en-GB')} / £${Math.round(h.taxA).toLocaleString('en-GB')} | tables ${B.digest === A.digest ? 'the same' : 'differ'} | ${Math.round(B.solveSecs)} s / ${Math.round(A.solveSecs)} s`); }
  console.log(`\nThe rule (AFTER less BEFORE):`);
  console.log(`  1. pooled survival, the mean of d over ${R.H.length} households: ${f(R.pooled)} (95% ${f(R.lo)} to ${f(R.hi)}, se ${R.se.toFixed(4)}); its lower end above ${RULE.pooledLo}: ${R.part1 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  2. no household's interval wholly below ${RULE.household}: ${R.harmed.length ? R.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${R.part2 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  3. pooled spending delivered ${f(R.spend, 4)} points of target; within ${RULE.spend} either way: ${R.part3 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  4. the pooled mean pot left ${f(R.pot, 3)}%; not lower by more than ${-RULE.pot}%: ${R.part4 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  beside, deciding nothing: pooled lifetime tax £${Math.round(R.avg(h => h.taxB)).toLocaleString('en-GB')} to £${Math.round(R.avg(h => h.taxA)).toLocaleString('en-GB')} (${f(100 * (R.avg(h => h.taxA) / Math.max(1e-9, R.avg(h => h.taxB)) - 1), 2)}%)`);
  const failed = [!R.part1 && 1, !R.part2 && 2, !R.part3 && 3, !R.part4 && 4].filter(Boolean);
  console.log(`\nHARVEST-CEILING OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.pass ? 'PASSES 1 to 4: the ceiling stands as built and goes to main with its batch (D92)' : `FAILS ${failed.join(', ')}: STOP; to the maintainer, nothing of the ceiling merged before a ruling`}`);
}
