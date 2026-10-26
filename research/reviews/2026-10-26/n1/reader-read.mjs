// N1's assessment, read by its rule (research/reviews/2026-10-26/N1-ASSESSMENT.md, committed before the runs): NOREADER less CAND, paired
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const dir = process.argv[2];
const units = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
const groups = {}; for (const u of units) (groups[u.id] = groups[u.id] || {})[u.arm] = u;
const paired = (a, b) => { const n = a.length; let s = 0; for (let i = 0; i < n; i++) s += b[i] - a[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (b[i] - a[i] - m) ** 2; return [m, Math.sqrt(v / (n - 1) / n)]; };
const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
const EXPECTED = ['S362', 'S366', 'S368', 'S370', 'S380'];
console.log('N1\'S ASSESSMENT (EXPLORATORY): the bridge reader package on the latest candidate, NOREADER less CAND, paired on the same 8,000 paths of the tuning seed, 45 points, W0.02, the solver\'s forward run');
console.log(`  the code: ${[...new Set(units.map(u => u.codeHash))].join(', ')} (one value: every arm on the same code)`);
let fair = 0, loss = false, small = true;
for (const k of EXPECTED) {
  const g = groups[k] || {}, a = g.CAND, b = g.NOREADER;
  if (!a || !b) { console.log(`  ${k}: ${!a ? 'CAND' : 'NOREADER'} not in`); small = false; continue; }
  if (!['paths', 'seed', 'points', 'w', 'T', 'codeHash'].every(x => a[x] === b[x])) { console.log(`  ${k}: NOT A FAIR TEST`); small = false; continue; }
  fair++;
  const sa = dec(a.perPath.survived, Uint8Array), sb = dec(b.perPath.survived, Uint8Array), wa = dec(a.perPath.whole, Float64Array), wb = dec(b.perPath.whole, Float64Array);
  const [dS, seS] = paired(Array.from(sa, x => 100 * x), Array.from(sb, x => 100 * x)), [dW, seW] = paired(Array.from(wa), Array.from(wb));
  let saved = 0, lost = 0; for (let i = 0; i < sa.length; i++) { if (sb[i] && !sa[i]) saved++; if (sa[i] && !sb[i]) lost++; }
  if ((dS + 1.96 * seS < 0 && dS <= -0.5) || (dW + 1.96 * seW < 0 && dW <= -0.5)) loss = true;
  if (!(Math.abs(dS) <= 0.25 && Math.abs(dW) <= 0.25 && Math.abs(dS) <= 1.96 * seS + 1e-12 && Math.abs(dW) <= 1.96 * seW + 1e-12)) small = false;
  console.log(`  ${k}: survival ${a.survival.toFixed(3)}% (CAND) to ${b.survival.toFixed(3)}% (NOREADER): ${f(dS)} points (se ${seS.toFixed(3)}; 95% ${f(dS - 1.96 * seS)} to ${f(dS + 1.96 * seS)}; ${saved} saved, ${lost} lost); whole score ${f(dW)} (se ${seW.toFixed(3)})`);
  console.log(`    failures before the pension opens ${a.bridgeFails} to ${b.bridgeFails}, after ${a.laterFails} to ${b.laterFails}; the solve ${a.solveSecs.toFixed(0)} s to ${b.solveSecs.toFixed(0)} s (x${(b.solveSecs / a.solveSecs).toFixed(2)})`);
}
if (fair < EXPECTED.length) { console.log(`INCOMPLETE: ${fair} of ${EXPECTED.length} pairs in and fair: no verdict yet`); process.exit(0); }
console.log(`RULE: NOREADER within 0.25 and within noise of CAND everywhere: ${small ? 'YES' : 'no'}; a loss beyond noise of at least 0.5 anywhere: ${loss ? 'YES' : 'no'}`);
console.log(`VERDICT: ${small ? 'THE READER NO LONGER PAYS: delete it (a simpler, faster solve); N1 is not needed' : loss ? 'THE READER DOES REAL WORK: N1 could at best match it; do not build N1 now, simplify by N5 and keep the package' : 'BETWEEN: the reader\'s value is marginal; deleting it is the maintainer\'s call (simplicity and time against a fraction of a point)'}`);
