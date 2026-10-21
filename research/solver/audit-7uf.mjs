/*
 * 7U-F: THE ASSEMBLED CANDIDATE AGAINST THE SHIPPING DEFAULT, ONCE, ON A HELD-OUT SEED, SCORED BY THE ENGINE
 * (registrations/fresh-7uf.md; panel-7uf.mjs; the external review of 21 Oct, Part B Step 4.3; STATE.md D3, D5, D7).
 * Per unit (household, arm, estate weight), 7u's plan preparation (guardrails and the cost lookahead off, the floor spend at
 * 80% of the target, resolveMpaa) and solve (30 points, 7u's lambda), the settings the arm ran checked against the arm's
 * own, then:
 *   - THE ENGINE (the primary): the solved table executed by the app's engine on the plan the solver solved (bridge.js
 *     withTable on the model's own plan, then runTrial path by path), N paths of the seed: each path's survival, terminal
 *     net estate, unmet spending, realised spend and years cut. The engine's context is held to the solver's, field by field;
 *   - runPolicy beside it on the first BESIDE paths (the fidelity check), its trace saved as 7u's (the whole score);
 *   - on CAND and DECOMP (households with bridge years), each world's paired runs: NW paths with the world's return shock
 *     (HO-DEP's worldPath), executed by the engine, with the world's table at its own opening (the by-world item and the
 *     reference's part, read by the mixture).
 * Per unit, the per-path arrays to results/diag7uf (DIAG7UF_OUT), stamped with the code, this file, the panel and the
 * registration. The preflight (PRE_SEED, few paths) runs the same code.
 *   node research/solver/audit-7uf.mjs [paths=16000] part k/n [seed=7014]
 *   node research/solver/audit-7uf.mjs --units          the unit count
 *   AUDIT7UF_ONLY=<id>,<id> limits the units to those households, AUDIT7UF_W=<w> to one estate weight, and
 *   AUDIT7UF_DECOMP_ALL=1 runs DECOMP on every household (the preflight: on one without bridge years DECOMP must be CAND,
 *   path for path; the registered run never sets them, and the reducer's gate refuses a panel they cut)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan, CANDIDATE_OPTS, CANDIDATE_HASH } from './candidate.mjs';
import { PANEL, unitsOf, bridgeYears, SEED as SEED_7UF, N as N_7UF, PTS, LAMBDA, BESIDE, NW } from './panel-7uf.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { makeTrace } from './record.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const byId = id => all.find(s => s.id === id);
if (PANEL.some(id => !byId(id))) { console.error('audit-7uf: a household of the panel has no builder'); process.exit(2); }
const prep = h => E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const hasBridge = id => bridgeYears(E, prep(byId(id))) > 0;
const ONLY = process.env.AUDIT7UF_ONLY ? new Set(process.env.AUDIT7UF_ONLY.split(',')) : null;
const ONLY_W = process.env.AUDIT7UF_W || null, DECOMP_ALL = process.env.AUDIT7UF_DECOMP_ALL === '1';
const UNITS = unitsOf(DECOMP_ALL ? () => true : hasBridge).filter(([id, , w]) => (!ONLY || ONLY.has(id)) && (!ONLY_W || w === ONLY_W));
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).update(readFileSync(join(HERE, 'panel-7uf.mjs'))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, candidate: CANDIDATE_HASH, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);   // fair-gate.mjs LOG_STAMP
console.log(`candidate: ${STAMP.candidate}`);

const NP = Number(process.argv[2] || N_7UF);
const part = process.argv[3] === 'part' ? process.argv[4] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(NP >= 1) || !(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-7uf: bad paths or part (${process.argv.slice(2, 5).join(' ')})`); process.exit(2); }
const SEED = process.argv[5] ? Number(process.argv[5]) : SEED_7UF;
const NB = Math.min(BESIDE, NP), NWP = Math.min(NW, NP);
const OUT = process.env.DIAG7UF_OUT || join(HERE, 'results', 'diag7uf');
mkdirSync(OUT, { recursive: true });

// the arms' solves and the settings each must have run (the package by its meta, the rest as 7u's want lists)
const DECOMP_OPTS = (() => { const { readerRef, adaptiveLattice, ...rest } = CANDIDATE_OPTS; return rest; })();
if (CANDIDATE_OPTS.readerRef !== 'adaptive' || !CANDIDATE_OPTS.adaptiveLattice || CANDIDATE_OPTS.readerSplit !== 'rs') { console.error('audit-7uf: the candidate does not carry the adaptive package'); process.exit(2); }
const solveArm = (arm, plan, base) => arm === 'SHIP' ? solvePlan(E, M, candidatePlan(E, plan), base)
  : solveCandidate(E, M, plan, arm === 'CAND' ? base : { ...base, readerRef: undefined, adaptiveLattice: undefined });
const WANT = {
  CAND: { bridgeRead: 'reader', tierState: true, jointWorlds: true, bridgeStep: 'exact', switchMargin: 0, switchCharge: 0.001, e3: true, e3pcls: true, pclsInterp: true, readerRef: 'adaptive', readerSplit: 'rs' },
  DECOMP: { bridgeRead: 'reader', tierState: true, jointWorlds: true, bridgeStep: 'exact', switchMargin: 0, switchCharge: 0.001, e3: true, e3pcls: true, pclsInterp: true, readerRef: null, readerSplit: 'rs' },
  SHIP: { bridgeRead: false, tierState: false, jointWorlds: false, bridgeStep: null, switchMargin: 0.001, switchCharge: 0, e3: false, e3pcls: false, pclsInterp: false, readerRef: null, readerSplit: null }
};
const gotOf = r => ({ bridgeRead: r.meta.bridgeRead, tierState: !!r.meta.tierState, jointWorlds: !!r.meta.jointWorlds, bridgeStep: r.meta.bridgeStep || null, switchMargin: r.switchMargin, switchCharge: r.switchCharge || 0, e3: !!r.meta.e3, e3pcls: !!r.meta.e3pcls, pclsInterp: !!r.g.pclsInterp, readerRef: r.meta.readerRef || null, readerSplit: r.meta.readerSplit || null });
// the engine's context against the solver's: every field but the policy's own and the plan object
const SKIP = new Set(['plan', 'warnings', 'policyOverride', 'policyKey']);
const ctxKey = ctx => JSON.stringify(Object.keys(ctx).filter(k => !SKIP.has(k)).sort().map(k => [k, ctx[k]]));
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const fileOf = (id, arm, w) => `${id}-${arm.toLowerCase()}-w${w}.json.gz`;

console.log(`7U-F: CAND (the assembled candidate, ${STAMP.candidate}), DECOMP (CAND on the plan reference, households with bridge years) and SHIP (the product's settings), ${PTS} points, lambda ${LAMBDA}, the estate weights 0.02 and 0.01; ${NP} paths of seed ${SEED} executed by the engine, runPolicy beside it on ${NB}, ${NWP} a world on CAND and DECOMP; ${UNITS.length} units; part ${part}`);
UNITS.forEach(([id, arm, w], i) => {
  if (i % pn !== pk) return;
  const W = Number(w), L = `${arm}/W${w}`, plan = prep(byId(id));
  console.log(`${id.padEnd(8)} case | unit ${L} | bridge years ${bridgeYears(E, plan)}`);
  const t0 = Date.now(), r = solveArm(arm, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W }), secs = (Date.now() - t0) / 1000;
  const got = gotOf(r);
  for (const [k, v] of Object.entries(WANT[arm])) if (got[k] !== v) { console.error(`audit-7uf: ${id} ${L} ran ${k} ${got[k]}, not ${v}`); process.exit(3); }
  if (!(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-7uf: ${id} ${L} ran the estate weight ${r.meta.bequestWeight}`); process.exit(3); }
  if (arm === 'CAND') { const la = r.mix.tables[0].g.reader && r.mix.tables[0].g.reader.adaptive && r.mix.tables[0].g.reader.adaptive.lattice; const want = CANDIDATE_OPTS.adaptiveLattice;
    if (bridgeYears(E, plan) > 0 && (!la || Object.keys(want).some(k => la[k] !== want[k]))) { console.error(`audit-7uf: ${id} ${L} built no adaptive lattice as the candidate's (${JSON.stringify(la)})`); process.exit(3); } }
  const m = r.m, T = m.ctx.totalYears, s0 = M.initialState(m);
  const tiers = Object.entries(E.normalizePlan(candidatePlan(E, plan)).riskProfiles).filter(([k]) => / Risk$/.test(k)).map(([k, p]) => `${k.replace(/ /g, '_')}:${p.real}`).join(',');
  const ran = `mix ${r.meta.mixture} pts ${r.g.np} seed ${SEED} paths ${NP} beside ${NB} world ${NWP} grid ${String(r.meta.points).replace(/ /g, '')} lambda ${r.meta.lambda} levels ${r.meta.spendLevels.join(',')} raiseSurv ${r.meta.raiseSurvival} failShort ${r.meta.failureShortfall} tiersAbove ${m.tiersAbove || 0} minPot ${E.num(m.ctx.solvencyFloor, 0)} quad ${r.quadNodes ? r.quadNodes.length : 5}${r.meta.bridgeStep ? ` bridgeStep ${r.meta.bridgeStep}` : ''}${r.meta.tierState ? ` tierState ${r.meta.tierState}` : ''} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} finalIntegral ${r.meta.finalIntegral === true} bridgeRead ${r.meta.bridgeRead} readerRef ${got.readerRef} readerSplit ${got.readerSplit} switchMargin ${r.switchMargin} switchCharge ${r.switchCharge || 0} e3 ${got.e3} e3pcls ${got.e3pcls} pclsInterp ${got.pclsInterp} tiers ${tiers}`;
  const table = 100 * r.worlds.reduce((t, wd, k) => t + r.mix.weights[k] * wd.value(s0, 0).survival, 0);
  console.log(`${''.padEnd(8)} solve ${L}: table ${table.toFixed(4)} secs ${Math.round(secs)}`);
  console.log(`${''.padEnd(8)} ran ${L}: ${ran}`);
  // the engine on the plan the solver solved
  const ctx = E.buildContext(withTable(m.ctx.plan, r));
  if (ctxKey(ctx) !== ctxKey(m.ctx)) { const k = Object.keys(m.ctx).find(k => !SKIP.has(k) && JSON.stringify(ctx[k]) !== JSON.stringify(m.ctx[k])); console.error(`audit-7uf: ${id} ${L}: the engine's context differs from the solver's (first: ${k})`); process.exit(3); }
  const paths = E.pathsForSeed(SEED, NP, T);
  const f0 = Date.now(), surv = new Uint8Array(NP), estate = new Float32Array(NP), unmet = new Float32Array(NP), spend = new Float32Array(NP), cut = new Uint8Array(NP), cap = r.meta.bequestCap;
  let ok = 0;
  paths.forEach((zs, k) => { const o = E.runTrial(ctx, Float64Array.from(zs)); if (o.survived) { ok++; surv[k] = 1; } estate[k] = o.survived ? Math.min(o.terminalPotNet, cap) : 0; unmet[k] = o.unmetTotal; spend[k] = o.realisedSpend; cut[k] = Math.min(255, o.cutYears); });
  const eSecs = (Date.now() - f0) / 1000;
  // runPolicy beside it on the first NB paths, its trace kept (the whole score)
  const g0 = Date.now(), pol = new Uint8Array(NB), tr = makeTrace(NB, T + 1);
  let pok = 0;
  for (let k = 0; k < NB; k++) { tr.row = k; const o = runPolicy(r, Float64Array.from(paths[k]), { trace: tr }); if (o.survived) { pok++; pol[k] = 1; } }
  let eo = 0, po = 0; for (let k = 0; k < NB; k++) { if (surv[k] && !pol[k]) eo++; if (pol[k] && !surv[k]) po++; }
  console.log(`${''.padEnd(8)} run ${L}: engine ${(100 * ok / NP).toFixed(4)} estate ${Math.round(estate.reduce((a, x) => a + x, 0) / NP)} secs ${Math.round(eSecs)} | runPolicy on ${NB}: ${(100 * pok / NB).toFixed(4)}, the engine alone ${eo}, runPolicy alone ${po}, secs ${Math.round((Date.now() - g0) / 1000)}`);
  // each world's runs on CAND and DECOMP
  const worlds = [];
  if (arm !== 'SHIP') {
    const w0 = Date.now(), wpaths = paths.slice(0, NWP);
    r.mix.nodes.forEach((z, k) => {
      const bits = new Uint8Array(NWP);
      let n = 0; wpaths.forEach((zs, i) => { const cz = Float64Array.from(zs); cz[cz.length - 1] = z; if (E.runTrial(ctx, cz).survived) { bits[i] = 1; n++; } });
      const tab = 100 * r.worlds[k].value(s0, 0).survival;
      worlds.push({ z, weight: r.mix.weights[k], table: tab, sim: 100 * n / NWP, bits: b64(bits) });
      console.log(`${''.padEnd(8)} world ${L} ${k}: z ${z.toFixed(6)} weight ${r.mix.weights[k].toFixed(6)} table ${tab.toFixed(4)} engine ${(100 * n / NWP).toFixed(4)} on ${NWP}`);
    });
    console.log(`${''.padEnd(8)} worlds ${L}: secs ${Math.round((Date.now() - w0) / 1000)}`);
  }
  writeFileSync(join(OUT, fileOf(id, arm, w)), gzipSync(JSON.stringify({ id, arm, w, stamp: STAMP, ran, N: NP, NB, NW: NWP, Y: tr.Y, seed: SEED, table,
    survived: b64(surv), estate: b64(estate), unmet: b64(unmet), spend: b64(spend), cut: b64(cut), cap,
    // the whole score's inputs, as HO-DEP read them from the solve (audit-hodep.mjs l.191 and l.241)
    beside: { survived: b64(pol), level: b64(tr.level), wealth: b64(tr.wealth), failYear: b64(tr.failYear), lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), capR: Math.round(cap), death: m.ctx.pensionDeathTaxRate, spendYears: Array.from({ length: tr.Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) },
    worlds })));
  console.log(`${''.padEnd(8)} done ${L}`);
});
