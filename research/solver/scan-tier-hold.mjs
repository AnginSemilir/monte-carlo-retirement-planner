/*
 * How often the solver holds a pot below the plan's own tier (the maintainer's question, 9 Oct: how much is kept in lower
 * tiers as a safety net, against a bucket rule of two to three years' spending in a lower-risk bucket, topped up in good
 * years). A MEASUREMENT over 7aw's closed records (results/diag7aw: the candidate and the shipping default at the estate
 * weight 0.02, 7e's 25 households, 8,000 paths of the tuning seed), behind their own fair-test gate; it decides nothing.
 * Each trace's tier code is held.pen * 4 + held.isa (solve.js l.1565): the steps below the plan's tier the whole pension and
 * the whole ISA are held at that year. The traces carry total wealth, not each pot's, so this counts path-years, not pounds.
 * Per arm and period (years 0-4, 5-14, 15 on), over the path-years still alive: the share with the pension below the plan's
 * tier, with the ISA below it, with either, and the mean steps down; and the households where either is below in more than
 * half of the alive path-years.
 * Alive: the path has not failed by that year (record.mjs perYear's rule).
 *   node research/solver/scan-tier-hold.mjs > research/solver/results-tier-hold.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diag7aw');
export const decode = c => [c >> 2, c & 3];   // [pension steps, ISA steps]
const PERIODS = [['years 0-4', 0, 4], ['years 5-14', 5, 14], ['years 15 on', 15, 1e9]];

// planted: the decoder and the alive filter on a case of known answer
{
  const ok = [[decode(0).join(), '0,0'], [decode(4).join(), '1,0'], [decode(9).join(), '2,1'], [decode(3).join(), '0,3']];
  const bad = ok.filter(([g, w]) => g !== w);
  if (bad.length) { console.log(`PLANTED CHECK FAILED: ${bad.map(([g, w]) => `${g} not ${w}`).join('; ')}`); process.exit(1); }
  console.log(`planted (${ok.length}): the tier code decodes as solve.js writes it`);
}
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
requireFairLogs(logs, 'research/solver/predictions/diag-7aw.md');
console.log(`FAIR-TEST GATE: passed (requireFairLogs over ${Object.keys(logs).length} logs of results/diag7aw, 7aw's registered prediction)`);
const files = readdirSync(DIR).filter(f => f.endsWith('.json.gz')).sort();
const acc = {}, byHH = {};
for (const f of files) {
  const j = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString());
  const arm = j.arm.split('/')[0], N = j.N, Y = j.Y;
  const tier = Buffer.from(j.tier, 'base64'), fy = new Int16Array(new Uint8Array(Buffer.from(j.failYear, 'base64')).buffer);
  const alive = (i, t) => fy[i] < 0 || fy[i] > t;   // record.mjs perYear's rule
  for (const [lab, a, b] of PERIODS) {
    const k = `${arm}|${lab}`, A = (acc[k] ||= { n: 0, pen: 0, isa: 0, either: 0, steps: 0 });
    for (let i = 0; i < N; i++) for (let t = a; t <= Math.min(b, Y - 1); t++) {
      if (!alive(i, t)) continue;
      const [p, s] = decode(tier[i * Y + t]);
      A.n++; if (p) A.pen++; if (s) A.isa++; if (p || s) A.either++; A.steps += p + s;
    }
  }
  const H = (byHH[`${arm}|${j.id}`] ||= { n: 0, either: 0 });
  for (let i = 0; i < N; i++) for (let t = 0; t < Y; t++) { if (!alive(i, t)) continue; H.n++; if (tier[i * Y + t]) H.either++; }
}
const pc = (x, n) => (n ? (100 * x / n).toFixed(1) + '%' : '-');
console.log('\nBELOW THE PLAN\'S OWN TIER, share of the alive path-years (7aw, estate weight 0.02, 25 households, 8,000 paths each)');
for (const arm of ['CAND', 'SHIP']) for (const [lab] of PERIODS) {
  const A = acc[`${arm}|${lab}`];
  console.log(`  ${arm.padEnd(4)} ${lab.padEnd(11)}: pension ${pc(A.pen, A.n)}, ISA ${pc(A.isa, A.n)}, either ${pc(A.either, A.n)}; mean steps down ${(A.steps / A.n).toFixed(3)} (path-years ${A.n})`);
}
for (const arm of ['CAND', 'SHIP']) {
  const hs = Object.entries(byHH).filter(([k]) => k.startsWith(`${arm}|`)).map(([k, H]) => [k.split('|')[1], H.either / H.n]).sort((x, y) => y[1] - x[1]);
  console.log(`  ${arm}: households with either pot below the plan's tier in more than half their alive years: ${hs.filter(x => x[1] > 0.5).length} of ${hs.length}; the most ${hs.slice(0, 5).map(([id, v]) => `${id} ${(100 * v).toFixed(0)}%`).join(', ')}`);
}
