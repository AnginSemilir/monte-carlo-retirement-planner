/*
 * WHAT THE SOLVER'S OWN CHOICES ARE (EXPLORATORY; LEVERS.md, "What the solver does with the draws"). The split
 * (draws-split.mjs) leaves +2.81 points of FIXHOLD's lead to the solver's own choice of draw each year: which pot pays, how
 * much pension to draw into the tax bands, when to sell the taxable account up to the CGT exemption. Is that a better fixed
 * rule than the app's, or choosing each year? FIXHOLD is solved again as levers-audit.mjs solved it, and its move recorded
 * at every decision on the units' paths. Two fixed rules from its own menu are then played every year through the same
 * table, as Phase 4's FIXBR plays arm A's policy (audit-phase4.mjs fixedBridgePolicy):
 *   MODAL    the move it makes most often in the retired years;
 *   BESTFIX  the move with the best survival on 1,000 paths of the search seed 7001 (never scored), chosen in advance as
 *            the app's rules are.
 * A4 (the app's order with the sweep and no full lump sum, draws-split.mjs) is rebuilt to pair with them, by path.
 * Checks: the re-solve, recorder on, reproduces FIXHOLD's unit on every path (planted: against FIXAPP's unit it must
 * differ); A4's survival is the split's.
 *   node draws-adapt.mjs <unit dir> <split dir> <out dir> <id>...    (from the root of the code under test)
 *   node draws-adapt.mjs --pool <out dir>                           (the read, from anywhere)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';
import { createHash } from 'crypto';
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
const PAIRS = [['better', 'BESTFIX', 'A4', "the solver's best fixed move against the app's order"], ['adapt', 'FIXHOLD', 'BESTFIX', 'choosing each year against that move'],
  ['modal', 'MODAL', 'A4', "the solver's most used move against the app's order"], ['adaptModal', 'FIXHOLD', 'MODAL', 'choosing each year against that move'], ['own', 'FIXHOLD', 'A4', "the solver's own choices (the split's step)"]];
const args = process.argv.slice(2);
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), sg = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`, pc = x => `${(100 * x).toFixed(0)}%`;

if (args[0] === '--pool') {
  const dir = args[1], rs = IDS.filter(id => existsSync(join(dir, `${id}.json`))).map(id => JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8')));
  const out = [`WHAT THE SOLVER'S OWN CHOICES ARE (EXPLORATORY): FIXHOLD against fixed rules from its own menu, played every year; ${rs.length} of ${IDS.length} households, seed 7002 on the units' paths, the fixed move chosen on 1,000 paths of 7001`];
  const fail = [], missing = IDS.filter(id => !rs.some(r => r.id === id));
  if (missing.length) fail.push(`households missing: ${missing.join(', ')}`);
  const codes = [...new Set(rs.flatMap(r => [r.code, ...r.unitCodes]))];
  if (codes.length !== 1) fail.push(`the code and the units' differ: ${codes.join(', ')}`);
  for (const r of rs) {
    if (r.checks.resolve !== 0) fail.push(`${r.id}: the re-solve differs from FIXHOLD's unit on ${r.checks.resolve} paths`);
    if (!(r.checks.plant > 0)) fail.push(`${r.id}: the planted check did not bite`);
    if (!r.checks.a4) fail.push(`${r.id}: A4's survival is not the split's`);
    if (!r.checks.menu) fail.push(`${r.id}: the menu is not one spend level and the plan's own tiers`);
  }
  out.push(`the code ${codes.join(', ')}; checks: the re-solve against FIXHOLD's unit, paths that differ: ${rs.map(r => `${r.id} ${r.checks.resolve}`).join(', ')} (planted, against FIXAPP's unit: ${rs.map(r => r.checks.plant).join(', ')}); A4 as the split's: ${rs.map(r => `${r.id} ${r.checks.a4 ? 'yes' : 'NO'}`).join(', ')}`);
  out.push("Per household: the moves on the solver's menu; MODAL and BESTFIX (and BESTFIX's survival on the search seed, against the best three others); survival A4 / MODAL / BESTFIX / FIXHOLD; the pairs, points by path (saved / lost); how the solver's moves follow the markets, in its retired years before any failure");
  for (const r of rs) {
    const a = r.adapt;
    out.push(`  ${r.id.padEnd(6)} ${r.moves} moves; MODAL "${r.modal.label}" (${pc(r.modal.share)} of the retired decisions); BESTFIX "${r.best.label}" (search ${f1(r.best.search)}%; the next: ${r.next.map(x => `"${x.label}" ${f1(x.search)}%`).join(', ')})`);
    out.push(`         survival ${['A4', 'MODAL', 'BESTFIX', 'FIXHOLD'].map(k => f1(r.surv[k])).join(' / ')}; ${PAIRS.map(([k, , , label]) => `${label} ${sg(r.pairs[k].d)} (${r.pairs[k].saved}/${r.pairs[k].lost})`).join('; ')}`);
    out.push(`         ${a.n} decisions, ${a.distinct} moves used, the move changed from the year before on ${pc(a.changed)}; after the worst third of market years / the best third: the pension drawn first ${pc(a.lo.penFirst)} / ${pc(a.hi.penFirst)}, a harvest ${pc(a.lo.harvest)} / ${pc(a.hi.harvest)} (to the basic rate or above ${pc(a.lo.harvestHigh)} / ${pc(a.hi.harvestHigh)}), a CGT sale ${pc(a.lo.cgt)} / ${pc(a.hi.cgt)}, the modal move ${pc(a.lo.modal)} / ${pc(a.hi.modal)}`);
  }
  const tally = k => `${rs.reduce((p, r) => p + r.pairs[k].saved, 0)} saved, ${rs.reduce((p, r) => p + r.pairs[k].lost, 0)} lost`;
  out.push(`  all households, paths: the best fixed move against the app's order ${tally('better')}; choosing each year against it ${tally('adapt')}; the moves used ${Math.min(...rs.map(r => r.adapt.distinct))} to ${Math.max(...rs.map(r => r.adapt.distinct))}, changed from the year before on ${pc(Math.min(...rs.map(r => r.adapt.changed)))} to ${pc(Math.max(...rs.map(r => r.adapt.changed)))} of the decisions; a CGT sale on ${pc(Math.max(...rs.flatMap(r => [r.adapt.lo.cgt, r.adapt.hi.cgt])))} at most`);
  const pool = k => { const xs = rs.map(r => r.pairs[k]); const d = xs.reduce((p, x) => p + x.d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x.v, 0)) / xs.length; return { d, se, lo: d - 1.96 * se, hi: d + 1.96 * se }; };
  const own = pool('own');
  out.push('');
  out.push("Pooled, each household once (points; 95% by path; the share of the solver's own choices, FIXHOLD less A4):");
  for (const [k, , , label] of PAIRS) { const p = pool(k); out.push(`  ${label.padEnd(54)} ${sg(p.d)} (se ${f2(p.se)}; ${sg(p.lo)} to ${sg(p.hi)})${k === 'own' ? '' : `; ${f1(100 * p.d / own.d)}%`}`); }
  out.push(fail.length ? `CHECKS FAILED: ${fail.join('; ')}` : 'ALL CHECKS PASS');
  console.log(out.join('\n'));
  process.exit(fail.length ? 1 : 0);
}

const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { runPath, solverPlanOf, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
const { tablePolicy } = await imp('src/solver/bridge.js');
const [dir, splitDir, OUT, ...ids] = args;
if (!dir || !splitDir || !OUT || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: draws-adapt.mjs <unit dir> <split dir> <out dir> <id>...  |  --pool <out dir>'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); })();
const P = Object.fromEntries(readPanel().map(x => [x.id, x]));
const W = 0.02, SEARCH_SEED = 7001, SEARCH_N = 1000;
const fixedAppPlan = raw => E.normalizePlan({ ...raw, config: { ...raw.config, guardrails: false, lookaheadYears: 5, raiseCap: 1 } });
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const unit = (id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));
const bits = u => { const b = Buffer.from(u.main.survived, 'base64'); return new Uint8Array(b.buffer, b.byteOffset, b.byteLength); };
const diff = (x, y) => { let n = 0; for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) n++; return n; };
const pair = (x, y) => { const N = x.length; let s1 = 0, s2 = 0, saved = 0, lost = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) saved++; if (d < 0) lost++; } const m = s1 / N; return { d: 100 * m, v: 1e4 * (s2 / N - m * m) / N, saved, lost }; };
for (const id of ids) {
  const t0 = Date.now(), h = P[id], uA = unit(id, 'fixapp'), uH = unit(id, 'fixhold'), split = JSON.parse(readFileSync(join(splitDir, `${id}.json`), 'utf8'));
  const pk = JSON.parse(readFileSync(join(dir, `${id}-pick-fixapp.json`), 'utf8'));
  // FIXHOLD as levers-audit.mjs solves it: the household's own plan under the app pick's policy name, spending fixed, tiers held
  const r = C.solveCandidate(E, M, prep(solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy })), { lambda: LAMBDA, points: CAND_PTS, bequestWeight: W, blockTrim: true, raiseCap: 1, riskConsent: false });
  const levels = [...new Set(r.levelOf)], tierMoves = [...new Set(r.actions.map(x => `${x.tierPen || 0}/${x.tierIsa || 0}`))];
  const menu = levels.length === 1 && levels[0] === 1 && tierMoves.length === 1 && tierMoves[0] === '0/0';
  const base = tablePolicy(r), plan = r.m.ctx.plan;
  const ctxOf = choose => E.buildContext({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...plan.spending, policyOverride: { ...base, choose } } });
  // the move the table returns for a given menu entry (bridge.js tablePolicy), to be played every year
  const moveOf = ai => { const a = r.actions[ai], ca = r.c.acts[ai]; return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code: `fixed ${ai}`, tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name }; };
  const T = E.buildContext(E.resolveMpaa(armA(fixedAppPlan(h.plan), { tournament: false }).planState)).totalYears, Y = T + 1, N = uH.N;
  const paths = E.pathsForSeed(uH.seed, N, T), search = E.pathsForSeed(SEARCH_SEED, SEARCH_N, T);
  const survOn = (ctx, ps) => { if (ctx.totalYears !== T) throw new Error(`${id}: a context of ${ctx.totalYears} years`); const s = new Uint8Array(ps.length); for (let k = 0; k < ps.length; k++) s[k] = runPath(ctx, Float64Array.from(ps[k]), false).survived ? 1 : 0; return s; };
  // the solver, its move recorded at every decision
  const choice = new Int16Array(N * Y).fill(-1), failYear = new Int16Array(N);
  let cur = null;
  const recCtx = ctxOf((s, t, held) => { const mv = base.choose(s, t, held); cur[t] = mv.index; return mv; });
  const sH = new Uint8Array(N);
  for (let k = 0; k < N; k++) { cur = choice.subarray(k * Y, (k + 1) * Y); const o = runPath(recCtx, Float64Array.from(paths[k]), false); sH[k] = o.survived ? 1 : 0; failYear[k] = o.failYear; }
  const checks = { resolve: diff(sH, bits(uH)), plant: diff(sH, bits(uA)), menu };
  const self = recCtx.owners.find(o => o.key === 'self'), retT = Math.max(0, Math.min(T, self.retireAge - recCtx.ageSelf0));
  const decisions = [];
  for (let k = 0; k < N; k++) for (let t = Math.max(1, retT); t <= T; t++) { if (failYear[k] >= 0 && t > failYear[k]) break; const ai = choice[k * Y + t]; if (ai >= 0) decisions.push({ k, t, ai, prev: choice[k * Y + t - 1], z: paths[k][t - 1] }); }
  const count = new Map(); for (const d of decisions) count.set(d.ai, (count.get(d.ai) || 0) + 1);
  const modalAi = [...count.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0];
  // the best fixed move, chosen on the search seed
  const searched = r.actions.map((a, ai) => ({ ai, label: a.label, search: 100 * survOn(ctxOf(() => moveOf(ai)), search).reduce((p, x) => p + x, 0) / SEARCH_N })).sort((x, y) => y.search - x.search || x.ai - y.ai);
  const bestAi = searched[0].ai;
  // A4 rebuilt (draws-split.mjs): the app's pick, lookahead off, the household's own drawdown, its own move every year with the sweep
  const ps = armA(fixedAppPlan(h.plan), { tournament: false }).planState, own = { ...ps, config: { ...ps.config, lookaheadYears: 0 }, spending: { ...ps.spending, drawdownStrategy: h.plan.spending.drawdownStrategy } };
  const resolved = E.resolveMpaa(own), b4 = E.buildContext(resolved), s4 = b4.owners.find(o => o.key === 'self');
  const nameOf = aid => (b4.tierProfiles[aid] ? b4.tierProfiles[aid][0].name : undefined);
  const mv4 = { steps: b4.policySteps, costSteps: b4.costSteps, harvest: !!b4.harvestPA, harvestCeil: b4.harvestCeiling, lump: !!b4.fullLumpSum, sweepCash: true, spendLevel: 1, tierPen: 0, tierIsa: 0, index: -1, code: 'fixed', tierPenName: nameOf(s4.ids.pen), tierIsaName: nameOf(s4.ids.isa) };
  const ctx4 = E.buildContext({ ...resolved, config: { ...resolved.config, guardrails: false, lookaheadYears: 0 }, spending: { ...resolved.spending, policyOverride: { kind: 'table', choose: () => mv4, switchCost: 0, tiersBelow: 2 } } });
  const S = { A4: survOn(ctx4, paths), MODAL: survOn(ctxOf(() => moveOf(modalAi)), paths), BESTFIX: survOn(ctxOf(() => moveOf(bestAi)), paths), FIXHOLD: sH };
  const surv = Object.fromEntries(Object.entries(S).map(([k, s]) => [k, 100 * s.reduce((p, x) => p + x, 0) / N]));
  checks.a4 = Math.abs(surv.A4 - split.surv.A4) < 1e-9;
  // how the moves follow the markets: the decisions after the worst third of the previous year's shocks against the best third
  const zs = decisions.map(d => d.z).sort((x, y) => x - y), zLo = zs[Math.floor(zs.length / 3)], zHi = zs[Math.floor(2 * zs.length / 3)];
  const share = (ds, f) => (ds.length ? ds.filter(f).length / ds.length : NaN);
  const traits = ds => ({ penFirst: share(ds, d => String(r.actions[d.ai].steps[0]).startsWith('pen')), harvest: share(ds, d => !!r.actions[d.ai].harvest), harvestHigh: share(ds, d => !!r.actions[d.ai].harvest && (r.actions[d.ai].harvestCeil || 'pa') !== 'pa'),
    cgt: share(ds, d => !!r.actions[d.ai].cgtSale), modal: share(ds, d => d.ai === modalAi) });
  const adapt = { n: decisions.length, distinct: count.size, changed: share(decisions.filter(d => d.prev >= 0), d => d.ai !== d.prev), lo: traits(decisions.filter(d => d.z <= zLo)), hi: traits(decisions.filter(d => d.z >= zHi)) };
  const rec = { id, code: codeHash, unitCodes: [uA.code, uH.code], N, moves: r.actions.length, checks, surv, adapt,
    modal: { ai: modalAi, label: r.actions[modalAi].label, share: count.get(modalAi) / decisions.length }, best: { ai: bestAi, label: r.actions[bestAi].label, search: searched[0].search }, next: searched.slice(1, 4).map(x => ({ label: x.label, search: x.search })),
    pairs: Object.fromEntries(PAIRS.map(([k, a, b]) => [k, pair(S[a], S[b])])), secs: (Date.now() - t0) / 1000 };
  writeFileSync(join(OUT, `${id}.json`), JSON.stringify(rec));
  console.log(`${id}: survival ${Object.entries(surv).map(([k, v]) => `${k} ${f1(v)}`).join(', ')}; MODAL "${rec.modal.label}", BESTFIX "${rec.best.label}"; checks ${JSON.stringify(checks)}; ${Math.round(rec.secs)} s; code ${codeHash}`);
}
