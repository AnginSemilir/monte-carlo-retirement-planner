/*
 * O97 ON THE BUFFER VIEW (the maintainer, 6 Oct: 'yes, do the buffer check'; the 5 Oct 08:00 decision: the end pot is a
 * buffer, not an estate - O97's estate loss is not a cost to the axis decision, its extra tax is). A measurement over
 * ADOPT-PI's death-tax-0 files, read-only, through their own gate (rule 3; reduce-dto97.mjs references()).
 * The question: once the pension left at the end is valued as a buffer - what it would pay out if drawn, after the income
 * tax on drawing it - does PCLSI (the fix) still leave less than SNAP (today's snap)?
 * Per household, arm and path: the buffer = terminal net - the deferred tax on the pension left, where the pension left is
 * the path's last recorded pension (reduce-dto97.mjs lastPension; 0 on a failed path, whose terminal net is 0), its
 * tax-free part min(0.25 x pension, the lump-sum allowance unused at the path's last recorded year: (1 - u) x lsa), and the
 * rest taxed at a flat drawing rate: 20% (drawn slowly, inside the basic band) or 40% (drawn fast). Printed per household:
 * the paired change PCLSI less SNAP a path in terminal net (ADOPT-PI's secondary), in the deferred tax, and in the buffer at
 * each rate (mean, se over paths, and the median path's change), and in lifetime tax plus deferred tax (the whole tax bill
 * on the pension money). Declared: a flat drawing rate stands in for the tax a real draw-down would pay (the personal
 * allowance and the State Pension's use of it are ignored), and the last recorded pension stands in for the pension at the
 * horizon's end (as derive-dto97.mjs's revaluation; the deep review after FORCE-X, 6 Oct 08:08 UK, found that
 * revaluation overstating the re-solved shift about twofold on S130 and S370; derive-dto97.mjs has not been run since).
 *   node research/solver/derive-o97-buffer.mjs > research/solver/results-derive-o97-buffer.txt
 */
import { references, lastPension } from './reduce-dto97.mjs';
import { PANEL } from './reduce-adoptpi.mjs';

const RATES = [0.2, 0.4], LUMP = 0.25;
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
/* the deferred tax on path j's pension left, at a flat drawing rate */
export function deferred(t, j, lsa, rate) {
  if (!t.survived[j]) return 0;
  const pen = lastPension(t, j);
  let u = 0; for (let y = t.Y - 1; y >= 0; y--) { const v = t.u[j * t.Y + y]; if (v === v) { u = v; break; } }
  const free = Math.min(LUMP * pen, Math.max(0, 1 - u) * lsa);
  return rate * (pen - free);
}
export function stats(xs) {
  const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (n - 1));
  const s = [...xs].sort((a, b) => a - b);
  return { m, se: sd / Math.sqrt(n), med: s[n >> 1] };
}
// PLANTED (rule 6): a 100,000 pension with the allowance fully unused has 25,000 tax-free, 75,000 taxed: 15,000 at 20%;
// with the allowance used up, all 100,000 taxed; a failed path has none
{
  const mk = (u, sv) => ({ N: 1, Y: 2, survived: Uint8Array.from([sv]), pen: Float32Array.from([1e5, 1e5]), u: Float32Array.from([u, u]) });
  const a = deferred(mk(0, 1), 0, 268275, 0.2), b = deferred(mk(1, 1), 0, 268275, 0.2), c = deferred(mk(0, 0), 0, 268275, 0.2);
  const s = stats([1, 2, 3, 10]);
  if (!(a === 15000 && b === 20000 && c === 0 && s.m === 4 && s.med === 3)) { console.log(`PLANTED CHECK FAILED: ${a} ${b} ${c} ${JSON.stringify(s)}`); process.exit(1); }
}

const R = references();
if (R.bad.length) { console.log(`GATE (ADOPT-PI's files): FAILED\n  ${R.bad.join('\n  ')}`); process.exit(1); }
console.log('GATE (ADOPT-PI\'s files, through their own gate): passed; planted: passed\n');
const lsaOf = id => { const u = R.units.find(x => x.id === id && !x.dt); return Number((/ lsa (\d+)/.exec(u.access) || [])[1]); };

console.log('THE BUFFER VIEW: PCLSI less SNAP a path at death tax 0 - mean (se) and the median path - in terminal net (ADOPT-PI\'s secondary), in the deferred tax on the pension left, in the buffer (terminal net less that tax) at a 20% and a 40% drawing rate, and in the whole tax bill (lifetime tax plus the deferred tax at 20%)');
console.log('  household        net change              deferred tax @20%       buffer @20%                buffer @40%                whole tax @20%');
const rows = [];
for (const id of PANEL) {
  const S = R.files[`${id} SNAP`], P = R.files[`${id} PCLSI`], N = S.N, lsa = lsaOf(id);
  if (!(lsa > 0)) { console.log(`NOT READ: ${id} has no lsa on its access line`); process.exit(1); }
  const dn = [], dd = [], b2 = [], b4 = [], wt = [];
  for (let j = 0; j < N; j++) {
    const d2s = deferred(S, j, lsa, 0.2), d2p = deferred(P, j, lsa, 0.2), d4s = deferred(S, j, lsa, 0.4), d4p = deferred(P, j, lsa, 0.4);
    dn.push(P.net[j] - S.net[j]); dd.push(d2p - d2s);
    b2.push((P.net[j] - d2p) - (S.net[j] - d2s)); b4.push((P.net[j] - d4p) - (S.net[j] - d4s));
    wt.push((P.tax[j] + d2p) - (S.tax[j] + d2s));
  }
  const r = { id, net: stats(dn), def: stats(dd), b2: stats(b2), b4: stats(b4), wt: stats(wt) };
  rows.push(r);
  const c = x => `${f2(x.m).padStart(11)} (${f2(x.se).padStart(9)})`;
  console.log(`  ${id.padEnd(16)} ${c(r.net)}  ${c(r.def)}  ${c(r.b2)} ${f2(r.b2.med).padStart(9)}  ${c(r.b4)} ${f2(r.b4.med).padStart(9)}  ${c(r.wt)}`);
}
const lossHH = rows.filter(r => r.net.m < 0);
const below = (k, rate) => lossHH.filter(r => r[k].m + 2 * r[k].se < 0).length;
console.log(`\nSUMMARY over the ${lossHH.length} households where the terminal net falls under PCLSI at death tax 0 (${lossHH.map(r => r.id).join(', ')}):`);
console.log(`  buffer @20%: ${below('b2')} still lower under PCLSI by more than two se; buffer @40%: ${below('b4')}; the mean change over them @20% ${f2(lossHH.reduce((s, r) => s + r.b2.m, 0) / lossHH.length)}, @40% ${f2(lossHH.reduce((s, r) => s + r.b4.m, 0) / lossHH.length)} (net ${f2(lossHH.reduce((s, r) => s + r.net.m, 0) / lossHH.length)})`);
console.log(`  whole tax @20% higher under PCLSI by more than two se on ${lossHH.filter(r => r.wt.m - 2 * r.wt.se > 0).length} of ${lossHH.length}`);
