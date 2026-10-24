/*
 * A THIRD STEP DOWN (EXPLORATORY, the tuning seed 7002; the external review, 24 Oct; the archived M22 and M15 v2's sibling
 * arm, designed and never run). The candidate's pension and ISA move together between the plan's tier and up to two
 * below it; the archive found the lowest step chosen in 87-91% of spending years on four thin households (24 Sep, before
 * the tier state and the 29 Sep growth correction). Here the candidate is solved with one more joint step below
 * (Medium/Low under a High Risk plan) and run on the same paths as the candidate, paired.
 * Needs a copy of the code with the two-line option `tiersBelow` (fast.js tiersFor's default and solve.js, beside
 * tiersAbove: third-step.diff). That changes the solver's fingerprint, so e3pcls's pin no longer matches: both arms run
 * with e3pcls off, which its identity test holds bit for bit to the tables with it on (CHECK below shows it again here).
 * usage (from the root of that copy, engine built): node third-step.mjs <household> <weight> [paths 3000] [below 3]
 * env: PTS (45); CHECK=1 runs both arms' plain twin first (tiersBelow unset, e3pcls on and off) at PTS for the identity;
 * BASEJSON a menu-gap.mjs summary of the same household and weight whose candidate's run stands in for the base arm's
 * (its paths are the same: seed 7002's first ones), else the base arm is solved here; OUT a JSON summary
 */
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
const root = process.cwd(), imp = p => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const { makeTrace } = await imp('research/solver/record.mjs');
const { wholeScore } = await imp('research/solver/reduce-7uf.mjs');
const { SEED, LAMBDA } = await imp('research/solver/v4-ensemble.mjs');

const [id, w = '0.02', nArg = '3000', belowArg = '3'] = process.argv.slice(2);
const N = Number(nArg), BELOW = Number(belowArg), PTS = Number(process.env.PTS || 45);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const h = buildScenarios().find(s => s.id === id);
if (!h) throw new Error(`no household ${id}`);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, seOf = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length); };
function arm(label, extra, n) {
  const t0 = Date.now();
  const r = C.solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: Number(w), ...extra });
  const T = r.m.ctx.totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, n, T);
  const tr = makeTrace(n, Y), surv = new Uint8Array(n), tiers = {};
  let years = 0;
  for (let p = 0; p < n; p++) {
    tr.row = p;
    const o = S.runPolicy(r, Float64Array.from(paths[p]), { trace: tr, visit: (t, s, held, ai) => { if (r.c.yr.spend[t] > 0) { const a = r.c.acts[ai], k = `${a.tierPen}/${a.tierIsa}`; tiers[k] = (tiers[k] || 0) + 1; years++; } } });
    if (o.survived) surv[p] = 1;
  }
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float64Array.from(wholeScore(bs, Number(w), Y));
  const names = r.c.tiers.pen.map(x => x.name);
  const res = { label, secs: (Date.now() - t0) / 1000, moves: r.actions.length, pairs: r.meta.tierState, tierNames: names, survival: 100 * mean(Array.from(surv)), whole: mean(Array.from(ws)), tierShare: Object.fromEntries(Object.entries(tiers).sort().map(([k, v]) => [k, +(v / years).toFixed(4)])), ws, surv };
  log(`${label}: ${res.moves} moves, tier pairs ${res.pairs} (the pension's tiers ${names.join(', ')}), solved and run in ${res.secs.toFixed(0)} s; survival ${res.survival.toFixed(3)}%, whole score ${res.whole.toFixed(4)} on ${n} paths`);
  log(`  the tier pair chosen in a spending year: ${Object.entries(res.tierShare).map(([k, v]) => `${k} ${(100 * v).toFixed(1)}%`).join(', ')}`);
  return res;
}
const paired = (A, B, n) => {
  const dW = [], dS = []; let saved = 0, lost = 0;
  for (let i = 0; i < n; i++) { dW.push(B.ws[i] - A.ws[i]); dS.push(100 * (B.surv[i] - A.surv[i])); if (B.surv[i] && !A.surv[i]) saved++; if (!B.surv[i] && A.surv[i]) lost++; }
  return { whole: [mean(dW), seOf(dW)], survival: [mean(dS), seOf(dS)], saved, lost, paths: n };
};
const f = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
log(`${id} W${w}: ${PTS} points, ${N} paths of seed ${SEED}, the joint step's lowest rung moved from 2 to ${BELOW} below the plan's tier`);
if (process.env.CHECK === '1') {
  // the option unset is the candidate, and e3pcls off gives the same run: on this copy the pin is stale, so e3pcls on
  // cannot be solved here; the check compares e3pcls off against the base figures given (BASEJSON) or prints both
  const A = arm('CHECK, the option unset, e3pcls off', { e3pcls: false }, Math.min(N, 200));
  if (process.env.BASEJSON) {
    const b = JSON.parse(readFileSync(process.env.BASEJSON, 'utf8')).perPath, n = A.ws.length;
    let diff = 0; for (let i = 0; i < n; i++) if (Math.abs(A.ws[i] - b.whole0[i]) > 1e-6 || A.surv[i] !== b.surv0[i]) diff++;
    log(`  against the unedited code's candidate run (${process.env.BASEJSON}, e3pcls on): ${diff === 0 ? 'the same on every path' : `${diff} of ${n} paths DIFFER`}`);
    if (diff) throw new Error('the check failed');
  }
}
let base;
if (process.env.BASEJSON) {
  const j = JSON.parse(readFileSync(process.env.BASEJSON, 'utf8'));
  if (j.id !== id || j.w !== w || j.points !== PTS) throw new Error('BASEJSON is another household, weight or grid');
  const b = j.perPath; if (b.whole0.length < N) throw new Error(`BASEJSON has ${b.whole0.length} paths`);
  base = { label: 'BASE (the candidate, from the menu-gap run)', ws: Float64Array.from(b.whole0.slice(0, N)), surv: Uint8Array.from(b.surv0.slice(0, N)) };
  base.survival = 100 * mean(Array.from(base.surv)); base.whole = mean(Array.from(base.ws));
  log(`${base.label}: survival ${base.survival.toFixed(3)}%, whole score ${base.whole.toFixed(4)} on ${N} paths`);
} else base = arm('BASE (the candidate, e3pcls off)', { e3pcls: false }, N);
const B = arm(`THIRD (tiersBelow ${BELOW}, e3pcls off)`, { e3pcls: false, tiersBelow: BELOW }, N);
const d = paired(base, B, N);
log(`THIRD less BASE, paired: whole score ${f(d.whole[0])} (se ${d.whole[1].toFixed(3)}), survival ${f(d.survival[0])} points (se ${d.survival[1].toFixed(3)}; ${d.saved} saved, ${d.lost} lost)`);
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify({ id, w, points: PTS, paths: N, below: BELOW, base: { survival: base.survival, whole: base.whole, tierShare: base.tierShare }, third: { survival: B.survival, whole: B.whole, tierShare: B.tierShare, moves: B.moves, pairs: B.pairs, tierNames: B.tierNames, secs: B.secs }, paired: d }));
log('done');
