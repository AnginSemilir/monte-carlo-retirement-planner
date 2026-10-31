/*
 * THE PORT'S FULL-SCALE CHECK (STATE.md D48 item 7; EXPLORATORY, seed 7002). On one of the external review's households,
 * set up as its lock/lock-run.mjs sets up its units (research/reviews/2026-10-30/ on review/external-2026-10-21 at 7f492a7:
 * the plan under APP's pick, the candidate's settings at 45 points, the estate weight 0.02, the engine on 1,000 paths of
 * seed 7002, runPath held to E.runTrial on the first 100):
 *   CANDLK   the candidate, both options off: the lock's tiers, and with --base the same as the candidate on the code before
 *            the port on every path (survival, failure year, yearly level, spending delivered, unmet, estate, end wealth);
 *   D10MLK   DIAL10M's settings (lambda times ten, ageWeight { mode 90, disp 9 }) with its tiers locked to CANDLK's
 *            (lockTiers, the layer loop, the candidate's own decision on the tier above), its move held to the pair the
 *            candidate's chooser picks at every decision of the first 200 paths (runPolicy's visit; any other stops it).
 * The review's figures (lock/results-lock-run.txt): D10MLK S090 92.3%, S328F 93.3%; CAND S090 95.1%, S328F 94.1%.
 *   node research/solver/lock-check.mjs <id> [--base <root of the code before the port>]     (from the repository root)
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
const argv = process.argv.slice(2), flag = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const id = argv.find((x, i) => !x.startsWith('--') && argv[i - 1] !== '--base'), BROOT = flag('--base') ? resolve(flag('--base')) : null;
const REVIEW = { S090: { CAND: 95.1, D10MLK: 92.3 }, S328F: { CAND: 94.1, D10MLK: 93.3 } };
if (!REVIEW[id]) { console.error('usage: lock-check.mjs <S090|S328F> [--base <root>]'); process.exit(2); }
const SEED = 7002, N = 1000, CHECK = 100, BESIDE = 200, W = 0.02, AW = { mode: 90, disp: 9 };
const imp = (root, p) => import(pathToFileURL(resolve(root, p)).href);
const load = async root => ({ E: await imp(root, 'research/engine.mjs'), M: await imp(root, 'src/solver/model.js'), C: await imp(root, 'research/solver/candidate.mjs'), S: await imp(root, 'src/solver/solve.js'), A: await imp(root, 'research/solver/audit-phase4.mjs'), B: await imp(root, 'src/solver/bridge.js') });
const X = await load(process.cwd()), { E, M, C, S } = X;
const { readPanel, appPlan } = await imp(process.cwd(), 'research/solver/phase4-panel.mjs');
const { armA } = await imp(process.cwd(), 'research/solver/select-phase4.mjs');
const { solverPlanOf, LAMBDA, CAND_PTS } = X.A;
const head = root => { try { return execSync('git log --oneline -1', { cwd: root }).toString().trim().slice(0, 7) + (execSync('git status --short src/solver', { cwd: root }).toString().trim() ? ' with changes' : ''); } catch (e) { return '?'; } };
const h = readPanel().find(x => x.id === id);
const pick = armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy;
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pick }));
const base = { lambda: LAMBDA, points: CAND_PTS, bequestWeight: W };
const aboveOf = r => { const d = r.meta.riskAbove && r.meta.riskAbove.decision; if (typeof d !== 'string') throw new Error('the candidate records no decision on the tier above'); return d.startsWith('on'); };
// the engine on the solved plan, path by path (lock-run.mjs's loop): every path's outcomes, runPath held to E.runTrial on the first CHECK
const engine = (Y, r, label) => {
  const ctx = Y.E.buildContext(Y.B.withTable(r.m.ctx.plan, r)), paths = Y.E.pathsForSeed(SEED, N, ctx.totalYears), rows = [];
  let bad = 0;
  for (let k = 0; k < N; k++) {
    const zs = Float64Array.from(paths[k]), q = Y.A.runPath(ctx, zs);
    rows.push(JSON.stringify([q.survived, q.failYear, Array.from(q.level), q.delivered, q.unmet, q.estate, q.wealth]));
    if (k < CHECK) { const t = Y.E.runTrial(ctx, zs); if (t.survived !== q.survived || t.unmetTotal !== q.unmet) bad++; }
  }
  if (bad) throw new Error(`${id} ${label}: runPath differs from E.runTrial on ${bad} of the first ${CHECK} paths`);
  return { rows, surv: 100 * rows.filter(x => x.startsWith('[true')).length / N, paths, T: ctx.totalYears };
};
console.log(`LOCK-CHECK (EXPLORATORY, D48 item 7): ${id} under APP's pick (${pick}), ${CAND_PTS} points, the estate weight ${W}, seed ${SEED}, ${N} paths; the ported code ${head(process.cwd())}${BROOT ? `, the code before the port ${head(BROOT)}` : ''}`);
let t0 = Date.now();
const rc = C.solveCandidate(E, M, structuredClone(plan), base);
if (rc.meta.lockTiers || rc.meta.ageWeight || rc.lockTiers) throw new Error(`${id} CANDLK: an option is on`);
const tc = (Date.now() - t0) / 1000, ec = engine(X, rc, 'CANDLK');
let same = '';
if (BROOT) {
  const Y = await load(BROOT);
  t0 = Date.now();
  const rb = Y.C.solveCandidate(Y.E, Y.M, structuredClone(plan), base), eb = engine(Y, rb, 'CAND before the port');
  const differ = ec.rows.filter((x, k) => x !== eb.rows[k]).length;
  same = `; against the candidate on the code before the port: ${differ === 0 ? `THE SAME on all ${N} paths (survival, failure year, yearly level, delivered, unmet, estate, end wealth)` : `DIFFERS on ${differ} of ${N} paths`} (its survival ${eb.surv.toFixed(1)}%, solve ${Math.round((Date.now() - t0) / 1000)} s)`;
  if (differ) process.exitCode = 1;
}
console.log(`${id} CANDLK (both options off): survival ${ec.surv.toFixed(1)}% (the review's CAND ${REVIEW[id].CAND}%); the tier above ${rc.meta.riskAbove.decision}; solve ${Math.round(tc)} s${same}`);
t0 = Date.now();
const r = C.solveCandidate(E, M, structuredClone(plan), { ...base, lambda: 10 * LAMBDA, ageWeight: AW, tsOnce: false, lockTiers: rc, riskAbove: aboveOf(rc) });
if (!(r.meta.lockTiers && r.lockTiers && r.lockTiers.rc === rc && r.meta.tsOnce === false && JSON.stringify(r.meta.ageWeight) === JSON.stringify(AW) && Math.abs(r.lambda - 10 * LAMBDA) < 1e-15 && r.meta.failDelivered)) throw new Error(`${id} D10MLK: not as asked (lambda ${r.lambda}, lock ${JSON.stringify(r.meta.lockTiers)}, ageWeight ${JSON.stringify(r.meta.ageWeight)}, tsOnce ${r.meta.tsOnce})`);
const td = (Date.now() - t0) / 1000, ed = engine(X, r, 'D10MLK');
let decisions = 0, off = 0, firstOff = null, engineOnly = 0, policyOnly = 0;
for (let k = 0; k < BESIDE; k++) {
  const p = S.runPolicy(r, Float64Array.from(ed.paths[k]), { visit: (t, s, held, ai) => { decisions++; const ac = S.chooseAction(rc, s, t, held); if (r.tsLayerOf[ai] !== rc.tsLayerOf[ac]) { off++; if (!firstOff) firstOff = `path ${k} year ${t}`; } } }).survived;
  const e = ed.rows[k].startsWith('[true'); if (e && !p) engineOnly++; if (p && !e) policyOnly++;
}
if (off) throw new Error(`${id} D10MLK: ${off} of ${decisions} decisions off the candidate's pair, the first at ${firstOff}`);
const gap = ed.surv - REVIEW[id].D10MLK;
console.log(`${id} D10MLK (lambda times ten, ageWeight ${JSON.stringify(r.meta.ageWeight)}, tiers locked to CANDLK's): survival ${ed.surv.toFixed(1)}% (the review's ${REVIEW[id].D10MLK}%: ${Math.abs(gap) < 0.05 ? 'THE SAME' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)} points`}); the lock held at ${decisions} of ${decisions} decisions of the first ${BESIDE} paths; beside: the engine alone ${engineOnly}, runPolicy alone ${policyOnly}; solve ${Math.round(td)} s`);
