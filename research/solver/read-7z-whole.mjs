/*
 * 7Z'S TRACES, READ FURTHER (the deep review after 7z, deep-review-log.md 28 Sep 00:38 UK; reported, grade C, no test): the
 * realised whole score (reduce-7t.mjs scorePaths, configured as reduce-7v.mjs configures it) READER+STEP against READER on
 * each case, split into survival, estate and the rest; the paths whose spend level or tier differs in any year; and on
 * share 0.95 the slices by long-run shift, the year the saved paths failed without the fix, and the tier codes held by year.
 * The logs and traces pass reduce-7z.mjs's own stamp gate, fair-test gate and trace check first.
 *   node research/solver/read-7z-whole.mjs > research/solver/results-7z-whole.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode, scorePaths, paired, Z_BINS } from './reduce-7t.mjs';
import { pathsForSeed } from '../engine.mjs';
import * as Z from './reduce-7z.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), D = join(HERE, 'results', 'diag7z');
const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
requireFairLogs(logs, Z.PRED);
const units = Object.values(logs).flatMap(Z.parse), bad = Z.gate(units);
if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
const ST = { code: st[1], audit: st[2], prediction: st[3], sha: st[4] };
const trace = (id, label) => { const u = units.find(x => x.id === id && x.label === label), j = JSON.parse(gunzipSync(readFileSync(join(D, Z.traceName(id, label)))).toString()); if (!Z.traceAgrees(j, ST, label, u.run.sim)) { console.log(`the trace ${id} ${label} is not the log's`); process.exit(1); } return decode(j); };
const field = (ran, k) => Z.field(ran, k);
console.log('7Z\'S TRACES, READ FURTHER (results/diag7z through reduce-7z\'s gates; reported, grade C)\n');
for (const id of Z.CASES) {
  const A = trace(id, 'READER'), B = trace(id, 'READER+STEP'), u = units.find(x => x.id === id && x.label === 'READER');
  const jl = Object.values(logs).join('\n').split('\n').find(l => l.includes('joint READER:') && Object.values(logs).join('\n').split('\n').indexOf(l) > Object.values(logs).join('\n').split('\n').findIndex(x => x.startsWith(id + ' ') && x.includes('unit READER ')));
  const scale = Number(/scale (\S+)/.exec(jl)[1]), cap = Number(/cap (\S+)/.exec(jl)[1]);
  const cfg = { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale, cap };
  cfg.spendYears = Array.from({ length: A.Y }, (_, t) => { for (let i = 0; i < A.N; i++) if (A.level[i * A.Y + t] > 0) return true; return false; });
  const sa = scorePaths(A, cfg), sb = scorePaths(B, cfg), w = paired(sa, sb);
  const part = (T, which) => { const o = new Float64Array(T.N); for (let i = 0; i < T.N; i++) { const alive = T.survived[i] === 1; o[i] = which === 's' ? (alive ? 100 : 0) : (alive ? 100 * 0.02 * Math.min(T.wealth[i * T.Y + T.Y - 1], cfg.cap) / cfg.scale : 0); } return o; };
  const ps = paired(part(A, 's'), part(B, 's')), pe = paired(part(A, 'e'), part(B, 'e'));
  let diffPaths = 0; for (let i = 0; i < A.N; i++) for (let t = 0; t < A.Y; t++) if (A.level[i * A.Y + t] !== B.level[i * A.Y + t] || A.tier[i * A.Y + t] !== B.tier[i * A.Y + t]) { diffPaths++; break; }
  console.log(`${id}: whole score ${w.d.toFixed(3)} +/- ${w.se.toFixed(3)} = survival ${ps.d.toFixed(3)}, estate ${pe.d.toFixed(3)}, the rest ${(w.d - ps.d - pe.d).toFixed(3)}; paths with any spend level or tier different ${diffPaths}`);
  if (id !== 'share 0.95') continue;
  const shifts = pathsForSeed(7002, A.N, A.Y - 1).map(zs => zs[A.Y]);
  const binOf = z => Z_BINS.findIndex(([, f]) => f(z));
  for (let k = 0; k < Z_BINS.length; k++) {
    const idx = [...Array(A.N).keys()].filter(i => binOf(shifts[i]) === k);
    const sv = T => idx.filter(i => T.survived[i]).length / idx.length * 100;
    let saved = 0, lost = 0; for (const i of idx) { if (B.survived[i] && !A.survived[i]) saved++; if (!B.survived[i] && A.survived[i]) lost++; }
    console.log(`   shift ${Z_BINS[k][0].padEnd(16)} n ${String(idx.length).padStart(5)}  READER ${sv(A).toFixed(2)}  READER+STEP ${sv(B).toFixed(2)}  saved/lost ${saved}/${lost}`);
  }
  const fy = {}; for (let i = 0; i < A.N; i++) if (B.survived[i] && !A.survived[i]) fy[A.failYear[i]] = (fy[A.failYear[i]] || 0) + 1;
  console.log(`   the saved paths, the year each failed without the fix (-1: the end pot): ${JSON.stringify(fy)}`);
  const tc = (T, t) => { const c = {}; for (let i = 0; i < T.N; i++) { const v = T.tier[i * T.Y + t]; c[v] = (c[v] || 0) + 1; } return JSON.stringify(c); };
  for (const t of [0, 1, 2, 5, 10, 20, 30]) console.log(`   year ${t}: tier codes held (pension x 4 + ISA) READER ${tc(A, t)}  READER+STEP ${tc(B, t)}`);
  let held = 0; for (let i = 0; i < B.N; i++) { let all = true; for (let t = 1; t <= 30 && t < B.Y; t++) if (B.tier[i * B.Y + t] !== 10) { all = false; break; } if (all) held++; }
  console.log(`   READER+STEP paths holding tier code 10 (2/2) in every year 1 to 30: ${held} of ${B.N}`);
}
