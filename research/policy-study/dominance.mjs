/*
 * NOT "who wins most". Two questions only:
 *
 *   1. Is there a policy for which NO realistic household exists where it is the right answer?
 *      That is a dominance test, not a popularity test. A policy can win zero scenarios and still be
 *      worth keeping if it is always joint-best; and a policy can win many and still be redundant if
 *      another policy matches it everywhere. So the measure is: across every scenario, what is the
 *      BEST this policy ever does relative to the best of all the others? If that number is never
 *      positive, nothing is lost by deleting it.
 *
 *   2. Is there a policy NOT in the set that is the right answer for at least one realistic household?
 *      Same test, pointed the other way: does a challenger ever beat every shipped policy at once?
 *
 * Both questions turn on small differences, so the noise floor has to be stated rather than assumed.
 * All candidates in a scenario run on the SAME seed and therefore the same market paths, so the
 * comparison is paired and the difference is far more precise than either rate alone. Anything that
 * clears the threshold here is re-tested at high precision by confirm.mjs before it is believed.
 */
import fs from 'fs';

// results directory: defaults to ./results beside this script, overridable so a run made elsewhere
// (a scratch dir, another machine) can be analysed without moving files around
const DIR = process.argv[2] || new URL('./results/', import.meta.url).pathname;
const load = () => [0, 1, 2, 3].flatMap(i => {
  for (const f of [`${DIR}/policy-run3-${i}.json`, `${DIR}/policy-run3-${i}.partial.json`]) if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f));
  return [];
}).sort((a, b) => a.id.localeCompare(b.id));

const rows = load();
if (!rows.length) { console.log('no results yet'); process.exit(0); }
const complete = [0, 1, 2, 3].every(i => fs.existsSync(`policy-run3-${i}.json`));

const SHIPPED = ['Bracket Fill Basic', 'Bracket Fill', 'Sequential'];
const ALL = [...new Set(rows.flatMap(r => r.cands.map(c => c.policy)))];
const NEW = ALL.filter(p => !SHIPPED.includes(p));

// A policy's score in a scenario is its BEST variant: nobody deliberately picks a bad harvest setting.
const best = (r, p) => {
  const cs = r.cands.filter(c => c.policy === p);
  if (!cs.length) return null;
  return cs.reduce((a, b) => (b.successRate > a.successRate || (b.successRate === a.successRate && b.p10 > a.p10)) ? b : a);
};
const bestOf = (r, set) => {
  const cs = r.cands.filter(c => set.includes(c.policy));
  return cs.reduce((a, b) => (b.successRate > a.successRate || (b.successRate === a.successRate && b.p10 > a.p10)) ? b : a);
};

const pad = (s, n) => String(s).padEnd(n);
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : '—';
const RATE_EPS = 0.15;   // survival points; below this a paired difference is not worth believing
const POT_EPS = 2000;    // pounds of 10th-percentile pot

console.log(`=== ${rows.length}${complete ? '' : ' (PARTIAL)'} scenarios | ${ALL.length} policies ===`);
console.log(`Thresholds: a policy must beat the field by >${RATE_EPS}pt survival, or match on survival and beat it by >£${POT_EPS.toLocaleString()} of 10th-percentile pot.\n`);

/*
 * For each policy: the single best case it ever makes for itself against everyone else.
 * `bestRateEdge` is the largest survival-rate margin it ever achieves over the best rival.
 * `bestPotEdge` is the largest pot margin it achieves in a scenario where survival is level.
 */
function profile(policy, field) {
  const rivals = field.filter(p => p !== policy);
  let bestRateEdge = -Infinity, bestRateAt = null, bestPotEdge = -Infinity, bestPotAt = null;
  /*
   * Three buckets, and the boundaries matter because they decide what gets deleted.
   *   soleBest  - nothing else matches it: the policy is the answer for this household
   *   noLoss    - it is within the noise of the best, so choosing it costs nothing measurable
   *   behind    - it is materially worse, so choosing it costs the household real money
   * A policy with no soleBest is redundant. Whether it is HARMLESS depends on how the rest splits:
   * a default that is never uniquely right but almost never behind is doing its job.
   */
  let uniqueWins = 0, jointBest = 0, everStrictlyWorse = 0;
  for (const r of rows) {
    const me = best(r, policy), them = bestOf(r, rivals);
    if (!me || !them) continue;
    const dr = me.successRate - them.successRate;
    if (dr > bestRateEdge) { bestRateEdge = dr; bestRateAt = r; }
    if (Math.abs(dr) < 1e-9) {
      const dp = me.p10 - them.p10;
      if (dp > bestPotEdge) { bestPotEdge = dp; bestPotAt = r; }
    }
    const dp = me.p10 - them.p10;
    if (dr > RATE_EPS || (Math.abs(dr) < 1e-9 && dp > POT_EPS)) uniqueWins++;
    else if (dr >= -RATE_EPS && dp >= -POT_EPS) jointBest++;
    else everStrictlyWorse++;
  }
  return { policy, bestRateEdge, bestRateAt, bestPotEdge, bestPotAt, uniqueWins, jointBest, everStrictlyWorse };
}

function report(title, field, note, { verdicts = true } = {}) {
  console.log(`\n######## ${title} ########`);
  if (note) console.log(note + '\n');
  const profs = field.map(p => profile(p, field)).sort((a, b) => b.uniqueWins - a.uniqueWins || b.bestRateEdge - a.bestRateEdge);
  console.log(`  ${pad('policy', 22)} ${pad('sole best', 11)} ${pad('joint best', 12)} ${pad('best edge (pts)', 17)} best edge on pot (tied survival)`);
  for (const x of profs) {
    const edge = x.bestRateEdge === -Infinity ? 'n/a' : (x.bestRateEdge > 0 ? '+' : '') + x.bestRateEdge.toFixed(2);
    const pot = x.bestPotEdge === -Infinity ? 'never tied' : (x.bestPotEdge > 0 ? '+£' : '-£') + Math.abs(Math.round(x.bestPotEdge)).toLocaleString();
    console.log(`  ${pad(x.policy, 22)} ${pad(x.uniqueWins, 11)} ${pad(x.jointBest, 12)} ${pad(edge, 17)} ${pot}`);
  }
  console.log('');
  /*
   * Removal verdicts are only meaningful against a field of BEHAVIOURALLY DISTINCT policies.
   *
   * Several challengers share Bracket Fill Basic's draw order and differ only in how a one-off cost is
   * funded or where a windfall lands. On a household with neither, they are not merely similar to it -
   * they are the same policy, and they tie with it exactly. In that field "sole best" is unreachable for
   * Bracket Fill Basic by construction, and reading that as evidence for deleting the app's default
   * would be an artefact of the field, not a finding about the policy. So verdicts are emitted only for
   * the shipped three, whose draw orders genuinely differ.
   */
  const dominated = profs.filter(x => x.uniqueWins === 0);
  if (!verdicts) {
    const never = dominated.map(x => x.policy);
    if (never.length) console.log(`  Never uniquely best here: ${never.join(', ')}.\n  In this field that is expected rather than damning - several challengers share a draw order with\n  a shipped policy and tie with it exactly wherever their own lever is not exercised. Question 3 is\n  the test that matters for adding a policy; Question 1 is the test that matters for removing one.`);
    return profs;
  }
  if (!dominated.length) { console.log('  Every policy is the sole best answer for at least one household. None is redundant.'); return profs; }
  for (const x of dominated) {
    const noLossShare = x.jointBest / rows.length;
    /*
     * Redundant is not the same as harmful. A policy that is never uniquely right but is within noise
     * of the best almost everywhere is a perfectly good DEFAULT - being rarely wrong is the job. The
     * removal case is the policy that is neither: never the answer, and materially behind often.
     */
    const verdict = noLossShare >= 0.6 ? 'redundant as a CHOICE, but a sound default: within noise of the best almost everywhere'
      : x.everStrictlyWorse > rows.length * 0.4 ? 'REMOVAL CANDIDATE: never the answer, and materially behind too often to be a safe default'
        : 'redundant, and only sometimes safe - worth a closer look';
    console.log(`  ${x.policy}: never the sole best answer in ${rows.length} households.`);
    console.log(`     best moment: ${x.bestRateEdge > 0 ? `+${x.bestRateEdge.toFixed(2)}pt` : `${x.bestRateEdge.toFixed(2)}pt (still behind)`}${x.bestRateAt ? ` on ${x.bestRateAt.name}` : ''}`);
    console.log(`     costs nothing to use in ${x.jointBest} (${pct(x.jointBest, rows.length)}); materially behind in ${x.everStrictlyWorse} (${pct(x.everStrictlyWorse, rows.length)})`);
    console.log(`     verdict: ${verdict}\n`);
  }
  return profs;
}

report('QUESTION 1: AMONG THE THREE SHIPPED POLICIES, IS ANY REDUNDANT?', SHIPPED,
  'Field = the three policies the app offers today. "Sole best" means no other shipped policy matches it.');

report('QUESTION 2: WITH ALL CHALLENGERS ADDED, WHO SURVIVES?', ALL,
  'Field = all fifteen. Read this as "who reaches the top of the field", not as a removal test:\n  several challengers are exact clones of a shipped policy on households where their own lever\n  never fires, so they deny each other sole-best status for reasons that say nothing about merit.',
  { verdicts: false });

// --- does any challenger beat the whole shipped field? -------------------------------------------
console.log('\n######## QUESTION 3: DOES A CHALLENGER BEAT EVERY SHIPPED POLICY AT ONCE? ########\n');
console.log(`  ${pad('challenger', 22)} ${pad('households it wins', 20)} ${pad('best margin', 13)} where`);
const winners = [];
for (const p of NEW) {
  const hits = rows.map(r => {
    const me = best(r, p), them = bestOf(r, SHIPPED);
    if (!me) return null;
    const dr = me.successRate - them.successRate, dp = me.p10 - them.p10;
    const wins = dr > RATE_EPS || (Math.abs(dr) < 1e-9 && dp > POT_EPS);
    return wins ? { r, dr, dp } : null;
  }).filter(Boolean).sort((a, b) => (b.dr - a.dr) || (b.dp - a.dp));
  const top = hits[0];
  console.log(`  ${pad(p, 22)} ${pad(`${hits.length} (${pct(hits.length, rows.length)})`, 20)} ${pad(top ? (top.dr > 0 ? `+${top.dr.toFixed(2)}pt` : `+£${Math.round(top.dp).toLocaleString()}`) : '—', 13)} ${top ? top.r.name : ''}`);
  if (hits.length) winners.push({ policy: p, hits });
}
console.log('');
if (!winners.length) console.log('  No challenger ever beats the shipped three. The current set covers the space.');
else {
  console.log('  CANDIDATES FOR ADDITION - the households each one uniquely serves:\n');
  for (const w of winners.sort((a, b) => b.hits.length - a.hits.length)) {
    console.log(`  ${w.policy}  (${w.hits.length} households)`);
    const byTag = {};
    w.hits.forEach(h => { const k = `${h.r.tags.mix} / ${h.r.tags.flow}`; byTag[k] = (byTag[k] || 0) + 1; });
    Object.entries(byTag).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([k, v]) => console.log(`     ${pad(k, 32)} ${v}`));
    w.hits.slice(0, 3).forEach(h => console.log(`     e.g. ${pad(h.r.name, 44)} ${h.dr > 0 ? `+${h.dr.toFixed(2)}pt survival` : `+£${Math.round(h.dp).toLocaleString()} pot`}`));
    console.log('');
  }
  fs.writeFileSync('confirm-list.json', JSON.stringify(winners.map(w => ({ policy: w.policy, ids: w.hits.slice(0, 12).map(h => h.r.id) }))));
  console.log(`  -> confirm-list.json written: re-test these at high precision before believing them.`);
}
