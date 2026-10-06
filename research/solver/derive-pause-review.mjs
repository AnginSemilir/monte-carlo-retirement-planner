/*
 * THE DEEP REVIEW AFTER PAUSE'S FIGURES (deep-review-log.md 6 Oct 01:52 UK read them by scratch; committed here so the plan
 * can cite them: CHECKLIST item 4). PAUSE's files through PAUSE's own gate first (reduce-pause.mjs: the stamps, the
 * self-check, the identity against EDGE-SPLIT's and HYB's files; rule 3). Declared: the deep review saw these figures before
 * this script existed; it re-derives them, it does not test anything. Per arm, over its main pause band's flat years, on the
 * fixed move's read (fx) and the envelope (fv, fc):
 *   1. WHERE THE PAUSES SIT: the share in u's grid cell below each snapped edge ([0.70, 0.75), [0.725, 0.75); [0.20, 0.25),
 *      [0.225, 0.25)) or within 0.025 of the middle point;
 *   2. THE FALL AHEAD WITH u'S OWN CELL COUNTED (FLAG 1): reduce-pause.mjs counts a step as ahead only when its midpoint is
 *      above u, dropping the step in u's own cell; here the steps from u's own cell up - the steepest fall's far end within
 *      0.1 of u, and the FIRST fall larger than the switch margin (1e-3) within 0.1 of u;
 *   3. HYB AGAINST P-HI in [0.15, 0.25): the same path-years, the fixed read equal to 1e-12 up to u 0.45, the move-change
 *      flags equal;
 *   4. THE FIRST MOVE CHANGE ABOVE u (FLAG 2): where it sits, how far the new move beats the paused one there (env - fix), the
 *      share under the switch margin, and how far the paused move's own read has fallen by then;
 *   5. THE ALLOWANCE'S PRICE ON EACH TABLE (FLAG 3): the fixed read's drop from u 0 to 0.5 (exactly 0 counted) and from 0.5
 *      to 1, at flat years with u 0.15 or more, and at the pre-access years (u under 0.15) matched between S-INT (SNAP's
 *      tables) and PCLSI (PCLSI's);
 *   6. WHEN THE PAUSES FALL (FLAG 4): the share of each arm's band years before year 12 (S130's State Pension).
 *   node research/solver/derive-pause-review.mjs > research/solver/results-derive-pause-review.txt
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url)), D = join(HERE, 'results', 'diagpause'), MARGIN = 1e-3;
const BAND = { SNAP: [0.6, 0.75], 'S-LO': [0.6, 0.75], 'P-LO': [0.6, 0.75], 'P-HI': [0.15, 0.25], HYB: [0.15, 0.25], 'S-HI': [0.25, 0.6], 'S-INT': [0.25, 0.6] };
const f64 = s => { const b = Buffer.from(s, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const u8 = s => new Uint8Array(Buffer.from(s, 'base64'));
const load = arm => { const j = JSON.parse(gunzipSync(readFileSync(join(D, `S130-${arm.toLowerCase()}.json.gz`))).toString()); j.FX = f64(j.fx); j.FV = f64(j.fv); j.FC = u8(j.fc); return j; };
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(p * (s.length - 1))] : NaN; };
const e = x => (Number.isFinite(x) ? x.toExponential(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');

// the steps from u's own cell up: the steepest fall (its far end) and the first fall past the margin
export function fallsFrom(row, G, u) {
  const ib = G.findIndex(g => g > u) - 1;
  let best = 0, bi = -1, fi = -1;
  for (let i = Math.max(0, ib); i + 1 < G.length; i++) { const d = row[i + 1] - row[i]; if (d < best) { best = d; bi = i; } if (fi < 0 && d < -MARGIN) fi = i; }
  return { ib, steep: bi < 0 ? NaN : G[bi + 1], first: fi < 0 ? NaN : G[fi + 1] };
}
// PLANTED (rule 6): an edge inside u's own cell is found (reduce-pause.mjs's rule misses it); a gentle slope is not a fall
{
  const G = Array.from({ length: 21 }, (_, i) => i / 20), row = G.map(x => (x < 0.74 ? 1 - 1e-4 * x : 0.5));
  const a = fallsFrom(row, G, 0.73), b = fallsFrom(G.map(x => 1 - 1e-4 * x), G, 0.3);
  if (!(a.steep === 0.75 && a.first === 0.75 && Number.isNaN(b.first))) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify({ a, b })}`); process.exit(1); }
}
// PAUSE's own gate first
let gateOut = '';
try { gateOut = execFileSync('node', [join(HERE, 'reduce-pause.mjs')], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (err) { gateOut = String(err.stdout || ''); }
if (!/^GATE: passed/m.test(gateOut)) { console.log(`PAUSE'S GATE: FAILED - nothing derived\n${gateOut.split('\n').slice(0, 6).join('\n')}`); process.exit(1); }
console.log('PAUSE\'S GATE (reduce-pause.mjs: stamps, self-check, the identity against EDGE-SPLIT\'s and HYB\'s files): passed; planted: passed\n');

const A = Object.fromEntries(Object.keys(BAND).concat('PCLSI').map(a => [a, load(a)]));
const inBand = (j, k, a) => j.fu[k] >= BAND[a][0] && j.fu[k] < BAND[a][1];
console.log('1. WHERE THE PAUSES SIT (each arm\'s main band): the share in the cell below the edge, and in its upper half');
for (const a of Object.keys(BAND)) {
  const j = A[a], U = j.fu.filter((_, k) => inBand(j, k, a)), sh = f => f3(U.filter(f).length / U.length);
  const edge = BAND[a][1] === 0.75 ? 0.75 : BAND[a][1] === 0.25 ? 0.25 : 0.5;
  console.log(`  ${a.padEnd(6)} n ${U.length}: ${edge === 0.5 ? `within 0.025 of 0.5 ${sh(u => Math.abs(u - 0.5) <= 0.025)}` : `[${(edge - 0.05).toFixed(2)}, ${edge}) ${sh(u => u >= edge - 0.05 && u < edge)}, [${(edge - 0.025).toFixed(3)}, ${edge}) ${sh(u => u >= edge - 0.025 && u < edge)}`}`);
}
console.log('\n2. THE FALL AHEAD WITH u\'S OWN CELL COUNTED (the fixed move): the steepest fall\'s far end within 0.1 of u; the first fall past the switch margin within 0.1 of u');
for (const a of Object.keys(BAND)) {
  const j = A[a], G = j.ugrid, n = G.length; let N = 0, s1 = 0, f1 = 0, ff = 0;
  for (let k = 0; k < j.fu.length; k++) { if (!inBand(j, k, a)) continue; N++; const r = fallsFrom(j.FX.subarray(k * n, (k + 1) * n), G, j.fu[k]); if (r.steep - j.fu[k] <= 0.1 + 1e-12) s1++; if (Number.isFinite(r.first)) { ff++; if (r.first - j.fu[k] <= 0.1 + 1e-12) f1++; } }
  console.log(`  ${a.padEnd(6)} n ${N}: steepest within 0.1 ${f3(s1 / N)}; first fall past 1e-3 within 0.1 ${f3(f1 / N)} (a first fall found on ${f3(ff / N)})`);
}
{
  const P = A['P-HI'], H = A.HYB, n = 21, key = j => new Map(j.fp.map((p, k) => [p * 1000 + j.ft[k], k])), kh = key(H);
  let band = 0, both = 0, eqR = 0, eqC = 0;
  for (let k = 0; k < P.fp.length; k++) {
    if (!inBand(P, k, 'P-HI')) continue; band++; const h = kh.get(P.fp[k] * 1000 + P.ft[k]); if (h === undefined) continue; both++;
    let r = true, c = true; for (let i = 0; i <= 9; i++) { if (Math.abs(P.FX[k * n + i] - H.FX[h * n + i]) > 1e-12) r = false; if (P.FC[k * n + i] !== H.FC[h * n + i]) c = false; }
    if (r) eqR++; if (c) eqC++;
  }
  console.log(`\n3. HYB AGAINST P-HI in [0.15, 0.25): P-HI's band years ${band}, the same path-years in HYB ${both}, the fixed read equal to 1e-12 up to u 0.45 on ${eqR}, the move-change flags equal on ${eqC}`);
}
console.log('\n4. THE FIRST MOVE CHANGE ABOVE u (the envelope): where it sits (the commonest grid points, share), env - fix there (median), the share under the switch margin, the fixed read\'s fall from u\'s cell to there (median)');
for (const a of Object.keys(BAND)) {
  const j = A[a], G = j.ugrid, n = G.length, at = new Map(), gap = [], fall = []; let N = 0;
  for (let k = 0; k < j.fu.length; k++) {
    if (!inBand(j, k, a)) continue; N++; const o = k * n, ib = G.findIndex(g => g > j.fu[k]) - 1;
    for (let i = ib + 1; i < n; i++) if (j.FC[o + i]) { at.set(G[i], (at.get(G[i]) || 0) + 1); gap.push(j.FV[o + i] - j.FX[o + i]); fall.push(j.FX[o + ib] - j.FX[o + i]); break; }
  }
  const top = [...at.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([g, c]) => `${g.toFixed(2)} ${c}`).join(', ');
  console.log(`  ${a.padEnd(6)} n ${N}: changes on ${gap.length}, first at ${top}; env - fix ${e(q(gap, 0.5))}; under 1e-3 ${f3(gap.filter(g => g < MARGIN).length / Math.max(1, gap.length))}; the fixed read's fall ${e(q(fall, 0.5))}`);
}
console.log('\n5. THE ALLOWANCE\'S PRICE: the fixed read\'s drop from u 0 to 0.5 (median; exactly 0 counted) and from 0.5 to 1 (median)');
for (const a of ['SNAP', 'S-INT', 'S-HI', 'PCLSI', 'P-LO', 'P-HI', 'HYB']) {
  const j = A[a], n = 21, lo = [], hi = []; let z = 0;
  for (let k = 0; k < j.fu.length; k++) { if (!(j.fu[k] >= 0.15)) continue; const d = j.FX[k * n] - j.FX[k * n + 10]; lo.push(d); if (Math.abs(d) < 1e-12) z++; hi.push(j.FX[k * n + 10] - j.FX[k * n + 20]); }
  if (lo.length) console.log(`  ${a.padEnd(6)} flat years with u 0.15 or more ${lo.length}: 0 to 0.5 ${e(q(lo, 0.5))} (exactly 0 on ${z}); 0.5 to 1 ${e(q(hi, 0.5))}`);
}
{
  const S = A['S-INT'], P = A.PCLSI, n = 21, kp = new Map(P.fp.map((p, k) => [p * 1000 + P.ft[k], k])); const sl = [], sh = [], pl = [], ph = []; let z = 0;
  for (let k = 0; k < S.fp.length; k++) { if (!(S.fu[k] < 0.15)) continue; const b = kp.get(S.fp[k] * 1000 + S.ft[k]); if (b === undefined) continue; const d = S.FX[k * n] - S.FX[k * n + 10]; sl.push(d); if (Math.abs(d) < 1e-12) z++; sh.push(S.FX[k * n + 10] - S.FX[k * n + 20]); pl.push(P.FX[b * n] - P.FX[b * n + 10]); ph.push(P.FX[b * n + 10] - P.FX[b * n + 20]); }
  console.log(`  pre-access years (u under 0.15) matched, ${sl.length}: SNAP's tables (S-INT) 0 to 0.5 ${e(q(sl, 0.5))} (exactly 0 on ${z}), 0.5 to 1 ${e(q(sh, 0.5))}; PCLSI's tables 0 to 0.5 ${e(q(pl, 0.5))}, 0.5 to 1 ${e(q(ph, 0.5))}`);
}
console.log('\n6. WHEN THE PAUSES FALL: the share of each arm\'s band years before year 12 (S130\'s State Pension)');
for (const a of Object.keys(BAND)) { const j = A[a], T = j.ft.filter((_, k) => inBand(j, k, a)); console.log(`  ${a.padEnd(6)} n ${T.length}: before year 12 ${f3(T.filter(t => t < 12).length / T.length)}`); }
