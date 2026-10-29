import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const n = 16000, acc = {}; const worse = { '0.02': [], '0.01': [] };
for (const h of panel) {
  const per = {};
  for (const [a, w] of [['app', '-'], ['ship', '0.02'], ['cand', '0.02'], ['ship', '0.01'], ['cand', '0.01']]) {
    const u = JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${a}-w${w}.json.gz`)).toString()), Y = u.Y;
    const s = dec(u.main.survived, Uint8Array), um = dec(u.main.unmet, Float32Array), f = dec(u.main.failYear, Int16Array), d = dec(u.main.delivered, Float32Array);
    let U = 0, Uf = 0, nf = 0, yl = 0, nfe = 0; for (let i = 0; i < n; i++) { U += um[i]; if (!s[i]) { nf++; Uf += um[i]; if (f[i] < Y - 1) { nfe++; yl += Y - 1 - f[i]; } } }
    let D0 = 0; for (let i = 0; i < n; i++) D0 += d[i];
    const k = `${a}${w === '-' ? '' : w}`; per[k] = { unmetShare: 100 * U / D0, unmetPerFail: nf ? Uf / nf / h.target : 0, yearsLeft: nfe ? yl / nfe : 0 };
    const A = (acc[k] ||= { unmetShare: 0, unmetPerFail: 0, yearsLeft: 0 }); for (const x of Object.keys(A)) A[x] += per[k][x] / 40;
  }
  for (const w of ['0.02', '0.01']) if (per[`cand${w}`].unmetShare > per.app.unmetShare) worse[w].push(`${h.id} ${per[`cand${w}`].unmetShare.toFixed(3)} vs ${per.app.unmetShare.toFixed(3)}`);
}
for (const [k, A] of Object.entries(acc)) console.log(`${k}: unmet spending as a share of spending delivered ${A.unmetShare.toFixed(3)}%; on a failed path, unmet in years of target ${A.unmetPerFail.toFixed(2)}; years left after a failure before the last year ${A.yearsLeft.toFixed(1)}`);
for (const w of ['0.02', '0.01']) console.log(`W${w}: households where CAND's unmet share exceeds APP's: ${worse[w].length} (${worse[w].join('; ')})`);
