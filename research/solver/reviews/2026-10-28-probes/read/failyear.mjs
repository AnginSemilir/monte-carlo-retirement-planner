import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const tot = { app: [0, 0, 0, 0], cand: [0, 0, 0, 0] };
for (const h of panel) for (const [a, w] of [['app', '-'], ['cand', '0.02']]) {
  const u = JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${a}-w${w}.json.gz`)).toString()), Y = u.Y, n = 16000;
  const s = dec(u.main.survived, Uint8Array), fy = dec(u.main.failYear, Int16Array), L = dec(u.main.level, Uint8Array);
  for (let i = 0; i < n; i++) { if (s[i]) continue; const t = fy[i]; const T = tot[a]; T[0]++; if (t === Y - 1) { T[3]++; continue; } const l = L[i * Y + t]; if (l <= 80) T[1]++; else T[2]++; }
}
for (const [a, T] of Object.entries(tot)) console.log(`${a}: failed paths ${T[0]} over 40 x 16000; failing in a year at the floor (level <= 80) ${T[1]}, above the floor ${T[2]} (${(100 * T[2] / T[0]).toFixed(1)}%), at the last year (the minimum pot or the final year) ${T[3]}`);
