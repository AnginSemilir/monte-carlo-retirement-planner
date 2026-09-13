/*
 * Re-test, at high precision, only the claims the screen actually made.
 *
 * The screen runs 2,000 paths on one seed. That is enough to RANK policies, because every candidate in
 * a scenario sees the same paths and the comparison is paired - but it is not enough to assert that a
 * 0.3pt edge is real rather than an artefact of the one path set they happened to share. A shared seed
 * removes the noise between candidates; it does not remove the noise in the seed itself.
 *
 * So: take each claim the screen made, re-run it on THREE independent seeds at 20,000 paths, and keep
 * only the claims that survive all three. A finding that reverses on a different seed was never a
 * finding. Reporting one as a reason to add or remove a policy would be the worst outcome of the whole
 * study, since the whole point is to decide what ships.
 *
 * Usage: node confirm.mjs [resultsDir]
 */
import * as E from '../engine.mjs';
import { installChallengers } from './challengers.mjs';
import { installChallengers2 } from './challengers2.mjs';
import { buildScenarios } from './scenarios.mjs';
import fs from 'fs';

installChallengers(E);
installChallengers2(E);

const DIR = process.argv[2] || new URL('./results/', import.meta.url).pathname;
const SHIPPED = ['Bracket Fill Basic', 'Bracket Fill', 'Sequential'];
const SEEDS = [12345, 777, 20260913];
const TRIALS = 20000;

const rows = [0, 1, 2, 3].flatMap(i => {
  for (const f of [`${DIR}/policy-run3-${i}.json`, `${DIR}/policy-run3-${i}.partial.json`]) if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f));
  return [];
});
if (!rows.length) { console.log('no screen results to confirm'); process.exit(0); }

const scenarios = Object.fromEntries(buildScenarios().map(s => [s.id, s]));
const pad = (s, n) => String(s).padEnd(n);

// the screen's claim: challenger P beats every shipped policy on scenario R
const claims = [];
for (const r of rows) {
  const bestShipped = r.cands.filter(c => SHIPPED.includes(c.policy))
    .reduce((a, b) => (b.successRate > a.successRate || (b.successRate === a.successRate && b.p10 > a.p10)) ? b : a);
  const byPolicy = {};
  r.cands.forEach(c => {
    if (SHIPPED.includes(c.policy)) return;
    const cur = byPolicy[c.policy];
    if (!cur || c.successRate > cur.successRate || (c.successRate === cur.successRate && c.p10 > cur.p10)) byPolicy[c.policy] = c;
  });
  Object.entries(byPolicy).forEach(([p, c]) => {
    const dr = c.successRate - bestShipped.successRate, dp = c.p10 - bestShipped.p10;
    if (dr > 0.15 || (Math.abs(dr) < 1e-9 && dp > 2000)) claims.push({ id: r.id, name: r.name, policy: p, screenDr: dr, screenDp: dp, shipped: bestShipped.policy, drawdown: c.drawdown, harvest: c.harvest, shippedDrawdown: bestShipped.drawdown, shippedHarvest: bestShipped.harvest });
  });
}

console.log(`${claims.length} claims from the screen, over ${new Set(claims.map(c => c.policy)).size} challenger policies.`);
console.log(`Re-testing each on ${SEEDS.length} seeds x ${TRIALS.toLocaleString()} paths.\n`);

const variant = (plan, policy, drawdown, harvest) => E.buildContext(E.resolveMpaa({
  ...plan,
  spending: { ...plan.spending, decumulationPolicy: policy, drawdownStrategy: drawdown },
  config: { ...plan.config, harvestPersonalAllowance: harvest }
}));

const held = [], reversed = [];
claims.forEach((cl, n) => {
  const sc = scenarios[cl.id];
  if (!sc) return;
  const a = variant(sc.plan, cl.policy, cl.drawdown, cl.harvest);
  const b = variant(sc.plan, cl.shipped, cl.shippedDrawdown, cl.shippedHarvest);
  const deltas = SEEDS.map(seed => {
    const x = E.monteCarlo(a, { trials: TRIALS, seed });
    const y = E.monteCarlo(b, { trials: TRIALS, seed });
    return { dr: x.successRate - y.successRate, dp: (x.p10TerminalNet ?? x.p10Terminal) - (y.p10TerminalNet ?? y.p10Terminal) };
  });
  // hold only if the challenger is ahead on EVERY seed, by the same kind of margin the screen claimed
  const onRate = cl.screenDr > 0.15;
  const survives = onRate ? deltas.every(d => d.dr > 0.05) : deltas.every(d => Math.abs(d.dr) < 0.05 && d.dp > 500);
  const rec = { ...cl, deltas, meanDr: deltas.reduce((s, d) => s + d.dr, 0) / deltas.length, meanDp: deltas.reduce((s, d) => s + d.dp, 0) / deltas.length };
  (survives ? held : reversed).push(rec);
  if (n % 5 === 0) process.stderr.write(`  ${n}/${claims.length}\n`);
});

console.log(`\n======== ${held.length} CLAIMS HELD, ${reversed.length} REVERSED ========\n`);
const byPolicy = {};
[...held].forEach(h => { (byPolicy[h.policy] = byPolicy[h.policy] || []).push(h); });
const rev = {};
reversed.forEach(h => { rev[h.policy] = (rev[h.policy] || 0) + 1; });

console.log(`  ${pad('challenger', 22)} ${pad('held', 7)} ${pad('reversed', 10)} ${pad('mean edge (held)', 18)} best household`);
for (const p of new Set(claims.map(c => c.policy))) {
  const h = byPolicy[p] || [];
  const bestOne = h.sort((a, b) => (b.meanDr - a.meanDr) || (b.meanDp - a.meanDp))[0];
  const edge = bestOne ? (bestOne.meanDr > 0.05 ? `+${(h.reduce((s, x) => s + x.meanDr, 0) / h.length).toFixed(2)}pt` : `+£${Math.round(h.reduce((s, x) => s + x.meanDp, 0) / h.length).toLocaleString()}`) : '—';
  console.log(`  ${pad(p, 22)} ${pad(h.length, 7)} ${pad(rev[p] || 0, 10)} ${pad(edge, 18)} ${bestOne ? bestOne.name : ''}`);
}

console.log('\nHOUSEHOLDS EACH CONFIRMED POLICY UNIQUELY SERVES:');
Object.entries(byPolicy).sort((a, b) => b[1].length - a[1].length).forEach(([p, hs]) => {
  console.log(`\n  ${p} — ${hs.length} households`);
  hs.slice(0, 6).forEach(h => console.log(`    ${pad(h.name, 44)} ${h.meanDr > 0.05 ? `+${h.meanDr.toFixed(2)}pt survival` : `+£${Math.round(h.meanDp).toLocaleString()} pot`}  (beats ${h.shipped})`));
});
fs.writeFileSync(`${DIR}/confirmed.json`, JSON.stringify({ held, reversed }, null, 1));
console.log(`\nwritten: ${DIR}/confirmed.json`);
