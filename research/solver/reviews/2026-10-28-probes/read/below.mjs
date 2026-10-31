import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const acc = {}; let deeperCand = 0, moreDeepCand = [];
for (const h of panel) {
  const per = {};
  for (const [a, w] of [['app', '-'], ['ship', '0.02'], ['cand', '0.02'], ['cand', '0.01']]) {
    const u = JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${a}-w${w}.json.gz`)).toString()), Y = u.Y, n = u.N, L = dec(u.main.level, Uint8Array);
    let below = 0, deep = 0, floor = 0, short = 0, mild = 0;
    for (let i = 0; i < n * Y; i++) { const l = L[i]; if (l <= 0) continue; if (l < 100) { below++; short += (100 - l) / 100; if (l <= 90) deep++; if (l <= 80) floor++; if (l >= 95) mild++; } }
    const k = `${a}${w === '-' ? '' : w}`; per[k] = { below: below / n, deep: deep / n, floor: floor / n, short: short / n, mild: mild / n };
    const A = (acc[k] ||= { below: 0, deep: 0, floor: 0, short: 0, mild: 0 }); for (const f of Object.keys(A)) A[f] += per[k][f] / 40;
  }
  if (per['cand0.02'].deep > per.app.deep) moreDeepCand.push(`${h.id} ${per['cand0.02'].deep.toFixed(1)} vs ${per.app.deep.toFixed(1)}`);
  if (per['cand0.02'].short > per.app.short) deeperCand++;
}
for (const [k, A] of Object.entries(acc)) console.log(`${k}: panel mean years below target ${A.below.toFixed(2)} (of which 95-99%: ${A.mild.toFixed(2)}; at or below 90%: ${A.deep.toFixed(2)}; at the 80% floor: ${A.floor.toFixed(2)}); shortfall below target, summed over years, in years of target ${A.short.toFixed(3)}`);
console.log(`households where CAND/0.02's summed shortfall below target exceeds APP's: ${deeperCand} of 40; with more years at or below 90%: ${moreDeepCand.length} (${moreDeepCand.join('; ')})`);
