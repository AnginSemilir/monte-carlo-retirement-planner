/*
 * THE SECOND AMENDMENT'S TESTS (EXPLORATORY; SPENDING-CURVE.md section 8), run from the root of the failure-year code
 * (curve2-wt), which they only read; their units go to a scratch directory.
 *   1. the curve at gamma 3 and 5: with failDelivered set, every weight, move cost and ruin price as the formula gives (to
 *      1e-12 of its size), every table finite, meta recording the gamma; planted: the same checks at the wrong gamma fail;
 *      and the tables differ from gamma 2's;
 *   2. the harness: curve-audit3.mjs runs curve-audit2.mjs's arms as it does (HYB10D on S090 at 6 points and 60 paths, the
 *      two units the same in every field but the timings and the machine); planted: one path's survival flipped is seen;
 *   3. the smoke run: UTIL3D and UTIL5D on S090 at 6 points and 60 paths, each with its gamma, the failure year at what it can
 *      pay, and the switch charge the candidate's 0.001 times its own exchange, (0.8^(1 - gamma) - 1) / (gamma - 1) / (lambda x 0.04).
 *   node <this file> <scratch dir>
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { gunzipSync } from 'zlib';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js');
const C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const G = '/home/claude/monte-carlo-retirement-planner/research/reviews/2026-10-29/curve';
const SCR = process.argv[2];
if (!SCR) { console.error('usage: curve-test3.mjs <scratch dir>'); process.exit(2); }
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const LAMBDA = 0.0223606797749979, LIGHT = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const P = Object.fromEntries(readPanel().map(h => [h.id, h]));
const planOf = id => E.resolveMpaa(E.normalizePlan({ ...P[id].plan, config: { ...P[id].plan.config, guardrails: false, lookaheadYears: 0 } }));
const MORT = { mode: 90, disp: 9 }, SU = g => ({ gamma: g, kappa: 1, beta: 1, mortality: MORT, ruinMin: 0.1 });
const walkArrays = (o, f, seen = new Set()) => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (ArrayBuffer.isView(o)) { f(o); return; } if (Array.isArray(o)) { o.forEach(x => walkArrays(x, f, seen)); return; } for (const k of Object.keys(o).sort()) walkArrays(o[k], f, seen); };
const hashOf = r => { const h = createHash('sha256'); walkArrays(r.tablesW, a => h.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength))); return h.digest('hex').slice(0, 16); };
// the largest gap, relative to the size of the value, between the solve's weights, costs and ruin prices and the formula at gamma g
const gapAt = (r, g) => {
  const u = l => (Math.abs(g - 1) < 1e-12 ? Math.log(l) : (Math.pow(l, 1 - g) - 1) / (1 - g)), rel = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b));
  const a0 = r.m.ctx.ageSelf0, T = r.m.ctx.totalYears, W = r.spendUtility.w, R = r.spendUtility.ruinLevel, F = r.spendUtility.failCost;
  let worst = 0;
  for (let t = 0; t <= T; t++) {
    const w = Math.exp(-Math.exp((a0 - MORT.mode) / MORT.disp) * (Math.exp(t / MORT.disp) - 1));
    worst = Math.max(worst, rel(W[t], w));
    for (const l of [0.8, 0.9, 0.95, 1, 1.1]) worst = Math.max(worst, rel(r.costOf(l, t), w * (u(1) - u(l))));
    const sp = r.c.yr.spend[t];
    if (sp > 0) { const lv = Math.min(1, Math.max(0.1, (r.c.yr.taxFree0[t] + E.calculateUKNetIncome(r.c.yr.taxable0[t], r.c.P)) / sp)); worst = Math.max(worst, rel(R[t], lv), rel(F[t] - F[t + 1], w * (u(1) - u(lv)))); }
    else worst = Math.max(worst, rel(F[t] - F[t + 1], 0));
  }
  return worst;
};

// 1. the curve at gamma 3 and 5
const h2 = hashOf(C.solveCandidate(E, M, planOf('S090'), { ...LIGHT, spendUtility: SU(2), failDelivered: true }));
for (const g of [3, 5]) {
  const r = C.solveCandidate(E, M, planOf('S090'), { ...LIGHT, spendUtility: SU(g), failDelivered: true });
  let bad = 0, cells = 0; walkArrays(r.tablesW, a => { for (const x of a) { cells++; if (!Number.isFinite(x)) bad++; } });
  const gap = gapAt(r, g), wrong = Math.min(gapAt(r, g - 1), gapAt(r, g + 1));
  ok(gap < 1e-12 && r.meta.spendUtility.gamma === g && r.meta.failDelivered === true, `1. S090 at gamma ${g}: every weight, cost and ruin price as the formula gives (the largest gap ${gap.toExponential(1)} of its size); meta records gamma ${r.meta.spendUtility.gamma}, failDelivered ${r.meta.failDelivered}`);
  ok(bad === 0 && cells > 0, `1. S090 at gamma ${g}: all ${cells} table values finite (${bad} not)`);
  ok(wrong > 1e-3, `1. planted: the same checks at gamma ${g - 1} and ${g + 1} fail (the smaller largest gap ${wrong.toExponential(1)})`);
  ok(hashOf(r) !== h2, `1. S090: the tables at gamma ${g} differ from gamma 2's`);
}

// 2. the harness: curve-audit3.mjs runs curve-audit2.mjs's arms as it does
const load = f => JSON.parse(gunzipSync(readFileSync(f)));
const run = (harness, dir, arm) => { mkdirSync(dir, { recursive: true }); const ap = join(dir, 'S090-aPol.json'); if (!existsSync(ap)) copyFileSync(join(SCR, 'S090-aPol.json'), ap); execFileSync('node', [join(G, harness), '60', dir, 'S090', arm], { env: { ...process.env, CURVE_PTS: '6' }, stdio: ['ignore', 'pipe', 'inherit'] }); return load(join(dir, `S090-${arm.toLowerCase()}.json.gz`)); };
const SKIP = new Set(['solveSecs', 'engineSecs', 'cpu']);
const differ = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])].filter(k => !SKIP.has(k) && JSON.stringify(x[k]) !== JSON.stringify(y[k]));
const a2 = run('curve-audit2.mjs', join(SCR, 'h2'), 'HYB10D'), a3 = run('curve-audit3.mjs', join(SCR, 'h3'), 'HYB10D');
const d = differ(a2, a3);
ok(d.length === 0 && a2.code === a3.code, `2. S090 HYB10D (6 points, 60 paths): curve-audit3.mjs's unit is curve-audit2.mjs's in every field but the timings and the machine (code ${a3.code})${d.length ? `; differs in ${d.join(', ')}` : ''}`);
{ const c = JSON.parse(JSON.stringify(a3)), s = Buffer.from(c.main.survived, 'base64'); s[0] ^= 1; c.main.survived = s.toString('base64'); const dp = differ(a2, c); ok(dp.length === 1 && dp[0] === 'main', `2. planted: with path 1's survival flipped the comparison fails (${dp.join(', ')})`); }

// 3. the smoke run of the new arms
for (const [arm, g] of [['UTIL3D', 3], ['UTIL5D', 5]]) {
  const u = run('curve-audit3.mjs', join(SCR, 'h3'), arm), su = u.ran.spendUtility || {};
  const want = 0.001 * ((Math.pow(0.8, 1 - g) - 1) / (g - 1)) / (LAMBDA * 0.04);
  ok(su.gamma === g && su.kappa === 1 && su.mortality && u.ran.failDelivered === true && Math.abs(u.ran.switchCharge - want) < 1e-12 && u.N === 60,
    `3. S090 ${arm} (6 points, 60 paths): gamma ${su.gamma}, kappa ${su.kappa}, mortality ${su.mortality ? `${su.mortality.mode}/${su.mortality.disp}` : 'none'}, failDelivered ${u.ran.failDelivered}, switch charge ${u.ran.switchCharge.toFixed(6)} (want ${want.toFixed(6)}); survival ${(100 * Buffer.from(u.main.survived, 'base64').reduce((p, x) => p + x, 0) / u.N).toFixed(1)}% on ${u.N}`);
}
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
