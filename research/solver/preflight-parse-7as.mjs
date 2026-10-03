/*
 * 7AS'S PREFLIGHT PARSE CHECK: reduce-7as.mjs's stamp gate refuses a log launched under "none", and P's records are at 30
 * points and 16,000 paths, so the preflight calls the reducer's own parse, gate and traces at its size (4 wealth points,
 * 100 paths, 100 at the node and across all worlds) with the preflight's own identity jobs as P's tag for the identity check
 * (trivially met: it is the registered run's, against P's records); every other gate check runs in full; P's traces are
 * read from results/diagP against P's logs and cut to the preflight's paths; the reading runs to its outcome line (counted,
 * not printed). Planted: a copy with a 0.002 job's joint line at 0.001, a copy with S194's node line dropped, and a copy
 * with an identity table off its reference must each be refused.
 *   node research/solver/preflight-parse-7as.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, loadTraces, reading, JOBS } from './reduce-7as.mjs';
import * as P from './reduce-P.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7as-preflight'), DIRP = join(HERE, 'results', 'diagP'), SIZE = { n: 100, wn: 100, na: 100, pts: 4 };
const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
const texts = files.map(f => readFileSync(join(DIR, f), 'utf8'));
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const clean = texts.flatMap(parse);
const refOf = js => (id, arm, w) => { const j = js.find(x => x.kind === 'ident:P' && x.id === id && x.arm === arm && x.w === w); if (!j) return null; const t = j.tags.P; return { ...t, ran: t.ran.replace(/(^| )pts \d+(?= |$)/, '$1pts 30').replace(/(^| )grid total\d+x/, '$1grid total30x').replace(/(^| )paths \d+(?= |$)/, `$1paths ${P.N}`) }; };
const run = (txt, ref = refOf(clean)) => { const js = txt.flatMap(parse); return { js, bad: gate(js, ref, SIZE) }; };
const { js, bad } = run(texts);
if (JOBS.some(([kind, id, a, w]) => !js.some(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.done))) { console.log(`PREFLIGHT PARSE FAILED: ${js.filter(j => j.done).length} of ${JOBS.length} jobs done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const planted = [
  ['a 0.002 job\'s joint line at 0.001', () => run(texts.map(t => t.replace(/(joint OFF\/TS\+J\/MC2\/30x5\/W0\.02: true switchMargin 0 switchCharge )0\.002/, '$10.001'))).bad],
  ['S194\'s node line dropped', () => run(texts.map(t => t.replace(/^\s+node OFF\/TS\+J\/MC05\/.*\n/m, ''))).bad],
  ['an identity table off its reference', () => run(texts, (id, a, w) => { const r = refOf(clean)(id, a, w); return r && id === 'S126' ? { ...r, table: '0.0000' } : r; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
const logsOf = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')]));
const logsP = logsOf(DIRP), jobsP = Object.values(logsP).flatMap(P.parse), tb = [];
const TR = loadTraces(js, DIR, P.stampOf(Object.fromEntries(files.map((f, i) => [f, texts[i]]))), jobsP, DIRP, P.stampOf(logsP), tb, { wn: SIZE.wn, na: SIZE.na });
if (tb.length) { console.log(`PREFLIGHT PARSE FAILED: the traces:\n  ${tb.join('\n  ')}`); process.exit(1); }
const tagP = (id, m) => { const j = jobsP.find(x => x.kind === `core:${m}` && x.id === id); return j ? j.tags[m] : null; };
const tag = (id, m) => js.find(x => x.kind === `core:${m}` && x.id === id).tags[m];
let lines = 0, outcome = '';
reading(TR, tagP, tag, l => { lines++; if (/^OUTCOME/.test(l.trim())) outcome = l.trim(); });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${js.length} jobs parsed and gated at the preflight's size (every check but the identity with P's records, which is the registered run's); ${Object.keys(TR).length} traces read (P's cut to the preflight's paths); ${planted.length} planted faults refused; the reading ran to its outcome line (${lines} lines, not read)`);
