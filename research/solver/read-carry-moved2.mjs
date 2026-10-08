// read-only: the moved paths (survival differs 0.01 vs 0.02) per arm, by the direction of their tier difference and whether
// the first tier difference comes before the failure year
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const ROOT = process.argv[2];
const u8 = s => new Uint8Array(Buffer.from(s, 'base64'));
const i16 = s => { const b = Buffer.from(s, 'base64'); return new Int16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const load = (dir, id, arm, w) => { const j = JSON.parse(gunzipSync(readFileSync(join(ROOT, dir, `${id.replace(/ /g, '_')}-${arm}-${arm === 'cand' ? 'candidate' : 'product'}@w${w}.json.gz`))).toString()); return { N: j.N, Y: j.Y, s: u8(j.survived), tier: u8(j.tier), level: u8(j.level), fail: i16(j.failYear) }; };
const PANEL = ['share 0.50','share 0.70','share 0.78','share 0.90','share 0.95','bridge 0','bridge 1','bridge 6','wealth x0.5','wealth x2','S120','S122','S126','bridge 4','S360','S194','S124','S128','S130','S366','S370','bridge 4+cost','S162','S172','S168'];
const CLASS = { 'bridge 4+cost': 'SW', S172: 'SW', S124: 'SW', S128: 'HC', S370: 'HC', S130: 'HC' };
const rank = c => { const p = c >> 2; return p === 3 ? 1 : -p; };
const agg = { cand: {}, ship: {} };
const add = (o, k) => { o[k] = (o[k] || 0) + 1; };
for (const id of PANEL) {
  const parts = [];
  for (const arm of ['cand', 'ship']) {
    const a = load('diag7aj', id, arm, '0.01'), b = load('diag7aw', id, arm, '0.02'), Y = a.Y; const c = {};
    for (let i = 0; i < a.N; i++) {
      const d = b.s[i] - a.s[i]; if (!d) continue;
      let first = -1, dr = 0, lvBefore = false;
      const fT = d > 0 ? a.fail[i] : b.fail[i]; const failT = fT >= 0 ? fT : Y; const endFail = fT < 0;
      for (let t = 0; t < Y; t++) { const k = i * Y + t; if (a.tier[k] !== b.tier[k]) { if (first < 0) first = t; if (t < failT) dr += rank(b.tier[k]) - rank(a.tier[k]); } if (t < failT && a.level[k] !== b.level[k]) lvBefore = true; }
      const tag = `${d > 0 ? "up" : "down"}${endFail ? "@end" : "@yr"}:${first < 0 || first >= failT ? (lvBefore ? 'spendOnly' : 'none') : dr > 0 ? 'riskier' : dr < 0 ? 'safer' : 'mixed'}`;
      add(c, tag); add(agg[arm][CLASS[id] || '19'] ||= {}, tag);
    }
    parts.push(`${arm.toUpperCase()} ${Object.entries(c).sort().map(([k, v]) => `${k} ${v}`).join(', ') || '-'}`);
  }
  console.log(`${id.padEnd(14)} ${(CLASS[id] || '19').padEnd(2)} ${parts.join(' | ')}`);
}
for (const arm of ['cand', 'ship']) for (const [k, v] of Object.entries(agg[arm])) console.log(`TOTAL ${arm.toUpperCase()} ${k}: ${Object.entries(v).sort().map(([a, b]) => `${a} ${b}`).join(', ')}`);
