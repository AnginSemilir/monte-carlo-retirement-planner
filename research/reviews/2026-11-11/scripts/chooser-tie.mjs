// EXPLORATORY (the external review, 11 Nov): is the shortlists' extra pot the whole menu's own indifference above the estate cap?
// One household solved once at the candidate's settings; then the same tables run forward with the chooser on the whole menu,
// on the whole menu with a tie-break (within a margin of the best score, the move that pays least tax this year), and on
// item 7's widths, every arm on the same paths, each against the whole menu.
//   REPO_ROOT=<a copy with prototype/shortlist.diff and prototype/chooser-tie.diff applied> [SEED=n] [ARMS=a,b] node chooser-tie.mjs <household> [points 45] [paths 3000]
// An arm: whole | structure | order | cells-held@0.005, then optionally +tieS@<margin> (only moves at the best move's spending
// level and tier pair: the draw order and the re-wrap alone can change) or +tieA@<margin> (any move within the margin: the
// chooser's existing `tieMargin`) or +tieC@<margin> (as tieS, and only where the household's wealth is already above the
// estate cap). A margin is in score units: 1e-4 is 0.01 points of survival.
// A width can also take +slice (needs prototype/shortlist-slice.diff too; ignored without it): above the cap, with tieC on,
// every move at the shortlist's chosen spending level and tier pair joins the list and the decision is made again.
// <household>: one of Phase 4's eight as it landed them (research/solver/phase4-panel.mjs readPanel), else a library id.
// SOFT=1: the household is then solved again with the estate shape 'soft' (solve.js, phase 6c: the cap kept, the cliff gone)
// and those tables run on the whole menu, with and without the tie-break, against the first tables' whole menu.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 99004);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { SHORT } = await import(R + '/src/solver/solve.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const { readPanel } = await import(R + '/research/solver/phase4-panel.mjs');
const [id, pts, nP] = [process.argv[2], Number(process.argv[3] || 45), Number(process.argv[4] || 3000)];
const ARMS = (process.env.ARMS || 'whole+tieS@1e-4,whole+tieS@1e-3,whole+tieA@1e-3,structure,structure+tieS@1e-3').split(',');
const panel = readPanel().find(h => h.id === id);
const plan = panel ? panel.plan : E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t00 = Date.now();
const solved = solveForApp(E, M, plan, opts);
const solveS = (Date.now() - t00) / 1000;
const T = S.solvedContext(E, solved).totalYears;
const opening = solved.m.ctx.accounts.reduce((x, a) => x + a.balance, 0), cap = 4 * opening;
const paths = E.pathsForSeed(SEED, nP, T);
const setArm = (arm, solved) => {
  SHORT.on = false; SHORT.slice = false; solved.tieMargin = 0; solved.tieSame = false; solved.tieAbove = false;
  if (!arm) return;
  for (const part of arm.split('+')) {
    let mt;
    if (part === 'whole') continue;
    if (part === 'slice') { SHORT.slice = true; continue; }
    if ((mt = /^tie([SAC])@(.+)$/.exec(part))) { solved.tieMargin = Number(mt[2]); solved.tieSame = mt[1] !== 'A'; solved.tieAbove = mt[1] === 'C'; continue; }
    const [v, dl] = part.split('@');
    SHORT.delta = dl ? Number(dl) : null; SHORT.levels = true; SHORT.time = false; SHORT.mode = v.startsWith('cells') ? 'cells' : v; SHORT.layers = v === 'cells-held' ? 'held' : 'all'; SHORT.on = true;
  }
};
// what each arm chooses, tallied at every decision: the tier indices (risk), the re-wraps, the spending level
const tally = { n: 0, pen: 0, isa: 0, harvest: 0, level: 0 };
const runner = (solved) => {
  const sc = S.solvedContext(E, solved), base = sc.policyOverride;
  const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
    const f = base.choose(st, t, held);
    if (f && f.index !== undefined && t < T) { const p = S.partsOf(solved.actions[f.index], solved.c.acts[f.index]); tally.n++; tally.pen += p.tierPen || 0; tally.isa += p.tierIsa || 0; if (p.harvest && p.harvest !== 'none') tally.harvest++; tally.level += solved.levelOf ? solved.levelOf[f.index] : 1; }
    return f;
  } } };
  return (arm) => {
    setArm(arm, solved); for (const k of Object.keys(tally)) tally[k] = 0;
    for (const zs of paths.slice(0, 3)) S.runPath(E, ctx, zs);
    for (const k of Object.keys(tally)) tally[k] = 0;
    SHORT.stats.sliced = 0; SHORT.stats.slicedMoves = 0;
    const t0 = process.hrtime.bigint(); const out = paths.map(zs => S.runPath(E, ctx, zs)); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / nP;
    const r = { out, ms, t: { ...tally }, sliced: SHORT.stats.sliced || 0, slicedMoves: SHORT.stats.slicedMoves || 0 }; setArm(null, solved); return r;
  };
};
const run = runner(solved);
const mean = (o, f) => o.reduce((s, x) => s + f(x), 0) / o.length;
const capped = x => Math.min(x.terminalPot, cap);
const w = run(null);
const below = w.out.map(x => x.terminalPot <= cap), nBelow = below.filter(Boolean).length;
const tl = r => `tiers held on average ${(r.t.pen / r.t.n).toFixed(3)} and ${(r.t.isa / r.t.n).toFixed(3)}, a re-wrap at ${(100 * r.t.harvest / r.t.n).toFixed(1)}% of decisions, the level chosen ${(100 * r.t.level / r.t.n).toFixed(2)}%`;
console.log(`${id}${panel ? ' (as Phase 4 landed it)' : ''} at ${pts} points (solve ${solveS.toFixed(0)} s), seed ${SEED}, ${nP} paths, ${T + 1} years; opening wealth £${Math.round(opening).toLocaleString('en-GB')}, the estate cap £${Math.round(cap).toLocaleString('en-GB')}`);
console.log(`  whole menu: a path ${w.ms.toFixed(1)} ms; survival ${(100 * w.out.filter(x => x.survived).length / nP).toFixed(2)}%; spending ${(100 * mean(w.out, x => x.delivered) / mean(w.out, x => x.target)).toFixed(3)}% of target; mean pot £${Math.round(mean(w.out, x => x.terminalPot)).toLocaleString('en-GB')}, capped £${Math.round(mean(w.out, capped)).toLocaleString('en-GB')}; paths ending above the cap ${nP - nBelow} (${(100 * (nP - nBelow) / nP).toFixed(1)}%); lifetime tax £${Math.round(mean(w.out, x => x.lifetimeTax)).toLocaleString('en-GB')}; ${tl(w)}`);
const report = (arm, c) => {
  let saved = 0, lost = 0, up = 0, down = 0;
  c.out.forEach((y, i) => { const x = w.out[i]; if (y.survived && !x.survived) saved++; if (x.survived && !y.survived) lost++; if (y.terminalPot > x.terminalPot + 1) up++; else if (y.terminalPot < x.terminalPot - 1) down++; });
  const d = saved - lost, se = Math.sqrt(Math.max(saved + lost - d * d / nP, 0)) / nP;
  const pct = (f, sel = null) => { const a = sel ? c.out.filter((_, i) => sel[i]) : c.out, b = sel ? w.out.filter((_, i) => sel[i]) : w.out; return (100 * (mean(a, f) / mean(b, f) - 1)).toFixed(2); };
  const spend = 100 * (mean(c.out, x => x.delivered) / mean(c.out, x => x.target) - mean(w.out, x => x.delivered) / mean(w.out, x => x.target));
  console.log(`  ${arm.padEnd(30)} a path ${c.ms.toFixed(1).padStart(5)} ms | ${saved} saved, ${lost} lost (${(100 * d / nP).toFixed(3)} points, se ${(100 * se).toFixed(3)}) | spending ${spend >= 0 ? '+' : ''}${spend.toFixed(3)} points of target | mean pot ${pct(x => x.terminalPot)}%, capped ${pct(capped)}%, on the whole menu's paths below the cap ${pct(x => x.terminalPot, below)}% | lifetime tax ${pct(x => x.lifetimeTax)}% | paths with more pot ${up}, with less ${down} | ${tl(c)}${c.sliced ? ` | the slice: at ${(100 * c.sliced / c.t.n).toFixed(1)}% of decisions, ${(c.slicedMoves / c.sliced).toFixed(1)} moves added on average` : ''}`);
};
for (const arm of ARMS) report(arm, run(arm));
if (process.env.SOFT === '1') {
  const t1 = Date.now();
  const soft = solveForApp(E, M, plan, { ...opts, research: { ...(opts.research || {}), bequestShape: 'soft' } });
  const isSoft = soft.terminal.beqOf(2 * cap) > cap && solved.terminal.beqOf(2 * cap) === cap;
  console.log(`  the estate shape 'soft' (solve ${((Date.now() - t1) / 1000).toFixed(0)} s; above the cap its estate term still rises: ${isSoft}), its tables against the first tables' whole menu:`);
  if (!isSoft) { console.log('THE SHAPE DID NOT TAKE'); process.exit(1); }
  const run2 = runner(soft);
  report('soft: whole', run2(null));
  report('soft: whole+tieC@1e-4', run2('whole+tieC@1e-4'));
}
