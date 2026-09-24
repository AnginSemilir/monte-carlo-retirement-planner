/*
 * WHY RISK ABOVE THE TIER LOSES ON COMFORTABLE PLANS (M14b, 24 Sep; the maintainer's question: "what's the reasoning at 99%
 * allowing increasing risk tiers has a negative effect?"). A reading of M14b's own records, no run. Both arms saw the
 * same 3,000 market paths, so each path can be compared with itself:
 *   saved / lost   paths that fail without the tier above and survive with it, and the reverse
 *   lost paths     how many ever held the tier above before failing, and how long before
 *   spillover      on paths and years where the arm with the option does NOT hold the tier above, how often its
 *                  spending level or its tier differs from the arm without the option - the option changing behaviour
 *                  where it is never used (the value of a later bet feeding back into today's choices)
 *   tier mix       the share of paid years each arm holds at each tier
 * Tier codes are tierPen * 4 + tierIsa (record.mjs); the menu's index 0 is the plan's tier, 1 and 2 one and two below,
 * and 3 one above (src/solver/fast.js tiersFor: "the tiers above go AFTER the ones below"), so 0, 5, 10 and 15 here.
 * Levels are percent of target.
 *
 *   node research/solver/diagnose-m14b.mjs        (kept in results-m14b-why.txt)
 */
import { readRecord } from './record.mjs';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFair } from './fair-gate.mjs';

const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const UP = 'm14b-up', DOWN = 'm14b-down', ABOVE = 15;
requireFair([[DOWN, UP, { tested: [13] }]]);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const MIX = [];
const ids = ['S172', 'S194', 'S162', 'S252', 'S414', 'S234', 'S020', 'S082', 'S184', 'S070', 'S330', 'S354'];

console.log('M14b, PATH BY PATH: the arm allowed one tier above (up) against the arm without it (down), same 3,000 paths');
console.log('  id    survival down/up | saved lost | lost paths: held the tier above first / median years from first up-move to failure | spillover, in years the up arm is NOT above: spending differs / tier differs / up arm spends more when it differs');
for (const id of ids) {
  const fd = join(R, DOWN, `${id}.solver.record.json.gz`), fu = join(R, UP, `${id}.solver.record.json.gz`);
  if (!existsSync(fd) || !existsSync(fu)) { console.log(`  ${id}  no records`); continue; }
  const d = readRecord(fd), u = readRecord(fu);
  if (d.N !== u.N || d.Y !== u.Y) throw new Error(`${id}: the arms' records differ in shape`);
  const { N, Y } = d;
  let saved = 0, lost = 0, lostUsed = 0; const gaps = [];
  let years = 0, lvlDiff = 0, tierDiff = 0, upMore = 0;
  for (let i = 0; i < N; i++) {
    const sd = d.paths.survived[i], su = u.paths.survived[i];
    if (!sd && su) saved++;
    if (sd && !su) {
      lost++;
      const tf = u.trace.failYear[i] > 0 ? u.trace.failYear[i] : Y;
      let first = -1; for (let t = 0; t < tf; t++) if (u.trace.level[i * Y + t] && u.trace.tier[i * Y + t] === ABOVE) { first = t; break; }
      if (first >= 0) { lostUsed++; gaps.push(tf - first); }
    }
    for (let t = 0; t < Y; t++) {
      const k = i * Y + t;
      if (!d.trace.level[k] || !u.trace.level[k] || u.trace.tier[k] === ABOVE) continue;
      years++;
      if (u.trace.level[k] !== d.trace.level[k]) { lvlDiff++; if (u.trace.level[k] > d.trace.level[k]) upMore++; }
      if (u.trace.tier[k] !== d.trace.tier[k]) tierDiff++;
    }
  }
  gaps.sort((a, b) => a - b);
  const mix = r => { const c = { 0: 0, 5: 0, 10: 0, 15: 0 }; let n = 0; for (let k = 0; k < r.trace.tier.length; k++) if (r.trace.level[k]) { c[r.trace.tier[k]] = (c[r.trace.tier[k]] || 0) + 1; n++; } return [0, 5, 10, 15].map(t => f(100 * c[t] / n).padStart(5)).join(' '); };
  MIX.push(`  ${id}  ${mix(d)}   |  ${mix(u)}`);
  const pc = (a, b) => (b ? f(100 * a / b) + '%' : '-');
  console.log(`  ${id}  ${f(100 * d.paths.survived.filter(Boolean).length / N, 2)}/${f(100 * u.paths.survived.filter(Boolean).length / N, 2)} | ${String(saved).padStart(4)} ${String(lost).padStart(4)} | ${pc(lostUsed, lost).padStart(6)} / ${gaps.length ? gaps[gaps.length >> 1] : '-'} yrs | ${pc(lvlDiff, years).padStart(6)} / ${pc(tierDiff, years).padStart(6)} / ${pc(upMore, lvlDiff)}`);
}
console.log('\nTIER MIX, % of paid years at: plan / one below / two below / one above');
console.log('  id    down (no tier above)       |  up (one tier above allowed)');
for (const l of MIX) console.log(l);
