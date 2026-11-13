// EXPLORATORY: item 7's pot difference on the paths whose OFF pot ends below the estate cap (4 x opening wealth, today's money)
import { readFileSync } from 'node:fs'; import { gunzipSync } from 'node:zlib';
import { planOf } from './audit-speed.mjs';
const DIR = process.argv[2] || new URL('./results/speed-7002/', import.meta.url).pathname;
const f64 = s => { const b = Buffer.from(s, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const W = ['structure', 'cells-held@0.005'], acc = Object.fromEntries(W.map(w => [w, { all: [0, 0], below: [0, 0], capped: [0, 0] }]));
for (const id of ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F']) {
  const scale = planOf(id).accounts.reduce((x, a) => x + (+a.balance || 0), 0), cap = 4 * scale;
  const u = JSON.parse(gunzipSync(readFileSync(`${DIR}${id}-A.json.gz`))), po = f64(u.arms.OFF.pot);
  const line = [id];
  for (const w of W) {
    const px = f64(u.arms[`OFF:${w}`].pot); let b0 = 0, b1 = 0, c0 = 0, c1 = 0;
    for (let i = 0; i < po.length; i++) { if (po[i] <= cap) { b0 += po[i]; b1 += px[i]; } c0 += Math.min(po[i], cap); c1 += Math.min(px[i], cap); }
    const a = acc[w]; a.below[0] += b0; a.below[1] += b1; a.capped[0] += c0; a.capped[1] += c1; a.all[0] += po.reduce((s, x) => s + x, 0); a.all[1] += px.reduce((s, x) => s + x, 0);
    line.push(`${w}: below the cap ${(100 * (b1 / b0 - 1)).toFixed(2)}%, the pot as scored (capped) ${(100 * (c1 / c0 - 1)).toFixed(2)}%`);
  }
  console.log(line.join('; '));
}
for (const w of W) { const a = acc[w], p = ([x, y]) => `${(100 * (y / x - 1)).toFixed(2)}%`; console.log(`POOLED ${w}: the mean pot ${p(a.all)}; on OFF's paths below the cap ${p(a.below)}; the pot as the solver scores it (capped) ${p(a.capped)}`); }
