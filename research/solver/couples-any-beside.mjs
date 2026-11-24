/*
 * EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL: BESIDE THE READ (EXPLORATORY; written after the read, deciding nothing).
 * From results-couples-any.txt's own unit lines (reduce-couples-any.mjs's output), by class:
 *   - each arm's survival, the paths lost and saved;
 *   - D34's own statistic, the paths lost less the paths saved, against each unit's threshold in whole paths
 *     (reduce-share-rules.mjs harmExact: flagged where it passes the threshold), and the unit nearest its threshold;
 *   - the mean pot and the capped pot, and lifetime tax, ROUTE against APP;
 * then by couple over the classes the rule reads (W, R, L, P), in pounds a path as D116 asks (the capped pot, and lifetime
 * tax ROUTE less APP), and N's units one by one, beside C's question. Reads the results file only; runs nothing.
 * Each part of a unit line is read on its own: the capped pot is absent where a unit has no cap, and a threshold may end in
 * FLAGGED (the reviewer at the read, MINOR 4); --planted checks both on planted lines.
 * D34's own rates at each unit's threshold (the reviewer's second look, MINOR 1): from the unit's paths lost, saved and run,
 * as reduce-couples.mjs harmOf takes them (the discordance's upper Clopper-Pearson bound, floored at 0.0101; size-phase4.mjs
 * thresholdFor and harmRate), the threshold in points and the chance a true one-point and a quarter-point loss would be
 * flagged; the threshold in whole paths must be the one the read printed, or the beside exits 1. An N line with no cap or no
 * tax says so (MINOR 2).
 *   node research/solver/couples-any-beside.mjs > research/solver/results-couples-any-beside.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thresholdFor, harmRate } from './size-phase4.mjs';
import { clopperPearson } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const money = s => Number(String(s).replace(/[£,]/g, ''));
export function unitOf(line) {
  const h = line.match(/^\s+(S\S+)\s+APP ([\d.]+)% ROUTE ([\d.]+)%; (\d+) lost, (\d+) saved of (\d+);/);
  if (!h) return null;
  const pot = line.match(/the mean pot ([+-][\d.]+)%/), cap = line.match(/, capped ([+-][\d.]+)% \((-?£[\d,]+) a path\)/);
  const tax = line.match(/lifetime tax ([+-][\d.]+)% \(APP (£[\d,]+), ROUTE (£[\d,]+) a path\)/), thr = line.match(/the threshold (\d+) paths( FLAGGED)?/);
  return { id: h[1], couple: h[1].split('-')[0], app: +h[2], route: +h[3], lost: +h[4], saved: +h[5], n: +h[6], pot: pot ? +pot[1] : null,
    capped: cap ? +cap[1] : null, cappedGbp: cap ? money(cap[2]) : null, tax: tax ? +tax[1] : null, taxApp: tax ? money(tax[2]) : null,
    taxRoute: tax ? money(tax[3]) : null, taxGbp: tax ? money(tax[3]) - money(tax[2]) : null, thr: thr ? +thr[1] : null, flagged: !!(thr && thr[2]) };
}
export function unitsByClass(text) {
  let cls = null; const by = {};
  for (const l of text.split('\n')) {
    const c = l.match(/^CLASS (\w)/);
    if (c) { cls = c[1]; by[cls] = []; continue; }
    const u = cls ? unitOf(l) : null;
    if (u) by[cls].push(u);
  }
  return by;
}
/* D34's threshold and rates at a unit's paths, as harmOf sets them from its discordance (lost and saved over the paths run) */
export function d34Of(u) {
  const k = u.lost + u.saved, n = u.n, dUp = Math.max(clopperPearson(k, n)[1], 0.0101), t = thresholdFor(dUp, n);
  return { disc: 100 * k / n, dUp, tPts: t, j: Math.round(t * n / 100), tp: harmRate(dUp, n, t, 1), fp: harmRate(dUp, n, t, 0.25) };
}
export const median = xs => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const gbp = x => `${x < 0 ? '-' : '+'}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const range = (a, k, show = x => x) => { const s = a.filter(u => u[k] != null).sort((x, y) => x[k] - y[k]); return s.length ? `${show(s[0][k])} (${s[0].id}) to ${show(s[s.length - 1][k])} (${s[s.length - 1].id})` : 'none read'; };
const pctOf = x => `${x > 0 ? '+' : ''}${x}%`;
const lv = x => `£${Math.round(x).toLocaleString('en-GB')}`;
/* N's line: an absent cap or tax said so, never printed as a figure */
export const nLine = u => `   ${u.id}: the capped pot ${u.capped == null ? 'no cap' : `${pctOf(u.capped)} (${gbp(u.cappedGbp)} a path)`}; lifetime tax ${u.tax == null ? 'not read' : `${pctOf(u.tax)}, ${gbp(u.taxGbp)} a path (APP ${lv(u.taxApp)}, ROUTE ${lv(u.taxRoute)})`}`;
/* each unit with a threshold, with D34's rates; a threshold the read printed that is not D34's at the unit's paths is a mismatch */
export const withD34 = a => a.filter(u => u.thr != null).map(u => { const d = d34Of(u); return { ...u, ...d, net: u.lost - u.saved, margin: u.thr - (u.lost - u.saved), mismatch: d.j !== u.thr }; });
const f3 = x => x.toFixed(3);
const ratesLine = w => `D34's own rates at each unit's threshold (harmOf's, from its paths lost, saved and run): the threshold ${range(w, 'tPts', f3)} points of ${w[0].n} paths; the discordance ${range(w, 'disc', x => `${x.toFixed(2)}%`)}; a true one-point loss flagged ${range(w, 'tp', f3)} of the time, median ${f3(median(w.map(u => u.tp)))}; a quarter-point loss ${range(w, 'fp', f3)}`;

if (process.argv[2] === '--planted') {
  const base = '    S000-Rp1s-own    APP 85.00% ROUTE 90.00%; 3 lost, 200 saved of 4000; spending on the paths both keep +1.0000%, over all paths +1.0000 (+0.9000 to +1.1000)%; the mean pot -50.000%';
  const tail = '; lifetime tax +10.000% (APP £1,000, ROUTE £1,100 a path); the tier map; MPAA ages APP 60/60, ROUTE 60/60';
  const cases = [
    ['a line with its cap and threshold', unitOf(`${base}, capped -5.000% (-£12,345 a path)${tail}; the threshold 40 paths`), u => u.cappedGbp === -12345 && u.thr === 40 && !u.flagged && u.taxGbp === 100],
    ['a line with no cap still read, its threshold too', unitOf(`${base}${tail}; the threshold 40 paths`), u => u && u.capped === null && u.thr === 40],
    ['a line ending FLAGGED read with its threshold and the flag', unitOf(`${base}, capped -5.000% (-£12,345 a path)${tail}; the threshold 40 paths FLAGGED`), u => u.thr === 40 && u.flagged],
    ['N\'s line, no threshold', unitOf(`${base}, capped +1.000% (£2,000 a path)${tail}`), u => u.thr === null && u.cappedGbp === 2000],
    ['not a unit line', unitOf('  1. no harm by D34: HOLDS'), u => u === null],
    ['D34\'s threshold at a unit\'s paths taken as the read prints it', withD34([unitOf(`${base}${tail}; the threshold ${d34Of({ lost: 3, saved: 200, n: 4000 }).j} paths`)])[0], u => !u.mismatch && u.tp > 0 && u.tp < 1 && u.fp < u.tp],
    ['a threshold the read printed that is not D34\'s is a mismatch', withD34([unitOf(`${base}${tail}; the threshold ${d34Of({ lost: 3, saved: 200, n: 4000 }).j + 1} paths`)])[0], u => u.mismatch],
    ['an N line with no cap says so', nLine(unitOf(`${base}${tail}`)), l => /the capped pot no cap;/.test(l) && !/null/.test(l)],
    ['an N line with a cap prints it', nLine(unitOf(`${base}, capped +1.000% (£2,000 a path)${tail}`)), l => /the capped pot \+1% \(\+£2,000 a path\)/.test(l)]];
  let bad = 0;
  for (const [n, u, ok] of cases) { const good = ok(u); if (!good) bad++; console.log(`${good ? 'ok  ' : 'FAIL'} ${n}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  process.exit(bad ? 1 : 0);
}

const FILE = process.argv[2] || join(HERE, 'results-couples-any.txt');
const by = unitsByClass(readFileSync(FILE, 'utf8'));
console.log(`EVERY COUPLE ON THE SOLVER, THE DRESS REHEARSAL: BESIDE THE READ (EXPLORATORY; written after the read, deciding nothing; from ${FILE.replace(/.*research\/solver\//, '')}'s unit lines)`);
for (const [c, a] of Object.entries(by)) {
  if (!a.length) { console.log(`${c}: no unit lines read`); continue; }
  console.log(`${c}, ${a.length} units: ROUTE survives ${range(a, 'route', x => `${x}%`)}; APP ${range(a, 'app', x => `${x}%`)}; paths lost ${range(a, 'lost')}, saved ${range(a, 'saved')}; the mean pot ${range(a, 'pot', pctOf)}; the capped pot ${range(a, 'capped', pctOf)}; lifetime tax ${range(a, 'tax', pctOf)}`);
  const withThr = withD34(a);
  if (withThr.length) {
    const near = [...withThr].sort((x, y) => x.margin - y.margin)[0];
    console.log(`   D34's statistic, the paths lost less the paths saved, against each unit's threshold (${range(withThr, 'thr', x => `${x} paths`)}): from ${range(withThr, 'net')}; flagged ${withThr.filter(u => u.flagged).length}; nearest its threshold ${near.id}, ${near.lost} lost less ${near.saved} saved, ${near.net} against ${near.thr}, a margin of ${near.margin} paths`);
    console.log(`   ${ratesLine(withThr)}`);
    for (const u of withThr.filter(x => x.mismatch)) { console.log(`   MISMATCH: ${u.id}'s threshold ${u.thr} paths in the read, D34's at its paths ${u.j}`); process.exitCode = 1; }
  }
}
const read = ['W', 'R', 'L', 'P'].flatMap(c => by[c] || []), couples = [...new Set(read.map(u => u.couple))];
const readD34 = withD34(read);
if (readD34.length) console.log(`over W, R, L and P, ${readD34.length} units: ${ratesLine(readD34)}; D34's statistic at least ${Math.min(...readD34.map(u => u.margin))} paths below its threshold on every unit; ${readD34.some(u => u.mismatch) ? `the read's threshold not D34's on ${readD34.filter(u => u.mismatch).length}` : `the read's threshold D34's at the unit's paths on all ${readD34.length}`}`);
console.log('by couple, over W, R, L and P, ROUTE against APP:');
for (const cp of couples) {
  const a = read.filter(u => u.couple === cp);
  console.log(`   ${cp}, ${a.length} units: the mean pot ${range(a, 'pot', pctOf)}; the capped pot ${range(a, 'capped', pctOf)}, in pounds a path ${range(a, 'cappedGbp', gbp)}; lifetime tax ${range(a, 'tax', pctOf)}, in pounds a path ${range(a, 'taxGbp', gbp)} (APP's ${range(a, 'taxApp', lv)})`);
}
console.log('N, unit by unit (reported, not read; beside C\'s question):');
for (const u of by.N || []) console.log(nLine(u));
