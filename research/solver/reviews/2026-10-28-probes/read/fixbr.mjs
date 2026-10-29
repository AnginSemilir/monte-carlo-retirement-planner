import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const D = process.argv[2];
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
for (const id of process.argv.slice(3)) {
  const c = JSON.parse(gunzipSync(readFileSync(`${D}/${id}-cand-w0.02.json.gz`)).toString()), a = JSON.parse(gunzipSync(readFileSync(`${D}/${id}-app-w-.json.gz`)).toString());
  const Y = c.Y, yrs = c.fixbr.years, n = c.fixbr.N;
  const fl = dec(c.fixbr.level, Uint8Array), cl = dec(c.main.level, Uint8Array), al = dec(a.main.level, Uint8Array), ff = dec(c.fixbr.failYear, Int16Array), cf = dec(c.main.failYear, Int16Array), af = dec(a.main.failYear, Int16Array);
  const stat = (L) => { let below = 0, tot = 0, sum = 0; for (let i = 0; i < n; i++) for (const t of yrs) { const l = L[i * Y + t]; if (l > 0) { tot++; sum += l; if (l < 100) below++; } } return `mean level ${(sum / tot).toFixed(1)}%, below target in ${(100 * below / tot).toFixed(1)}% of path-years`; };
  const failIn = F => { let k = 0; for (let i = 0; i < n; i++) if (F[i] >= 0 && F[i] <= yrs[yrs.length - 1]) k++; return (100 * k / n).toFixed(2); };
  console.log(`${id} fixed years ${yrs.join(',')} (Y ${Y}), first ${n} paths: FIXBR ${stat(fl)}; CAND ${stat(cl)}; APP ${stat(al)}; failing by the last fixed year: FIXBR ${failIn(ff)}% CAND ${failIn(cf)}% APP ${failIn(af)}%; policy ${JSON.stringify(c.fixbr.policy)}`);
}
