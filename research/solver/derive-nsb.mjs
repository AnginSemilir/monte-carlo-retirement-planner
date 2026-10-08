/*
 * NSB: THE DERIVATION (predictions/diag-nsb.md; PLAN.md NSB; the deep review after XAS-R2, deep-review-log.md 6 Oct 03:10
 * UK). From records only, XAS-R2's files through their own gate (reduce-xasr2.mjs; NSB's reducer holds its reads to them
 * read for read, its identity), and two judged inputs, each named:
 *   1. THE INPUTS: the review's cause credences (F3-, YB2-), the deep-review lead rate (results-scorecard.txt KIND BASE
 *      RATES), and, from XAS-R2's S126 file, BASE's and COV's top-cell step-year bequest errors eb/bE (COV has no dead
 *      weight there: its error is the live corners' own) and both arms' scores of both opening moves split by term.
 *   2. ITEM 1: the blend's signature on S126 (eb/bE near -wd and near-constant), the live-corner floor (COV's mean
 *      |eb/bE|), so r's point under the blend; the credence from F3-NSBLEND shaded halfway to the base rate, and the
 *      blend's arithmetic holding under the other causes with a judged chance (the bequest is stored 0 at a failing state in
 *      every year, code grade A; the live corners' error away from S126's year 1 is grade D).
 *   2b. THE PREVIEWS: the preflight's files at 4 wealth points (printed before registration; predictions/diag-nsb.md's
 *      Provenance declares them) read by the registered rule's cells; r at 30 points under three readings of where the
 *      live corners' error lies (along share, unrefined; along wealth, to first or second order in the node spacing),
 *      their weights judged after the previews; item 1's HELD carries the weight of the readings that put every TOL cell
 *      under the tolerance. Items 2 and 3 print their previews and keep them out of their credences (each says why).
 *   3. ITEM 2: S126's opening flips when the swap supplies at least the share f* of COV's change to the two moves'
 *      non-survival difference that BASE's score gap needs (a ratio of saved terms); the copy rule supplies the bequest
 *      COV's edge node supplies to within the live floor (judged: the read at a near 0.87 takes the 0.8 node's value).
 *   4. ITEM 3: the power of the registered tests at s 0.6 and 0.1, from S370's per-path BASE (read - ex5) in each year
 *      before a step with vb's per-path departure from its own mean share as the noise; the credences from YB2-REF shaded.
 *   node research/solver/derive-nsb.mjs > research/solver/results-derive-nsb.txt
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { perPath } from './reduce-xasr.mjs';
import { flipP } from './reduce-7ar.mjs';
import { TOL1, QUART1, LO3, HI3, ALPHA, PTS, DECIDING, cellsOf, item2, yearsOf } from './reduce-nsb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(HERE, f), 'utf8');
const xf = id => JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', 'diagxasr2', `${id.replace(/\s+/g, '_')}.json.gz`))).toString());
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => x.toExponential(4);
const causes = (() => { const line = read('deep-review-log.md').split('\n').find(l => l.startsWith('- 6 Oct 03:10 UK')); const m = /CAUSE CREDENCES: ([^\n|]*)$/.exec(line); return Object.fromEntries(m[1].split(';').map(x => x.trim().split('=')).map(([k, v]) => [k, Number(v)])); })();
// the scorecard as committed when predictions/diag-nsb.md was added (check-prediction.mjs baseRateProblems' rule), the
// working copy before it is: a later scorecard moves the rates, and this must keep printing the registered derivation
const SC = (() => {
  try {
    const git = a => execFileSync('git', a, { cwd: join(HERE, '..', '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const added = git(['log', '--diff-filter=A', '--format=%H', '--', 'research/solver/predictions/diag-nsb.md']).trim().split('\n').filter(Boolean).pop();
    if (added) return git(['show', `${added}:research/solver/results-scorecard.txt`]);
  } catch { /* no git: the working copy */ }
  return read('results-scorecard.txt');
})();
const BASE = Number((/leaning on a deep review's cause or story (\d\.\d+)/.exec(SC) || [])[1]);
if (!(BASE > 0 && BASE < 1)) throw new Error('no deep-review lead rate in results-scorecard.txt');
const EFFECT = Number((/EFFECT (\d\.\d+) \(/.exec(SC) || [])[1]);
// the lead of a question halfway to the base rate, the rest sharing what is left in proportion (derive-carry.mjs's shade)
const shade = (pre, unassigned) => { const c = Object.fromEntries(Object.entries(causes).filter(([k]) => k.startsWith(pre))); if (unassigned > 0) c[`${pre}UNASSIGNED`] = unassigned; const [lead] = Object.entries(c).sort((x, y) => y[1] - x[1])[0], L = (c[lead] + BASE) / 2, rest = Object.entries(c).filter(([k]) => k !== lead), tot = rest.reduce((t, [, v]) => t + v, 0); return Object.fromEntries([[lead, L], ...rest.map(([k, v]) => [k, (1 - L) * v / tot])]); };
const sum = pre => Object.entries(causes).filter(([k]) => k.startsWith(pre)).reduce((t, [, v]) => t + v, 0);
const F3 = shade('F3-', 1 - sum('F3-')), YB2 = shade('YB2-', 1 - sum('YB2-'));
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; };
const meanOf = xs => xs.reduce((t, x) => t + x, 0) / xs.length;

console.log('NSB: THE DERIVATION (records only: XAS-R2\'s files, the review\'s receipt, the scorecard; two judged inputs, named)');
console.log('\n1. THE INPUTS');
console.log(`  the 6 Oct 03:10 UK causes: ${Object.entries(causes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  the deep-review lead rate (results-scorecard.txt KIND BASE RATES): ${BASE}; the EFFECT kind's rate: ${EFFECT}`);
console.log(`  shaded (each question's lead halfway to the lead rate, the rest and the unassigned in proportion): ${Object.entries(F3).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(', ')}; ${Object.entries(YB2).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(', ')}`);

// 2. ITEM 1
const S126 = xf('S126'), b = S126.blend, rel = a => { const A = b.arms[a]; return b.top.map((x, j) => (x === 1 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 ? (A.bR[j] - A.bE[j]) / A.bE[j] : NaN)).filter(Number.isFinite); };
const rB = rel('BASE'), rC = rel('COV'), floor = meanOf(rC.map(Math.abs)), spread = (q(rB, 0.95) - q(rB, 0.05)) / 2;
console.log('\n2. ITEM 1: THE BLEND IN THE BEQUEST READ');
console.log(`  S126 year 1, top-cell step reads (XAS-R2): BASE eb/bE ${rB.length} reads, 5% ${f3(q(rB, 0.05))} median ${f3(q(rB, 0.5))} 95% ${f3(q(rB, 0.95))} (near-constant: half the 5-95% range ${spread.toFixed(3)}); COV ${rC.length} reads, mean |eb/bE| ${f4(floor)} (95% ${f3(q(rC, 0.95))}): the live corners' own error`);
// under the blend r = |eb/bE + wd| is the live corners' error: the point; the upper end judged up to twice the tolerance
// where the reads lie away from S126's year 1 (grade D: no record reads a non-step year's bequest)
const P1 = floor, IV1 = [floor / 2, 2 * TOL1];
// the credence: NSBLEND (shaded) carries item 1 with H_IF (the review's own outcome rule on its own cause); under the other
// causes the blend's arithmetic still holds where the live floor stays under the tolerance, judged Q_ELSE; FALSIFIED needs
// the non-step errors under a quarter of wd, which the code forbids but for a one-step bequest near the read (judged F_ELSE)
const H_IF = 0.85, Q_ELSE = 0.6, F_ELSE = 0.08, pN = F3['F3-NSBLEND'];
const h1 = pN * H_IF + (1 - pN) * Q_ELSE, fa1 = (1 - pN) * F_ELSE, i1 = 1 - h1 - fa1;
console.log(`  r's point under the blend: ${f4(P1)}; 80% interval ${f4(IV1[0])} to ${IV1[1]} (the upper end judged, grade D away from S126's year 1)`);
console.log(`  credence: F3-NSBLEND shaded ${pN.toFixed(3)} x ${H_IF} + the rest x ${Q_ELSE} (judged: the arithmetic under the other causes) -> HELD ${h1.toFixed(2)}, FALSIFIED (the rest x ${F_ELSE}, judged) ${fa1.toFixed(2)}, INCONCLUSIVE ${i1.toFixed(2)}`);

// 2b. THE PREVIEWS (declared under the prediction's Provenance): the preflight's files (results/diagnsb-preflight, the
// registered audit, 4 wealth points, 3 paths a world), read by the registered rule's cells (reduce-nsb.mjs cellsOf). They
// were printed before registration, so they enter here openly, after H_IF, Q_ELSE and F_ELSE (539a49f). The 4-point run
// leaves the share axis as it is (6 points at both) and spaces the wealth nodes 29/3 times as wide as 30 points do: a
// live corner's error along wealth falls by that ratio (a read beside a bend in the bequest) or by its square (a smooth
// bequest), along share not at all. The three readings' weights are judged after the previews (LIVE_W): along share 0.3
// (59 of S370's 63 BASE reads and all of bridge 4's lie in the top share cell, whose live corners are the next share node
// down); along wealth to first order 0.3 (the reads lie by the cliff, where the bequest bends); to second order 0.4 (the
// non-step reads sit above their one-step values though most of their weight is on a zero bequest: a straight line
// across a convex bequest between wide nodes; S126's step year at 4 points already reads near its 30-point floor)
const PREVIEW = { audit: '4dba7bf6a82c', points: 4 }, RATIO = (Number(PTS) - 1) / (PREVIEW.points - 1);
const pv = Object.fromEntries(DECIDING.map(id => [id, JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', 'diagnsb-preflight', `${id.replace(/\s+/g, '_')}.json.gz`))).toString())]));
for (const [id, t] of Object.entries(pv)) if (t.stamp.audit !== PREVIEW.audit || t.points !== PREVIEW.points) throw new Error(`${id}: the preview is not the registered audit's at ${PREVIEW.points} points`);
const cells = cellsOf(pv), tolCells = cells.filter(c => c.counts && (c.a === 'BASE' ? c.cls === 'all' : true));
console.log(`\n2b. ITEM 1: THE PREVIEWS AT ${PREVIEW.points} POINTS (the preflight's files, audit ${PREVIEW.audit}, 3 paths a world; seen before registration, declared)`);
for (const c of cells) console.log(`  ${c.id.padEnd(9)} ${c.a.padEnd(4)} ${c.cls.padEnd(7)}: ${c.n ? `reads ${c.n} paths ${c.paths}, ${c.counts ? 'counts' : 'does not count'}; mean wd ${c.mwd.toFixed(3)} eb/bE ${f3(c.mrel)} r ${c.mr.toFixed(4)} e ${c.me.toFixed(4)}${c.a === 'BASE' && c.cls === 'nonstep' ? `; QUART's margin (a quarter of wd less e) ${f3(QUART1 * c.mwd - c.me)}` : ''}` : 'no reads (no non-step reader year)'}`);
const LIVE_W = [['along share, not refined', 1, 0.3], ['along wealth, first order', RATIO, 0.3], ['along wealth, second order', RATIO ** 2, 0.4]];
let LIVE = 0;
const worstAt = LIVE_W.map(([name, div, w]) => { const worst = Math.max(...tolCells.map(c => c.mr / div)), under = worst < TOL1; if (under) LIVE += w; console.log(`  read ${name} (r over ${div.toFixed(1)}; weight ${w}, judged): the largest TOL cell's r at ${PTS} points ${worst.toFixed(4)}, ${under ? 'every TOL cell under' : 'a TOL cell over'} ${TOL1}`); return [worst, w]; });
// the point: the largest TOL cell's r at 30 points (the cell HELD turns on), the readings' weighted median; 80% from the
// smallest reading to the largest
const sorted = [...worstAt].sort((x, y) => x[0] - y[0]);
let cum = 0; const P1b = sorted.find(([, w]) => (cum += w) >= 0.5)[0];
// FALSIFIED: QUART needs every counting BASE non-step cell. With the read (1 - wd) L over the one-step bE and the live
// error x = L/bE - 1 cut by a factor f at 30 points (wd as at 4 points), a cell reads QUART for f in a band; every cell's
// band must hold one f. None of the three readings lies in it; a live error mostly along share with a small part along
// wealth would: F_ELSE's figure is kept for it
const bandOf = c => { const x = (1 + c.mrel) / (1 - c.mwd) - 1, lo = (1 - QUART1 * c.mwd) / (1 - c.mwd) - 1, hi = (1 + QUART1 * c.mwd) / (1 - c.mwd) - 1; return x > 0 && hi > 0 ? [x / hi, lo > 0 ? x / lo : Infinity] : [NaN, NaN]; };
const quartCells = cells.filter(c => c.counts && c.a === 'BASE' && c.cls === 'nonstep'), bands = quartCells.map(c => [c.id, bandOf(c)]);
const common = [Math.max(...bands.map(([, b]) => b[0])), Math.min(...bands.map(([, b]) => b[1]))];
console.log(`  QUART on every BASE non-step cell needs the live error cut by a common factor f: ${bands.map(([id, b]) => `${id} ${b[0].toFixed(2)} to ${b[1].toFixed(2)}`).join(', ')}; together ${common[0] <= common[1] ? `${common[0].toFixed(2)} to ${common[1].toFixed(2)}` : 'none'} (the readings: 1, ${RATIO.toFixed(1)} and ${(RATIO ** 2).toFixed(1)})`);
const h1b = h1 * LIVE, fa1b = fa1, i1b = 1 - h1b - fa1b;
console.log(`  r's point: the largest TOL cell's r at ${PTS} points ${P1b.toFixed(4)} (the readings' weighted median; 80% ${sorted[0][0].toFixed(4)} to ${sorted[sorted.length - 1][0].toFixed(2)}); S126's floor ${f4(P1)} where the live corners read well`);
console.log(`  credence: HELD ${h1.toFixed(2)} (above) x ${LIVE.toFixed(2)}, the weight of the readings that put every TOL cell under ${TOL1} -> HELD ${h1b.toFixed(2)}; FALSIFIED kept at ${fa1b.toFixed(2)} (the common band above: none of the three readings, a live error mostly along share with a small part along wealth); INCONCLUSIVE ${i1b.toFixed(2)}`);

// 3. ITEM 2
const o = S126.open, N = k => o[k].beq - o[k].short;
const gap = o['BASE BASE-move'].score - o['BASE COV-move'].score, dSurvB = o['BASE BASE-move'].surv - o['BASE COV-move'].surv;
const dNB = N('BASE BASE-move') - N('BASE COV-move'), dNC = N('COV BASE-move') - N('COV COV-move'), corr = dNB - dNC, fStar = gap / corr;
console.log('\n3. ITEM 2: S126\'S OPENING');
console.log(`  BASE's moves ${S126.mv.BASE} (BASE) and ${S126.mv.COV} (COV). Under BASE's tables BASE's move leads by ${f4(gap)} (survival ${f4(dSurvB)}, non-survival ${f4(dNB)}); under COV's the non-survival difference is ${f4(dNC)}: COV's correction to it ${f4(corr)}`);
console.log(`  the swap flips the opening when it supplies at least f* = gap / correction = ${fStar.toFixed(3)} of COV's correction (it moves the non-survival terms alone; survival is the reader's, untouched)`);
// judged: the copy rule gives the read at a near 0.87 the 0.8 node's bequest, COV's edge node the value at its own edge; the
// share of COV's correction the swap supplies is judged normal about 1, sd 0.25 (grade D), so the chance it reaches f*:
const Phi = x => 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI)));
const pFlip = 1 - Phi((fStar - 1) / 0.25), pOther = 0.3;
const h2 = pFlip + (1 - pFlip) * pOther, fa2 = (1 - pFlip) * 0.25, i2 = 1 - h2 - fa2;
console.log(`  the chance the swap reaches f* (its share of COV's correction judged about 1, sd 0.25): ${pFlip.toFixed(2)}; with no flip, a 1% share in some other year judged ${pOther}, no change anywhere 0.25`);
console.log(`  credence (from the EFFECT kind's ${EFFECT}, moved by the opening's arithmetic): HELD ${h2.toFixed(2)}, INCONCLUSIVE ${i2.toFixed(2)}, FALSIFIED ${fa2.toFixed(2)}; point: S126's opening ${S126.mv.BASE} -> ${S126.mv.COV}, other years' shares 80% 0 to 3% (judged)`);
// the preview (declared; kept out of the credence): at 4 points BASE and COV open alike on S126, so there is no COV
// correction for the swap to supply and the opening's stability there says nothing of the 30-point split (59 and 5)
const pv2 = item2(pv);
console.log(`  the preview at ${PREVIEW.points} points (kept out): S126's opening ${pv2.opening.from.join(',')} -> ${pv2.opening.to.join(',')} under BASE's swap, with BASE and COV opening alike (${[...new Set(pv.S126.item2.s.map((s, j) => (s === 0 ? `${pv.S126.item2.arms.BASE.a0[j]} and ${pv.S126.item2.arms.COV.a0[j]}` : null)).filter(Boolean))].join('; ')}): no correction to supply; changed states ${pv2.rows.filter(r => r.ch).map(r => `${r.id} year ${r.s} ${r.ch} of ${r.n}`).join(', ')}, every year under ${100} states`);

// 4. ITEM 3
const S370 = xf('S370'), A = S370.arms.BASE, years = [...new Set(S370.t)].sort((a, c) => a - c);
console.log('\n4. ITEM 3: THE MENU-ORDER REFERENCE ON S370\'S YEARS BEFORE A STEP (BASE)');
const pw = [];
for (const y of years) {
  const J = S370.t.map((_, j) => j).filter(j => S370.t[j] === y), P0 = perPath(S370, J, j => A.read[j] - A.ex5[j]), sg = Math.sign(P0.reduce((t, x) => t + x, 0)) || 1, P = P0.map(x => sg * x);
  const Dv = perPath(S370, J, j => A.read[j] - A.vb[j]).map(x => sg * x), sP = P.reduce((t, x) => t + x, 0), sv = Dv.reduce((t, x) => t + x, 0) / sP, e = Dv.map((d, i) => d - sv * P[i]);
  // power: D = s P + e, the registered tests with B 2,000 flips (the reducer's 20,000 are tighter), 40 draws of the noise's sign
  const powerAt = (s, side) => { let shows = 0; for (let r = 0; r < 40; r++) { const D = P.map((p, i) => s * p + ((((i * 7919 + r * 104729) >>> 0) % 2) ? e[i] : -e[i])); const x = side === 'lo' ? D.map((d, i) => d - LO3 * P[i]) : D.map((d, i) => HI3 * P[i] - d); if (flipP(x, 2000, 7501 + r) < ALPHA / 4) shows++; } return shows / 40; };
  const pl = powerAt(0.6, 'lo'), ph = powerAt(0.1, 'hi');
  pw.push({ y, pl, ph });
  console.log(`  year ${y}: reads ${J.length} paths ${P.length}; rep ${f4(meanOf(J.map(j => A.read[j] - A.ex5[j])))}; vb's share ${sv.toFixed(3)} (XAS-R2's); power of LO at s 0.6 ${pl.toFixed(2)}, of HI at s 0.1 ${ph.toFixed(2)} (each at ${ALPHA}/4, Holm's worst)`);
}
const pR = YB2['YB2-REF'], pwL = Math.min(...pw.map(x => x.pl)), pwH = Math.min(...pw.map(x => x.ph));
// under REF both years read REF with the LO power in each (judged: s near 0.6 in both); under the rest both read NOTREF with
// the HI power where s stays at or under 0.2 (judged 0.7 of that mass: NODEQ and CURV leave the reference's share small)
const h3 = pR * pwL * pwL, fa3 = (1 - pR) * 0.7 * pwH * pwH, i3 = 1 - h3 - fa3;
console.log(`  credence: YB2-REF shaded ${pR.toFixed(3)} x both years' LO power -> HELD ${h3.toFixed(2)}; the rest x 0.7 (judged) x both years' HI power -> FALSIFIED ${fa3.toFixed(2)}; INCONCLUSIVE ${i3.toFixed(2)}`);
console.log(`  s's point: ${(pR * 0.6 + (1 - pR) * 0.1).toFixed(2)} (REF at 0.6, the rest at 0.1); 80% interval -0.10 to 0.75 (judged)`);
// the preview (declared; kept out of the credence): the point lies between its two years and inside the interval, so it
// stands; year 6's reads are all but unmoved by the rebuilt reference at 4 points (no sampling spread to weigh: a property
// of that table, which item 3 measures on the 30-point one); were it carried, it would lower HELD
for (const r of yearsOf(pv.S370)) {
  const P = r.lo.map((l, i) => (l + r.hi[i]) / (HI3 - LO3)), D = r.lo.map((l, i) => l + LO3 * P[i]), sP = P.reduce((a, b) => a + b, 0);
  const I = pv.S370.item3, J = I.t.map((_, j) => j).filter(j => I.t[j] === r.y), moved = J.filter(j => I.rr[j] !== I.ro[j]).length;
  const se = Math.sqrt(D.reduce((a, d, i) => a + (d - r.s * P[i]) ** 2, 0)) / Math.abs(sP), big = Math.max(...J.map(j => Math.abs(I.rr[j] - I.ro[j]))) / Math.max(...J.map(j => Math.abs(I.rr[j] - I.ex5[j])));
  console.log(`  the preview at ${PREVIEW.points} points (kept out): year ${r.y}, ${r.paths} paths: s ${r.s.toFixed(3)} (se ${se.toFixed(3)}, the delta method); the reference moves ${moved} of ${J.length} reads, the largest move ${big.toExponential(1)} of the largest |rep|`);
}
console.log(`\nCREDENCE item 1: point ${P1b.toFixed(4)} HELD ${h1b.toFixed(2)} INCONCLUSIVE ${i1b.toFixed(2)} FALSIFIED ${fa1b.toFixed(2)}`);
console.log(`CREDENCE item 2: point ${fStar.toFixed(3)} HELD ${h2.toFixed(2)} INCONCLUSIVE ${i2.toFixed(2)} FALSIFIED ${fa2.toFixed(2)}`);
console.log(`CREDENCE item 3: point ${(pR * 0.6 + (1 - pR) * 0.1).toFixed(2)} HELD ${h3.toFixed(2)} INCONCLUSIVE ${i3.toFixed(2)} FALSIFIED ${fa3.toFixed(2)}`);
console.log(`\nDERIVED: item 1 HELD ${h1b.toFixed(2)} INCONCLUSIVE ${i1b.toFixed(2)} FALSIFIED ${fa1b.toFixed(2)}; item 2 HELD ${h2.toFixed(2)} INCONCLUSIVE ${i2.toFixed(2)} FALSIFIED ${fa2.toFixed(2)}; item 3 HELD ${h3.toFixed(2)} INCONCLUSIVE ${i3.toFixed(2)} FALSIFIED ${fa3.toFixed(2)}`);
