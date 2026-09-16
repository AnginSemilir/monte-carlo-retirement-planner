/* Does optimising for what the heirs receive change which policy is right? */
import fs from 'fs';
const DIR = process.argv[2] || new URL('./results/', import.meta.url).pathname;
const rows = JSON.parse(fs.readFileSync(`${DIR}/inheritance-run.json`));
const pad = (s, n) => String(s).padEnd(n);
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const tally = (rs, k) => rs.reduce((m, r) => { m[r[k]] = (m[r[k]] || 0) + 1; return m; }, {});
const show = (t, n) => Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ');

console.log(`=== ${rows.length} rows: ${new Set(rows.map(r => r.id)).size} households x ${new Set(rows.map(r=>r.profile)).size} beneficiary profiles x ${new Set(rows.map(r=>r.deathAge)).size} death ages ===\n`);

console.log('WHICH POLICY LEAVES THE MOST AFTER TAX?');
Object.entries(tally(rows, 'winnerNet')).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${pad(k, 22)} ${pad(v, 6)} ${pct(v, rows.length)}`));

console.log('\nTHE HYPOTHESIS: Pension First won 0 of 360 on survival. On post-tax inheritance?');
const pf = rows.filter(r => r.winnerNet === 'Pension First').length;
console.log(`  Pension First wins ${pf} of ${rows.length} (${pct(pf, rows.length)})`);
console.log(`  -> ${pf > rows.length * 0.15 ? 'CONFIRMED: the objective inverts the answer.' : pf === 0 ? 'REJECTED: it never wins on inheritance either.' : 'PARTIAL: it wins sometimes, but is not dominant.'}`);

console.log('\nGROSS POT vs POST-TAX INHERITANCE - do they pick the same policy?');
const differ = rows.filter(r => r.winnerNet !== r.winnerGross).length;
console.log(`  they disagree on ${differ} of ${rows.length} (${pct(differ, rows.length)})`);
console.log(`  ranking on the GROSS pot picks: ${show(tally(rows, 'winnerGross'), rows.length)}`);

console.log('\nBY BENEFICIARY - the same estate, different heirs:');
for (const p of [...new Set(rows.map(r => r.profile))]) {
  const sub = rows.filter(r => r.profile === p);
  console.log(`  ${pad(p, 15)} ${show(tally(sub, 'winnerNet'), sub.length)}`);
}

console.log('\nBY DEATH AGE - either side of the 75 cliff:');
for (const a of [...new Set(rows.map(r => r.deathAge))]) {
  const sub = rows.filter(r => r.deathAge === a);
  console.log(`  died at ${pad(a, 5)} ${show(tally(sub, 'winnerNet'), sub.length)}`);
}

const allAlive = rows.filter(r => r.survivingPolicies === r.totalPolicies);
console.log(`\nHOW MUCH IS AT STAKE? (best minus worst SURVIVING policy - a plan that ran dry is a survival`);
console.log(`question, not a tax one, so those are excluded. ${allAlive.length} of ${rows.length} rows have every policy solvent.)`);
const sp = rows.map(r => r.spreadNet).filter(x => x > 0).sort((a, b) => a - b);
const q = (x) => sp[Math.min(sp.length - 1, Math.floor(x * sp.length))];
console.log(`  median £${Math.round(q(0.5)).toLocaleString()}   75th £${Math.round(q(0.75)).toLocaleString()}   90th £${Math.round(q(0.9)).toLocaleString()}   max £${Math.round(sp[sp.length - 1]).toLocaleString()}`);
const big = rows.filter(r => r.spreadNet > 100000).length;
console.log(`  the policy choice is worth over £100,000 to the heirs in ${big} of ${rows.length} (${pct(big, rows.length)})`);

console.log('\nTHE TEN WHERE IT MATTERS MOST');
[...rows].sort((a, b) => b.spreadNet - a.spreadNet).slice(0, 10).forEach(r =>
  console.log(`  ${pad(r.name, 40)} ${pad(r.profile, 14)} d${r.deathAge}  ${pad(r.winnerNet, 20)} +£${Math.round(r.spreadNet).toLocaleString()}`));
