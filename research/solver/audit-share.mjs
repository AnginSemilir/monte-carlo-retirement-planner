/*
 * COUPLES WHO HOLD THEIR MONEY UNEVENLY, STAGE A (the review of 9 Nov, item 6; D66; SHARE-A.md; EXPLORATORY, deciding
 * nothing). One unit a process: a couple at one holding (the household's total in every wrapper kept, only who holds it
 * changed), the target landed so the plan's own rules (guardrails, the 80% floor, the 5-year lookahead) survive about 85%
 * on the unit's paths, then the rules arm and the couples' rollout under each share rule (each person's table solved by
 * solveForApp at 45 points on `share` of the household's spending: 0.5, or the first person's share of the pots held to
 * 0.05 to 0.95), every arm run by the engine on the same paths. Unit 0 is the review's own run, reproduced: S091 at 90/10,
 * share 0.5, 300 paths of seed 4242 (the review printed 53.0% against 85.3%, 0 saved, 97 lost).
 * The units go to results/share-<seed>/ (SHARE_OUT): case<k>.txt, the log, stamped (fair-gate.mjs LOG_STAMP), and
 * <id>-<holding>.json.gz, each arm's survival and pot left a path, its recorded settings beside it. reduce-share.mjs reads them.
 *   node research/solver/audit-share.mjs part k/n          node research/solver/audit-share.mjs --units
 *   SHARE_PTS the points (smoke only); SHARE_N the paths of units 1 on (smoke only); SHARE_OUT the folder
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple, withCouple, COUPLE } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { prepareForSolve } from '../../src/solverSettings.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SEED = 7002, N = 500, PTS = 45, LAND = 85;
export const COUPLES = ['S007', 'S079', 'S127', 'S187', 'S391', 'S267'];
export const HOLDINGS = ['as-held', 'sixtyfive', 'seventyfive', 'ninety-ten', 'all-one'];
// the first person's share of each wrapper (null: as the library holds it)
export const HOLD = { 'as-held': null, sixtyfive: 0.65, seventyfive: 0.75, 'ninety-ten': 0.9, 'all-one': 1 };
export const SHARES = ['half', 'pots'];
export const REPRO = { id: 'S091', holding: 'ninety-ten', seed: 4242, N: 300, shares: ['half'] };
export const UNITS = [REPRO, ...COUPLES.flatMap(id => HOLDINGS.map(holding => ({ id, holding, seed: SEED, N, shares: SHARES })))];
export const CATS = ['pen', 'isa', 'other', 'cash', 'cashIsa'];
export const STAMP_FILES = ['audit-share.mjs', 'reduce-share.mjs', 'SHARE-A.md', 'stats.mjs'];
export function stampFilesHash() {
  const h = createHash('sha256');
  for (const f of STAMP_FILES) h.update(readFileSync(join(HERE, f)));
  return h.digest('hex').slice(0, 12);
}
export const fileOf = u => `${u.id}-${u.holding}${u.seed === SEED ? '' : `-s${u.seed}`}.json.gz`;
const hashOf = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 12);

/* the plan with the household's money re-held: each wrapper's total kept, the first person holding `h` of it */
export function reheld(base, holding) {
  const h = HOLD[holding];
  if (h === null || h === undefined) return base;
  const tot = c => base.accounts.filter(a => a.id.startsWith(c + '_')).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const accounts = base.accounts.map(a => {
    const c = CATS.find(k => a.id.startsWith(k + '_'));
    if (!c) return a;
    return { ...a, balance: a.id.endsWith('_self') ? tot(c) * h : tot(c) * (1 - h) };
  });
  return E.normalizePlan({ ...base, accounts });
}
/* each wrapper's total and the first person's part of it, to check the re-holding kept every total */
export const holdingOf = plan => Object.fromEntries(CATS.map(c => {
  const of = w => plan.accounts.filter(a => a.id === `${c}_${w}`).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  return [c, { self: of('self'), part: of('part'), total: plan.accounts.filter(a => a.id.startsWith(c + '_')).reduce((t, a) => t + (Number(a.balance) || 0), 0) }];
}));
/* the rules arm: guardrails on, the 5-year lookahead, the floor at 80% of the target (as D4's arm A sets them) */
export const asRules = p => E.normalizePlan({ ...p, config: { ...p.config, guardrails: true, lookaheadYears: 5 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * Number(p.spending.targetSpend)) } });
const withTarget = (p, t) => E.normalizePlan({ ...p, spending: { ...p.spending, targetSpend: t } });
export const potsOf = (plan, w) => plan.accounts.filter(x => x.id.endsWith('_' + w)).reduce((t, x) => t + (Number(x.balance) || 0), 0);
/* the first person's share of the spending their table is solved on */
export const shareOf = (plan, rule) => (rule === 'half' ? 0.5 : Math.min(0.95, Math.max(0.05, potsOf(plan, 'self') / (potsOf(plan, 'self') + potsOf(plan, 'part')))));
const settingsOf = r => `pts ${r.g.np} mix ${r.meta.mixture} lambda ${r.meta.lambda} bequestWeight ${+Number(r.meta.bequestWeight).toPrecision(10)} levels ${r.meta.spendLevels.join(',')} tierState ${r.meta.tierState} tiersBelow ${r.meta.tiersBelow} tableDealing ${r.meta.tableDealing} switchCharge ${r.switchCharge || 0} e3pcls ${!!r.meta.e3pcls} jointWorlds ${!!r.meta.jointWorlds} failDelivered ${!!r.meta.failDelivered} readerRef ${r.meta.readerRef} finalExact ${!!r.finalExact}`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach((u, k) => console.log(`${k} ${u.id} ${u.holding} seed ${u.seed} paths ${u.N} ${u.shares.join(',')}`)); console.log(UNITS.length); process.exit(0); }
  const at = args.indexOf('part'), [pk, pn] = at >= 0 ? args[at + 1].split('/').map(Number) : [NaN, NaN];
  if (!(pn === UNITS.length && pk >= 0 && pk < pn)) { console.error(`audit-share: part k/${UNITS.length}`); process.exit(2); }
  const OUT = process.env.SHARE_OUT || join(HERE, 'results', `share-${SEED}`);
  mkdirSync(OUT, { recursive: true });
  const pts = Number(process.env.SHARE_PTS) || PTS;
  // a smoke run's light lattice at 6 points or fewer (the review's couple-share.mjs); the run's 45 points take the candidate's own
  const research = pts <= 6 ? { research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : {};
  const cid = codeId(), STAMP = { code: cid ? cid.hash : 'unknown', audit: stampFilesHash(), prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED', node: process.version };
  console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${process.env.PREDICTION_SHA || '-'}`);   // fair-gate.mjs LOG_STAMP
  const u = UNITS[pk], n = pk > 0 && process.env.SHARE_N ? Number(process.env.SHARE_N) : u.N;
  console.log(`SHARE-A (EXPLORATORY): unit ${pk}/${pn}: ${u.id} ${u.holding}, seed ${u.seed}, ${n} paths, ${pts} points, the share rules ${u.shares.join(' and ')}; COUPLE.fast ${COUPLE.fast}; node ${STAMP.node}`);
  const t0 = Date.now();
  const base = E.normalizePlan(buildScenarios().find(s => s.id === u.id).plan);
  let plan = reheld(base, u.holding);
  const H = holdingOf(plan), H0 = holdingOf(base);
  for (const c of CATS) if (Math.abs(H[c].total - H0[c].total) > 1e-6 || Math.abs(H[c].self + H[c].part - H[c].total) > 1e-6) { console.error(`audit-share: ${u.id} ${u.holding}: the ${c} total moved (${H0[c].total} to ${H[c].total}; ${H[c].self} + ${H[c].part})`); process.exit(3); }
  const T = E.buildContext(plan).totalYears, paths = E.pathsForSeed(u.seed, n, T);
  const rulesSurv = p => { const ctx = E.buildContext(E.resolveMpaa(asRules(p))); let s = 0; for (const zs of paths) if (E.runTrial(ctx, zs).survived) s++; return 100 * s / n; };
  // the target landed so the rules survive about LAND% on these paths (the review's bisection: 14 halvings of 0.3 to 3 times)
  let lo = 0.3, hi = 3; const tBase = Number(plan.spending.targetSpend);
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (rulesSurv(withTarget(plan, tBase * mid)) > LAND) lo = mid; else hi = mid; }
  plan = withTarget(plan, Math.round(tBase * lo));
  const inputs = hashOf(plan), target = Number(plan.spending.targetSpend);
  const own = w => CATS.map(c => `${c} ${Math.round(H[c][w] / 1000)}k`).join(' ');
  console.log(`${u.id.padEnd(8)} case | unit ${pk} ${u.holding} | first person ${own('self')} | second ${own('part')} | target ${target} | inputs ${inputs}`);
  // the rules arm
  const ctxR = E.buildContext(E.resolveMpaa(asRules(plan)));
  const arms = {}, runArm = (ctx) => { const survived = new Uint8Array(n), pot = new Float32Array(n); paths.forEach((zs, k) => { const o = E.runTrial(ctx, zs); survived[k] = o.survived ? 1 : 0; pot[k] = o.terminalPotNet; }); return { survived, pot }; };
  let e0 = Date.now(); const R = runArm(ctxR);
  arms.RULES = { ran: `guardrails ${!!ctxR.guardrails} lookahead ${ctxR.lookaheadYears} floor ${asRules(plan).spending.floorSpend} target ${ctxR.targetSpend}`, inputs, ...R, secs: (Date.now() - e0) / 1000 };
  console.log(`${''.padEnd(8)} ran RULES: ${arms.RULES.ran}`);
  console.log(`${''.padEnd(8)} done RULES secs ${Math.round(arms.RULES.secs)}`);
  for (const rule of u.shares) {
    const share = shareOf(plan, rule), s0 = Date.now();
    const cp = solveCouple(E, M, prepareForSolve(E, plan), { share, solveOne: (p, o) => solveForApp(E, M, p, { points: pts, ...research, ageWith: o.partnerAge0 }) });
    const solveSecs = (Date.now() - s0) / 1000;
    const lines = ['self', 'part'].map(w => settingsOf(cp.tables[w]));
    const ctxS = E.buildContext(withCouple(cp.plan, cp));
    e0 = Date.now(); const S = runArm(ctxS);
    const key = rule === 'half' ? 'HALF' : 'POTS';
    arms[key] = { ran: `share ${share} | self: ${lines[0]} | part: ${lines[1]}`, share, inputs, ...S, solveSecs, secs: (Date.now() - e0) / 1000 };
    console.log(`${''.padEnd(8)} ran ${key}: ${arms[key].ran} | solve secs ${Math.round(solveSecs)}`);
    console.log(`${''.padEnd(8)} done ${key} secs ${Math.round(solveSecs + arms[key].secs)}`);
  }
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  writeFileSync(join(OUT, fileOf(u)), gzipSync(JSON.stringify({ k: pk, id: u.id, holding: u.holding, seed: u.seed, N: n, pts, target, inputs, holdings: H, stamp: STAMP, cpu: cpus()[0].model,
    arms: Object.fromEntries(Object.entries(arms).map(([a, x]) => [a, { ran: x.ran, share: x.share, inputs: x.inputs, solveSecs: x.solveSecs || 0, secs: x.secs, survived: b64(x.survived), pot: b64(x.pot) }])) })));
  console.log(`${''.padEnd(8)} done unit ${pk} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
