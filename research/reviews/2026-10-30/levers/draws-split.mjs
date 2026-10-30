/*
 * WHAT THE DRAWS' GAIN IS MADE OF (EXPLORATORY; LEVERS.md, "What the solver does with the draws"; the maintainer's question
 * of 30 Oct: what makes the solver better outside the tiers and spending?). FIXHOLD less FIXAPP, the draws alone (+3.20
 * points), mixes four things the two arms do differently:
 *   - the cost lookahead: the app's plan sets money aside for a one-off cost it can see coming (5 years ahead); the engine
 *     refuses a table with it on, so the solver runs without it;
 *   - the cash sweep: every move on the solver's menu carries `sweepCash` (src/solver/solve.js), and under it the engine
 *     keeps cash at the buffer (half a year of target) and puts the rest in the GIA at cost, each year (engine step 7d);
 *     the app's policy leaves cash where it is until its draw order reaches it;
 *   - the lump sum: the app's pick may take the full 25% lump sum, into cash; the solver solves the household's own plan
 *     (phased drawdown on all eight) and takes it only where the plan says so;
 *   - what is left: the solver's choice each year of which pot pays, how much pension to draw into the tax bands, and
 *     whether to sell the taxable account up to the CGT exemption.
 * The app's own fixed policy is given them in turn, run through the engine's table hook (`spending.policyOverride`, as
 * Phase 4's FIXBR runs arm A's policy: audit-phase4.mjs fixedBridgePolicy) with a move that is the policy's own every year,
 * on the units' paths (seed 7002, 1,000), scored by runPath as the units were, paired by path:
 *   A0  FIXAPP, replayed: must equal its unit on every path;
 *   A1  A0 with the lookahead off;
 *   A2  A1 through the table hook, the sweep off: must equal A1 on every path (the hook changes nothing else);
 *   A3  A2 with the sweep on;
 *   A4  A3 with the household's own drawdown (no full lump sum where the pick took it); A5 A2 with the same (the other order);
 *   FIXHOLD, its unit.
 * Plants (each must differ): A0 against FIXHOLD's unit; the hook with the draw order reversed against A1.
 *   node draws-split.mjs <unit dir> <out dir> <id>...    (from the root of the code under test; one JSON a household)
 *   node draws-split.mjs --pool <out dir>               (the read, from anywhere)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';
import { createHash } from 'crypto';
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
const ARMS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'FIXHOLD'];
const STEPS = [
  ['lookahead', 'A1', 'A0', 'the cost lookahead off'],
  ['hook', 'A2', 'A1', 'the table hook (must be nothing)'],
  ['sweep', 'A3', 'A2', 'the cash sweep'],
  ['lump', 'A4', 'A3', 'no full lump sum, after the sweep'],
  ['decide', 'FIXHOLD', 'A4', "the solver's own choices of draw each year"],
  ['total', 'FIXHOLD', 'A0', 'FIXHOLD less FIXAPP'],
  ['lumpFirst', 'A5', 'A2', 'no full lump sum, before the sweep'],
  ['sweepAfter', 'A4', 'A5', 'the cash sweep, after that'],
];
const args = process.argv.slice(2);
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), sg = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

if (args[0] === '--pool') {
  const dir = args[1], rs = IDS.filter(id => existsSync(join(dir, `${id}.json`))).map(id => JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8')));
  const out = [`WHAT THE DRAWS' GAIN IS MADE OF (EXPLORATORY): FIXHOLD less FIXAPP (the draws alone) split by giving the app's own fixed policy, in turn, what the solver's arm has besides its choice of draw; ${rs.length} of ${IDS.length} households, seed 7002, the units' paths`];
  const missing = IDS.filter(id => !rs.some(r => r.id === id));
  const codes = [...new Set(rs.map(r => r.code))], unitCodes = [...new Set(rs.flatMap(r => r.unitCodes))];
  const fail = [];
  if (missing.length) fail.push(`households missing: ${missing.join(', ')}`);
  if (codes.length !== 1 || unitCodes.length !== 1 || codes[0] !== unitCodes[0]) fail.push(`the code ${codes.join(', ')} against the units' ${unitCodes.join(', ')}`);
  for (const r of rs) {
    if (r.checks.replay !== 0) fail.push(`${r.id}: the replay of FIXAPP differs from its unit on ${r.checks.replay} paths`);
    if (r.checks.hook !== 0) fail.push(`${r.id}: the table hook differs from A1 on ${r.checks.hook} paths`);
    if (!(r.checks.plantReplay > 0)) fail.push(`${r.id}: the planted replay check did not bite`);
  }
  if (!rs.some(r => r.checks.plantHook > 0)) fail.push('the planted hook check bit on no household');
  out.push(`the code ${codes.join(', ')} (the units' ${unitCodes.join(', ')}); ${[...new Set(rs.map(r => r.N))].join(', ')} paths a household`);
  out.push(`Checks: the replay of FIXAPP against its unit, paths that differ: ${rs.map(r => `${r.id} ${r.checks.replay}`).join(', ')} (planted, against FIXHOLD's unit: ${rs.map(r => r.checks.plantReplay).join(', ')}); the table hook against A1: ${rs.map(r => `${r.id} ${r.checks.hook}`).join(', ')} (planted, the draw order reversed: ${rs.map(r => r.checks.plantHook).join(', ')})`);
  out.push('Per household: what differs; survival A0 (FIXAPP) / A1 / A2 / A3 / A4 / A5 / FIXHOLD; the median cash at the first retired year on the first 200 paths, years of target (A2 without the sweep, A3 with it); each step, points paired by path (paths saved / lost)');
  for (const r of rs) {
    const x = r.facts;
    const q = r.kinds;
    out.push(`  ${r.id.padEnd(6)} ${r.label}; cash at the start ${f2(x.cash0)} years of target (${x.cashTier}), the GIA at ${x.giaTier}; the pick's drawdown '${x.pickDrawdown}', the household's '${x.ownDrawdown}'; one-off costs ${x.costs}, lookahead ${x.lookahead} years; the minimum pot ${f2(x.minPot)} years of target; pension access at ${x.access}, the plan's last year at ${x.endAge}`);
    out.push(`         the ${r.steps.total.saved} paths FIXHOLD saves, how FIXAPP fails: short of a year's spending before the last year ${q.early} (in the bridge ${q.bridge}${q.medianAge !== null ? `; the median age ${q.medianAge}` : ''}), short only in the last year ${q.last}, ending below the minimum pot ${q.minpot}; FIXHOLD loses ${r.steps.total.lost}`);
    out.push(`         survival ${ARMS.map(a => f1(r.surv[a])).join(' / ')}; cash ${f2(r.cash.A2)} / ${f2(r.cash.A3)}`);
    out.push(`         ${STEPS.map(([k, , , label]) => `${label} ${sg(r.steps[k].d)} (${r.steps[k].saved}/${r.steps[k].lost})`).join('; ')}`);
  }
  const pool = k => { const xs = rs.map(r => r.steps[k]); const d = xs.reduce((p, x) => p + x.d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x.v, 0)) / xs.length; return { d, se, lo: d - 1.96 * se, hi: d + 1.96 * se }; };
  const tot = pool('total');
  out.push('');
  out.push('Pooled, each household once (points; 95% by path; the share of FIXHOLD less FIXAPP):');
  for (const [k, , , label] of STEPS) { const p = pool(k); out.push(`  ${label.padEnd(44)} ${sg(p.d)} (se ${f2(p.se)}; ${sg(p.lo)} to ${sg(p.hi)})${k === 'total' || k === 'hook' ? '' : `; ${f1(100 * p.d / tot.d)}%`}`); }
  const sum = ['lookahead', 'hook', 'sweep', 'lump', 'decide'].reduce((p, k) => p + pool(k).d, 0);
  out.push(`  the five steps add to ${sg(sum)} (the total ${sg(tot.d)})`);
  out.push(fail.length ? `CHECKS FAILED: ${fail.join('; ')}` : 'ALL CHECKS PASS');
  console.log(out.join('\n'));
  process.exit(fail.length ? 1 : 0);
}

const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { runPath } = await imp('research/solver/audit-phase4.mjs');
const [dir, OUT, ...ids] = args;
if (!dir || !OUT || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: draws-split.mjs <unit dir> <out dir> <id>...  |  --pool <out dir>'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
// the units' code hash, computed as levers-audit.mjs computes it
const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); })();
const P = Object.fromEntries(readPanel().map(x => [x.id, x]));
const fixedAppPlan = raw => E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 5, raiseCap: 1 } });
const unit = (id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));
const bits = u => { const b = Buffer.from(u.main.survived, 'base64'); return new Uint8Array(b.buffer, b.byteOffset, b.byteLength); };
const diff = (x, y) => { let n = 0; for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) n++; return n; };
const pair = (x, y) => { const N = x.length; let s1 = 0, s2 = 0, saved = 0, lost = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) saved++; if (d < 0) lost++; } const m = s1 / N; return { d: 100 * m, v: 1e4 * (s2 / N - m * m) / N, saved, lost }; };
for (const id of ids) {
  const t0 = Date.now(), h = P[id], uA = unit(id, 'fixapp'), uH = unit(id, 'fixhold');
  const pick = armA(fixedAppPlan(h.plan), { tournament: false }), ps = pick.planState;
  const ctxA0 = E.buildContext(E.resolveMpaa(ps)), T = ctxA0.totalYears, N = uA.N, target = ctxA0.targetSpend;
  if (uA.Y !== T + 1 || uH.N !== N || uA.seed !== uH.seed) throw new Error(`${id}: the units' years, paths or seed do not match`);
  const paths = E.pathsForSeed(uA.seed, N, T);
  const survOf = ctx => { if (ctx.totalYears !== T) throw new Error(`${id}: a context of ${ctx.totalYears} years`); const s = new Uint8Array(N); for (let k = 0; k < N; k++) s[k] = runPath(ctx, Float64Array.from(paths[k]), false).survived ? 1 : 0; return s; };
  // the app's policy through the table hook: the move is the policy's own every year (the context it would run on, the
  // plan's own tiers by name, no spending change, no CGT sale); the MPAA resolved before the hook, as the policy alone sets it
  const hooked = (plan, sweep, plant = false) => {
    const resolved = E.resolveMpaa(plan), base = E.buildContext(resolved), self = base.owners.find(o => o.key === 'self');
    const nameOf = aid => (base.tierProfiles[aid] ? base.tierProfiles[aid][0].name : undefined);
    const move = { steps: plant ? [...base.policySteps].reverse() : base.policySteps, costSteps: base.costSteps, harvest: !!base.harvestPA, harvestCeil: base.harvestCeiling,
      lump: !!base.fullLumpSum, sweepCash: sweep, spendLevel: 1, tierPen: 0, tierIsa: 0, index: -1, code: 'fixed', tierPenName: nameOf(self.ids.pen), tierIsaName: nameOf(self.ids.isa) };
    return E.buildContext({ ...resolved, config: { ...resolved.config, guardrails: false, lookaheadYears: 0 }, spending: { ...resolved.spending, policyOverride: { kind: 'table', choose: () => move, switchCost: 0, tiersBelow: 2 } } });
  };
  const noLook = { ...ps, config: { ...ps.config, lookaheadYears: 0 } };
  const own = { ...noLook, spending: { ...noLook.spending, drawdownStrategy: h.plan.spending.drawdownStrategy } };
  const ctx = { A0: ctxA0, A1: E.buildContext(E.resolveMpaa(noLook)), A2: hooked(noLook, false), A3: hooked(noLook, true), A4: hooked(own, true), A5: hooked(own, false) };
  const S = Object.fromEntries(Object.entries(ctx).map(([k, c]) => [k, survOf(c)]));
  S.FIXHOLD = bits(uH);
  const plantHook = survOf(hooked(noLook, false, true));
  const checks = { replay: diff(S.A0, bits(uA)), hook: diff(S.A2, S.A1), plantReplay: diff(S.A0, S.FIXHOLD), plantHook: diff(plantHook, S.A1) };
  // the sweep at work: the median cash at the first retired year, on the first 200 paths
  const self = ctxA0.owners.find(o => o.key === 'self'), retT = Math.max(0, Math.min(T, self.retireAge - ctxA0.ageSelf0));
  const cashAt = c => { const v = []; for (let k = 0; k < Math.min(200, N); k++) { const zs = Float64Array.from(paths[k]), st = E.freshState(c), zPath = zs.length > T + 1 ? zs[T + 1] : 0; let row = null; for (let t = 0; t <= retT; t++) row = E.stepYear(c, st, t, { z: zs[t], zPath }, null); v.push(row.cash / target); } v.sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
  // the paths FIXHOLD saves (A0 fails, FIXHOLD survives), by how A0 fails, the rule runPath's: short of a year's spending
  // before the plan's last year (in the bridge if before pension access), short only in its last year, or every year met
  // but ending below the minimum pot
  const kinds = { early: 0, bridge: 0, last: 0, minpot: 0, ages: [] };
  for (let k = 0; k < N; k++) {
    if (S.A0[k] || !S.FIXHOLD[k]) continue;
    const zs = Float64Array.from(paths[k]), st = E.freshState(ctxA0), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    let kind = null, last = null;
    for (let t = 0; t <= T && !kind; t++) {
      const row = E.stepYear(ctxA0, st, t, { z: zs[t], zPath }, null); last = row;
      if (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent) { kind = t < T ? 'early' : 'last'; if (kind === 'early') { kinds.ages.push(ctxA0.ageSelf0 + t); if (ctxA0.ageSelf0 + t < ctxA0.nmpa) kinds.bridge++; } }
    }
    if (!kind) { if (!(ctxA0.solvencyFloor > 0 && Math.max(0, last.totalCombined) < ctxA0.solvencyFloor)) throw new Error(`${id}: path ${k} fails in runPath and not here`); kind = 'minpot'; }
    kinds[kind]++;
  }
  kinds.ages.sort((x, y) => x - y);
  kinds.medianAge = kinds.ages.length ? kinds.ages[Math.floor(kinds.ages.length / 2)] : null; delete kinds.ages;
  const accs = ctxA0.accounts, costs =ctxA0.oneOffCosts instanceof Map ? [...ctxA0.oneOffCosts.values()].reduce((p, x) => p + (Array.isArray(x) ? x.length : 1), 0) : (ctxA0.oneOffCosts || []).length;
  const facts = { cash0: accs.filter(a => a.cat === 'cash').reduce((p, a) => p + a.balance, 0) / target, cashTier: [...new Set(accs.filter(a => a.cat === 'cash').map(a => a.risk))].join(', '),
    giaTier: [...new Set(accs.filter(a => a.cat === 'other').map(a => a.risk))].join(', ') || 'none', pickDrawdown: ps.spending.drawdownStrategy, ownDrawdown: h.plan.spending.drawdownStrategy, costs, lookahead: ctxA0.lookaheadYears,
    minPot: ctxA0.solvencyFloor / target, access: ctxA0.nmpa, endAge: ctxA0.ageSelf0 + T };
  const surv = Object.fromEntries(ARMS.map(a => [a, 100 * S[a].reduce((p, x) => p + x, 0) / N]));
  const steps = Object.fromEntries(STEPS.map(([k, a, b]) => [k, pair(S[a], S[b])]));
  const rec = { id, label: pick.label, code: codeHash, unitCodes: [uA.code, uH.code], seed: uA.seed, N, facts, surv, steps, checks, kinds, cash: { A2: cashAt(ctx.A2), A3: cashAt(ctx.A3) }, secs: (Date.now() - t0) / 1000 };
  writeFileSync(join(OUT, `${id}.json`), JSON.stringify(rec));
  console.log(`${id}: ${pick.label}; survival ${ARMS.map(a => `${a} ${f1(surv[a])}`).join(', ')}; checks ${JSON.stringify(checks)}; ${Math.round(rec.secs)} s; code ${codeHash}`);
}
