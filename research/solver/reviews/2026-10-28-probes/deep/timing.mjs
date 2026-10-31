// Deep review (post hoc, leads only): spending by period of retirement, and the end wealth by outcome, per cohort and arm.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const N0 = 16000, ARMS = [['app', '-'], ['ship', '0.02'], ['cand', '0.02'], ['cand', '0.01']];
const startRetired = new Set(['S026', 'S030', 'S040', 'S050', 'S062', 'S074', 'S090', 'S096', 'S108', 'S132', 'S164', 'S368', 'S384']);
const groups = { 'retired at the start (13)': h => startRetired.has(h.id), 'library, retiring later (7)': h => h.cohort === 'lib' && !startRetired.has(h.id), 'FIRE (20)': h => h.cohort === 'fire' };
const q = (a, x) => { const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(x * s.length))]; };
const res = {}; let p10better = { '0.02': 0, '0.01': 0 }, medLower = { '0.02': 0, '0.01': 0 };
for (const h of panel) {
  const per = {};
  for (const [a, w] of ARMS) {
    const u = JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${a}-w${w}.json.gz`)).toString()), Y = u.Y;
    const s = dec(u.main.survived, Uint8Array), f = dec(u.main.failYear, Int16Array), L = dec(u.main.level, Uint8Array), wl = dec(u.main.wealth, Float32Array);
    let t0 = -1; for (let t = 0; t < Y; t++) if (L[t] > 0) { t0 = t; break; }
    const P = [[0, 5], [5, 10], [10, 20], [20, 99]], sums = P.map(() => 0), cnt = P.map(() => 0);
    for (let i = 0; i < N0; i++) { const fy = s[i] ? Y : f[i]; for (let t = t0; t < Y; t++) { const k = P.findIndex(([x, y]) => t - t0 >= x && t - t0 < y); sums[k] += t < fy ? L[i * Y + t] : 0; cnt[k]++; } }
    per[`${a}${w === '-' ? '' : w}`] = { per: sums.map((x, k) => x / cnt[k]), p10: q(wl.subarray(0, N0), 0.1), p50: q(wl.subarray(0, N0), 0.5) };
  }
  for (const w of ['0.02', '0.01']) { if (w === '0.01' && !per['cand0.01']) continue; const c = per[`cand${w}`]; if (c.p10 > per.app.p10) p10better[w]++; if (c.p50 < per.app.p50) medLower[w]++; }
  for (const [g, sel] of Object.entries(groups)) if (sel(h)) for (const [k, v] of Object.entries(per)) { const R = ((res[g] ||= {})[k] ||= { per: [0, 0, 0, 0], n: 0 }); v.per.forEach((x, j) => (R.per[j] += x)); R.n++; }
}
console.log('mean level (% of target; a year after a failure counts 0) by retired years 0-4, 5-9, 10-19, 20 on, per group and arm');
for (const [g, A] of Object.entries(res)) console.log(`${g}: ${Object.entries(A).map(([k, R]) => `${k} ${R.per.map(x => (x / R.n).toFixed(1)).join('/')}`).join(' | ')}`);
console.log(`end wealth, the unlucky tenth higher under CAND than APP: W0.02 ${p10better['0.02']} of 40, W0.01 ${p10better['0.01']} of 40; the median lower: W0.02 ${medLower['0.02']}, W0.01 ${medLower['0.01']}`);
