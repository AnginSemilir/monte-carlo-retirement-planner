// the level in the years after a failure, per arm (post hoc): the base unmet spending is measured against
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
for (const [a, w] of [['app', '-'], ['cand', '0.02'], ['ship', '0.02']]) {
  const H = {}; let n = 0;
  for (const h of panel) { const u = JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${a}-w${w}.json.gz`)).toString()), Y = u.Y, s = dec(u.main.survived, Uint8Array), f = dec(u.main.failYear, Int16Array), L = dec(u.main.level, Uint8Array);
    for (let i = 0; i < 16000; i++) { if (s[i] || f[i] >= Y - 1) continue; for (let t = f[i] + 1; t < Y; t++) { const l = L[i * Y + t]; if (l <= 0) continue; H[l] = (H[l] || 0) + 1; n++; } } }
  console.log(`${a}${w}: years after a failure ${n}; their level: ${Object.entries(H).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([l, c]) => `${l}% ${(100 * c / n).toFixed(1)}%`).join(', ')}`);
}
