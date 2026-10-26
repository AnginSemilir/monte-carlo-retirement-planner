// A profile's share in named spans of lines (V8's positionTicks, every function node of the file, inlined code included):
//   node share-lines.mjs <file.cpuprofile> <file name, e.g. solver/solve.js> "<label>=<from>-<to>[+<from>-<to>...]" ...
// Each span's ticks as a share of the whole profile's; a line counts once even if two spans hold it.
import { readFileSync } from 'fs';
const [f, file, ...specs] = process.argv.slice(2), P = JSON.parse(readFileSync(f, 'utf8'));
let total = 0; const byLine = new Map();
for (const n of P.nodes) {
  total += n.hitCount || 0;
  if (!n.callFrame.url.endsWith(file)) continue;
  for (const pt of n.positionTicks || []) byLine.set(pt.line, (byLine.get(pt.line) || 0) + pt.ticks);
}
for (const spec of specs) {
  const [label, spans] = spec.split('='), lines = new Set();
  for (const sp of spans.split('+')) { const [a, b] = sp.split('-').map(Number); for (let l = a; l <= (b || a); l++) lines.add(l); }
  let t = 0; for (const l of lines) t += byLine.get(l) || 0;
  console.log(`${(100 * t / total).toFixed(2).padStart(6)}%  ${label} (${file} lines ${spans})`);
}
