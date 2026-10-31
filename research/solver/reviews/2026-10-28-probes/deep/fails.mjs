// Deep review (post hoc, leads only): where the solver arms' failures before the last year fall, and what came before them.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import * as E from '../../../../../research/engine.mjs';
import { readPanel } from '../../../../../research/solver/phase4-panel.mjs';
const D = process.argv[2], ARM = process.argv[3] || 'cand', W = process.argv[4] || '0.02';
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const N0 = 16000;
const tot = { early: 0, p110: 0, preAccess: 0, p110pre: 0, rich: 0, p110rich: 0, seq: new Map(), rel: new Map(), relSpa: new Map() };
const rows = [];
for (const h of readPanel()) {
  const ctx = E.buildContext(E.resolveMpaa(h.plan));
  const u = JSON.parse(gunzipSync(readFileSync(`${D}/${h.id}-${ARM}-w${W}.json.gz`)).toString()), Y = u.Y;
  const s = dec(u.main.survived, Uint8Array), f = dec(u.main.failYear, Int16Array), L = dec(u.main.level, Uint8Array), wl = dec(u.main.wealth, Float32Array);
  const a0 = ctx.ageSelf0, nmpa = ctx.nmpa, spa = ctx.owners.find(o => o.key === 'self').statePension ? (ctx.spa || null) : null;
  let early = 0, p110 = 0, pre = 0, p110pre = 0, rich = 0;
  for (let i = 0; i < N0; i++) {
    if (s[i]) continue; const t = f[i]; if (t === Y - 1) continue;
    early++; const age = a0 + t, lp = t > 0 ? L[i * Y + t - 1] : 0;
    const isPre = age < nmpa; if (isPre) pre++;
    const r = wl[i] > ctx.targetSpend * 2; if (r) rich++;
    if (lp >= 110) { p110++; if (isPre) p110pre++; if (r) tot.p110rich++; }
    const key = [3, 2, 1].map(k => (t - k >= 0 ? L[i * Y + t - k] : 0)).map(l => (l >= 110 ? 'R' : l >= 100 ? 'T' : l > 80 ? 'C' : l > 0 ? 'F' : '-')).join('');
    tot.seq.set(key, (tot.seq.get(key) || 0) + 1);
    const ra = Math.floor((age) / 5) * 5; tot.rel.set(ra, (tot.rel.get(ra) || 0) + 1);
  }
  tot.early += early; tot.p110 += p110; tot.preAccess += pre; tot.p110pre += p110pre; tot.rich += rich;
  rows.push(`${h.id} age0 ${a0} retire ${h.plan.demographics.retireAgeSelf} nmpa ${nmpa} Y ${Y}: early fails ${early}, of them before access ${pre}, end wealth above 2 years' target ${rich}; 110% the year before ${p110} (${early ? (100 * p110 / early).toFixed(0) : '-'}%), of them before access ${p110pre}`);
}
console.log(rows.join('\n'));
console.log(`${ARM}/${W}: failures before the last year ${tot.early}; before pension access ${tot.preAccess}; end wealth above two years' target ${tot.rich}; 110% the year before ${tot.p110} (before access ${tot.p110pre}, end wealth above two years' target ${tot.p110rich})`);
console.log('the three years before the failure (R 110%, T 100-109, C 81-99, F the floor), the commonest:', [...tot.seq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${v}`).join(', '));
console.log('the age at failure, by five years:', [...tot.rel.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k} ${v}`).join(', '));
