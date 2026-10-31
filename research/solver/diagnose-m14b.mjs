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
 *   the bets       like for like: the estate on paths that survive in BOTH arms (so no failed path's zero is counted);
 *                  the paths that bet at all (held the tier above in any year) and how they ended in each arm; and on
 *                  the paths lost to the bet, how much the arm without it had left at the end (how close it came)
 *   how they fail  saved paths: did the arm without the bet run out part-way, or end under the minimum pot (a failure
 *                  at the plan's end: solve.js scores the final year alive only at or above it, and runPolicy fails a path
 *                  below it)? lost paths: the same for the arm with the bet; and each arm's wealth in its last paid year
 *   what it bought each arm's estate at the end (median, mean, unlucky tenth) and spending on the median path, from the
 *                  result files: the solver's score counts the estate as well as spending and years without money,
 *                  so a survival loss can be a trade the score accepts (fields the runPolicy bug never touched)
 * Tier codes are tierPen * 4 + tierIsa (record.mjs); the menu's index 0 is the plan's tier, 1 and 2 one and two below,
 * and 3 one above (src/solver/fast.js tiersFor: "the tiers above go AFTER the ones below"), so 0, 5, 10 and 15 here.
 * Levels are percent of target.
 *
 *   node research/solver/diagnose-m14b.mjs        (kept in results-m14b-why.txt)
 */
import { readRecord } from './record.mjs';
import { existsSync, readFileSync } from 'node:fs';
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
console.log('\nWHAT IT BOUGHT (result files): survival | estate at the end, median / mean / unlucky tenth | spending level on the median path');
const S = (t, id) => JSON.parse(readFileSync(join(R, t, `${id}.json`), 'utf8')).solver;
const k = x => `${(x / 1000).toFixed(0)}k`, ch = (a, b) => `${b >= a ? '+' : ''}${(100 * (b / a - 1)).toFixed(1)}%`;
for (const id of ids) {
  const d = S(DOWN, id), u = S(UP, id);
  console.log(`  ${id}  ${d.floorRate.toFixed(2)} -> ${u.floorRate.toFixed(2)} | median ${k(d.medianTerminalNet)} -> ${k(u.medianTerminalNet)} (${ch(d.medianTerminalNet, u.medianTerminalNet)})  mean ${k(d.meanTerminalNet)} -> ${k(u.meanTerminalNet)} (${ch(d.meanTerminalNet, u.meanTerminalNet)})  tenth ${k(d.p10TerminalNet)} -> ${k(u.p10TerminalNet)} | ${d.meanLevelMedian.toFixed(3)} -> ${u.meanLevelMedian.toFixed(3)}`);
}

console.log('\nTHE BETS, LIKE FOR LIKE (records): estate on paths surviving in BOTH arms, median down -> up | paths that bet: count, and their outcome both-survive / saved / lost / both-fail | lost paths: the no-bet arm\'s estate at the end, median (min-max), in years of target spending');
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
for (const id of ids) {
  const d = readRecord(join(R, DOWN, `${id}.solver.record.json.gz`)), u = readRecord(join(R, UP, `${id}.solver.record.json.gz`));
  const { N, Y } = d, tgt = JSON.parse(readFileSync(join(R, UP, `${id}.json`), 'utf8')).target;
  const bothD = [], bothU = [], lostEnd = []; const bet = { ss: 0, saved: 0, lost: 0, ff: 0 };
  for (let i = 0; i < N; i++) {
    const sd = d.paths.survived[i], su = u.paths.survived[i];
    if (sd && su) { bothD.push(d.paths.terminalNet[i]); bothU.push(u.paths.terminalNet[i]); }
    if (sd && !su) lostEnd.push(d.paths.terminalNet[i] / tgt);
    let b = false; for (let t = 0; t < Y && !b; t++) if (u.trace.level[i * Y + t] && u.trace.tier[i * Y + t] === ABOVE) b = true;
    if (b) { if (sd && su) bet.ss++; else if (!sd && su) bet.saved++; else if (sd && !su) bet.lost++; else bet.ff++; }
  }
  const nb = bet.ss + bet.saved + bet.lost + bet.ff;
  lostEnd.sort((a, b) => a - b);
  console.log(`  ${id}  ${k(med(bothD))} -> ${k(med(bothU))} (${ch(med(bothD), med(bothU))}) | ${String(nb).padStart(4)} bet: ${bet.ss} / ${bet.saved} / ${bet.lost} / ${bet.ff} | ${lostEnd.length ? `${f(med(lostEnd), 1)} yrs (${f(lostEnd[0], 1)}-${f(lostEnd[lostEnd.length - 1], 1)})` : '-'}`);
}

console.log('\nHOW THE SAVED AND LOST PATHS FAIL (records): saved = the arm without the bet failed; lost = the arm with it failed. "ran out" = money ran out part-way; "end" = reached the end but under the minimum pot. Last-paid-year wealth in years of target, median, failing arm -> other arm');
for (const id of ids) {
  const d = readRecord(join(R, DOWN, `${id}.solver.record.json.gz`)), u = readRecord(join(R, UP, `${id}.solver.record.json.gz`));
  const { N, Y } = d, tgt = JSON.parse(readFileSync(join(R, UP, `${id}.json`), 'utf8')).target;
  const last = (r, i) => { for (let t = Y - 1; t >= 0; t--) if (r.trace.level[i * Y + t]) return r.trace.wealth[i * Y + t] / tgt; return 0; };
  const S = { run: 0, end: 0, a: [], b: [] }, L = { run: 0, end: 0, a: [], b: [] };
  for (let i = 0; i < N; i++) {
    const sd = d.paths.survived[i], su = u.paths.survived[i];
    if (!sd && su) { d.trace.failYear[i] > 0 ? S.run++ : S.end++; S.a.push(last(d, i)); S.b.push(last(u, i)); }
    if (sd && !su) { u.trace.failYear[i] > 0 ? L.run++ : L.end++; L.a.push(last(u, i)); L.b.push(last(d, i)); }
  }
  const w = (a, b) => (a.length ? `${f(med(a), 2)} -> ${f(med(b), 2)}` : '-');
  console.log(`  ${id}  saved ${String(S.run + S.end).padStart(3)}: ran out ${String(S.run).padStart(3)}, end ${String(S.end).padStart(3)}  (${w(S.a, S.b)})  |  lost ${String(L.run + L.end).padStart(3)}: ran out ${String(L.run).padStart(3)}, end ${String(L.end).padStart(3)}  (${w(L.a, L.b)})`);
}
