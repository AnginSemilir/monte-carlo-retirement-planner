/*
 * Read the tournament output and answer four questions:
 *   1. among the three SHIPPED policies, which wins and where - and does any of them never win
 *   2. does the choice matter at all, or are the policies tied on most households
 *   3. when a policy loses, how badly (never winning but never behind is harmless; routinely points
 *      behind is doing damage wherever it happens to be selected)
 *   4. with six CHALLENGERS added, does any of them displace a shipped policy often enough to earn a place
 */
import fs from 'fs';

const rows = [0, 1, 2, 3].flatMap(i => {
  const f = `policy-run2-${i}.json`;
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : [];
}).sort((a, b) => a.id.localeCompare(b.id));
if (!rows.length) { console.log('no results yet'); process.exit(0); }

const SHIPPED = ['Bracket Fill Basic', 'Bracket Fill', 'Sequential'];
const ALL = [...new Set(rows.flatMap(r => r.cands.map(c => c.policy)))];
const CHALLENGERS = ALL.filter(p => !SHIPPED.includes(p));

const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const pad = (s, n) => String(s).padEnd(n);

/*
 * pickBest, replayed offline over an arbitrary subset of policies. Replaying it is what lets the same
 * run answer both "what does the app do today" (shipped only) and "what would it do with the challengers
 * in" - without simulating anything twice.
 */
function winnerAmong(cands, allowed) {
  const pool = cands.filter(c => allowed.includes(c.policy));
  const best = Math.max(...pool.map(c => c.successRate));
  const top = pool.filter(c => c.successRate >= best - 0.5);
  top.sort((a, b) => (b.p10 - a.p10) || (b.median - a.median));
  return top[0];
}

console.log(`=== ${rows.length} scenarios | ${ALL.length} policies (${SHIPPED.length} shipped, ${CHALLENGERS.length} challengers) ===\n`);

// ================================ PART 1: THE SHIPPED THREE ======================================
console.log('################  PART 1: THE THREE POLICIES THE APP SHIPS TODAY  ################\n');
rows.forEach(r => { r.winShipped = winnerAmong(r.cands, SHIPPED); });

const tallyBy = (fn, set) => set.reduce((m, k) => { m[k] = 0; return m; }, {});
const winsShipped = tallyBy(null, SHIPPED);
rows.forEach(r => { winsShipped[r.winShipped.policy]++; });
console.log('WINS BY POLICY');
Object.entries(winsShipped).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${pad(k, 22)} ${pad(v, 5)} ${pct(v, rows.length)}${v === 0 ? '   <-- NEVER WINS' : ''}`));
console.log('');

const ds = {}; const hv = {};
rows.forEach(r => { ds[r.winShipped.drawdown] = (ds[r.winShipped.drawdown] || 0) + 1; hv[r.winShipped.harvest ? 'harvest on' : 'harvest off'] = (hv[r.winShipped.harvest ? 'harvest on' : 'harvest off'] || 0) + 1; });
console.log('WINS BY DRAWDOWN STRATEGY');
Object.entries(ds).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${pad(k, 22)} ${pad(v, 5)} ${pct(v, rows.length)}`));
console.log('\nWINS BY ALLOWANCE HARVEST');
Object.entries(hv).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${pad(k, 22)} ${pad(v, 5)} ${pct(v, rows.length)}`));
console.log('');

// --- does it matter -----------------------------------------------------------------------------
const bestRateAmong = (r, allowed) => Math.max(...r.cands.filter(c => allowed.includes(c.policy)).map(c => c.successRate));
const worstRateAmong = (r, allowed) => {
  // the WORST a policy can do is its own best variant - nobody deliberately picks a bad harvest setting
  const byP = {}; r.cands.filter(c => allowed.includes(c.policy)).forEach(c => { byP[c.policy] = Math.max(byP[c.policy] ?? -1, c.successRate); });
  return Math.min(...Object.values(byP));
};
const spreads = rows.map(r => bestRateAmong(r, SHIPPED) - worstRateAmong(r, SHIPPED)).sort((a, b) => a - b);
const q = (p) => spreads[Math.min(spreads.length - 1, Math.floor(p * spreads.length))];
const tied = spreads.filter(s => s < 0.1).length, material = spreads.filter(s => s >= 1).length;
console.log('DOES THE POLICY CHOICE MATTER? (survival-rate spread between the best and worst shipped policy)');
console.log(`  all three within 0.1pt   ${pad(tied, 5)} ${pct(tied, rows.length)}   <- the choice is cosmetic here`);
console.log(`  spread of 1pt or more    ${pad(material, 5)} ${pct(material, rows.length)}`);
console.log(`  median ${q(0.5).toFixed(2)}pt   90th ${q(0.9).toFixed(2)}pt   max ${spreads[spreads.length - 1].toFixed(2)}pt\n`);

// --- how far behind -----------------------------------------------------------------------------
console.log('WHEN A POLICY IS NOT CHOSEN, HOW FAR BEHIND IS ITS BEST VARIANT?');
console.log(`  ${pad('policy', 22)} ${pad('wins', 6)} ${pad('mean deficit', 14)} ${pad('90th', 9)} ${pad('worst', 9)} n >=1pt behind`);
for (const p of SHIPPED) {
  const defs = rows.map(r => bestRateAmong(r, SHIPPED) - Math.max(...r.cands.filter(c => c.policy === p).map(c => c.successRate)));
  const srt = [...defs].sort((a, b) => a - b);
  const mean = defs.reduce((a, b) => a + b, 0) / defs.length;
  console.log(`  ${pad(p, 22)} ${pad(winsShipped[p], 6)} ${pad(mean.toFixed(3) + 'pt', 14)} ${pad(srt[Math.floor(0.9 * srt.length)].toFixed(2) + 'pt', 9)} ${pad(srt[srt.length - 1].toFixed(2) + 'pt', 9)} ${defs.filter(d => d >= 1).length}`);
}
console.log('');

// --- sliced by every axis -----------------------------------------------------------------------
const AXES = ['stage', 'mix', 'wealth', 'spend', 'bequest', 'household', 'flow', 'employ', 'region'];
for (const axis of AXES) {
  const vals = [...new Set(rows.map(r => r.tags[axis]))];
  console.log(`WINS BY ${axis.toUpperCase()}`);
  console.log(`  ${pad('', 15)} ${SHIPPED.map(p => pad(p.slice(0, 18), 20)).join('')}n    median spread`);
  for (const v of vals) {
    const sub = rows.filter(r => r.tags[axis] === v);
    const s = sub.map(r => bestRateAmong(r, SHIPPED) - worstRateAmong(r, SHIPPED)).sort((a, b) => a - b);
    const cells = SHIPPED.map(p => { const n = sub.filter(r => r.winShipped.policy === p).length; return pad(`${n} (${pct(n, sub.length)})`, 20); }).join('');
    console.log(`  ${pad(v, 15)} ${cells}${pad(sub.length, 5)}${s[Math.floor(s.length / 2)].toFixed(2)}pt`);
  }
  console.log('');
}

// ================================ PART 2: THE CHALLENGERS ========================================
console.log('\n################  PART 2: WITH SIX CHALLENGER POLICIES ADDED  ################\n');
rows.forEach(r => { r.winAll = winnerAmong(r.cands, ALL); });
const winsAll = {}; ALL.forEach(p => { winsAll[p] = 0; });
rows.forEach(r => { winsAll[r.winAll.policy]++; });
console.log('WINS BY POLICY, ALL NINE COMPETING');
Object.entries(winsAll).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${pad(k + (SHIPPED.includes(k) ? '  (shipped)' : '  (new)'), 34)} ${pad(v, 5)} ${pct(v, rows.length)}${v === 0 ? '   <-- NEVER WINS' : ''}`));
console.log('');

console.log('HOW MUCH DOES ADDING THE CHALLENGERS ACTUALLY BUY?');
const displaced = rows.filter(r => !SHIPPED.includes(r.winAll.policy));
const gains = displaced.map(r => r.winAll.successRate - r.winShipped.successRate).sort((a, b) => a - b);
console.log(`  a challenger wins ${displaced.length} of ${rows.length} scenarios (${pct(displaced.length, rows.length)})`);
if (gains.length) {
  const meaningful = gains.filter(g => g >= 0.5).length;
  console.log(`  survival-rate gain over the best shipped policy: median ${gains[Math.floor(gains.length / 2)].toFixed(2)}pt, max ${gains[gains.length - 1].toFixed(2)}pt`);
  console.log(`  of those, ${meaningful} beat the best shipped policy by 0.5pt or more (${pct(meaningful, rows.length)} of all scenarios)`);
  console.log('  NOTE: a challenger winning on a survival TIE has only won the pot tie-break, not the plan.');
  const onTie = displaced.filter(r => Math.abs(r.winAll.successRate - r.winShipped.successRate) < 0.01).length;
  console.log(`  won on a pure survival tie: ${onTie} of ${displaced.length}`);
}
console.log('');

console.log('EACH CHALLENGER, MEASURED AGAINST THE BEST SHIPPED POLICY');
console.log(`  ${pad('policy', 20)} ${pad('outright wins', 15)} ${pad('mean vs shipped', 17)} ${pad('best case', 11)} scenarios it beats shipped by >=0.5pt`);
for (const p of CHALLENGERS) {
  const d = rows.map(r => Math.max(...r.cands.filter(c => c.policy === p).map(c => c.successRate)) - bestRateAmong(r, SHIPPED));
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  console.log(`  ${pad(p, 20)} ${pad(winsAll[p], 15)} ${pad((mean >= 0 ? '+' : '') + mean.toFixed(3) + 'pt', 17)} ${pad('+' + Math.max(...d).toFixed(2) + 'pt', 11)} ${d.filter(x => x >= 0.5).length}`);
}
console.log('');

console.log('WHERE A CHALLENGER WINS, WHICH KIND OF HOUSEHOLD IS IT?');
for (const axis of ['stage', 'mix', 'bequest', 'spend']) {
  const vals = [...new Set(rows.map(r => r.tags[axis]))];
  const line = vals.map(v => {
    const sub = rows.filter(r => r.tags[axis] === v);
    return `${v} ${pct(sub.filter(r => !SHIPPED.includes(r.winAll.policy)).length, sub.length)}`;
  }).join('   ');
  console.log(`  ${pad(axis, 10)} ${line}`);
}
