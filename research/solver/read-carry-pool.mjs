// read-only: the nineteen pooled with the shared paths kept (per path, x summed over the households), so the households'
// common market paths are in the se; and each arm apart
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const ROOT = process.argv[2];
const u8 = s => new Uint8Array(Buffer.from(s, 'base64'));
const load = (dir, id, arm, w) => { const j = JSON.parse(gunzipSync(readFileSync(join(ROOT, dir, `${id.replace(/ /g, '_')}-${arm}-${arm === 'cand' ? 'candidate' : 'product'}@w${w}.json.gz`))).toString()); return u8(j.survived); };
const N19 = ['share 0.50','share 0.70','share 0.78','share 0.90','share 0.95','bridge 0','bridge 1','bridge 6','wealth x0.5','wealth x2','S120','S122','S126','bridge 4','S360','S194','S366','S162','S168'];
const N = 8000;
const sums = { gain: new Float64Array(N), cand: new Float64Array(N), ship: new Float64Array(N) };
let indepVar = 0;
for (const id of N19) {
  const c1 = load('diag7aj', id, 'cand', '0.01'), s1 = load('diag7aj', id, 'ship', '0.01'), c2 = load('diag7aw', id, 'cand', '0.02'), s2 = load('diag7aw', id, 'ship', '0.02');
  const x = new Float64Array(N); for (let i = 0; i < N; i++) { x[i] = (c2[i] - s2[i]) - (c1[i] - s1[i]); sums.gain[i] += x[i]; sums.cand[i] += c2[i] - c1[i]; sums.ship[i] += s2[i] - s1[i]; }
  const m = x.reduce((a, b) => a + b, 0) / N; let v = 0; for (const y of x) v += (y - m) ** 2; indepVar += (v / (N - 1)) / N;
}
for (const [k, a] of Object.entries(sums)) { const m = a.reduce((x, y) => x + y, 0) / N; let v = 0; for (const y of a) v += (y - m) ** 2; const se = Math.sqrt(v / (N - 1) / N); console.log(`${k.padEnd(5)} summed over the nineteen: ${(100 * m).toFixed(3)} points, se ${(100 * se).toFixed(3)} (paths shared), z ${(m / se).toFixed(2)}; paths with any move ${a.filter(y => y !== 0).length}`); }
console.log(`gain se if the households were independent: ${(100 * Math.sqrt(indepVar)).toFixed(3)}`);
