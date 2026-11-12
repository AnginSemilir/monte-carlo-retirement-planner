/*
 * THE CANDIDATE'S TIERS AND THE AGE WEIGHTS, THEIR TESTS (STATE.md D48; EXPLORATORY options, off by default). The external
 * review's lock/lock-test.mjs (research/reviews/2026-10-30/ on review/external-2026-10-21 at 7f492a7), ported without its
 * EZ checks, against the solver as it was before the port (BASE, or the root given):
 *   node research/tests/lock-tiers.test.mjs [<root of the code before the port>] [--dev]
 * Without a root, BASE is checked out into a temporary git worktree (its engine built there) and removed after. --dev: every
 * solve with e3pcls off, for use before the pin is refreshed on the ported code; never a record.
 * At light settings (4 wealth points, a small reference lattice; S090 and S328F, the review's households, under APP's pick):
 *   1. OFF: with neither option, every table of every layer, world and year is the code before the port's to the bit, 40
 *      forward runs and the run record the same, at the candidate's settings and on the layer loop (tsOnce: false)
 *   2. THE AGE WEIGHTS: DIAL10M (lambda times ten, ageWeight { mode 90, disp 9 }) on the layer loop the same as on E5, its
 *      tables and 40 runs, the weights recorded; planted: mode 91 parts the tables
 *   3. THE LOCK (lockTiers: the candidate's own solve; a locked solve takes the candidate's decision on the tier above, so
 *      that the two menus are one):
 *      a. the candidate locked to itself is the candidate on the layer loop, its tables to the bit and 40 runs
 *      b. DIAL10M locked: at every year, layer and cell the table's move is on the pair the candidate's table chose there;
 *         at every decision of 40 forward runs (runPolicy, as the engine through the bridge) the move is on the pair the
 *         candidate's chooser picks at that position; it differs from itself unlocked
 *      c. planted: the lock reading the first layer's choice for every layer held ('layer0': the table check must fail);
 *         the chooser unlocked ('nochooser': the decisions' check must fail)
 *      d. the same as b and c with the lock's base the candidate as it is since D73, solved on anchors and shortlists (what a
 *         dial position above 1 is locked to in the app, solverApp.js): on both households the locked table on the base's pair
 *         at every cell and the locked move on the base's chooser's pair at every decision; both plants caught on that base
 *   4. THE REFUSALS: the lock on E5's path, with a switch margin, without joint worlds, with a candidate solved on another
 *      grid or another plan; the age weights with no dispersion: each throws its own refusal
 * Since D73's port (11 Nov) the candidate sweeps cash ISA money to the ISA and is solved on anchors and shortlists (`coarse`),
 * exact only on E5's path: a solve on the layer loop takes the whole menu (solveCandidate, solve.js coarseWhereFits). So:
 * check 1 solves the candidate before D73 on this code (candidate.mjs BEFORE_D73_OPTS), which is what the code before the port
 * solves; check 1b's pins are re-taken on the candidate as it is, E5's on anchors and the loop's on the whole menu (the
 * working: results-d73-fulltier.txt), and 1c holds what the one pin for both used to: E5 with `coarse` taken out is the loop
 * to the bit; checks 2, 3a, 3b and 3c are identities and measures of the age weights and the lock, not of the anchors, and
 * run with `coarse` taken out of E5's side (the reviewer of 11 Nov, reviews/2026-11-11-default-d73.md, finding 2); 3d is new.
 */
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

// the code before the port (D48): the branch's head when it was made, src/solver as the port found it
const BASE = '0223182';
const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..', '..')), ARGS = process.argv.slice(2), DEV = ARGS.includes('--dev');
let BROOT = ARGS.filter(x => !x.startsWith('--')).map(x => resolve(x))[0], tmpWt = null;
if (!BROOT) {
  tmpWt = join(mkdtempSync(join(tmpdir(), 'lock-tiers-')), 'base');
  execFileSync('git', ['worktree', 'add', '-q', '--detach', tmpWt, BASE], { cwd: ROOT, stdio: 'ignore' });
  if (existsSync(join(ROOT, 'node_modules'))) symlinkSync(join(ROOT, 'node_modules'), join(tmpWt, 'node_modules'));
  execFileSync('python3', ['research/build-engine.py'], { cwd: tmpWt, stdio: 'ignore' });
  BROOT = tmpWt;
}
const cleanup = () => { if (tmpWt) { try { execFileSync('git', ['worktree', 'remove', '--force', tmpWt], { cwd: ROOT, stdio: 'ignore' }); } catch (e) { rmSync(tmpWt, { recursive: true, force: true }); } tmpWt = null; } };
process.on('exit', cleanup);

const imp = (root, p) => import(pathToFileURL(resolve(root, p)).href);
const load = async root => ({ root, E: await imp(root, 'research/engine.mjs'), M: await imp(root, 'src/solver/model.js'), C: await imp(root, 'research/solver/candidate.mjs'), S: await imp(root, 'src/solver/solve.js') });
const X = await load(ROOT), B = await load(BROOT);
const { E, M, C, S } = X;
const { readPanel, appPlan } = await imp(ROOT, 'research/solver/phase4-panel.mjs');
const { armA } = await imp(ROOT, 'research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA } = await imp(ROOT, 'research/solver/audit-phase4.mjs');

let failed = 0, passed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (c) passed++; else failed++; };
const sec = t0 => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
const headOf = root => { try { return execSync('git log --oneline -1', { cwd: root }).toString().trim().slice(0, 7); } catch (e) { return '?'; } };
const dirty = root => { try { return execSync('git status --short src/solver', { cwd: root }).toString().trim() ? ' with changes' : ''; } catch (e) { return ''; } };
const panel = readPanel();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => { const h = panel.find(x => x.id === id); const pk = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy; return prep(solverPlanOf(h.plan, { decumulationPolicy: pk })); };
const light = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true }, ...(DEV ? { e3pcls: false } : {}) };
const LOOP = { tsOnce: false }, AW = { mode: 90, disp: 9 }, D10M = { lambda: 10 * LAMBDA, ageWeight: AW };
/*
 * Check 1 against the code before the port where the review of 9 Nov's items 3 and 4 leave a table alone (D69): cash interest
 * untaxed, no dividend yield, any Auto deposit typed into the taxable account. Check 1b pins the options-off solve of the
 * household as the test takes it, at each of check 1's two settings: its tables and 40 forward runs, digested (PIN1B, taken on
 * item 3's code; again on item 4's where the household has an Auto deposit). CHECK1_PLANT=1 swaps the two plans on this code's
 * side: check 1 and check 1b must both fail. RECORD1B=1 prints 1b's digests.
 */
const PLANT1 = process.env.CHECK1_PLANT === '1', RECORD1B = process.env.RECORD1B === '1';
const NEUTRAL = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, cashInterestTaxed: false, giaDividendYield: 0 }, oneOffContributions: (plan.oneOffContributions || []).map(x => (x.category === E.AUTO_DEPOSIT ? { ...x, category: E.CATEGORY_LABEL.other } : x)) }));
const PIN1B = {   // taken on item 3's code (the review of 9 Nov), the light settings; S026's and S090's again on item 4's (each
  // has an Auto deposit in 2030 the plan routes into its pension: the same £3,600 now lands for £2,880, £720 more kept taxable)
  // re-taken on D73's candidate (12 Nov; before, E5 and the loop alike: S090 f1e1167100e2f43b..., S328F 7f0bb15e4811424c...): the sweep
  // to the ISA moves both, and E5 is now solved on anchors while the loop keeps the whole menu, so each household has two
  // figures; nothing else in the port moves them (with both keys out each solve gives the figure before:
  // results-d73-fulltier.txt, printed by research/solver/d73-fulltier.mjs)
  'S090 e5': 'c789a06cbc51db2ef8ebb900d0b71c47d2e32e62268dc31551451b18ff513174',
  'S090 loop': '349a6b25a08868f37a7a08fa00509e273dc8b9d61573ba70b9cef6f9172b2019',
  'S328F e5': 'a2d5a178a50037e6cecccaa88b692aad415d742f6c1cf1d2c22c364068af960b',
  'S328F loop': 'af6a40fb9e205cad29be0284c437d67f61f23a65dc2ad09d198564289f448139'
};
const { tablesOf, digestOf } = await import(pathToFileURL(resolve(ROOT, 'src/solverDigest.js')).href);
const { createHash } = await import('node:crypto');
const digest1b = async (r, runs) => createHash('sha256').update(await digestOf(tablesOf(r))).update(runs.join('\n')).digest('hex');
console.log(`The lock's and the age weights' tests${DEV ? ' (--dev: e3pcls off, not a record)' : ''}: the ported code at ${ROOT} (${headOf(ROOT)}${dirty(ROOT)}), the code before the port at ${BROOT} (${headOf(BROOT)}${dirty(BROOT)})`);

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
const solve = (Cx, Ex, Mx, plan, o, base) => Cx.solveCandidate(Ex, Mx, structuredClone(plan), o, base);
// the whole menu named by the arm itself: the candidate's `coarse` left out of a solve on E5's path, which could take it
const WHOLE = { coarse: undefined };
// whether a solve was made on anchors and shortlists (meta.coarse, with the cells solved on a shortlist), or on the whole menu
const onAnchors = r => !!(r.meta.coarse && !r.meta.coarse.off && r.meta.coarse.fine > 0), onWhole = r => !r.meta.coarse || !!r.meta.coarse.off;
// the candidate's own decision on the tier above (solvePlanAuto, D16): a locked solve takes it, so that its menu is the candidate's
const aboveOf = r => { const d = r.meta.riskAbove && r.meta.riskAbove.decision; if (typeof d !== 'string') throw new Error('the candidate records no decision on the tier above'); return d.startsWith('on'); };
const lockOf = rc => ({ lockTiers: rc, riskAbove: aboveOf(rc) });

// ---------------------------------------------------------------------------------------------------- 1. OFF
console.log('=========== 1. OFF: THE TABLES AND RUNS OF THE CODE BEFORE THE PORT ===========');
const H = {};
for (const id of ['S090', 'S328F']) {
  const full = planOf(id), plan = NEUTRAL(full);
  H[id] = { plan: full };
  for (const [name, extra, key] of [["the candidate's settings", {}, 'e5'], ['the layer loop (tsOnce: false)', LOOP, 'loop']]) {
    let t0 = Date.now();
    // this code's side on the candidate before D73 (no sweep to the ISA, no anchors): what the code before the port solves
    const a = solve(C, E, M, PLANT1 ? full : plan, { ...light, ...extra }, C.BEFORE_D73_OPTS), ta = sec(t0);
    const pathsN = E.pathsForSeed(99001, 40, a.m.ctx.totalYears), ra = runsOf(S, a, pathsN);
    t0 = Date.now();
    const b = solve(B.C, B.E, B.M, plan, { ...light, ...extra }), st = sameTables(a, b), rd = runDiff(ra, runsOf(B.S, b, pathsN)), md = metaDiff(a, b);
    ok(st.same && st.n > 0 && rd < 0 && md.length === 0 && !a.lockTiers && !a.meta.lockTiers && !a.meta.ageWeight && !a.costOf.meta,
      `1. ${id}, ${name}, both options off, the candidate before D73, against the code before the port (cash interest untaxed, no dividend yield, any Auto deposit typed into the taxable account: D69${PLANT1 ? '; planted: this code on the plan as taken' : ''}): ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the run record ${md.length ? `differs at ${md.slice(0, 4).join(', ')}` : 'the same, its timings aside'} (the ported code's solve ${ta}, the code before's ${sec(t0)})`);
    // 1b. both options off on the household as the test takes it, against its pinned digest; the later checks build on it
    const off = solve(C, E, M, PLANT1 ? plan : full, { ...light, ...extra });
    if (!H[id].paths) H[id].paths = E.pathsForSeed(99001, 40, off.m.ctx.totalYears);
    const ro = runsOf(S, off, H[id].paths), dg = await digest1b(off, ro), pk = `${id} ${key}`;
    if (RECORD1B) console.log(`RECORD1B ${pk} ${dg}`);
    const menuOk = key === 'e5' ? onAnchors(off) : onWhole(off);
    ok(dg === PIN1B[pk] && menuOk, `1b. ${id}, ${name}, both options off, as the test takes it (interest, dividends and any Auto deposit; ${key === 'e5' ? 'on anchors and shortlists' : 'the whole menu'}${menuOk ? '' : ': NOT SO'}): its tables and 40 forward runs ${dg.slice(0, 16)} against the pin ${PIN1B[pk] ? PIN1B[pk].slice(0, 16) : 'not taken'}${PLANT1 ? '; planted: the neutral plan' : ''}`);
    H[id][key] = off; H[id][`${key}Runs`] = ro;
  }
}
if (RECORD1B || PLANT1) { console.log(`\ncheck 1 and 1b only (${RECORD1B ? 'RECORD1B' : 'CHECK1_PLANT'}): ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); }
// 1c. E5 is the layer loop, to the bit, on the candidate as it is (the sweep to the ISA with it): before D73 one pin held both
// of 1b's solves; now E5's own solve is on anchors, so the identity is read with `coarse` taken out of E5's side. The later
// identities (3a, 3b) build on this solve. Planted: E5's own solve, on anchors, must part from the loop
for (const id of ['S090', 'S328F']) {
  const t0 = Date.now(), w = solve(C, E, M, H[id].plan, { ...light, ...WHOLE }), st = sameTables(w, H[id].loop), rd = runDiff(runsOf(S, w, H[id].paths), H[id].loopRuns);
  H[id].e5w = w;
  ok(st.same && st.n > 0 && rd < 0 && onWhole(w) && w.meta.tsOnce === true && H[id].loop.meta.tsOnce === false,
    `1c. ${id}, the candidate on E5 with coarse taken out (the whole menu) is the candidate on the layer loop: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`} (${sec(t0)})`);
  const sp = sameTables(H[id].e5, H[id].loop);
  ok(!sp.same && onAnchors(H[id].e5), `1c. planted: ${id}, the candidate's own solve, on anchors and shortlists (${H[id].e5.meta.coarse ? H[id].e5.meta.coarse.fine : 0} cells on a shortlist), parts from the loop (first difference at ${sp.at})`);
}

// ---------------------------------------------------------------------------------------------------- 2. THE AGE WEIGHTS
console.log('=========== 2. THE AGE WEIGHTS ===========');
{
  const plan = H.S090.plan;
  let t0 = Date.now();
  // the identity is the age weights', so E5's side is on the whole menu as the loop's is (coarse taken out), the planted solve too
  const a = solve(C, E, M, plan, { ...light, ...D10M, ...WHOLE }), ta = sec(t0), ra = runsOf(S, a, H.S090.paths);
  t0 = Date.now();
  const L = solve(C, E, M, plan, { ...light, ...D10M, ...LOOP }), st = sameTables(L, a), rl = runsOf(S, L, H.S090.paths), rd = runDiff(rl, ra);
  ok(st.same && st.n > 0 && rd < 0 && onWhole(a) && onWhole(L) && JSON.stringify(a.meta.ageWeight) === JSON.stringify(AW) && JSON.stringify(L.meta.ageWeight) === JSON.stringify(AW) && a.lambda === 10 * LAMBDA && a.costOf.w && a.costOf.w[0] === 1,
    `2. S090, DIAL10M (lambda times ten, ageWeight ${JSON.stringify(a.meta.ageWeight)}) on the layer loop the same as on E5, both on the whole menu (coarse taken out): ${st.n} table entries to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; the weight at year 0 ${a.costOf.w[0]}, at year 20 ${a.costOf.w[20].toFixed(4)} (E5 ${ta}, the loop ${sec(t0)})`);
  H.S090.d10m = a; H.S090.d10mLoop = L; H.S090.d10mLoopRuns = rl;
  const t1 = Date.now(), p = solve(C, E, M, plan, { ...light, lambda: 10 * LAMBDA, ageWeight: { mode: 91, disp: 9 }, ...WHOLE }), sp = sameTables(p, a);
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
  // the identity is the lock's: its base the candidate on the whole menu (1c's solve), as the loop it is compared with
  const t0 = Date.now(), rc = H[id].e5w, L = solve(C, E, M, H[id].plan, { ...light, ...LOOP, ...lockOf(rc) });
  const st = sameTables(L, H[id].loop), rd = runDiff(runsOf(S, L, H[id].paths), H[id].loopRuns);
  ok(st.same && st.n > 0 && rd < 0 && L.meta.lockTiers && L.lockTiers && L.lockTiers.rc === rc && onWhole(rc),
    `3a. ${id}: the candidate (on the whole menu, coarse taken out) locked to itself is the candidate on the layer loop: ${st.n} table entries the same to the bit${st.same ? '' : ` (first difference: ${st.at})`}; 40 forward runs ${rd < 0 ? 'the same' : `differ first at path ${rd}`}; recorded ${JSON.stringify(L.meta.lockTiers)}; the candidate's tier above: ${rc.meta.riskAbove.decision} (${sec(t0)})`);
}
// 3b and 3c on a base: `tag` the checks' label, `rc` the candidate's solve the position is locked to, `what` how it was solved
const lockChecks = (tag, id, rc, what, plants) => {
  const plan = H[id].plan, paths = H[id].paths;
  const t0 = Date.now(), L = solve(C, E, M, plan, { ...light, ...LOOP, ...D10M, ...lockOf(rc) }), ts = sec(t0);
  const ht = honourTable(L, rc), hc = honourChooser(L, rc, paths);
  ok(ht.n > 0 && ht.bad === 0 && onWhole(L), `${tag}. ${id}, DIAL10M locked to ${what}: the table's move on the candidate's pair at every year, layer and cell (${ht.n})${ht.bad ? `: ${ht.bad} off it, the first at ${ht.at}` : ''} (${ts})`);
  ok(hc.n > 0 && hc.bad === 0, `${tag}. ${id}, DIAL10M locked to ${what}: the move on the pair the candidate's chooser picks, at every decision of 40 forward runs (${hc.n})${hc.bad ? `: ${hc.bad} off it, the first at ${hc.at}` : ''}`);
  if (H[id].d10mLoop) {
    const st = sameTables(L, H[id].d10mLoop), nd = runsDiffering(runsOf(S, L, paths), H[id].d10mLoopRuns);
    ok(!st.same && nd > 0, `${tag}. ${id}, DIAL10M locked to ${what} differs from DIAL10M unlocked: the tables part (first at ${st.at}); ${nd} of 40 forward runs differ`);
  }
  if (!plants) return;
  const t1 = Date.now(), P1 = solve(C, E, M, plan, { ...light, ...LOOP, ...D10M, ...lockOf(rc), lockTiersPlant: 'layer0' }), h1 = honourTable(P1, rc);
  ok(h1.bad > 0, `${plants}. planted, the base ${what}: the lock reading the first layer's choice for every layer held ('layer0'): ${h1.bad} of ${h1.n} cells off the candidate's pair, caught (${sec(t1)})`);
  const t2 = Date.now(), P2 = solve(C, E, M, plan, { ...light, ...LOOP, ...D10M, ...lockOf(rc), lockTiersPlant: 'nochooser' }), h2 = honourChooser(P2, rc, paths);
  ok(h2.bad > 0, `${plants}. planted, the base ${what}: the chooser unlocked ('nochooser'): ${h2.bad} of ${h2.n} decisions off the candidate's pair, caught (${sec(t2)})`);
};
lockChecks('3b', 'S090', H.S090.e5w, 'the candidate on the whole menu (coarse taken out)', '3c');
// 3d. the base the candidate as it is since D73, solved on anchors and shortlists: what the app locks a dial position above 1
// to (solverApp.js: the position on the layer loop and the whole menu, its base the candidate's own solve). The lock must hold
// on that base as on the whole menu's: at every cell the base's table stores a move, an anchor's or a shortlist's, and at
// every decision of the forward runs. Both households; the plants on S090
for (const id of ['S090', 'S328F']) {
  const rc = H[id].e5;
  ok(onAnchors(rc), `3d. ${id}: the base is the candidate as it is, solved on anchors and shortlists: ${rc.meta.coarse ? `${rc.meta.coarse.fine} cells on a shortlist, ${rc.meta.coarse.fallback} fallen back to the whole menu` : 'NO, the whole menu'}`);
  lockChecks('3d', id, rc, 'the candidate on anchors and shortlists', id === 'S090' ? '3d' : null);
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
cleanup();
console.log(failed ? `FAILED: ${failed} of ${passed + failed} checks` : `ALL PASS: ${passed} checks`);
process.exit(failed ? 1 : 0);
