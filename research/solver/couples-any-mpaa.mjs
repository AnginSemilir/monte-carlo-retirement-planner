/*
 * EVERY COUPLE ON THE SOLVER: EACH ARM'S MPAA AGES, BESIDE THE READS (EXPLORATORY; written 25 Nov after the registered read,
 * deciding nothing). The registration reports each arm's MPAA ages and decides nothing on them (`registrations/couples-any.md`,
 * Outcomes). Each unit line of a read (reduce-couples-any.mjs) ends "MPAA ages APP a/b, ROUTE c/d": the first person's then the
 * partner's, from each arm's own context (`audit-couples-any.mjs` `mpaaOf`: APP's the engine's on arm A's plan, ROUTE's the
 * page's own context for the solved couple), so each arm's paths run on its own. This tallies, for the registered read and the
 * dress rehearsal, the units where ROUTE's age is earlier than APP's for one person or both, later, or the same, by class and by
 * couple, and each change. Reads the results files only; runs nothing.
 *   node research/solver/couples-any-mpaa.mjs > research/solver/results-couples-any-registered-mpaa.txt
 *   node research/solver/couples-any-mpaa.mjs --planted
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const num = s => (s === '' || s === undefined ? NaN : Number(s));
/* one unit line: its id, class and the two arms' ages; null where the line is not a unit's or carries no MPAA ages */
export function mpaaOfLine(line, cls) {
  const h = line.match(/^\s+(S\S+)\s+APP [\d.]+% ROUTE [\d.]+%;/), m = line.match(/MPAA ages APP (\d*)\/(\d*), ROUTE (\d*)\/(\d*)/);
  if (!h || !m) return null;
  const app = [num(m[1]), num(m[2])], route = [num(m[3]), num(m[4])];
  const known = [0, 1].filter(i => Number.isFinite(app[i]) && Number.isFinite(route[i]));
  const earlier = known.some(i => route[i] < app[i]), later = known.some(i => route[i] > app[i]);
  return { id: h[1], couple: h[1].split('-')[0], cls, app, route, known: known.length, way: earlier && later ? 'both ways' : earlier ? 'earlier' : later ? 'later' : 'the same' };
}
export function tally(text) {
  let cls = null; const units = [];
  for (const l of text.split('\n')) {
    const c = l.match(/^CLASS (\w)/);
    if (c) { cls = c[1]; continue; }
    const u = cls ? mpaaOfLine(l, cls) : null;
    if (u) units.push(u);
  }
  return units;
}
const ages = a => a.map(x => (Number.isFinite(x) ? x : 'none')).join('/');
function report(name, file, units) {
  const out = [], n = units.length, by = (k, us) => us.filter(u => u.way === k);
  const classes = [...new Set(units.map(u => u.cls))], couples = [...new Set(units.map(u => u.couple))];
  const count = us => `${by('earlier', us).length} earlier, ${by('later', us).length} later, ${by('both ways', us).length} both ways, ${by('the same', us).length} the same`;
  out.push(`${name} (${file}), ${n} units: ROUTE's MPAA ages against APP's for one person or both: ${count(units)}; a unit with an age missing in either arm ${units.filter(u => u.known < 2).length}`);
  out.push(`  by class: ${classes.map(c => `${c} ${by('earlier', units.filter(u => u.cls === c)).length} earlier of ${units.filter(u => u.cls === c).length}`).join('; ')}`);
  out.push(`  by couple: ${couples.map(c => { const us = units.filter(u => u.couple === c); return `${c} ${by('earlier', us).length} earlier of ${us.length}`; }).join('; ')}`);
  const changes = {};
  for (const u of units.filter(x => x.way !== 'the same')) { const k = `APP ${ages(u.app)}, ROUTE ${ages(u.route)}`; (changes[k] ||= []).push(u.id); }
  const ks = Object.keys(changes).sort((a, b) => changes[b].length - changes[a].length || a.localeCompare(b));
  out.push(`  each change: ${ks.length ? ks.map(k => `${k} on ${changes[k].length} (${changes[k].join(', ')})`).join('; ') : 'none'}`);
  return out;
}

if (process.argv[2] === '--planted') {
  const line = (id, a, r) => `    ${id.padEnd(16)} APP 85.00% ROUTE 95.00%; 1 lost, 10 saved of 26000; the rest; MPAA ages APP ${a}, ROUTE ${r}; the threshold 150 paths`;
  const text = ['CLASS W, x', line('S001-W0-own', '60/60', '58/58'), line('S001-W0-Y75', '60/60', '60/60'), 'CLASS R, y', line('S002-Rp1s-own', '58/60', '60/58'), line('S002-Rp1s-Y75', '58/58', '60/58'), line('S002-Ri1s-own', '/', '/'), '    S003 not a unit line'].join('\n');
  const got = tally(text).map(u => `${u.id} ${u.cls} ${u.way} ${u.known}`).join('; ');
  const want = 'S001-W0-own W earlier 2; S001-W0-Y75 W the same 2; S002-Rp1s-own R both ways 2; S002-Rp1s-Y75 R later 2; S002-Ri1s-own R the same 0';
  console.log(got === want ? `planted (5 lines): all read as they should` : `PLANTED CHECK FAILED: got ${got}`);
  process.exit(got === want ? 0 : 1);
}
const out = ["EVERY COUPLE ON THE SOLVER: EACH ARM'S MPAA AGES, BESIDE THE READS (EXPLORATORY; written after the registered read, deciding nothing; from each read's unit lines, the first person's age then the partner's)"];
for (const [name, file] of [['the registered read', 'results-couples-any-registered.txt'], ['the dress rehearsal', 'results-couples-any.txt']]) out.push(...report(name, file, tally(readFileSync(join(HERE, file), 'utf8'))));
console.log(out.join('\n'));
