/*
 * 7AU'S PREFLIGHT PARSE CHECK: reduce-7au.mjs's stamp gate refuses a log launched under "none", and P's records are at 30
 * points and 16,000 paths, so the preflight calls the reducer's own parse, gate and traces at its size (4 wealth points, 100
 * paths, 100 at the node and across all worlds, 50 for the identity runs) with the preflight's own solve lines as P's for the
 * solve identity (trivially met: the identity with P's records is the registered run's) and the run identity off (a 4-point
 * run cannot equal P's 30-point traces); every other gate check runs in full; P's traces are read from results/diagP against
 * P's logs and cut to the preflight's paths; the reading runs to its outcome line (counted, not printed). Planted: a copy with
 * the node line dropped, a copy with an all line's paths changed, and a copy with a table off its reference must each be
 * refused; and the run identity, switched on, must refuse the 4-point runs against P's (a check shown to bite).
 *   node research/solver/preflight-parse-7au.mjs [dir]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, loadTraces, reading, JOBS, pRefs } from './reduce-7au.mjs';
import * as P from './reduce-P.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'diag7au-preflight'), DIRP = join(HERE, 'results', 'diagP'), SIZE = { n: 100, wn: 100, na: 100, inn: 50, pts: 4 };
const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
const texts = files.map(f => readFileSync(join(DIR, f), 'utf8'));
if (!texts.length) { console.log(`PREFLIGHT PARSE FAILED: no logs in ${DIR}: a check that ran on nothing is an error`); process.exit(1); }
const clean = texts.flatMap(parse);
const ref30 = ran => ran.replace(/(^| )pts \d+(?= |$)/, '$1pts 30').replace(/(^| )grid total\d+x/, '$1grid total30x').replace(/(^| )paths \d+(?= |$)/, '$1paths 16000');
const refOf = js => (id, arm, w) => { const j = js.find(x => x.id === id && x.arm === arm && x.w === w); return j ? { table: j.table, ran: ref30(j.ran), gap: j.gap, joint: j.joint, movesRaw: j.movesRaw, priceRaw: j.priceRaw, worlds: j.worlds } : null; };
const run = (txt, ref = refOf(clean)) => { const js = txt.flatMap(parse); return { js, bad: gate(js, ref, SIZE) }; };
const { js, bad } = run(texts);
if (JOBS.some(([kind, id, a, w]) => !js.some(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.done))) { console.log(`PREFLIGHT PARSE FAILED: ${js.filter(j => j.done).length} of ${JOBS.length} jobs done`); process.exit(1); }
if (bad.length) { console.log(`PREFLIGHT PARSE FAILED: the gate refuses the preflight:\n  ${bad.join('\n  ')}`); process.exit(1); }
const planted = [
  ['the node line dropped', () => run(texts.map(t => t.replace(/^\s+node OFF\/TS\+J\/MP\/.*\n/m, ''))).bad],
  ['an all line\'s paths changed', () => run(texts.map(t => t.replace(/^(\s+all READER\/TS\+J\/MP\/30x5\/W0: .* paths )100 /m, '$199 '))).bad],
  ['a table off its reference', () => run(texts, (id, a, w) => { const r = refOf(clean)(id, a, w); return r && id === 'S126' ? { ...r, table: '0.0000' } : r; }).bad],
];
for (const [nm, f] of planted) if (!(f().length > 0)) { console.log(`PREFLIGHT PARSE FAILED: the gate does not refuse ${nm}`); process.exit(1); }
const logsOf = d => Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')]));
const logsP = logsOf(DIRP), { jobsP, tagP } = pRefs(logsP), ST = P.stampOf(Object.fromEntries(files.map((f, i) => [f, texts[i]]))), STP = P.stampOf(logsP);
const tb = [];
const { TR, SH } = loadTraces(js, DIR, ST, jobsP, DIRP, STP, tb, { wn: SIZE.wn, na: SIZE.na, inn: SIZE.inn, ident: false });
if (tb.length) { console.log(`PREFLIGHT PARSE FAILED: the traces:\n  ${tb.join('\n  ')}`); process.exit(1); }
{ const ib = []; loadTraces(js, DIR, ST, jobsP, DIRP, STP, ib, { wn: SIZE.wn, na: SIZE.na, inn: SIZE.inn }); if (!ib.some(x => /is not P's/.test(x))) { console.log('PREFLIGHT PARSE FAILED: the run identity, switched on, does not refuse 4-point runs against P\'s 30-point traces'); process.exit(1); } }
let lines = 0, outcome = '';
reading(TR, SH, tagP, js, l => { lines++; if (/^OUTCOME/.test(l.trim())) outcome = l.trim(); }, { b: 200 });
if (!outcome) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its outcome line'); process.exit(1); }
console.log(`PREFLIGHT PARSE PASSED: ${js.length} jobs parsed and gated at the preflight's size (every check but the identity with P's records, which is the registered run's; the run identity shown to refuse the 4-point runs); ${Object.keys(TR).length} traces read (P's cut to the preflight's paths); ${planted.length} planted faults refused; the reading reached its outcome line (${lines} lines, not read)`);
