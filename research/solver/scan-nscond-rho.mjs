/*
 * NS-COND's item 1, rho's distribution per cell (the plan-auditor's BLOCKING 2 on 7bc376fc76, review-log.md 9 Oct UK: the
 * cell means of rho on S370, 1.09e+2 to 1.63e+2, sit far above 1 + elive, and a tail of near-dead reads may drive R and K).
 * A report over NS-COND's own files, behind reduce-nscond.mjs's own gate; it decides nothing and changes no reading.
 * Per item-1 cell (the reducer's own read filter, its count checked against cellsOf), over the reads: rho's 10th, 50th
 * and 90th percentiles and its largest; the reads with rho above TAIL; each read's dR = abs(elive) - abs((1 + elive) /
 * rho - 1), summed over all reads and over the tail, and the reads where dividing by rho makes the read worse (dR < 0);
 * and the cell's means of abs(elive), abs((1 + elive) / rho - 1), abs(eC) and abs(eK) over the reads at or below TAIL.
 * And item 3's reference (the deep review after NS-COND, deep-review-log.md 9 Oct 02:09 UK, FLAG 4): per household and
 * year before a step, the reads where the menu-order reference's read ro equals BASE's rr exactly (where it cannot move
 * the read, so s there is an identity, not a measurement), and the mean abs(rr - ex5) against abs(ro - ex5).
 *   node research/solver/scan-nscond-rho.mjs > research/solver/results-nscond-rho.txt
 *   node research/solver/scan-nscond-rho.mjs --planted
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { PRED, NPW, PTS, UNITS, DECIDING, parse, gate, checkFile, readsOf, cellsOf } from './reduce-nscond.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TAIL = 2;
const CLASSES = [['BASE', 'all'], ['BASE', 'nonstep'], ['COV', 'nonstep']];
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const q = (xs, p) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// the reducer's own read filter (reduce-nscond.mjs cellsOf), applied to one arm and class
export function readsIn(I, a, cls) {
  const A = I.arms[a];
  const J = I.t.map((_, j) => j).filter(j => A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0));
  return J.map(j => readsOf(A, j));
}
export function rhoReport(R, tail = TAIL) {
  const rho = R.map(x => x.rho), dR = R.map(x => Math.abs(x.el) - Math.abs((1 + x.el) / x.rho - 1)), inT = R.map(x => x.rho > tail);
  const core = R.filter((_, i) => !inT[i]);
  return {
    n: R.length, q10: q(rho, 0.1), q50: q(rho, 0.5), q90: q(rho, 0.9), max: rho.length ? Math.max(...rho) : NaN,
    nTail: inT.filter(Boolean).length, sumDR: dR.reduce((s, x) => s + x, 0), sumDRtail: dR.reduce((s, x, i) => s + (inT[i] ? x : 0), 0),
    worse: dR.filter(x => x < 0).length,
    core: { n: core.length, el: mean(core.map(x => Math.abs(x.el))), div: mean(core.map(x => Math.abs((1 + x.el) / x.rho - 1))), eC: mean(core.map(x => Math.abs(x.eC))), eK: mean(core.map(x => Math.abs(x.eK))) },
  };
}

export function item3Report(Y, year) {
  const J = Y.t.map((_, j) => j).filter(j => Y.t[j] === year);
  return { n: J.length, same: J.filter(j => Y.ro[j] === Y.rr[j]).length, errRR: mean(J.map(j => Math.abs(Y.rr[j] - Y.ex5[j]))), errRO: mean(J.map(j => Math.abs(Y.ro[j] - Y.ex5[j]))) };
}

function planted() {
  const r = (el, rho, eC, eK) => ({ el, rho, eC, eK });
  const cases = [];
  // four reads: two at rho 1 (dividing changes nothing), one in the tail that dividing helps, one below it that dividing hurts
  const P = rhoReport([r(0.5, 1, 0.5, 0.5), r(0.5, 1, 0.5, 0.4), r(1, 3, 1, 0.9), r(0.5, 1.5, 0.2, 0.2)]);
  cases.push(['the tail: one read above 2, its dR its own', `${P.nTail} ${P.sumDRtail.toFixed(4)}`, `1 ${(1 - Math.abs(2 / 3 - 1)).toFixed(4)}`]);
  cases.push(['worse: dividing by rho 1.5 moves 1.5 to exactly 1, the read on bE, not worse; none worse', `${P.worse}`, '0']);
  cases.push(['the core means leave the tail out', `${P.core.n} ${P.core.el.toFixed(4)} ${P.core.eK.toFixed(4)}`, `3 ${(0.5).toFixed(4)} ${((0.5 + 0.4 + 0.2) / 3).toFixed(4)}`]);
  const W = rhoReport([r(0.1, 2.5, 0.1, 0.1)]);
  cases.push(['EDGE: a read at rho 2.5 that dividing makes worse counts in worse and in the tail', `${W.worse} ${W.nTail} ${W.core.n}`, '1 1 0']);
  const E = rhoReport([]);
  cases.push(['EDGE: an empty cell reads no read and no percentile', `${E.n} ${Number.isNaN(E.q50)} ${E.nTail}`, '0 true 0']);
  const T = rhoReport([r(0.5, 2, 0.5, 0.5)]);
  cases.push(['EDGE: rho exactly at the tail line stays in the core', `${T.nTail} ${T.core.n}`, '0 1']);
  const Y = { t: [2, 2, 2, 6], rr: [1, 2, 3, 4], ro: [1, 2.5, 3, 0], ex5: [0, 2, 3, 4] }, Q = item3Report(Y, 2);
  cases.push(['item 3: two of year 2\'s three reads unmoved by the reference, year 6 apart', `${Q.n} ${Q.same} ${Q.errRR.toFixed(4)} ${Q.errRO.toFixed(4)}`, `3 2 ${(1 / 3).toFixed(4)} ${(1.5 / 3).toFixed(4)}`]);
  cases.push(['EDGE: a year with no reads reads none', `${item3Report(Y, 9).n} ${item3Report(Y, 9).same}`, '0 0']);
  const bad = cases.filter(([, got, want]) => got !== want);
  if (bad.length) { bad.forEach(([n, got, want]) => console.log(`FAIL ${n}: ${got} (want ${want})`)); console.log(`PLANTED CHECK FAILED: ${bad.length}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should`);
  console.log('EDGES: a read in the tail that dividing makes worse, an empty cell, rho exactly at the tail line, a year with no item-3 reads');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const dir = join(HERE, 'results', 'diagnscond');
  const logs = Object.fromEntries((existsSync(dir) ? readdirSync(dir) : []).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  if (!Object.keys(logs).length) { console.log(`FAIR-TEST GATE: FAILED\n  no logs in ${dir}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const units = Object.values(logs).flatMap(parse), bad = gate(units, { pts: PTS, npw: NPW, pred: PRED });
  const files = {};
  for (const u of units.filter(x => !x.plant && UNITS.includes(x.id))) { const f = join(dir, `${u.id.replace(/\s+/g, '_')}.json.gz`); files[u.id] = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(files[u.id], u)); }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log('FAIR-TEST GATE: passed (reduce-nscond.mjs gate and checkFile over NS-COND\'s logs and files; the identity against XAS-R2 is item 3\'s and is not re-run here)');
  const cells = cellsOf(files), f = x => (Number.isFinite(x) ? x.toExponential(4) : '-');
  console.log(`\nRHO BY CELL (NS-COND item 1's cells; the tail is rho above ${TAIL}; dR = abs(elive) - abs((1 + elive)/rho - 1) per read)`);
  for (const id of DECIDING) for (const [a, cls] of CLASSES) {
    const R = files[id] ? readsIn(files[id].item1, a, cls) : [], c = cells.find(x => x.id === id && x.a === a && x.cls === cls);
    if (!c || c.n !== R.length) { console.log(`  ${id} ${a} ${cls}: read count ${R.length} is not cellsOf's ${c ? c.n : '-'}`); process.exit(1); }
    const P = rhoReport(R);
    console.log(`  ${id.padEnd(9)} ${a.padEnd(4)} ${cls.padEnd(7)} reads ${P.n}: rho q10 ${f(P.q10)} median ${f(P.q50)} q90 ${f(P.q90)} max ${f(P.max)}; tail ${P.nTail} reads; sum dR ${f(P.sumDR)}, the tail's ${f(P.sumDRtail)}; worse after dividing ${P.worse}; without the tail (${P.core.n} reads) abs(elive) ${f(P.core.el)}, divided by rho ${f(P.core.div)}, abs(eC) ${f(P.core.eC)}, abs(eK) ${f(P.core.eK)}`);
  }
  console.log('\nITEM 3\'S REFERENCE (BASE, the years before a step): reads where ro equals rr exactly, and the mean absolute error against ex5 of rr and of ro');
  for (const [id, year] of [['S370', 2], ['S370', 6], ['bridge 4', 2]]) {
    const R = item3Report(files[id].item3, year);
    console.log(`  ${id.padEnd(9)} year ${year}: reads ${R.n}; ro equals rr on ${R.same}; mean abs(rr - ex5) ${f(R.errRR)}, mean abs(ro - ex5) ${f(R.errRO)}`);
  }
}
