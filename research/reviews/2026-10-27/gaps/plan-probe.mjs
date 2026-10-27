/*
 * THE PLAN-VARIANT PROBES (EXPLORATORY; research/reviews/2026-10-27/GAPS-SWEEP.md, Part B): what a setting the solver cannot
 * choose is worth. The candidate is solved on the plan as it is (BASE) and on the plan with the one setting changed, and each is
 * run forward by the solver's own chooser (runPolicy) on the same 8,000 paths of the tuning seed, so the arms pair by path
 * (read-probes.mjs). At 45 wealth points and estate weight 0.02, as N1's probe.
 *   node plan-probe.mjs <household> <arm> <out.json> [paths=8000]      (from the root of the code under test)
 * A household is a library id, or a FIRE household (the id with F: the library household retiring at 52, as Phase 4 builds
 * one, its target landed by land.mjs and read from landing.json beside this file). The arms:
 *   BASE     the plan as it is: guardrails and the lookahead off, the floor at 80% of the target (as N1's probe)
 *   BUF0     the cash buffer at 0 months (the plan's: 6)
 *   BUF24    the cash buffer at 24 months
 *   LUMP     the full 25% lump sum at first access (the plan's: phased)
 *   ISA2ISA  the cash ISA's balance above the year-0 buffer moved into the stocks and shares ISA at the start (a transfer
 *            between ISAs, which uses no allowance), so the table's sweep cannot move it into the GIA
 *   MOREISA  while working, each year half the pension contribution's net cost paid into the ISA instead: the pension gets half
 *            its gross, the ISA the net cost saved (the engine's netCostOfPensionContrib), any excess over the allowance to the GIA
 *   MOREPEN  while working, each year the ISA contribution paid into the pension instead, grossed up to the same net cost
 */
import { resolve, dirname, join } from 'path';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { pathToFileURL, fileURLToPath } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { checkE3pclsPin } = await imp('research/solver/e3pcls-pin.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const { makeTrace } = await imp('research/solver/record.mjs');
const { wholeScore } = await imp('research/solver/reduce-7uf.mjs');
const HERE = dirname(fileURLToPath(import.meta.url));
export const ARMS = ['BASE', 'BUF0', 'BUF24', 'LUMP', 'ISA2ISA', 'MOREISA', 'MOREPEN'];

const codeHash = () => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/solver/candidate.json')); h.update(readFileSync('research/engine.mjs')); return h.digest('hex').slice(0, 12); };
const lib = id => JSON.parse(JSON.stringify(buildScenarios().find(s => s.id === id).plan));
/* the raw plan of a household: a library one as it is, a FIRE one retiring at 52 at its landed target */
export function rawOf(id, landing = null) {
  if (!id.endsWith('F')) return lib(id);
  const p = lib(id.slice(0, -1)); p.demographics.retireAgeSelf = 52;
  const L = landing || JSON.parse(readFileSync(join(HERE, 'landing.json'), 'utf8'));
  if (!L[id]) throw new Error(`plan-probe: ${id} has no landed target in landing.json`);
  p.spending.targetSpend = L[id].target;
  return p;
}
/* as N1's probe: guardrails and the lookahead off, the floor at 80% of the target */
export const prep = p => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));

/* each working year's contributions split another way at the same net cost (MOREISA, MOREPEN) */
function resplit(p, arm) {
  const ctx = E.buildContext(p), o = ctx.owners[0], pen = ctx.acc[o.ids.pen], isa = ctx.acc[o.ids.isa], other = ctx.acc[o.ids.other];
  const W = Math.max(0, Math.round(o.retireAge - o.age0));
  if (W <= 0) throw new Error(`plan-probe: ${arm} needs a household still working`);
  const cost = (g, t) => E.netCostOfPensionContrib(g, E.salaryAtYear(o, t), p.config, o.selfEmployed);
  const penBy = [], isaBy = [], othBy = [];
  for (let t = 0; t < W; t++) {
    const gp = E.contribAtYear(pen, t), ci = E.contribAtYear(isa, t), co = other ? E.contribAtYear(other, t) : 0;
    let gp2, ci2;
    if (arm === 'MOREISA') { gp2 = gp / 2; ci2 = ci + (cost(gp, t) - cost(gp2, t)); }
    else {   // MOREPEN: the gross whose net cost is the plan's pension cost plus the ISA money, by bisection
      const want = cost(gp, t) + ci, cap = Math.min(ctx.P.aaAt(E.salaryAtYear(o, t)), E.salaryAtYear(o, t));
      let lo = gp, hi = Math.max(gp, cap);
      if (cost(hi, t) < want) throw new Error(`plan-probe: MOREPEN year ${t}: the pension cannot take the ISA's money within the allowance`);
      for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (cost(mid, t) < want) lo = mid; else hi = mid; }
      gp2 = hi; ci2 = 0;
    }
    const room = ctx.P.isaAllowance;
    penBy.push(gp2); isaBy.push(Math.min(ci2, room)); othBy.push(co + Math.max(0, ci2 - room));
  }
  for (const a of p.accounts) {
    if (a.id === 'pen_self') a.contribByYear = penBy;
    if (a.id === 'isa_self') a.contribByYear = isaBy;
    if (a.id === 'other_self') a.contribByYear = othBy;
  }
  return { penBy, isaBy, othBy };
}

/* the plan for an arm, and what changed */
export function armPlan(id, arm, landing = null) {
  if (!ARMS.includes(arm)) throw new Error(`plan-probe: arm ${arm}?`);
  const p = rawOf(id, landing);
  let note = 'the plan as it is';
  if (arm === 'BUF0') { p.config.cashBufferMonths = 0; note = 'the cash buffer at 0 months'; }
  if (arm === 'BUF24') { p.config.cashBufferMonths = 24; note = 'the cash buffer at 24 months'; }
  if (arm === 'LUMP') { p.spending.drawdownStrategy = 'Full 25% Lump Sum'; note = 'the full 25% lump sum'; }
  if (arm === 'ISA2ISA') {
    const ctx = E.buildContext(prep(p)), o = ctx.owners[0];
    const buffer = E.spendTargetAtAge(ctx, ctx.ageSelf0) * ctx.cashBufferYears;
    const cashIsa = p.accounts.find(a => a.id === 'cashIsa_self'), cash = p.accounts.find(a => a.id === 'cash_self'), isa = p.accounts.find(a => a.id === 'isa_self');
    const sheltered = E.num(cashIsa.balance, 0), taxable = E.num(cash.balance, 0);
    // the buffer stays in cash, sheltered first; the cash ISA above what the buffer keeps goes to the stocks and shares ISA
    const keep = Math.max(0, buffer - taxable), move = Math.max(0, sheltered - keep);
    cashIsa.balance = Math.round(sheltered - move); isa.balance = Math.round(E.num(isa.balance, 0) + move);
    note = `£${Math.round(move)} of the cash ISA moved to the stocks and shares ISA (the year-0 buffer £${Math.round(buffer)}, taxable cash £${Math.round(taxable)})`;
    if (!(move > 0)) throw new Error(`plan-probe: ISA2ISA moves nothing on ${id}`);
  }
  if (arm === 'MOREISA' || arm === 'MOREPEN') {
    const s = resplit(p, arm), sum = a => a.reduce((x, y) => x + y, 0);
    note = `${arm === 'MOREISA' ? 'half the pension cost to the ISA' : 'the ISA money to the pension'} over ${s.penBy.length} working years: pension gross £${Math.round(sum(s.penBy))}, ISA £${Math.round(sum(s.isaBy))}, GIA £${Math.round(sum(s.othBy))}`;
  }
  return { plan: prep(p), note };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [id, arm, outFile, nArg = '8000'] = process.argv.slice(2);
  const N = Number(nArg), PTS = Number(process.env.PTS || 45), W = 0.02, SEED = 7002, LAMBDA = 0.0223606797749979;
  const { plan, note } = armPlan(id, arm);
  // the plan before the arm's change, so the read can show the base's own contributions
  const opts = { ...C.CANDIDATE_OPTS, lambda: LAMBDA, points: PTS, bequestWeight: W };
  checkE3pclsPin(opts);
  const t0 = Date.now();
  const r = S.solvePlan(E, M, C.candidatePlan(E, plan), opts);
  const solveSecs = (Date.now() - t0) / 1000;
  const T = r.m.ctx.totalYears, Y = T + 1, paths = E.pathsForSeed(SEED, N, T);
  const tr = makeTrace(N, Y), surv = new Uint8Array(N), failAge = new Int16Array(N).fill(-1);
  const f0 = Date.now();
  let lifetimeTax = 0;
  for (let i = 0; i < N; i++) { tr.row = i; const o = S.runPolicy(r, Float64Array.from(paths[i]), { trace: tr }); lifetimeTax += o.lifetimeTax; if (o.survived) surv[i] = 1; else failAge[i] = tr.failYear[i] >= 0 ? r.m.ctx.ageSelf0 + tr.failYear[i] : -1; }
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float64Array.from(wholeScore(bs, W, Y));
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const accessAge = r.m.ctx.nmpa;
  let bridgeFails = 0, laterFails = 0; for (let i = 0; i < N; i++) if (!surv[i]) { if (failAge[i] >= 0 && failAge[i] < accessAge) bridgeFails++; else laterFails++; }
  const out = { id, arm, note, points: PTS, w: W, seed: SEED, paths: N, T, codeHash: codeHash(), candidateHash: C.CANDIDATE_HASH, solveSecs, runSecs: (Date.now() - f0) / 1000, moves: r.actions.length,
    lump: !!r.actions[0].lump, buffer: r.m.ctx.cashBufferYears, target: r.m.ctx.targetSpend, survival: 100 * mean(Array.from(surv)), whole: mean(Array.from(ws)), meanLifetimeTax: lifetimeTax / N, bridgeFails, laterFails,
    perPath: { survived: b64(surv), whole: b64(ws) } };
  writeFileSync(outFile, JSON.stringify(out));
  console.log(`${id} ${arm} (${note}): solved in ${solveSecs.toFixed(0)} s (${r.actions.length} moves); ${N} paths in ${out.runSecs.toFixed(0)} s: survival ${out.survival.toFixed(3)}%, whole score ${out.whole.toFixed(4)}; failures before the pension opens ${bridgeFails}, after ${laterFails}; lifetime tax £${Math.round(out.meanLifetimeTax)}`);
}
