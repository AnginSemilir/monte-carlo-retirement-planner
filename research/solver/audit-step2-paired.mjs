/*
 * STEP 2, FROM THE SAVED RECORDS - no new solves. For each household, every arm against `new` on the same
 * 3,000 held-out paths: the paired survival difference and its standard error (discordant paths only), and
 * for the ternary check, how many stored moves differ from the exhaustive scan's on the same grid. Written
 * after the partial reduce showed S390 (ternary) and S206/S184 (56 points) outside their gates, to settle
 * whether those gaps are beyond noise before anything is concluded from them.
 */
import { readRecord } from './record.mjs';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const rec = (arm, id) => { const f = join(R, `s2-${arm}`, `${id}.solver.record.json.gz`); return existsSync(f) ? readRecord(f) : null; };
const BASE = process.env.BASE || 'new', ARMS = (process.env.ARMS || 'newex,newq15,newp56').split(','), EXARM = process.env.EXARM || 'newex';
const ids = readdirSync(join(R, `s2-${BASE}`)).filter(f => /^S\d+\.json$/.test(f)).map(f => f.slice(0, -5)).sort();
const paired = (a, b) => { let n10 = 0, n01 = 0; const N = a.length; for (let i = 0; i < N; i++) { if (a[i] && !b[i]) n10++; if (!a[i] && b[i]) n01++; } return { d: 100 * (n01 - n10) / N, se: 100 * Math.sqrt(n10 + n01) / N, n10, n01 }; };
const fmt = (p) => `${p.d >= 0 ? '+' : ''}${p.d.toFixed(2)} +/- ${p.se.toFixed(2)} (${(p.d / Math.max(p.se, 1e-9)).toFixed(1)} se; ${p.n01} gained, ${p.n10} lost)`;
console.log(`paired survival difference, arm minus ${BASE}, on the same 3,000 paths`);
for (const id of ids) {
  const n = rec(BASE, id); if (!n) continue;
  const line = [`${id}`];
  for (const arm of ARMS) { const o = rec(arm, id); if (o) line.push(`${arm} ${fmt(paired(n.paths.survived, o.paths.survived))}`); }
  console.log('  ' + line.join('\n        '));
  const e = rec(EXARM, id);
  if (e && n.pol && e.pol) {
    let diff = 0, tot = 0, diff0 = 0, tot0 = 0; const byT = [];
    for (let t = 0; t < n.pol.length; t++) { let d = 0; for (let i = 0; i < n.pol[t].length; i++) { tot++; if (n.pol[t][i] !== e.pol[t][i]) { diff++; d++; } } byT.push(d); if (t === 0) { diff0 = d; tot0 = n.pol[t].length; } }
    console.log(`        stored moves differing, ternary vs exhaustive: ${diff} of ${tot} cell-years (${(100 * diff / tot).toFixed(4)}%); year 0: ${diff0} of ${tot0}; worst year ${byT.indexOf(Math.max(...byT))} with ${Math.max(...byT)}`);
  }
}
