/*
 * M15 v3's probe, read by its rule (research/reviews/2026-10-26/GIA-LADDER.md, committed before the runs): each household's
 * LADDER against its CAND, paired on the same paths; the fair test first (the same paths, seed, points, weight and plan).
 *   node gia-read.mjs <probe dir>
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const dir = process.argv[2];
const units = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
const keyOf = u => `${u.id}${u.gain ? ` at a ${Math.round(100 * u.gain)}% gain` : ''}`;
const groups = {};
for (const u of units) (groups[keyOf(u)] = groups[keyOf(u)] || {})[u.arm] = u;
const paired = (a, b) => { const n = a.length; let s = 0; for (let i = 0; i < n; i++) s += b[i] - a[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (b[i] - a[i] - m) ** 2; return [m, Math.sqrt(v / (n - 1) / n)]; };
const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
let pass = false, harm = false, cost = true; const rows = [];
console.log('M15 v3, THE GIA\'S OWN RUNGS (EXPLORATORY): LADDER less CAND, paired on the same paths of the tuning seed, 45 wealth points, estate weight 0.02, the solver\'s forward run');
console.log(`  the code: ${[...new Set(units.map(u => u.codeHash))].join(', ')} (src/solver and candidate.json hashed; one value means every arm ran on the same code)`);
for (const [k, g] of Object.entries(groups).sort()) {
  const a = g.CAND, b = g.LADDER;
  if (!a || !b) { console.log(`  ${k}: ${a ? 'LADDER' : 'CAND'} not in`); continue; }
  const same = ['paths', 'seed', 'points', 'w', 'T', 'gain', 'codeHash'].every(x => a[x] === b[x]);
  if (!same) { console.log(`  ${k}: NOT A FAIR TEST (${['paths', 'seed', 'points', 'w', 'T', 'gain', 'codeHash'].map(x => `${x} ${a[x]}/${b[x]}`).join(', ')})`); continue; }
  const sa = dec(a.perPath.survived, Uint8Array), sb = dec(b.perPath.survived, Uint8Array), wa = dec(a.perPath.whole, Float64Array), wb = dec(b.perPath.whole, Float64Array);
  const [dS, seS] = paired(Array.from(sa, x => 100 * x), Array.from(sb, x => 100 * x)), [dW, seW] = paired(Array.from(wa), Array.from(wb));
  let saved = 0, lost = 0; for (let i = 0; i < sa.length; i++) { if (sb[i] && !sa[i]) saved++; if (sa[i] && !sb[i]) lost++; }
  const ratio = b.solveSecs / a.solveSecs, gl = b.giaLadder;
  const gainS = dS - 1.96 * seS > 0 && dS >= 0.5, gainW = dW - 1.96 * seW > 0 && dW >= 0.5;
  const lossS = dS + 1.96 * seS < 0 && dS <= -0.5, lossW = dW + 1.96 * seW < 0 && dW <= -0.5;
  if (gainS || gainW) pass = true; if (lossS || lossW) harm = true; if (gl && gl.on && ratio > 1.7) cost = false;
  console.log(`  ${k}: the GIA ${gl ? (100 * gl.share).toFixed(0) : '?'}% of the pots, rungs ${gl && gl.on ? `added (layers ${b.layers})` : 'NOT added (under the gate)'}`);
  console.log(`    survival ${a.survival.toFixed(3)}% to ${b.survival.toFixed(3)}%: ${f(dS)} points (se ${seS.toFixed(3)}; 95% ${f(dS - 1.96 * seS)} to ${f(dS + 1.96 * seS)}; ${saved} saved, ${lost} lost); the whole score ${f(dW)} (se ${seW.toFixed(3)}; 95% ${f(dW - 1.96 * seW)} to ${f(dW + 1.96 * seW)})`);
  console.log(`    a GIA rung in ${(100 * b.rungShare).toFixed(1)}% of spending years; ${b.giaChangesPerPath.toFixed(2)} GIA switches a path; switches paid £${Math.round(b.switchPaidPerPath)} a path (CAND £${Math.round(a.switchPaidPerPath)}); the solve ${a.solveSecs.toFixed(0)} s to ${b.solveSecs.toFixed(0)} s (x${ratio.toFixed(2)}), ${a.moves} to ${b.moves} moves`);
}
// the registered pairs (GIA-LADDER.md, the probe): no verdict until every one is in and fair
const EXPECTED = ['S206', 'S224', 'S330', 'S330 at a 40% gain', 'S390'];
const fair = EXPECTED.filter(k => groups[k] && groups[k].CAND && groups[k].LADDER && ['paths', 'seed', 'points', 'w', 'T', 'gain', 'codeHash'].every(x => groups[k].CAND[x] === groups[k].LADDER[x]));
if (fair.length < EXPECTED.length) { console.log(`INCOMPLETE: ${fair.length} of ${EXPECTED.length} registered pairs in and fair (missing ${EXPECTED.filter(k => !fair.includes(k)).join(', ')}): no verdict yet`); process.exit(0); }
console.log(`RULE: a gain beyond noise of at least 0.5 (survival or the whole score) on one household or more: ${pass ? 'YES' : 'no'}; a loss beyond noise of more than 0.5 on any: ${harm ? 'YES' : 'no'}; the solve within 1.7x on every qualifying household: ${cost ? 'yes' : 'NO'}`);
console.log(`VERDICT: ${pass && !harm && cost ? 'PASSES: the ladder goes to a proper build (the engine, the full panel, gate 5)' : 'DOES NOT PASS: M15 closes, the GIA keeps the plan\'s tier'}`);
