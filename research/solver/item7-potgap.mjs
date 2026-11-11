// EXPLORATORY: where item 7's shortlists' extra pot comes from, from SPEED-A's stored per-path arrays (seed 7002)
import { readFileSync } from 'node:fs'; import { gunzipSync } from 'node:zlib';
const DIR = process.argv[2] || new URL('./results/speed-7002/', import.meta.url).pathname;
const f64 = s => { const b = Buffer.from(s, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const u8 = s => new Uint8Array(Buffer.from(s, 'base64'));
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const fmt = x => `£${Math.round(x).toLocaleString('en-GB')}`;
for (const id of ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F']) {
  const u = JSON.parse(gunzipSync(readFileSync(`${DIR}${id}-A.json.gz`)));
  const O = u.arms.OFF, po = f64(O.pot), so = u8(O.survived), n = po.length;
  console.log(`\n${id} (${n} paths): OFF pot mean ${fmt(po.reduce((a, b) => a + b) / n)}, median ${fmt(q(po, .5))}, p10 ${fmt(q(po, .1))}, p90 ${fmt(q(po, .9))}`);
  for (const w of ['structure', 'cells-held@0.005']) {
    const X = u.arms[`OFF:${w}`], px = f64(X.pot), d = px.map((x, i) => x - po[i]);
    const up = d.filter(x => x > 1).length, dn = d.filter(x => x < -1).length, same = n - up - dn;
    // where the mean gain sits: by OFF's pot decile
    const idx = [...po.keys()].sort((a, b) => po[a] - po[b]), dec = [];
    for (let k = 0; k < 10; k++) { const s = idx.slice(k * n / 10, (k + 1) * n / 10); dec.push(s.reduce((a, i) => a + d[i], 0) / n); }
    const tot = d.reduce((a, b) => a + b) / n;
    const r = replay => replay ? Object.entries(replay.parts).map(([k, v]) => `${k} ${v}`).join(', ') : '-';
    console.log(`  ${w}: mean gain ${fmt(tot)} (${(100 * tot / (po.reduce((a, b) => a + b) / n)).toFixed(2)}%), median path gain ${fmt(q(d, .5))}, p10 ${fmt(q(d, .1))}, p90 ${fmt(q(d, .9))}; paths up ${up}, down ${dn}, same ${same}; median pot ${fmt(q(px, .5))} (OFF ${fmt(q(po, .5))}); p10 ${fmt(q(px, .1))}`);
    console.log(`    the mean gain by OFF's pot decile (lowest first, share of it): ${dec.map(x => `${(100 * x / tot).toFixed(0)}%`).join(' ')}`);
    console.log(`    the replay's differing decisions by kind: ${r(u.replay && u.replay[w])}`);
  }
}
