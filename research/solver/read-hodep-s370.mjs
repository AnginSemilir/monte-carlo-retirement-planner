/*
 * S370'S BAD-WORLD OVER-READ UNDER BOTH REFERENCES (O180; the deep-reviewer's consult of 18 Oct 15:09 UK, Q3): HO-DEP's reach
 * step's A and O on S370 at 30 points (results/hodep-reach, runs.log 18 Oct 13:52 UK, 400 paths a world from path 4,000), read
 * from the jobs' own ledger lines, no run: each world's table at its own opening against its runs, the ledger's split of the
 * table less the runs (audit-hodep.mjs: B0 - X = GB + GA + T; GB the bridge years' grid residual, GA after access, T the rest;
 * GL bridge years 4 to 6's part of GB, GD the de-risked layers' part of GB), the bridge years' residual by year, and the de-risked bridge path-years.
 *   node research/solver/read-hodep-s370.mjs > research/solver/results-hodep-s370.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results', 'hodep-reach');
const logs = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8')).filter(t => /^S370\s+case \| job (A|O)\//m.test(t));
if (logs.length !== 2) { console.log(`S370's two reach logs not found (${logs.length})`); process.exit(1); }
console.log('S370 UNDER BOTH REFERENCES (HO-DEP\'s reach step, 30 points, 400 paths a world from path 4,000, seed 7004; read from the jobs\' ledger lines)\n');
for (const arm of ['A', 'O']) {
  const t = logs.find(x => new RegExp(`^S370\\s+case \\| job ${arm}/`, 'm').test(x)), L = `${arm}/P30S6Q5`, esc = L.replace('/', '\\/');
  if (!new RegExp(`done ${esc}`).test(t)) { console.log(`${arm}: the job is not done`); process.exit(1); }
  console.log(`${arm} (${arm === 'A' ? 'the adaptive reference, the RS split, the fix' : 'the order reference'})`);
  for (let k = 0; k < 3; k++) {
    const led = new RegExp(`ledger ${esc} ${k}: (.*)$`, 'm').exec(t), sim = new RegExp(`sim ${esc} ${k} OWN ai (\\d+): (\\d+)/(\\d+)`).exec(t), dr = new RegExp(`derisk ${esc} ${k}: plan layer (\\d+) bridge path-years (\\d+) de-risked (\\d+)`).exec(t);
    if (!led || !sim || !dr) { console.log(`  world ${k}: a line is missing`); process.exit(1); }
    const f = Object.fromEntries([...led[1].matchAll(/(\w+) (-?[\d.]+)/g)].map(m => [m[1], Number(m[2])]));
    console.log(`  world ${k}: table ${f.B0.toFixed(4)} runs ${sim[2]}/${sim[3]} (${(100 * sim[2] / sim[3]).toFixed(4)}), table less runs ${(f.B0 - f.X).toFixed(4)} = GB ${f.GB.toFixed(4)} + GA ${f.GA.toFixed(4)} + T ${f.T.toFixed(4)}; of GB, the de-risked layers' GD ${f.GD.toFixed(4)} and years 4-6's GL ${f.GL.toFixed(4)}; bridge years Y1-Y7 ${[1, 2, 3, 4, 5, 6, 7].map(y => f[`Y${y}`].toFixed(4)).join(', ')}; opening ai ${sim[1]}, bridge path-years ${dr[2]}, de-risked ${dr[3]}`);
  }
}
