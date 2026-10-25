// The self time of a .cpuprofile by function and by file: node cpu-top.mjs <file.cpuprofile> [top=30]
import { readFileSync } from 'fs';
const [f, topArg] = process.argv.slice(2), P = JSON.parse(readFileSync(f, 'utf8')), top = Number(topArg || 30);
const byId = new Map(P.nodes.map(n => [n.id, n])), self = new Map();
const dt = P.timeDeltas; let total = 0;
for (let i = 0; i < P.samples.length; i++) { const d = dt[i] || 0; total += d; const n = byId.get(P.samples[i]); const cf = n.callFrame;
  const key = `${cf.functionName || '(anon)'} ${(cf.url || '').split('/').slice(-2).join('/')}:${cf.lineNumber + 1}`; self.set(key, (self.get(key) || 0) + d); }
const rows = [...self.entries()].sort((a, b) => b[1] - a[1]);
console.log(`total ${(total / 1e6).toFixed(1)} s sampled`);
for (const [k, v] of rows.slice(0, top)) console.log(`${(100 * v / total).toFixed(1).padStart(5)}%  ${(v / 1e6).toFixed(1).padStart(7)} s  ${k}`);
const byFile = new Map(); for (const [k, v] of rows) { const file = k.split(' ').slice(-1)[0].split(':')[0]; byFile.set(file, (byFile.get(file) || 0) + v); }
console.log('by file:'); for (const [k, v] of [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`${(100 * v / total).toFixed(1).padStart(5)}%  ${k}`);
