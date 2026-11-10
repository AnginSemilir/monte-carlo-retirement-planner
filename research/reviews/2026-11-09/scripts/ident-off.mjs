// The acceptance test every prototype here must pass first: with its switches off, a copy carrying the patches gives the
// branch's own numbers bit for bit, so "the whole menu", "as it is" and "the engine as it is" in every other output are
// the branch's.
//   node ident-off.mjs <root A: the branch, clean> <root B: a copy with the patches applied> [paths 200] [seed 99001]
// 1. the engine alone: eight households of the `touched` lists (five singles, three couples), the plan as entered, every
//    path's survival and pot left, and the expected path's every row;
// 2. a single's solve (light settings, 4 wealth points) and its policy on 100 paths: survival, pot left, spending
//    delivered, and the expected path's rows;
// 3. a couple's solve (light settings) and the couples' rollout on 60 paths: survival and pot left.
// Exit 1 if anything differs. Planted fault (CHECKLIST 5): PLANT=1 turns one of B's switches on, and the check must fail.
const [rootA, rootB] = process.argv.slice(2, 4), nP = Number(process.argv[4] || 200), seed = Number(process.argv[5] || 99001);
if (!rootA || !rootB) { console.error('usage: node ident-off.mjs <root A> <root B> [paths] [seed]'); process.exit(2); }
const load = async R => ({ R, E: await import(R + '/research/engine.mjs'), M: await import(R + '/src/solver/model.js'), app: await import(R + '/src/solverApp.js'), set: await import(R + '/src/solverSettings.js'),
  couple: await import(R + '/src/solver/couple.js'), solve: await import(R + '/src/solver/solve.js'), S: await import(R + '/src/solverStrategy.js'), sc: await import(R + '/research/policy-study/scenarios.mjs') });
const A = await load(rootA), B = await load(rootB);
const LIGHT = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const PLANT = process.env.PLANT === '1';
if (PLANT) { if (B.solve.SHORT) { B.solve.SHORT.on = true; B.solve.SHORT.mode = 'cells'; B.solve.SHORT.layers = 'held'; B.solve.SHORT.levels = true; } globalThis.__HMRC_ORDER = true; globalThis.__STACK_SALARY = true; }
let bad = 0, n = 0;
const same = (x, y, keys) => keys.every(k => Object.is(x[k], y[k]));
const planOf = (X, id) => X.E.normalizePlan(X.sc.buildScenarios().find(s => s.id === id).plan);

// 1. the engine alone
for (const id of ['S116', 'S214', 'S210', 'S224', 'S002', 'S007', 'S187', 'S201']) {
  const mk = X => { const ctx = X.E.buildContext(X.E.resolveMpaa(planOf(X, id))); return { ctx, paths: X.E.pathsForSeed(seed, nP, ctx.totalYears) }; };
  const a = mk(A), b = mk(B); let d = 0;
  for (let i = 0; i < nP; i++) { n++; if (!same(A.E.runTrial(a.ctx, a.paths[i]), B.E.runTrial(b.ctx, b.paths[i]), ['survived', 'terminalPot'])) d++; }
  if (JSON.stringify(A.E.simulateDeterministic(a.ctx, 'expected')) !== JSON.stringify(B.E.simulateDeterministic(b.ctx, 'expected'))) d++;
  bad += d; console.log(`${d ? 'FAIL' : 'PASS'}  the engine alone, ${id}: ${nP} paths and the expected path's rows, ${d} differing`);
}
// 2. a single's solve and its policy
{ const id = 'S116', run = X => { const solved = X.app.solveForApp(X.E, X.M, planOf(X, id), LIGHT), ctx = X.S.solvedContext(X.E, solved), paths = X.E.pathsForSeed(seed, 100, ctx.totalYears);
    return { out: paths.map(zs => X.S.runPath(X.E, ctx, zs)), rows: JSON.stringify(X.S.rowsOf(X.E, solved, 'expected').rows) }; };
  const a = run(A), b = run(B); let d = 0;
  a.out.forEach((x, i) => { n++; if (!same(x, b.out[i], ['survived', 'terminalPot', 'delivered'])) d++; });
  if (a.rows !== b.rows) d++;
  bad += d; console.log(`${d ? 'FAIL' : 'PASS'}  a single's solve and its policy, ${id} at 4 points: 100 paths (survival, pot left, spending delivered) and the expected path's rows, ${d} differing`); }
// 3. a couple's solve and the rollout
{ const id = 'S007', run = X => { const cp = X.couple.solveCouple(X.E, X.M, X.set.prepareForSolve(X.E, planOf(X, id)), { solveOne: (p, o) => X.app.solveForApp(X.E, X.M, p, { ...LIGHT, ageWith: o.partnerAge0 }) });
    const ctx = X.E.buildContext(X.couple.withCouple(cp.plan, cp)), paths = X.E.pathsForSeed(seed, 60, ctx.totalYears); return paths.map(zs => X.E.runTrial(ctx, zs)); };
  const a = run(A), b = run(B); let d = 0;
  a.forEach((x, i) => { n++; if (!same(x, b[i], ['survived', 'terminalPot'])) d++; });
  bad += d; console.log(`${d ? 'FAIL' : 'PASS'}  a couple's solve and the rollout, ${id} at 4 points: 60 paths (survival, pot left), ${d} differing`); }
console.log(`${bad ? 'FAILED' : 'ALL PASS'}: ${rootB.split('/').pop()} against ${rootA.split('/').pop()}, switches ${PLANT ? 'ON (planted)' : 'off'}: ${n} paths compared, ${bad} differing`);
process.exit(bad ? 1 : 0);
