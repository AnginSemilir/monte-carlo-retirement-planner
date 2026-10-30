/*
 * THE CANDIDATE'S TIERS AND THE AGE WEIGHTS ON EZ'S CODE, THEIR TESTS (EXPLORATORY; LOCK.md section 2; the patch
 * lock/solve-lock.patch, on the agent's code at a0e6400 with ez/solve-ez.patch, in a local worktree only). Run from the root
 * of the patched code, with the root of EZ's code (a0e6400 with ez/solve-ez.patch) and of the age weights' (the agent's
 * 1b39400 with dial/solve-ageweight.patch, on which the DIAL10M units were solved):
 *   node lock-test.mjs <root of EZ's code> <root of the age weights' code> [--dev]
 * --dev: every solve with e3pcls off, for use before the pin is refreshed on the patched code; never a record.
 * At light settings (4 wealth points, a small reference lattice; S090 and S328F, the review's households):
 *   1. OFF: with neither option, every table of every layer, world and year is EZ's code's to the bit, and 40 forward runs
 *      and the run record the same: the candidate at its settings and on the layer loop (tsOnce: false), and EZ (gamma 4,
 *      rho 2, the price of failing 30) on the layer loop; and the candidate the same against the age weights' code (the
 *      base the DIAL10M units were solved on), so that 2 can read its port alone
 *   2. THE AGE WEIGHTS' PORT: DIAL10M (lambda times ten, ageWeight { mode 90, disp 9 }) the age weights' code's to the bit,
 *      its tables and 40 runs, and its record differing only where the candidate's does; on the layer loop the same as on
 *      E5; planted: mode 91 parts the tables
 *   3. THE LOCK (lockTiers: the candidate's own solve, its settings; a locked solve takes the candidate's decision on the tier
 *      above, solvePlanAuto's, so that the two menus are one):
 *      a. the candidate locked to itself is the candidate on the layer loop, its tables to the bit and 40 runs
 *      b. EZ and DIAL10M locked: at every year, layer and cell the table's move is on the pair the candidate's table chose
 *         there; at every decision of 40 forward runs (runPolicy, as the engine through the bridge) the move is on the pair
 *         the candidate's chooser picks at that position; each locked arm differs from itself unlocked
 *      c. planted: the lock reading the first layer's choice for every layer held (the table check must fail); the chooser
 *         unlocked (the decisions' check must fail)
 *   4. THE REFUSALS: the lock on E5's path, with a switch margin, without joint worlds, with a candidate solved on another
 *      grid or another plan; the age weights with no dispersion: each throws its own refusal
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';
const ROOT = process.cwd(), ARGS = process.argv.slice(2), DEV = ARGS.includes('--dev');
const [EZROOT, AWROOT] = ARGS.filter(x => !x.startsWith('--')).map(x => resolve(x));
if (!EZROOT || !AWROOT) throw new Error("usage: node lock-test.mjs <root of EZ's code> <root of the age weights' code> [--dev]");
const imp = (root, p) => import(pathToFileURL(resolve(root, p)).href);
const load = async root => ({ root, E: await imp(root, 'research/engine.mjs'), M: await imp(root, 'src/solver/model.js'), C: await imp(root, 'research/solver/candidate.mjs'), S: await imp(root, 'src/solver/solve.js') });
const X = await load(ROOT), EZC = await load(EZROOT), AWC = await load(AWROOT);
const { E, M, C, S } = X;
const { readPanel, appPlan } = await imp(ROOT, 'research/solver/phase4-panel.mjs');
const { armA } = await imp(ROOT, 'research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp(ROOT, 'research/solver/audit-phase4.mjs');

let failed = 0, passed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (c) passed++; else failed++; };
const sec = t0 => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
const headOf = root => { try { return execSync('git log --oneline -1', { cwd: root }).toString().trim().slice(0, 7); } catch (e) { return '?'; } };
const panel = readPanel();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => { const h = panel.find(x => x.id === id); const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy; return prep(solverPlanOf(h.plan, { decumulationPolicy: pk })); };
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true }, ...(DEV ? { e3pcls: false } : {}) };
const EZS = { gamma: 4, rho: 2, failPrice: 30 }, LOOP = { tsOnce: false }, AW = { mode: 90, disp: 9 }, D10M = { lambda: 10 * LAMBDA, ageWeight: AW };
console.log(`The lock's and the age weights' tests${DEV ? ' (--dev: e3pcls off, not a record)' : ''}: the patched code at ${ROOT} (${headOf(ROOT)} with the patches), EZ's code at ${EZROOT} (${headOf(EZROOT)} with EZ's patch), the age weights' at ${AWROOT} (${headOf(AWROOT)} with theirs)`);

const KEYS = ['surv', 'lsurv', 'resil', 'lresil', 'beq', 'short', 'pol'];
const sameTables = (a, b) => {
  const La = a.tablesW.layW, Lb = b.tablesW.layW;
  let n = 0;
  if (!La || !Lb || La.length !== Lb.length) return { same: false, n, at: "the worlds' layers" };
  for (let k = 0; k < La.length; k++) {
    if (La[k].length !== Lb[k].length) return { same: false, n, at: `world ${k}'s layers` };
    for (let j = 0; j < La[k].length; j++) for (const key of KEYS) {
      const x = La[k][j][key], y = Lb[k][j][key];
      if (!x || !y || x.length !== y.length) return { same: false, n, at: `world ${k} layer ${j} ${key}` };
      for (let t = 0; t < x.length; t++) {
        const u = x[t], v = y[t];
        if (u.length !== v.length) return { same: false, n, at: `world ${k} layer ${j} ${key} year ${t}` };
        for (let i = 0; i < u.length; i++) { n++; if (!Object.is(u[i], v[i])) return { same: false, n, at: `world ${k} layer ${j} ${key} year ${t} cell ${i}: ${u[i]} against ${v[i]}` }; }
      }
    }
  }
  return { same: true, n };
};
const runsOf = (Sx, r, paths) => paths.map(zs => JSON.stringify(Sx.runPolicy(r, Float64Array.from(zs))));
const runDiff = (ra, rb) => ra.findIndex((x, i) => x !== rb[i]);
const runsDiffering = (ra, rb) => ra.filter((x, i) => x !== rb[i]).length;
// the run record, its timings aside (every key named ms, at any depth)
const flat = (o, pre = '', out = {}) => { for (const [k, x] of Object.entries(o || {})) { if (k === 'ms') continue; if (x && typeof x === 'object' && !Array.isArray(x)) flat(x, `${pre}${k}.`, out); else out[`${pre}${k}`] = JSON.stringify(x); } return out; };
const metaDiff = (a, b) => { const fa = flat(a.meta), fb = flat(b.meta); return [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter(k => fa[k] !== fb[k]).sort(); };
const solve = (Cx, Ex, Mx, plan, o) => Cx.solveCandidate(Ex, Mx, structuredClone(plan), o);
// the candidate's own decision on the tier above (solvePlanAuto, D16): a locked solve takes it, so that its menu is the candidate's
const aboveOf = r => { const d = r.meta.riskAbove && r.meta.riskAbove.decision; if (typeof d !== 'string') throw new Error('the candidate records no decision on the tier above'); return d.startsWith('on'); };
const lockOf = rc => ({ lockTiers: rc, riskAbove: aboveOf(rc) });

// ---------------------------------------------------------------------------------------------------- 1. OFF
console.log("=========== 1. OFF: EZ'S CODE'S TABLES AND RUNS ===========");
const H = {};
for (const id of ['S090', 'S328F']) {
  const plan = planOf(id);
  H[id] = { plan };
  for (const [name, extra, key] of [["the candidate's settings", {}, 'e5'], ['the layer loop (tsOnce: false)', LOOP, 'loop']]) {
    let t0 = Date.now();
    const a = solve(C, E, M, plan, { ...light, ...extra }), ta = sec(t0);
    if (!H[id].paths) H[id].paths = E.pathsForSeed(99001, 40, a.m.ctx.totalYears);
    const ra = runsOf(S, a, H[id].paths);
    t0 = Date.now();
    const b = solve(EZC.C, EZC.E, EZC.M, plan, { ...light, ...extra }), st = sameTables(a, b), rd = runDiff(ra, runsOf(EZC.S, b, H[id].paths)), md = metaDiff(a, b);
    ok(st.same && st.n > 0 && rd < 0 && md.length === 0 && !a.lockTiers && !a.meta.lockTiers && !a.meta.ageWeight && !a.costOf.meta,
      `1. ${id}, ${name}, both options off, against EZ's code: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record ${md.length ? `differs at ${md.slice(0, 4).join(', ')}` : 'the same, its timings aside'} (the patched code's solve ${ta}, EZ's code's ${sec(t0)})`);
    H[id][key] = a; H[id][`${key}Runs`] = ra;
  }
  // the base: the candidate against the age weights' code (1b39400), so that 2 reads the port alone
  const t0 = Date.now(), b = solve(AWC.C, AWC.E, AWC.M, plan, light), st = sameTables(H[id].e5, b), rd = runDiff(H[id].e5Runs, runsOf(AWC.S, b, H[id].paths));
  H[id].baseMeta = metaDiff(H[id].e5, b);
  ok(st.same && st.n > 0 && rd < 0, `1. ${id}, the candidate's settings, against the age weights' code (${headOf(AWROOT)}): ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record differs at ${H[id].baseMeta.length ? H[id].baseMeta.join(', ') : 'nothing'}, the agent's commits since (${sec(t0)})`);
}
{
  const plan = H.S090.plan;
  let t0 = Date.now();
  const a = solve(C, E, M, plan, { ...light, ...LOOP, ez: EZS }), ta = sec(t0), ra = runsOf(S, a, H.S090.paths);
  t0 = Date.now();
  const b = solve(EZC.C, EZC.E, EZC.M, plan, { ...light, ...LOOP, ez: EZS }), st = sameTables(a, b), rd = runDiff(ra, runsOf(EZC.S, b, H.S090.paths)), md = metaDiff(a, b);
  ok(st.same && st.n > 0 && rd < 0 && md.length === 0 && a.meta.ez && a.meta.ez.failPrice === 30,
    `1. S090, EZ (gamma 4, rho 2, the price of failing 30) on the layer loop, against EZ's code: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record ${md.length ? `differs at ${md.slice(0, 4).join(', ')}` : 'the same, its timings aside'} (${ta}, ${sec(t0)})`);
  H.S090.ez = a; H.S090.ezRuns = ra;
}

// ---------------------------------------------------------------------------------------------------- 2. THE AGE WEIGHTS' PORT
console.log("=========== 2. THE AGE WEIGHTS' PORT ===========");
for (const id of ['S090', 'S328F']) {
  const plan = H[id].plan;
  let t0 = Date.now();
  const a = solve(C, E, M, plan, { ...light, ...D10M }), ta = sec(t0), ra = runsOf(S, a, H[id].paths);
  t0 = Date.now();
  const b = solve(AWC.C, AWC.E, AWC.M, plan, { ...light, ...D10M }), st = sameTables(a, b), rd = runDiff(ra, runsOf(AWC.S, b, H[id].paths)), md = metaDiff(a, b);
  const sameAsBase = JSON.stringify(md) === JSON.stringify(H[id].baseMeta);
  ok(st.same && st.n > 0 && rd < 0 && sameAsBase && JSON.stringify(a.meta.ageWeight) === JSON.stringify(AW) && a.lambda === 10 * LAMBDA,
    `2. ${id}, DIAL10M (lambda times ten, ageWeight ${JSON.stringify(a.meta.ageWeight)}), against the age weights' code: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record ${sameAsBase ? "differing only where the candidate's does" : `differs at ${md.join(', ')}`} (${ta}, ${sec(t0)})`);
  H[id].d10m = a; H[id].d10mRuns = ra;
}
{
  const plan = H.S090.plan, t0 = Date.now();
  const a = solve(C, E, M, plan, { ...light, ...D10M, ...LOOP }), st = sameTables(a, H.S090.d10m), ra = runsOf(S, a, H.S090.paths), rd = runDiff(ra, H.S090.d10mRuns);
  ok(st.same && st.n > 0 && rd < 0, `2. S090, DIAL10M on the layer loop the same as on E5: ${st.n} table entries to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`} (${sec(t0)})`);
  H.S090.d10mLoop = a; H.S090.d10mLoopRuns = ra;
  const t1 = Date.now(), p = solve(C, E, M, plan, { ...light, lambda: 10 * LAMBDA, ageWeight: { mode: 91, disp: 9 } }), sp = sameTables(p, H.S090.d10m);
  ok(!sp.same, `2. planted: the age weights at mode 91 part the tables (first difference at ${sp.at}) (${sec(t1)})`);
}

// ---------------------------------------------------------------------------------------------------- 3. THE LOCK
console.log("=========== 3. THE LOCK: THE CANDIDATE'S TIERS ===========");
// the table: at every year, layer held and cell, the locked table's move on the pair the candidate's table chose there
const honourTable = (L, rc) => {
  let n = 0, bad = 0, at = null;
  for (let j = 0; j < L.tsLayers.length; j++) for (let t = 0; t < L.tsLayers[j].pol.length; t++) {
    const pl = L.tsLayers[j].pol[t], pc = rc.tsLayers[j].pol[t];
    for (let i = 0; i < pl.length; i++) { n++; if (L.tsLayerOf[pl[i]] !== rc.tsLayerOf[pc[i]]) { bad++; if (!at) at = `layer ${j}, year ${t}, cell ${i}`; } }
  }
  return { n, bad, at };
};
// the chooser: at every decision of the forward runs, the locked move on the pair the candidate's own chooser picks there
const honourChooser = (L, rc, paths) => {
  let n = 0, bad = 0, at = null;
  paths.forEach((zs, p) => S.runPolicy(L, Float64Array.from(zs), { visit: (t, s, held, ai) => { const ac = S.chooseAction(rc, s, t, held); n++; if (L.tsLayerOf[ai] !== rc.tsLayerOf[ac]) { bad++; if (!at) at = `path ${p}, year ${t}`; } } }));
  return { n, bad, at };
};
for (const id of ['S090', 'S328F']) {
  const t0 = Date.now(), rc = H[id].e5, L = solve(C, E, M, H[id].plan, { ...light, ...LOOP, ...lockOf(rc) });
  const st = sameTables(L, H[id].loop), rd = runDiff(runsOf(S, L, H[id].paths), H[id].loopRuns);
  ok(st.same && st.n > 0 && rd < 0 && L.meta.lockTiers && L.lockTiers && L.lockTiers.rc === rc,
    `3a. ${id}: the candidate locked to itself is the candidate on the layer loop: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; recorded ${JSON.stringify(L.meta.lockTiers)}; the candidate's tier above: ${rc.meta.riskAbove.decision} (${sec(t0)})`);
}
{
  const plan = H.S090.plan, rc = H.S090.e5, paths = H.S090.paths;
  for (const [name, extra, unlocked, unlockedRuns] of [['EZ', { ez: EZS }, H.S090.ez, H.S090.ezRuns], ['DIAL10M', D10M, H.S090.d10mLoop, H.S090.d10mLoopRuns]]) {
    const t0 = Date.now(), L = solve(C, E, M, plan, { ...light, ...LOOP, ...extra, ...lockOf(rc) }), ts = sec(t0);
    const ht = honourTable(L, rc), hc = honourChooser(L, rc, paths), st = sameTables(L, unlocked), rl = runsOf(S, L, paths), nd = runsDiffering(rl, unlockedRuns);
    ok(ht.n > 0 && ht.bad === 0, `3b. S090, ${name} locked: the table's move on the candidate's pair at every year, layer and cell (${ht.n})${ht.bad ? `: ${ht.bad} off it, the first at ${ht.at}` : ''} (${ts})`);
    ok(hc.n > 0 && hc.bad === 0, `3b. S090, ${name} locked: the move on the pair the candidate's chooser picks, at every decision of 40 forward runs (${hc.n})${hc.bad ? `: ${hc.bad} off it, the first at ${hc.at}` : ''}`);
    ok(!st.same && nd > 0, `3b. S090, ${name} locked differs from ${name} unlocked: the tables part (first at ${st.at}); ${nd} of 40 forward runs differ`);
  }
  const t1 = Date.now(), P1 = solve(C, E, M, plan, { ...light, ...LOOP, ez: EZS, ...lockOf(rc), lockTiersPlant: 'layer0' }), h1 = honourTable(P1, rc);
  ok(h1.bad > 0, `3c. planted: the lock reading the first layer's choice for every layer held: ${h1.bad} of ${h1.n} cells off the candidate's pair, caught (${sec(t1)})`);
  const t2 = Date.now(), P2 = solve(C, E, M, plan, { ...light, ...LOOP, ez: EZS, ...lockOf(rc), lockTiersPlant: 'nochooser' }), h2 = honourChooser(P2, rc, paths);
  ok(h2.bad > 0, `3c. planted: the chooser unlocked: ${h2.bad} of ${h2.n} decisions off the candidate's pair, caught (${sec(t2)})`);
}

// ---------------------------------------------------------------------------------------------------- 4. THE REFUSALS
console.log('=========== 4. THE REFUSALS ===========');
{
  const plan = H.S090.plan, rc = H.S090.e5;
  const throws = f => { try { f(); return null; } catch (e) { return e.message; } };
  const t0 = Date.now(), rc5 = solve(C, E, M, plan, { ...light, points: 5 }), tc = sec(t0);
  const cases = [
    ["the lock on E5's path (the candidate's settings, tsOnce unset)", () => solve(C, E, M, plan, { ...light, ...lockOf(rc) }), /^lockTiers runs on/],
    ['the lock with a switch margin of 0.01', () => solve(C, E, M, plan, { ...light, ...LOOP, switchMargin: 0.01, ...lockOf(rc) }), /^lockTiers runs on/],
    // the adaptive reference refuses a solve without joint worlds before the lock is reached, so the plan reference here
    ['the lock without joint worlds (on the plan reference)', () => solve(C, E, M, plan, { ...light, ...LOOP, jointWorlds: false, readerRef: 'plan', ...lockOf(rc) }), /^lockTiers runs on/],
    ['the lock with the candidate solved at 5 points', () => solve(C, E, M, plan, { ...light, ...LOOP, ...lockOf(rc5) }), /^lockTiers: the candidate was solved on another grid/],
    ["the lock with S328F's candidate on S090's plan", () => solve(C, E, M, plan, { ...light, ...LOOP, lockTiers: H.S328F.e5, riskAbove: aboveOf(rc) }), /^lockTiers: the candidate was solved on another grid/],
    ['the age weights with no dispersion', () => solve(C, E, M, plan, { ...light, lambda: 10 * LAMBDA, ageWeight: { mode: 90, disp: 0 } }), /^ageWeight needs/]
  ];
  // each must throw its own refusal, not another check's
  for (const [name, f, want] of cases) { const t1 = Date.now(), m = throws(f); ok(m !== null && want.test(m), `4. ${name}: ${m ? `throws (${m.slice(0, 110)})${want.test(m) ? '' : ', NOT the refusal expected'}` : 'DOES NOT THROW'} (${sec(t1)})`); }
  console.log(`   (the candidate at 5 points for the grid's refusal: ${tc})`);
}
console.log(failed ? `FAILED: ${failed} of ${passed + failed} checks` : `ALL PASS: ${passed} checks`);
process.exit(failed ? 1 : 0);
