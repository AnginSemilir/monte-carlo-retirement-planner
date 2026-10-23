// SPEED REVIEW (EXPLORATORY): the ratios SPEED-REVIEW.md quotes, printed from results-speed.txt's own lines (CHECKLIST 6).
// A command line ("$ ...") is followed by its result lines: two for a BASE-beside-PROTO pair, one otherwise (its comment
// says which). Prints each pair's solve and engine ratios, PROTO's engine with its sharing off and on, the memos' share
// of duplicates, the scores checked, and gate 5's bound on S362.
// usage: node speed-figures.mjs <results-speed.txt>
import { readFileSync } from 'fs';
const lines = readFileSync(process.argv[2], 'utf8').split('\n');
const runs = [];   // { part, cmd, role, d }
let part = '', cmd = '', n = 0;
for (const ln of lines) {
  const p = /^PART ([A-E])\./.exec(ln); if (p) { part = p[1]; continue; }
  if (ln.startsWith('$ ')) { cmd = ln; n = 0; continue; }
  if (!ln.startsWith('{"id"')) continue;
  const d = JSON.parse(ln);
  if (!d.arm || !(part === 'A' || part === 'B')) continue;   // the pairs and long runs only (parts C and D are profiles and notes)
  const role = / side by side$/.test(cmd) ? (n === 0 ? 'BASE' : 'PROTO') : /# BASE\b/.test(cmd) ? 'BASE' : 'PROTO';
  runs.push({ part, cmd, role, d, plant: /MEMO=0|PLANT=/.test(cmd), again: /PROTO again/.test(cmd), weight: d.w });
  n++;
}
const key = r => `${r.part === 'A' ? '0b403ac' : '2d7cce3'} ${r.d.id} ${r.d.arm} ${r.d.points}pt w${r.d.w}`;
const f = (x, k = 2) => (x === null || x === undefined ? '-' : x.toFixed(k));
const groups = new Map();
for (const r of runs) { if (r.plant) continue; const k = key(r); if (!groups.has(k)) groups.set(k, { BASE: null, PROTO: [] }); const g = groups.get(k); if (r.role === 'BASE') g.BASE = g.BASE || r; else g.PROTO.push(r); }
console.log('pair (commit, household, arm, points, weight)      solve: BASE  PROTO  times | engine ms: BASE  PROTO(on)  times | PROTO off  on  times | memo dup  aref dup');
for (const [k, g] of groups) {
  const b = g.BASE, p = g.PROTO[0], pe = g.PROTO.find(x => x.again) || g.PROTO.find(x => x.d.engineMsPerPath !== null) || p;
  if (!p) continue;
  const sb = b ? b.d.solveS : null, sp = p.d.solveS;
  const eb = b ? b.d.engineMsPerPath : null, ep = pe ? pe.d.engineMsPerPath : null, eo = pe ? pe.d.engineMsPerPathShareOff : null;
  const ms = p.d.memoStats, am = p.d.arefMemo;
  console.log(`${k.padEnd(50)} ${f(sb, 1).padStart(8)} ${f(sp, 1).padStart(6)} ${sb ? f(sb / sp) : '-'} | ${f(eb, 1).padStart(6)} ${f(ep, 1).padStart(6)} ${eb && ep ? f(eb / ep) : '-'} | ${f(eo, 1).padStart(6)} ${f(ep, 1).padStart(5)} ${eo && ep ? f(eo / ep) : '-'} | ${ms && ms.hits + ms.miss > 0 ? f(100 * ms.hits / (ms.hits + ms.miss), 1) + '%' : '-'} ${am && am.hits + am.miss > 0 ? f(100 * am.hits / (am.hits + am.miss), 1) + '%' : ''}`);
  if (b && b.d.arefSecs && p.d.arefSecs) console.log(`${''.padEnd(50)} the reference's build: ${f(b.d.arefSecs, 1)} s and ${f(p.d.arefSecs, 1)} s, ${f(b.d.arefSecs / p.d.arefSecs)} times`);
}
const checked = runs.filter(r => r.d.scoresChecked).map(r => `${r.d.id} ${r.d.arm} ${r.d.points}pt ${r.d.scoresChecked}`);
console.log(`scores checked bit for bit: ${checked.join('; ')}`);
// gate 5's bound on S362 at 30 points: the build, then a quarter of the rest, over SHIP's one-core solve
const at = (arm, role) => { const g = groups.get(`2d7cce3 S362 ${arm} 30pt w0.02`); return g ? (role === 'BASE' ? g.BASE : g.PROTO[0]) : null; };
const cb = at('CAND', 'BASE'), cp = at('CAND', 'PROTO'), shb = at('SHIP', 'BASE'), shp = at('SHIP', 'PROTO');
if (cb && cp && shb && shp) {
  const bound = r => r.d.arefSecs + (r.d.solveS - r.d.arefSecs) / 4;
  console.log(`gate 5 on S362 at 30 points: today ${f(bound(cb), 1)} s / ${f(shb.d.solveS, 1)} s = ${f(bound(cb) / shb.d.solveS)}; with S1 to S3 ${f(bound(cp), 1)} s / ${f(shp.d.solveS, 1)} s = ${f(bound(cp) / shp.d.solveS)}, against today's SHIP ${f(bound(cp) / shb.d.solveS)}`);
}
