// EXPLORATORY: item 7's extra pot against the estate cap (4 x opening wealth, the default 'cap' shape, scored as zero above it)
import { readFileSync } from 'node:fs'; import { gunzipSync } from 'node:zlib';
import { planOf } from './audit-speed.mjs';
const DIR = process.argv[2] || new URL('./results/speed-7002/', import.meta.url).pathname;
const f64 = s => { const b = Buffer.from(s, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const fmt = x => `£${Math.round(x).toLocaleString('en-GB')}`;
for (const id of ['S030', 'S050', 'S090', 'S368', 'S188', 'S304F', 'S328F', 'S340F']) {
  const plan = planOf(id), scale = plan.accounts.reduce((x, a) => x + (+a.balance || 0), 0);
  const u = JSON.parse(gunzipSync(readFileSync(`${DIR}${id}-A.json.gz`))), po = f64(u.arms.OFF.pot), n = po.length;
  const out = [`${id}: opening wealth ${fmt(scale)}, cap ${fmt(4 * scale)} (today's money; the pot is in today's money too)`];
  for (const [label, cap] of [['cap', 4 * scale]]) {
    const above = [...po.keys()].filter(i => po[i] > cap);
    for (const w of ['structure', 'cells-held@0.005']) {
      const px = f64(u.arms[`OFF:${w}`].pot); const tot = px.reduce((a, x, i) => a + x - po[i], 0), ab = above.reduce((a, i) => a + px[i] - po[i], 0);
      out.push(`  ${label} ${fmt(cap)}: OFF's paths above it ${above.length} (${(100 * above.length / n).toFixed(1)}%); ${w}: share of the gain on them ${(100 * ab / tot).toFixed(0)}%`);
    }
  }
  console.log(out.join('\n'));
}
