// The hot lines of the named functions in a .cpuprofile (V8's positionTicks): node cpu-lines.mjs <file> <fn,fn> [top]
import { readFileSync } from 'fs';
const [f, fns, topArg] = process.argv.slice(2), P = JSON.parse(readFileSync(f, 'utf8')), want = new Set(fns.split(',')), top = Number(topArg || 25);
const lines = new Map(); let total = 0;
for (const n of P.nodes) { total += n.hitCount || 0; if (!want.has(n.callFrame.functionName)) continue;
  for (const pt of n.positionTicks || []) { const k = `${n.callFrame.functionName}:${pt.line}`; lines.set(k, (lines.get(k) || 0) + pt.ticks); } }
const rows = [...lines.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, v] of rows.slice(0, top)) console.log(`${(100 * v / total).toFixed(2).padStart(6)}%  ${k}`);
