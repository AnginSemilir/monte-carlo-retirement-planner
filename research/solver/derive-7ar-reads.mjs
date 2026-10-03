/*
 * 7AR'S READS OF THE NEXT YEAR'S TABLE, recovered from its own lines (the deep review after 7ar, 3 Oct 21:52 UK): for each
 * unit, world and bridge year t, the mean claim at t and at t + 1 (the resid line's table and next) and the mean read term
 * (the dec line's read), so the mean read of world k's year-(t + 1) table at the paths' positions is next + read (grade A:
 * the read term is read less the claim at t + 1, path by path, and the means add). It shows whether an arm's read can move
 * at all when the claim it should track moves: the responsiveness a control needs (CHECKLIST item 6). No item reads it.
 *   node research/solver/derive-7ar-reads.mjs [dir] > research/solver/results-7ar-reads.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7ar');
const files = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort();
if (!files.length) { console.error(`derive-7ar-reads: no case files in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const rows = new Map();
for (const f of files) {
  for (const line of readFileSync(join(DIR, f), 'utf8').split('\n')) {
    let m = /^\s+resid (\S+) world (\d) year (\d+): paths (\d+) table (-?[\d.]+) next (-?[\d.]+)/.exec(line);
    if (m) { const k = `${m[1]}|${m[2]}|${m[3]}`; rows.set(k, { ...(rows.get(k) || {}), claim: Number(m[5]), next: Number(m[6]) }); continue; }
    m = /^\s+dec (\S+) world (\d) year (\d+): paths (\d+) quad (-?[\d.]+) read (-?[\d.]+) end (-?[\d.]+)/.exec(line);
    if (m) { const k = `${m[1]}|${m[2]}|${m[3]}`; rows.set(k, { ...(rows.get(k) || {}), quad: Number(m[5]), read: Number(m[6]) }); }
  }
}
const UNITS = [['READER DEFAULT', 'READER/TS+J/W0.02'], ['READER PCLSI', 'READER/TS+J/W0.02/PCLSI'], ['READER PCLSF', 'READER/TS+J/W0.02/PCLSF'], ['OFF DEFAULT', 'OFF/TS+J/W0.02'], ['OFF PCLSI', 'OFF/TS+J/W0.02/PCLSI']];
const at = (L, k, t) => { const r = rows.get(`${L}|${k}|${t}`); if (!r || r.claim === undefined || r.read === undefined) { console.error(`derive-7ar-reads: ${L} world ${k} year ${t}: a resid or dec line missing`); process.exit(1); } return { ...r, rd: r.next + r.read }; };
const f2 = x => x.toFixed(2);
console.log('7AR\'S READS OF THE NEXT YEAR\'S TABLE (S130, bridge years 0 and 1, access at year 2; means over the 2,000 paths of each world; the read = the claim at t + 1 plus the read term)');
for (const k of [0, 1, 2]) {
  for (const t of [0, 1]) {
    console.log(`world ${k} year ${t} (the read of year ${t + 1}'s table):`);
    for (const [nm, L] of UNITS) { const r = at(L, k, t); console.log(`  ${nm.padEnd(15)} claim at t ${f2(r.claim)}  claim at t+1 ${f2(r.next)}  read term ${f2(r.read)}  the read ${f2(r.rd)}`); }
    for (const [a, b, nm] of [['READER/TS+J/W0.02', 'READER/TS+J/W0.02/PCLSI', 'READER'], ['OFF/TS+J/W0.02', 'OFF/TS+J/W0.02/PCLSI', 'OFF']]) {
      const A = at(a, k, t), B = at(b, k, t);
      console.log(`  ${nm} interpolated less snapped: the claim at t+1 ${f2(B.next - A.next)}, the read ${f2(B.rd - A.rd)}, the read term ${f2(B.read - A.read)}`);
    }
  }
}
