/*
 * 7j's saved and lost paths in detail (descriptive, not an item; predictions/o22-trace.md). Reads the four arms
 * reduce-o22.mjs read behind its gate (results/o22-trace/S360-*.json.gz, results-o22.txt). For each path the 5-point run
 * (q5) and the 15-point run (q15) disagree on: the year q5 fails, whether every earlier year's tier and spending level
 * are the same in both runs, and q5's position in its last paid year (wealth, pension share). Also whether the exact
 * final year changed any path-year at all (q5 against q5x, q15 against q15x).
 * Planted: two made-up runs identical until year 2, where one fails, must report first difference 2, identical before.
 *   node research/solver/o22-detail.mjs > research/solver/results-o22-detail.txt
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const un = (b, T) => { const u = Buffer.from(b, 'base64'); return new T(u.buffer, u.byteOffset, u.byteLength / T.BYTES_PER_ELEMENT); };
const load = arm => { const j = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', 'o22-trace', `S360-${arm}.json.gz`))).toString());
  return { N: j.N, Y: j.Y, survived: un(j.survived, Uint8Array), level: un(j.level, Uint8Array), tier: un(j.tier, Uint8Array), wealth: un(j.wealth, Float32Array), penShare: un(j.penShare, Uint8Array), failYear: un(j.failYear, Int16Array) }; };
// the first year two runs differ in tier or level on path i, and whether they are the same in every year before it
const firstDiff = (a, b, i) => { for (let t = 0; t < a.Y; t++) { const k = i * a.Y + t; if (a.tier[k] !== b.tier[k] || a.level[k] !== b.level[k]) return t; } return -1; };
{ const mk = (lv, fy) => ({ Y: 4, tier: new Uint8Array(4), level: Uint8Array.from(lv), failYear: Int16Array.from([fy]) });
  const d = firstDiff(mk([100, 100, 0, 0], 2), mk([100, 100, 95, 100], -1), 0);
  if (d !== 2) { console.log('PLANTED CHECK FAILED'); process.exit(1); } }
const A = { q5: load('q5'), q15: load('q15'), q5x: load('q5x'), q15x: load('q15x') };
const { N, Y } = A.q5;
const med = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const pathYearsDiffer = (a, b) => { let n = 0; for (let k = 0; k < N * Y; k++) if (a.tier[k] !== b.tier[k] || a.level[k] !== b.level[k]) n++; return n; };
console.log('# 7j (O22) in detail: the paths the 5- and 15-point runs disagree on (descriptive, not an item)');
console.log(`the exact final year against averaged: ${pathYearsDiffer(A.q5, A.q5x)} path-years differ at 5 points, ${pathYearsDiffer(A.q15, A.q15x)} at 15 points (of ${N * Y})`);
for (const [lab, a, b] of [['saved by 15 points (q5 fails, q15 survives)', A.q5, A.q15], ['lost by 15 points (q5 survives, q15 fails)', A.q15, A.q5]]) {
  const ids = []; for (let i = 0; i < N; i++) if (!a.survived[i] && b.survived[i]) ids.push(i);
  const rows = ids.map(i => { const fy = a.failYear[i], d = firstDiff(a, b, i), last = fy > 0 ? i * Y + fy - 1 : -1;
    return { i, fy, d, sameBefore: fy < 0 ? d === -1 || d >= Y - 1 : d === fy, w: last >= 0 ? a.wealth[last] : NaN, ps: last >= 0 ? a.penShare[last] : NaN, lvB: fy >= 0 ? b.level[i * Y + fy] : NaN, tierB: fy >= 0 ? b.tier[i * Y + fy] : NaN }; });
  console.log(`\n${lab}: ${ids.length} paths`);
  if (!ids.length) continue;
  const spend = rows.filter(r => r.fy >= 0);
  console.log(`  failing run fails in a spending year: ${spend.length}; at the end of the plan (under the minimum pot): ${rows.length - spend.length}`);
  console.log(`  the two runs identical (tier and level) in every year before the failure year: ${rows.filter(r => r.sameBefore).length} of ${rows.length}`);
  if (spend.length) {
    console.log(`  failure year (years from the start): median ${med(spend.map(r => r.fy))}, range ${Math.min(...spend.map(r => r.fy))}-${Math.max(...spend.map(r => r.fy))}`);
    console.log(`  the failing run's last paid year: wealth median ${Math.round(med(spend.map(r => r.w)))}, pension share median ${med(spend.map(r => r.ps))}%`);
    console.log(`  the surviving run in that failure year: spending level (% of target) median ${med(spend.map(r => r.lvB))}; tier code median ${med(spend.map(r => r.tierB))}`);
    console.log(`  per path (path: failure year, first difference, wealth and pension share the year before, the survivor's level that year): ${rows.map(r => `${r.i}: ${r.fy}, ${r.d}, ${Math.round(r.w)} at ${r.ps}%, ${r.lvB}`).join('; ')}`);
  }
}
