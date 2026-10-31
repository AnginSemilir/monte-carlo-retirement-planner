import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
let written = 0, own = 0; const agg = { app: 0, cand2: 0, cand1: 0, ship2: 0 }, n = 16000, rows = [];
for (const h of panel) {
  const ld = (a, w) => JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${a}-w${w}.json.gz`)).toString());
  const A = ld('app', '-'), mp = Number(/ minPot (\S+)/.exec(A.ran)[1]); const isW = mp === h.target; isW ? written++ : own++;
  const endFail = u => { const s = dec(u.main.survived, Uint8Array), fy = dec(u.main.failYear, Int16Array), wl = dec(u.main.wealth, Float32Array); let k = 0; for (let i = 0; i < n; i++) if (!s[i] && fy[i] === u.Y - 1 && wl[i] < mp) k++; return 100 * k / n; };
  const ea = endFail(A), ec = endFail(ld('cand', '0.02')), ec1 = endFail(ld('cand', '0.01')), es = endFail(ld('ship', '0.02'));
  agg.app += ea / 40; agg.cand2 += ec / 40; agg.cand1 += ec1 / 40; agg.ship2 += es / 40;
  rows.push(`${h.id} minPot ${mp} (${isW ? 'written in' : 'own'}) end failures APP ${ea.toFixed(2)} CAND/0.02 ${ec.toFixed(2)}`);
}
console.log(rows.join('\n'));
console.log(`written in ${written}, own ${own}; panel mean of end-of-horizon failures (the last year, wealth below the minimum pot), points: APP ${agg.app.toFixed(3)} CAND/0.02 ${agg.cand2.toFixed(3)} CAND/0.01 ${agg.cand1.toFixed(3)} SHIP/0.02 ${agg.ship2.toFixed(3)}`);
