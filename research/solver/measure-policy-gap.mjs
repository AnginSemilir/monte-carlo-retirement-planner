/*
 * STEP 0 OF THE DEEP REVIEW AFTER REF-2 (deep-review-log.md 13 Oct 23:45 UK; PLAN.md O152): a read-only split of each
 * saved run's log gap between its own-opening table and its runs into three terms, by household, world and arm, from the
 * saved files only (no solver):
 *   COPY   = ln(table) - ln(the arm's reference chance at the year-1 states: REF for the proportional reference, OW for ORDER)
 *   GAP    = ln(FB) - ln(that reference), FB the engine's own bridge payment under the better order's fixed move
 *   POLICY = ln(the runs' bridge share) - ln(FB on the same paths): what the policy's own moves pay beyond the fixed move
 * and SAMPLE = ln(FB on the runs' paths) - ln(FB on the flow's), so that ln(runs) - ln(table) = POLICY + SAMPLE + GAP - COPY
 * (an identity, printed; POLICY is read on the runs' own paths, GAP on the ledger's). Beside it, paired on the same paths (the
 * runs' first paths are the ledger flow's): bridges the policy pays that the better fixed move loses, the reverse, and of
 * the first how many neither fixed order pays.
 *   S360: REF-2's ledger (results-ref2.txt, results/diagref2/S360-L) and arms BO and RSO (diagref2), BASE and RS (NE-REF's,
 *         results/diagneref), the tables and runs from results-ref2.txt's 2 x 2.
 *   S364: NE-REF's ledger and RSP (results-neref.txt, results/diagneref/S364-L and S364-RSP; the reference REF, RS's).
 *   node research/solver/measure-policy-gap.mjs > research/solver/results-policy-gap.txt
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const D = 'research/solver/';
const load = f => JSON.parse(gunzipSync(readFileSync(D + f)));
const bits = (j, nm) => Buffer.from(j.bits[nm], 'base64');
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
const cnt = (b, n) => { let s = 0; for (let i = 0; i < n; i++) s += b[i]; return s; };

function paired(pol, fixed, other, n) {
  let pOnly = 0, fOnly = 0, neither = 0;
  for (let i = 0; i < n; i++) { if (pol[i] && !fixed[i]) { pOnly++; if (!other[i]) neither++; } else if (!pol[i] && fixed[i]) fOnly++; }
  return { pOnly, fOnly, neither };
}
function line(hh, arm, k, table, refName, ref, FB, pol, L, ord, n) {
  const fixed = bits(L, `B${k}o${ord}`), other = bits(L, `B${k}o${1 - ord}`), fbN = cnt(fixed, n), polN = cnt(pol, n);
  const COPY = Math.log(table / 100) - Math.log(ref), GAP = Math.log(FB) - Math.log(ref), POLICY = Math.log(polN / n) - Math.log(fbN / n);
  const gap = Math.log(polN / n) - Math.log(table / 100), pr = paired(pol, fixed, other, n), SAMPLE = Math.log(fbN / n) - Math.log(FB);
  console.log(`${hh} ${arm} world ${k}: table ${f4(table)} runs' bridges ${polN}/${n}; ln(runs) - ln(table) ${f4(gap)} = POLICY ${f4(POLICY)} + SAMPLE ${f4(SAMPLE)} + GAP ${f4(GAP)} - COPY ${f4(COPY)} (${refName} ${ref.toExponential(4)}, FB ${FB.toExponential(4)} on the flow's paths, ${fbN}/${n} on the runs'; identity off by ${(gap - (POLICY + SAMPLE + GAP - COPY)).toExponential(1)}); paired on ${n} paths: the policy pays ${pr.pOnly} the better fixed move loses (${pr.neither} paid by neither fixed order), the fixed move pays ${pr.fOnly} the policy loses (${f4(100 * (pr.pOnly - pr.fOnly) / n)} points)`);
}

// S360
const R2 = readFileSync(D + 'results-ref2.txt', 'utf8').split('\n');
const led360 = {}; for (const l of R2) { const m = /^  world (\d): REF (\S+) FS \S+ OW (\S+) OS \S+ OSW \S+ FB (\S+) \(order (\d)\)/.exec(l); if (m) led360[m[1]] = { REF: +m[2], OW: +m[3], FB: +m[4], ord: +m[5] }; }
const tw = R2.find(l => l.includes('the 2 x 2 (own opening'));
const t360 = {}; for (const m of tw.matchAll(/world (\d): BASE ([\d.]+)\/[\d.]+, RS ([\d.]+)\/[\d.]+, BO ([\d.]+)\/[\d.]+, RSO ([\d.]+)\/[\d.]+/g)) t360[m[1]] = { BASE: +m[2], RS: +m[3], BO: +m[4], RSO: +m[5] };
const L360 = load('results/diagref2/S360-L-P4S6Q5.json.gz');
const arms360 = { BASE: load('results/diagneref/S360-BASE-P60S6Q5.json.gz'), RS: load('results/diagneref/S360-RS-P60S6Q5.json.gz'), BO: load('results/diagref2/S360-BO-P60S6Q5.json.gz'), RSO: load('results/diagref2/S360-RSO-P60S6Q5.json.gz') };
for (const arm of ['BASE', 'RS', 'BO', 'RSO']) for (const k of [0, 1, 2]) {
  const l = led360[k], order = arm === 'BO' || arm === 'RSO';
  line('S360', arm, k, t360[k][arm], order ? 'OW' : 'REF', order ? l.OW : l.REF, l.FB, bits(arms360[arm], `OWN${k}b`), L360, l.ord, arms360[arm].NPW);
}
// S364
const RN = readFileSync(D + 'results-neref.txt', 'utf8').split('\n');
const L364 = load('results/diagneref/S364-L-P4S6Q5.json.gz'), RSP = load('results/diagneref/S364-RSP-P60S6Q5.json.gz');
for (const l of RN) {
  const m = /^  world (\d): table (\S+) runs \S+ REF (\S+) FS \S+ OW (\S+) OS \S+ FB (\S+) \(order (\d)\)/.exec(l);
  if (!m) continue;
  const k = +m[1], pol = bits(RSP, `P${k}b`);
  line('S364', 'RSP', k, +m[2], 'REF', +m[3], +m[5], pol, L364, +m[6], pol.length);
}
// S360's runs under ORDER against BASE's, paired path by path (survival), with the exact two-sided sign test (the deep
// review after REF-2's flag)
const binom2 = (a, b) => { const m = a + b, lo = Math.min(a, b); let c = 1, p = 0; for (let i = 0; i <= m; i++) { if (i <= lo) p += c; c = c * (m - i) / (i + 1); } return Math.min(1, 2 * p / 2 ** m); };
for (const k of [0, 1, 2]) {
  const a = bits(arms360.BASE, `OWN${k}`), b = bits(arms360.BO, `OWN${k}`); let onlyA = 0, onlyB = 0;
  for (let i = 0; i < a.length; i++) { if (a[i] && !b[i]) onlyA++; else if (!a[i] && b[i]) onlyB++; }
  console.log(`S360 runs, BO against BASE, world ${k}: ${onlyA} paths survive only under BASE, ${onlyB} only under BO (exact two-sided sign test ${binom2(onlyA, onlyB).toExponential(2)})`);
}
