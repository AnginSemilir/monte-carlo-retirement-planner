/*
 * N1's assessment (EXPLORATORY; research/reviews/2026-10-26/N1-ASSESSMENT.md): what the bridge reader package is worth on
 * the latest candidate. One household, one arm: CAND (candidate.json as it stands) or NOREADER (the same with the package
 * removed: bridgeRead off, and bridgeStep, readerRef, adaptiveLattice and readerSplit unset), at 45 wealth points and estate
 * weight 0.02, run forward by the solver's own chooser (runPolicy) on 8,000 paths of the tuning seed; each path's survival and
 * whole score kept for the pairing (reader-read.mjs).
 *   node reader-probe.mjs <household> <CAND | NOREADER> <out.json> [paths=8000]     (from the root of the latest code)
 */
import { resolve } from 'path';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { checkE3pclsPin } = await imp('research/solver/e3pcls-pin.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const { makeTrace } = await imp('research/solver/record.mjs');
const { wholeScore } = await imp('research/solver/reduce-7uf.mjs');
const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); })();
const [id, arm, outFile, nArg = '8000'] = process.argv.slice(2);
const N = Number(nArg), PTS = Number(process.env.PTS || 45), W = 0.02, SEED = 7002, LAMBDA = 0.0223606797749979;
if (!['CAND', 'NOREADER'].includes(arm)) throw new Error(`arm ${arm}?`);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const PACKAGE = { bridgeRead: false, bridgeStep: undefined, readerRef: undefined, adaptiveLattice: undefined, readerSplit: undefined };
const opts = { ...C.CANDIDATE_OPTS, lambda: LAMBDA, points: PTS, bequestWeight: W, ...(arm === 'NOREADER' ? PACKAGE : {}) };
checkE3pclsPin(opts);
const t0 = Date.now();
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), opts);
const solveSecs = (Date.now() - t0) / 1000;
const T = r.m.ctx.totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, N, T);
const tr = makeTrace(N, Y), surv = new Uint8Array(N), failAge = new Int16Array(N).fill(-1);
const f0 = Date.now();
for (let i = 0; i < N; i++) { tr.row = i; const o = S.runPolicy(r, Float64Array.from(paths[i]), { trace: tr }); if (o.survived) surv[i] = 1; else failAge[i] = tr.failYear[i] >= 0 ? r.m.ctx.ageSelf0 + tr.failYear[i] : -1; }
const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
const ws = Float64Array.from(wholeScore(bs, W, Y));
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
// where the failures fall: before the pension opens (the bridge) or after
const accessAge = E.num(h.plan.demographics.privatePensionAge, 58);
let bridgeFails = 0, laterFails = 0; for (let i = 0; i < N; i++) if (!surv[i]) { if (failAge[i] >= 0 && failAge[i] < accessAge) bridgeFails++; else laterFails++; }
const out = { id, arm, points: PTS, w: W, seed: SEED, paths: N, T, codeHash, solveSecs, runSecs: (Date.now() - f0) / 1000, moves: r.actions.length, bridgeRead: r.meta.bridgeRead, readerRef: r.meta.readerRef,
  survival: 100 * mean(Array.from(surv)), whole: mean(Array.from(ws)), bridgeFails, laterFails, perPath: { survived: b64(surv), whole: b64(ws) } };
writeFileSync(outFile, JSON.stringify(out));
console.log(`${id} ${arm}: solved in ${solveSecs.toFixed(0)} s (${r.actions.length} moves, bridge read ${r.meta.bridgeRead}, reference ${r.meta.readerRef}); ${N} paths in ${out.runSecs.toFixed(0)} s: survival ${out.survival.toFixed(3)}%, whole score ${out.whole.toFixed(4)}; failures before the pension opens ${bridgeFails}, after ${laterFails}`);
