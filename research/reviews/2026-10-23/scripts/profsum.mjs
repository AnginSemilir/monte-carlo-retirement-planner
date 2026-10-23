// Summarise a V8 .cpuprofile: self and inclusive time by function (name, file, line), the top N of each.
// usage: node profsum.mjs <file.cpuprofile> [N]
import { readFileSync } from 'fs';
const [file, nArg = '25', under = ''] = process.argv.slice(2);
const p = JSON.parse(readFileSync(file, 'utf8'));
const byId = new Map(p.nodes.map(n => [n.id, n]));
const self = new Map();
for (let i = 0; i < p.samples.length; i++) { const id = p.samples[i], dt = p.timeDeltas[i] || 0; self.set(id, (self.get(id) || 0) + dt); }
// optional: keep only the samples whose stack passes through a function of this name
if (under) { const par = new Map(); for (const n of p.nodes) for (const c of (n.children || [])) par.set(c, n.id);
  for (const id of [...self.keys()]) { let cur = id, hit = false; while (cur !== undefined) { if (byId.get(cur).callFrame.functionName === under) { hit = true; break; } cur = par.get(cur); } if (!hit) self.delete(id); } }
const key = n => { const cf = n.callFrame; const f = (cf.url || '').split('/').slice(-2).join('/'); return `${cf.functionName || '(anon)'} ${f}:${cf.lineNumber + 1}`; };
const parent = new Map(); for (const n of p.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
const total = [...self.values()].reduce((a, b) => a + b, 0);
const selfBy = new Map(), inclBy = new Map();
for (const n of p.nodes) { const k = key(n); selfBy.set(k, (selfBy.get(k) || 0) + (self.get(n.id) || 0)); }
// inclusive: each sample counted once per distinct function on its stack
for (const [id, dt] of self) {
  const seen = new Set(); let cur = id;
  while (cur !== undefined) { const k = key(byId.get(cur)); if (!seen.has(k)) { seen.add(k); inclBy.set(k, (inclBy.get(k) || 0) + dt); } cur = parent.get(cur); }
}
const N = Number(nArg), pct = x => (100 * x / total).toFixed(1).padStart(5) + '%';
console.log(`total sampled ${(total / 1e6).toFixed(1)} s`);
console.log('SELF'); [...selfBy].sort((a, b) => b[1] - a[1]).slice(0, N).forEach(([k, v]) => console.log(pct(v), k));
console.log('INCLUSIVE'); [...inclBy].sort((a, b) => b[1] - a[1]).slice(0, N).forEach(([k, v]) => console.log(pct(v), k));
