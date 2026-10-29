import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const ld = (id, a, w) => JSON.parse(gunzipSync(readFileSync(`${D}/${id}-${a}-w${w}.json.gz`)).toString());
const agg = { cand0: 0, ship0: 0, app0: 0 };
const rows = [];
for (const h of panel) {
  const out = [h.id];
  for (const [a, w] of [['app', '-'], ['ship', '0.02'], ['cand', '0.02'], ['cand', '0.01']]) {
    const u = ld(h.id, a, w), Y = u.Y, n = u.N, L = dec(u.main.level, Uint8Array);
    // first retired year: first t where level>0
    let t0 = -1; for (let t = 0; t < Y && t0 < 0; t++) for (let i = 0; i < Math.min(n, 50); i++) if (L[i * Y + t] > 0) { t0 = t; break; }
    const at = t => { let s = 0, b = 0; for (let i = 0; i < n; i++) { s += L[i * Y + t]; if (L[i * Y + t] < 100) b++; } return [(s / n).toFixed(0), (100 * b / n).toFixed(0)]; };
    const [m0, b0] = at(t0), [m1, b1] = at(t0 + 1), [m5, b5] = at(t0 + 5);
    out.push(`${a}${w === '-' ? '' : w}: t${t0} ${m0}% (${b0}% below) t+1 ${m1}% t+5 ${m5}% (${b5}% below)`);
  }
  rows.push(out.join(' | '));
}
console.log(rows.join('\n'));
