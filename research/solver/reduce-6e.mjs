/*
 * PHASE 6e STAGE 1: THE REDUCER, WRITTEN BEFORE THE RESULTS EXISTED.
 *
 *   node research/solver/reduce-6e.mjs
 *
 * Gate, from PLAN.md Phase 6e, pre-registered:
 *
 *   "If every arm's median pot is within 2% of `current` on all twelve households, the ceilings are
 *    second-order, the current buckets stand on evidence rather than on nobody having looked, stage 2
 *    is never run, and the audit's findings are closed as recorded-and-checked."
 *
 *   "If any arm differs materially, the axis is a live variable. Stage 2 follows, and it must land
 *    before 6d stage 2 and before E1."
 *
 * So the decision rule is a single number per arm: the largest absolute median-pot change against
 * `cur`, across the twelve. Under 2% everywhere and the arm is quiet; over it anywhere and it is live.
 *
 * WHAT THIS CANNOT SAY, and the report repeats it so no figure is lifted out of context: lambda was
 * HELD at each household's landed flex-tiers value, so the floor rate is not pinned, the arms are not
 * compared at equal downside, and nothing here is a headline. It answers "does the ceiling matter",
 * not "by how much is the solver better".
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const HERE = '/home/user/vitejs-vite-kdvuf9qw/research/solver/results';
const ARMS = [['cur', 'current'], ['resp', 're-spaced 0.10/0.45/0.80'], ['gint', 'gain interpolated'], ['pcls', 'lump flag from state']];
const THRESH = 2.0;   // per cent, from the plan

const load = (tag) => {
  const d = `${HERE}/gf-${tag}`;
  if (!existsSync(d)) return {};
  const out = {};
  for (const f of readdirSync(d).filter(f => f.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(`${d}/${f}`, 'utf8'));
    out[j.id] = j;
  }
  return out;
};
const data = Object.fromEntries(ARMS.map(([t]) => [t, load(t)]));
const ids = Object.keys(data.cur).sort();
const have = ARMS.map(([t]) => `${t} ${Object.keys(data[t]).length}`).join(', ');
console.log(`PHASE 6e STAGE 1 - the grid-fidelity screen\ncells present: ${have}  (12 each when complete)\n`);
if (!ids.length) { console.log('no baseline records yet'); process.exit(0); }

const pct = (a, b) => (b === 0 ? 0 : 100 * (a - b) / Math.abs(b));
const worst = {};
for (const [tag, label] of ARMS.slice(1)) {
  console.log(`--- ${label} (${tag}) against current -------------------------------------------------`);
  console.log(`id      median pot        vs cur     floor rate   years@target   lambda`);
  let w = 0, wid = '';
  for (const id of ids) {
    const c = data.cur[id], a = data[tag][id];
    if (!a) { console.log(`${id}   (missing)`); continue; }
    const d = pct(a.solver.medianTerminalNet, c.solver.medianTerminalNet);
    if (Math.abs(d) > Math.abs(w)) { w = d; wid = id; }
    const fr = a.solver.floorRate - c.solver.floorRate;
    const yt = a.solver.yearsAtTargetMedian - c.solver.yearsAtTargetMedian;
    const flag = Math.abs(d) > THRESH ? '  <-- over 2%' : '';
    console.log(`${id}   ${Math.round(a.solver.medianTerminalNet).toLocaleString('en-GB').padStart(12)}   ${(d >= 0 ? '+' : '') + d.toFixed(2)}%`.padEnd(46)
      + `${(fr >= 0 ? '+' : '') + fr.toFixed(2)}`.padStart(8) + `${(yt >= 0 ? '+' : '') + yt.toFixed(3)}`.padStart(15) + `${String(a.solver.lambda).slice(0, 6)}`.padStart(9) + flag);
  }
  worst[tag] = { w, wid, label };
  console.log(`worst move: ${(w >= 0 ? '+' : '') + w.toFixed(2)}% on ${wid}\n`);
}

console.log('=========== THE GATE ===========');
let live = false;
for (const [tag] of ARMS.slice(1)) {
  const { w, wid, label } = worst[tag] || {};
  if (w === undefined) continue;
  const over = Math.abs(w) > THRESH;
  if (over) live = true;
  console.log(`  ${label.padEnd(28)} worst ${(w >= 0 ? '+' : '') + w.toFixed(2)}% (${wid})   ${over ? 'LIVE - over the 2% threshold' : 'quiet'}`);
}
console.log('');
if (live) {
  console.log('  VERDICT: at least one arm moves the answer materially. The axis is a LIVE VARIABLE.');
  console.log('  Stage 2 follows, and per the plan it lands BEFORE both 6d stages and before E1,');
  console.log('  because both are paired comparisons that would otherwise use a distorted baseline.');
  console.log('  Task #125 also activates: 6c may deserve a FRESH run once a fix lands - a new run with');
  console.log('  a new record, never a re-reading of the old numbers.');
} else {
  console.log('  VERDICT: every arm is inside 2% on every household. The ceilings are SECOND-ORDER.');
  console.log('  Stage 2 does not run. The current buckets stand on evidence rather than on nobody');
  console.log('  having looked, the audit findings close as recorded-and-checked, and E3/E4 are sized');
  console.log('  against a grid that is not going to move. Task #125 expires: nothing is owed on 6c.');
}
console.log('\n  NOT A HEADLINE: lambda was held at each household\'s landed flex-tiers value, so the floor');
console.log('  rate is not pinned and the arms are not at equal downside. This says whether the ceiling');
console.log('  matters, not how much better the solver is.');
