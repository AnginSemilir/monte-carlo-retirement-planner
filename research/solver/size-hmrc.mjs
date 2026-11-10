/*
 * ITEM 3'S SIZING (the review of 9 Nov, item 3, step 4; D66; EXPLORATORY, seed 7002, deciding nothing): the engine before
 * the port (a worktree at f8ab8e24, BEFORE) against the engine after (this tree), on the same paths.
 *   library   every household in the two `touched` lists (phase4-orders.json, couples-orders.json), the plan as entered, its
 *             own rules: survival before and after, and the tax on the expected path. The step's STOP: a household moving
 *             by more than 6 points, or the mean by more than 1 (that is not this defect).
 *   solved    the review's eight (audit-curve.mjs HOUSEHOLDS, Phase 4's panel as landed), one a process: each solved at 45
 *             points (solveForApp) on each engine and run by it, beside the app's rules (arm A, Phase 4's) on each engine:
 *             survival, the margin over the rules, the tax on the expected path. Its unit to results/hmrc-7002/<id>.json.
 *   read      the solved units: each household and the pooled margin over the rules before and after. The step's STOP: the
 *             pooled margin falling by more than 2 points.
 *   BEFORE=/home/user/before-item3 node research/solver/size-hmrc.mjs library [paths 1000]
 *   BEFORE=/home/user/before-item3 node research/solver/size-hmrc.mjs solved <id> [paths 4000]
 *   node research/solver/size-hmrc.mjs read
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

// AFTER_ROOT: the tree to read as the engine after (this one unless set)
const AFTER = process.env.AFTER_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../..'), SD = join(AFTER, 'research/solver'), SEED = 7002;
const OUT = join(SD, 'results', `hmrc-${SEED}`);
const [mode, a1, a2] = process.argv.slice(2);
const load = async (R) => ({
  E: await import(pathToFileURL(join(R, 'research/engine.mjs')).href), M: await import(pathToFileURL(join(R, 'src/solver/model.js')).href),
  A: await import(pathToFileURL(join(R, 'src/solverApp.js')).href), B: await import(pathToFileURL(join(R, 'src/solver/bridge.js')).href),
  S: await import(pathToFileURL(join(R, 'research/solver/select-phase4.mjs')).href), P4: await import(pathToFileURL(join(R, 'research/solver/phase4-panel.mjs')).href)
});
const f1 = v => (v >= 0 ? '+' : '') + v.toFixed(2);
const taxOf = (E, ctx) => E.simulateDeterministic(ctx, 'expected').reduce((t, x) => t + x.taxPaid + (x.cgtPaid || 0), 0);

if (mode === 'library') {
  if (!process.env.BEFORE) { console.error('size-hmrc: BEFORE=<a worktree at f8ab8e24>'); process.exit(2); }
  const nP = Number(a1 || 1000);
  const V = { before: await load(process.env.BEFORE), after: await load(AFTER) };
  const { buildScenarios } = await import(pathToFileURL(join(AFTER, 'research/policy-study/scenarios.mjs')).href);
  const touched = new Set([...JSON.parse(readFileSync(join(SD, 'phase4-orders.json'), 'utf8')).touched.ids, ...JSON.parse(readFileSync(join(SD, 'couples-orders.json'), 'utf8')).touched.ids]);
  const rows = [];
  for (const s of buildScenarios()) {
    if (!touched.has(s.id)) continue;
    const r = { id: s.id };
    for (const k of ['before', 'after']) {
      const { E } = V[k], plan = E.resolveMpaa(E.normalizePlan(s.plan)), ctx = E.buildContext(plan), paths = E.pathsForSeed(SEED, nP, ctx.totalYears);
      r[k] = paths.map(zs => (E.runTrial(ctx, zs).survived ? 1 : 0)); r[`tax_${k}`] = taxOf(E, ctx);
      if (k === 'after') { const d = plan.demographics; r.couple = d.planningMode !== 'single'; r.working = Number(d.currentAgeSelf) < Number(d.retireAgeSelf); }
    }
    r.d = 100 * (r.after.reduce((a, b) => a + b, 0) - r.before.reduce((a, b) => a + b, 0)) / nP;
    r.lost = r.before.filter((x, i) => x && !r.after[i]).length; r.saved = r.before.filter((x, i) => !x && r.after[i]).length;
    r.sBefore = 100 * r.before.reduce((a, b) => a + b, 0) / nP;
    rows.push(r);
  }
  const n = rows.length, by = [...rows].sort((x, y) => x.d - y.d), mean = rows.reduce((t, r) => t + r.d, 0) / n, cnt = g => rows.filter(g).length;
  console.log(`item 3's sizing, the plan's own rules (EXPLORATORY): ${n} households of the two touched lists (${cnt(r => r.couple)} couples, ${cnt(r => r.working)} still working), ${nP} paths of seed ${SEED}; the engine after less before, survival in points`);
  console.log(`  mean ${f1(mean)}; median ${f1(by[Math.floor(n / 2)].d)}; worst ${f1(by[0].d)} (${by[0].id}); best ${f1(by[n - 1].d)} (${by[n - 1].id})`);
  console.log(`  losing over 1 point ${cnt(r => r.d < -1)}, over 3 ${cnt(r => r.d < -3)}, over 6 ${cnt(r => r.d < -6)}; gaining over 1 ${cnt(r => r.d > 1)}; within half a point either way ${cnt(r => Math.abs(r.d) <= 0.5)}`);
  const grp = (name, g) => { const xs = rows.filter(g); if (xs.length) console.log(`  ${name}: ${xs.length}, mean ${f1(xs.reduce((t, r) => t + r.d, 0) / xs.length)}, worst ${f1(Math.min(...xs.map(r => r.d)))}; the expected path's tax up £${Math.round(xs.reduce((t, r) => t + r.tax_after - r.tax_before, 0) / xs.length).toLocaleString('en-GB')} a household`); };
  grp('still working', r => r.working); grp('retired', r => !r.working); grp('couples', r => r.couple); grp('singles', r => !r.couple);
  console.log('  the twelve that lose most:'); by.slice(0, 12).forEach(r => console.log(`    ${r.id}${r.couple ? ' (couple)' : ''}${r.working ? ' working' : ' retired'}: ${r.sBefore.toFixed(1)}% before, ${f1(r.d)} (${r.lost} lost, ${r.saved} saved); the expected path's tax £${Math.round(r.tax_before).toLocaleString('en-GB')} to £${Math.round(r.tax_after).toLocaleString('en-GB')}`));
  const stop = rows.some(r => Math.abs(r.d) > 6) || Math.abs(mean) > 1;
  console.log(`THE STEP'S STOP (a household moving by more than 6 points, or the mean by more than 1): ${stop ? 'STOP' : 'not met'}`);
} else if (mode === 'solved') {
  if (!process.env.BEFORE || !a1) { console.error('size-hmrc: BEFORE=<a worktree at f8ab8e24> ... solved <id> [paths]'); process.exit(2); }
  const id = a1, nP = Number(a2 || 4000);
  mkdirSync(OUT, { recursive: true });
  const unit = { id, N: nP, seed: SEED };
  for (const [k, R] of [['before', process.env.BEFORE], ['after', AFTER]]) {
    const { E, M, A, B, S, P4 } = await load(R);
    const h = P4.readPanel().find(x => x.id === id);
    const t0 = Date.now(), r = A.solveForApp(E, M, h.plan, { points: 45 }), solveSecs = (Date.now() - t0) / 1000;
    const ctxS = E.buildContext(B.withTable(r.m.ctx.plan, r));
    const a = S.armA(P4.appPlan(h.plan), { tournament: false }), ctxR = E.buildContext(E.resolveMpaa(a.planState));
    const paths = E.pathsForSeed(SEED, nP, ctxS.totalYears);
    unit[k] = { solved: paths.map(zs => (E.runTrial(ctxS, Float64Array.from(zs)).survived ? 1 : 0)), rules: paths.map(zs => (E.runTrial(ctxR, Float64Array.from(zs)).survived ? 1 : 0)), taxSolved: taxOf(E, ctxS), taxRules: taxOf(E, ctxR), solveSecs, rulesLabel: a.label };
    console.log(`${id} ${k}: solved ${(100 * unit[k].solved.reduce((x, y) => x + y, 0) / nP).toFixed(2)}%, the rules (${a.label}) ${(100 * unit[k].rules.reduce((x, y) => x + y, 0) / nP).toFixed(2)}%; solve ${Math.round(solveSecs)} s`);
  }
  writeFileSync(join(OUT, `${id}.json`), JSON.stringify(unit));
} else if (mode === 'read') {
  const units = existsSync(OUT) ? readdirSync(OUT).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(OUT, f), 'utf8'))) : [];
  const pct = a => 100 * a.reduce((x, y) => x + y, 0) / a.length;
  let mB = 0, mA = 0;
  console.log(`item 3's sizing, the solved plans (EXPLORATORY): ${units.length} households at 45 points, seed ${SEED}; survival, the margin over the rules, the expected path's tax (before -> after)`);
  for (const u of units) {
    const sB = pct(u.before.solved), rB = pct(u.before.rules), sA = pct(u.after.solved), rA = pct(u.after.rules);
    mB += sB - rB; mA += sA - rA;
    console.log(`  ${u.id}: solved ${sB.toFixed(2)}% -> ${sA.toFixed(2)}%; the rules ${rB.toFixed(2)}% -> ${rA.toFixed(2)}%; the margin ${f1(sB - rB)} -> ${f1(sA - rA)}; the solved plan's tax £${Math.round(u.before.taxSolved).toLocaleString('en-GB')} -> £${Math.round(u.after.taxSolved).toLocaleString('en-GB')} (${u.N} paths)`);
  }
  if (units.length) {
    const fall = (mB - mA) / units.length;
    console.log(`  pooled margin over the rules ${f1(mB / units.length)} -> ${f1(mA / units.length)} points (after less before ${f1(-fall)})`);
    console.log(`THE STEP'S STOP (the pooled margin over the rules falling by more than 2 points): ${fall > 2 ? 'STOP' : 'not met'}`);
  }
} else { console.error('size-hmrc: library | solved <id> | read'); process.exit(2); }
