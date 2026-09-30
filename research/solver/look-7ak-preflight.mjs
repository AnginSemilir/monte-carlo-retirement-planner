// 7ak preflight check: reduce-7ak.mjs's parse, content gate and report on the preflight's output (preflight-7ak.sh),
// with P's identity replaced by the units' own and the path count 60 - the stamp gate refuses a preflight by design.
//   node research/solver/look-7ak-preflight.mjs [dir]
import { parse, gate, reading, readTrace } from './reduce-7ak.mjs';
import { readFileSync } from 'node:fs';
const D = process.argv[2] || new URL('./results/diag7ak-pre', import.meta.url).pathname;
const units = ['case0.txt', 'case1.txt'].flatMap(f => parse(readFileSync(`${D}/${f}`, 'utf8')));
const refP = (id, label) => { const u = units.find(x => x.id === id && x.label === label); return u ? { table: u.table, ran: u.ran } : null; };
const traces = (id, A, w, rule) => { const t = readTrace(`${D}/${id.replace(/ /g, '_')}-${A.toLowerCase()}-${rule.toLowerCase().replace(/\+/g, '_')}-world0@w${w}.json.gz`); return [t, t]; };
const bad = gate(units, refP, traces, { np: 60 });
console.log(`GATE on the preflight (P's identity replaced by the units' own, np 60): ${bad.length ? 'FAILED\n  ' + bad.join('\n  ') : 'passed'}`);
for (const u of units) console.log(`${u.id}: access ${JSON.stringify(u.access)}, resid years OPEN0 ${Object.keys(u.resid.OPEN0).length} TS+J ${Object.keys(u.resid['TS+J']).length}`);
if (bad.length) process.exit(1);
reading(units);
