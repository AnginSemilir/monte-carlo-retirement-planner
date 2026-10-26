/*
 * M15 v3's probe (EXPLORATORY; research/reviews/2026-10-26/GIA-LADDER.md): one household, one arm. The latest candidate (CAND)
 * or the same with the GIA's own rungs (LADDER), at 45 wealth points and estate weight 0.02, run forward by the solver's own
 * chooser (runPolicy, as N4 and the third step's factorial were) on 8,000 paths of the tuning seed; each path's survival and
 * whole score kept for the pairing (gia-read.mjs), with the solve's time, the GIA rung's use in spending years, the GIA's
 * switches and what the switches paid (dealing and capital gains tax). e3pcls off in both arms (declared: the pin is stale on
 * the ladder's code; its copies are exact).
 *   node gia-probe.mjs <household> <CAND | LADDER> <out.json> [paths=8000]     env GAIN (the GIA's unrealised gain, 0 to 1)
 */
import { resolve } from 'path';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs'), F = await imp('src/solver/fast.js');
// the code the arm ran on: every file of src/solver and the candidate's options, hashed (gia-read.mjs's fair test compares them)
const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); })();
if (F.GIA_LADDER.plant !== '') throw new Error(`a plant is set (${F.GIA_LADDER.plant})`);
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const { makeTrace } = await imp('research/solver/record.mjs');
const { wholeScore } = await imp('research/solver/reduce-7uf.mjs');
const [id, arm, outFile, nArg = '8000'] = process.argv.slice(2);
const N = Number(nArg), PTS = Number(process.env.PTS || 45), W = 0.02, SEED = 7002, LAMBDA = 0.0223606797749979, GAIN = Number(process.env.GAIN || 0);
if (!['CAND', 'LADDER'].includes(arm)) throw new Error(`arm ${arm}?`);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan,
  accounts: h.plan.accounts.map(a => (/^Other Investments/.test(a.category) && a.owner === 'Myself' && E.num(a.balance, 0) > 0 ? { ...a, unrealisedGain: Math.round(GAIN * E.num(a.balance, 0)) } : a)),
  config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now();
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, e3pcls: false, lambda: LAMBDA, points: PTS, bequestWeight: W, ...(arm === 'LADDER' ? { giaLadder: true } : {}) });
const solveSecs = (Date.now() - t0) / 1000;
const T = r.m.ctx.totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, N, T);
const tr = makeTrace(N, Y), surv = new Uint8Array(N);
let spendYears = 0, rungYears = 0, switches = 0, paid = 0, giaChanges = 0, tax = 0;
const f0 = Date.now();
for (let i = 0; i < N; i++) {
  tr.row = i;
  const o = S.runPolicy(r, Float64Array.from(paths[i]), { trace: tr, visit: (t, s, held, ai) => { if (r.c.yr.spend[t] > 0) { spendYears++; if (r.c.acts[ai].tierGia > 0) rungYears++; } } });
  if (o.survived) surv[i] = 1;
  paid += o.switchPaid || 0; giaChanges += o.giaChanges || 0; tax += o.lifetimeTax || 0;
}
const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
const ws = Float64Array.from(wholeScore(bs, W, Y));
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const out = { id, arm, gain: GAIN, points: PTS, w: W, seed: SEED, paths: N, T, codeHash, solveSecs, runSecs: (Date.now() - f0) / 1000, moves: r.actions.length, layers: r.meta.tierState, giaLadder: r.meta.giaLadder || null,
  survival: 100 * mean(Array.from(surv)), whole: mean(Array.from(ws)), rungShare: spendYears ? rungYears / spendYears : 0, giaChangesPerPath: giaChanges / N, switchPaidPerPath: paid / N, taxPerPath: tax / N,
  perPath: { survived: b64(surv), whole: b64(ws) } };
writeFileSync(outFile, JSON.stringify(out));
console.log(`${id}${GAIN ? ` (gain ${GAIN})` : ''} ${arm}: solved in ${solveSecs.toFixed(0)} s (${r.actions.length} moves, layers ${r.meta.tierState}${r.meta.giaLadder ? `; the GIA ${(100 * r.meta.giaLadder.share).toFixed(0)}% of the pots, rungs ${r.meta.giaLadder.on ? r.meta.giaLadder.rungs : 'not added'}` : ''}); ${N} paths in ${out.runSecs.toFixed(0)} s: survival ${out.survival.toFixed(3)}%, whole score ${out.whole.toFixed(4)}; a GIA rung in ${(100 * out.rungShare).toFixed(1)}% of spending years, ${out.giaChangesPerPath.toFixed(2)} GIA switches a path, switches paid £${Math.round(out.switchPaidPerPath)} a path`);
