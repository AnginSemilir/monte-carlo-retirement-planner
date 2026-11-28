/*
 * COUPLES-APART'S BESIDE COUNTS (EXPLORATORY, deciding nothing; D154 (5); the reviewer at the read, MINOR 5): counted from
 * the read's own unit lines (results-couples-apart.txt, printed by reduce-couples-any.mjs with APART=1), refusing any count
 * of unit lines but 64. For each couple, and for each wrapper: ROUTE against APP, the mean pot, the pot capped at the estate
 * cap (in per cent and in pounds a path), lifetime tax (in per cent and in pounds a path, ROUTE's less APP's) and spending on
 * the paths both keep; and the same over the units whose mean pot ROUTE leaves smaller.
 *   node research/solver/couples-apart-beside.mjs [results-couples-apart.txt] > research/solver/results-couples-apart-beside.txt
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('./results-couples-apart.txt', import.meta.url));
const pounds = s => Number(s.replace(/[£,]/g, '').replace(/^-/, '-'));
const lines = readFileSync(file, 'utf8').split('\n').filter(l => /^ {4}S\d+F?-R[pi][45][st]-(own|Y75)\s/.test(l));
if (lines.length !== 64) { console.error(`couples-apart-beside: ${lines.length} unit lines, not 64`); process.exit(2); }
const rows = lines.map(l => {
  const m = re => { const x = re.exec(l); if (!x) throw new Error(`couples-apart-beside: no match ${re} in ${l.slice(0, 40)}`); return x; };
  const tax = m(/lifetime tax ([+-][\d.]+)% \(APP (-?£[\d,]+), ROUTE (-?£[\d,]+) a path\)/);
  return { id: l.trim().split(/\s+/)[0], kept: Number(m(/spending on the paths both keep ([+-][\d.]+)%/)[1]), pot: Number(m(/the mean pot ([+-][\d.]+)%/)[1]), capped: Number(m(/capped ([+-][\d.]+)%/)[1]),
    cappedGbp: pounds(m(/capped [+-][\d.]+% \((-?£[\d,]+) a path\)/)[1]), tax: Number(tax[1]), taxGbp: pounds(tax[3]) - pounds(tax[2]) };
});
const gbp = x => `${x < 0 ? '-' : '+'}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
const rng = (rs, k, f) => `${f(Math.min(...rs.map(r => r[k])))} to ${f(Math.max(...rs.map(r => r[k])))}`;
const pc = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}%`;
const line = (name, rs) => `${name} (${rs.length} units): the mean pot lower on ${rs.filter(r => r.pot < 0).length} (${rng(rs, 'pot', pc)}); the capped pot lower on ${rs.filter(r => r.capped < 0).length} (${rng(rs, 'capped', pc)}; ${rng(rs, 'cappedGbp', gbp)} a path); lifetime tax higher on ${rs.filter(r => r.tax > 0).length} (${rng(rs, 'tax', pc)}; ${rng(rs, 'taxGbp', gbp)} a path); the extra tax larger than the capped pot's change on ${rs.filter(r => r.taxGbp > 0 && r.taxGbp > Math.abs(r.cappedGbp)).length}; spending on the paths both keep ${rng(rs, 'kept', pc)}`;
console.log('COUPLES-APART: THE BESIDE COUNTS (EXPLORATORY, deciding nothing; from the read\'s unit lines, results-couples-apart.txt; ROUTE against APP)');
console.log(line('all', rows));
for (const c of [...new Set(rows.map(r => r.id.split('-')[0]))]) console.log(line(c, rows.filter(r => r.id.startsWith(`${c}-`))));
for (const [w, re] of [['the pension apart', /-Rp/], ['the ISA apart', /-Ri/]]) console.log(line(w, rows.filter(r => re.test(r.id))));
for (const c of [...new Set(rows.map(r => r.id.split('-')[0]))]) for (const [w, re] of [['pension', /-Rp/], ['ISA', /-Ri/]]) console.log(line(`${c}, the ${w} apart`, rows.filter(r => r.id.startsWith(`${c}-`) && re.test(r.id))));
console.log(line('the units whose mean pot ROUTE leaves smaller', rows.filter(r => r.pot < 0)));
