// read-only: for each household and arm, 7aj (0.01) against 7aw (0.02) on the same 8,000 paths:
// survival moves, and whether the paths that moved had a different tier path or spending path between the weights
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const ROOT = process.argv[2];
const u8 = s => new Uint8Array(Buffer.from(s, 'base64'));
const i16 = s => { const b = Buffer.from(s, 'base64'); return new Int16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const load = (dir, id, arm, w) => {
  const f = join(ROOT, dir, `${id.replace(/ /g, '_')}-${arm}-${arm === 'cand' ? 'candidate' : 'product'}@w${w}.json.gz`);
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  return { N: j.N, Y: j.Y, s: u8(j.survived), tier: u8(j.tier), level: u8(j.level), fail: i16(j.failYear) };
};
const PANEL = ['share 0.50','share 0.70','share 0.78','share 0.90','share 0.95','bridge 0','bridge 1','bridge 6','wealth x0.5','wealth x2','S120','S122','S126','bridge 4','S360','S194','S124','S128','S130','S366','S370','bridge 4+cost','S162','S172','S168'];
const CLASS = { 'bridge 4+cost': 'SW', S172: 'SW', S124: 'SW', S128: 'HC', S370: 'HC', S130: 'HC' };
const penRank = c => { const p = c >> 2; return p === 3 ? 1 : -p; };
const out = [];
for (const id of PANEL) {
  const row = { id, cls: CLASS[id] || '19' };
  for (const arm of ['cand', 'ship']) {
    const a = load('diag7aj', id, arm, '0.01'), b = load('diag7aw', id, arm, '0.02');
    const N = a.N, Y = a.Y;
    let up = 0, down = 0, tierDiffPaths = 0, upT = 0, downT = 0, upL = 0, downL = 0, safer = 0, riskier = 0, firstYrs = [];
    let pyTier2a = 0, pyTier2b = 0, alivePYa = 0, alivePYb = 0;
    for (let i = 0; i < N; i++) {
      let td = false, ld = false, first = -1, dr = 0;
      for (let t = 0; t < Y; t++) {
        const k = i * Y + t;
        if (a.tier[k] !== b.tier[k]) { td = true; if (first < 0) first = t; dr += penRank(b.tier[k]) - penRank(a.tier[k]); }
        if (a.level[k] !== b.level[k]) ld = true;
        if (a.fail[i] < 0 || t < a.fail[i]) { alivePYa++; if ((a.tier[k] >> 2) === 2) pyTier2a++; }
        if (b.fail[i] < 0 || t < b.fail[i]) { alivePYb++; if ((b.tier[k] >> 2) === 2) pyTier2b++; }
      }
      if (td) { tierDiffPaths++; firstYrs.push(first); if (dr < 0) safer++; else if (dr > 0) riskier++; }
      const d = b.s[i] - a.s[i];
      if (d > 0) { up++; if (td) upT++; if (ld) upL++; }
      if (d < 0) { down++; if (td) downT++; if (ld) downL++; }
    }
    firstYrs.sort((x, y) => x - y);
    row[arm] = { up, down, net: up - down, tierDiffPaths, safer, riskier, med1st: firstYrs.length ? firstYrs[firstYrs.length >> 1] : '-', upT, downT, upL, downL, pen2a: (pyTier2a / alivePYa).toFixed(3), pen2b: (pyTier2b / alivePYb).toFixed(3) };
  }
  out.push(row);
}
console.log('household cls | arm: survival paths up/down (net) at 0.02 vs 0.01; moved paths with a different tier path up/down, with a different spending path up/down; paths whose tier path differs (net safer/riskier), median first year; pension tier-2 share of alive path-years 0.01 -> 0.02');
for (const r of out) {
  const f = x => `${String(x.up).padStart(3)}/${String(x.down).padEnd(3)} (${String(x.net).padStart(4)}) T ${x.upT}/${x.downT} L ${x.upL}/${x.downL} | tierdiff ${String(x.tierDiffPaths).padStart(4)} (s${x.safer}/r${x.riskier}) yr${x.med1st} | pen2 ${x.pen2a}->${x.pen2b}`;
  console.log(`${r.id.padEnd(14)} ${r.cls.padEnd(2)} CAND ${f(r.cand)}`);
  console.log(`${''.padEnd(17)} SHIP ${f(r.ship)}`);
}
// the nineteen: totals
const n19 = out.filter(r => r.cls === '19');
const tot = arm => n19.reduce((s, r) => ({ up: s.up + r[arm].up, down: s.down + r[arm].down, upT: s.upT + r[arm].upT, downT: s.downT + r[arm].downT, upL: s.upL + r[arm].upL, downL: s.downL + r[arm].downL }), { up: 0, down: 0, upT: 0, downT: 0, upL: 0, downL: 0 });
console.log('THE NINETEEN, totals:', 'CAND', JSON.stringify(tot('cand')), 'SHIP', JSON.stringify(tot('ship')));
// the direction of each arm's differing tier paths, household by household (all 25)
for (const arm of ['cand', 'ship']) {
  const moved = out.filter(r => r[arm].tierDiffPaths > 0), riskier = moved.filter(r => r[arm].riskier > r[arm].safer), safer = moved.filter(r => r[arm].riskier <= r[arm].safer);
  console.log(`${arm.toUpperCase()} differing tier paths mostly riskier at 0.02 on ${riskier.length} of ${out.length} households, mostly safer on ${safer.length} (${safer.map(r => r.id).join(', ')}), none on ${out.length - moved.length}`);
}
