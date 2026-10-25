/*
 * PLAN VARIANTS (EXPLORATORY, the tuning seed 7002; the external review, 25 Oct). Choices a household makes once, outside
 * the solver's yearly menu, each tested by solving the candidate on the plan so changed and running it on the same paths,
 * paired against the plan as it stands:
 *   gia      the taxable account (GIA) held at a safer tier for the whole plan: Medium/Low, then Low (the solver never
 *            moves the GIA's tier; if even a fixed safer GIA helps, a GIA that can move is worth building)
 *   spdefer  the State Pension deferred two and four years, raised 5.78% for each year deferred (1% for every 9 weeks,
 *            the new State Pension's rule), a simple uplift, then level in real terms as the plan holds it
 * usage (from the root of a copy of the code, engine built): node plan-variants.mjs <household> <weight> <paths> <gia|spdefer>
 * env: PTS (45); TIERS_BELOW (3: needs third-step.diff, and runs with e3pcls off); MENUPLUS (N4's kinds, e.g. hr);
 *   OUTDIR: each variant's summary and its paths' outcomes go to <OUTDIR>/pv-<set>-<household>-w<weight>-<i>.json, and a
 *   variant whose file is there is read, not run again (its settings must match, or this throws); ONLY=<i,...> runs only
 *   those variants (0 is the plan as it stands). plan-variants-read.mjs reads the files.
 * The candidate as the maintainer is settling it (25 Oct): MENUPLUS=hr TIERS_BELOW=3.
 */
import { resolve } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
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

const [id, w = '0.02', nArg = '3000', set = 'gia'] = process.argv.slice(2);
const N = Number(nArg), PTS = Number(process.env.PTS || 45), TB = Number(process.env.TIERS_BELOW || 0), MP = process.env.MENUPLUS ? process.env.MENUPLUS.split(',') : [];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null, DIR = process.env.OUTDIR;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const h = buildScenarios().find(s => s.id === id);
if (!h) throw new Error(`no household ${id}`);
const UPLIFT = 0.0578;
const withGia = risk => p => ({ ...p, accounts: p.accounts.map(a => (a.owner === 'Myself' && a.category === 'Other Investments (e.g. GIA)' ? { ...a, risk } : a)) });
const defer = d => p => ({ ...p, demographics: { ...p.demographics, statePensionAge: Number(p.demographics.statePensionAge) + d, statePensionSelf: Math.round(Number(p.demographics.statePensionSelf) * (1 + UPLIFT * d)) } });
const SETS = {
  gia: [['the GIA at its plan tier', p => p], ['the GIA held at Medium/Low', withGia('Medium/Low Risk')], ['the GIA held at Low', withGia('Low Risk')]],
  spdefer: [['the State Pension as planned', p => p], ['deferred 2 years', defer(2)], ['deferred 4 years', defer(4)]]
};
if (!SETS[set]) throw new Error(`no variant set ${set}`);
const planOf = f => { const p = f(h.plan); return E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } })); };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, seOf = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length); };
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3);
const settings = { id, w, set, points: PTS, paths: N, seed: SEED, tiersBelow: TB || 2, menuPlus: MP };
log(`${id} W${w}: ${set}, ${PTS} points, ${N} paths of seed ${SEED}${MP.length ? `, menuPlus ${MP.join('+')}` : ''}${TB ? `, tiersBelow ${TB} (e3pcls off)` : ''}${ONLY ? `; variant ${ONLY.join(',')} only` : ''}`);
const done = [];
let paths = null, pathsT = -1;
for (const [i, [label, f]] of SETS[set].entries()) {
  const file = DIR ? resolve(DIR, `pv-${set}-${id}-w${w}-${i}.json`) : null;
  if (file && existsSync(file)) {
    const v = JSON.parse(readFileSync(file, 'utf8'));
    for (const [k, x] of Object.entries({ ...settings, index: i, label })) if (JSON.stringify(v[k]) !== JSON.stringify(x)) throw new Error(`${file}: ${k} is ${JSON.stringify(v[k])}, not ${JSON.stringify(x)}`);
    done[i] = v;
    log(`${label}: read from ${file}`);
    continue;
  }
  if (ONLY && !ONLY.includes(i)) continue;
  const plan = planOf(f), t0 = Date.now();
  const d = plan.demographics, gia = plan.accounts.find(a => a.owner === 'Myself' && a.category === 'Other Investments (e.g. GIA)');
  const r = C.solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: Number(w), ...(MP.length ? { menuPlus: MP } : {}), ...(TB ? { tiersBelow: TB, e3pcls: false } : {}) });
  const T = r.m.ctx.totalYears, Y = T + 1, age0 = r.m.ctx.ageSelf0;
  if (T !== pathsT) { paths = E.pathsForSeed(SEED, N, T); pathsT = T; }
  const hash = createHash('sha256');
  paths.forEach(zs => hash.update(Buffer.from(Float64Array.from(zs).buffer)));
  const tr = makeTrace(N, Y), surv = new Uint8Array(N);
  paths.forEach((zs, k) => { tr.row = k; if (S.runPolicy(r, Float64Array.from(zs), { trace: tr }).survived) surv[k] = 1; });
  const bs = { survived: surv, level: tr.level, wealth: tr.wealth, failYear: tr.failYear, lambda: LAMBDA, floor: Math.min(...r.levelOf), scale: Math.round(Math.max(1, r.m.ctx.accounts.reduce((x, a) => x + a.balance, 0))), capR: Math.round(r.meta.bequestCap), spendYears: Array.from({ length: Y }, (_, t) => (r.c.yr.spend[t] > 0 ? 1 : 0)) };
  const ws = Float64Array.from(wholeScore(bs, Number(w), Y));
  const lastsTo = age => 100 * Array.from(tr.failYear).filter(fy => !(fy >= 0 && age0 + fy <= age)).length / N;
  const endW = Array.from({ length: N }, (_, k) => (surv[k] ? tr.wealth[k * Y + T] : 0)).sort((a, b) => a - b);
  const v = { ...settings, index: i, label, T, endAge: age0 + T, pathsHash: hash.digest('hex').slice(0, 16),
    statePension: `${d.statePensionSelf} from ${d.statePensionAge}`, gia: gia ? `${gia.risk} ${gia.balance}` : '-', secs: (Date.now() - t0) / 1000, moves: r.actions.length, pairs: r.meta.tierState,
    survival: 100 * mean(Array.from(surv)), whole: mean(Array.from(ws)), lasts85: lastsTo(85), lasts90: lastsTo(90), endMedian: endW[Math.floor(N / 2)],
    surv: Array.from(surv), ws: Array.from(ws) };
  log(`${label} (State Pension ${v.statePension}; GIA ${v.gia}; ${v.moves} moves, tier pairs ${v.pairs}; paths ${v.pathsHash}; ${v.secs.toFixed(0)} s): survival to ${v.endAge} ${v.survival.toFixed(2)}%, no shortfall by 85 ${v.lasts85.toFixed(2)}% and by 90 ${v.lasts90.toFixed(2)}%; whole score ${v.whole.toFixed(3)}; median wealth at the end GBP ${Math.round(v.endMedian)}`);
  if (file) writeFileSync(file, JSON.stringify(v));
  done[i] = v;
}
const b = done[0];
for (const v of done.slice(1)) {
  if (!b || !v) continue;
  if (v.T !== b.T || v.pathsHash !== b.pathsHash) throw new Error(`${v.label}: not on the paths of the plan as it stands`);
  const dW = v.ws.map((x, k) => x - b.ws[k]), dS = v.surv.map((x, k) => 100 * (x - b.surv[k]));
  const saved = v.surv.filter((x, k) => x && !b.surv[k]).length, lost = v.surv.filter((x, k) => !x && b.surv[k]).length;
  log(`  ${v.label} less the plan as it stands, paired: survival ${f3(mean(dS))} points (se ${seOf(dS).toFixed(3)}; ${saved} saved, ${lost} lost), whole score ${f3(mean(dW))} (se ${seOf(dW).toFixed(3)})`);
}
log('done');
