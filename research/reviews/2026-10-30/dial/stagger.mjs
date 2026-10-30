/*
 * A STAGGERED TARGET (EXPLORATORY; DIAL-TIMING.md, "A staggered target"; the maintainer's question of 30 Oct 12:37: could we
 * allow a staggered spend, higher at the start, without impacting performance?). The plan's own spending bands (a target by
 * age; the solver plans each year against that year's band, src/solver/fast.js yr.scheduled) carry the stagger: the
 * household's target to age 75, then STEP of it from 76 (the go-go and slow-go years). The arm:
 *   STAG10  DIAL10 (the candidate at ten times the dislike of cuts, dial-timing.mjs) with that band, nothing else changed;
 * against DIAL10 and CAND (flat targets, their units), on the levers units' paths (seed 7002, 1,000).
 * Worker:  node stagger.mjs <levers unit dir> <dial unit dir> <id>...    (from the root of the code under test)
 * Read:    node stagger.mjs --read <levers unit dir> <dial unit dir>
 * The read: survival paired by path against DIAL10 and CAND; the spending in each retired year before any failure, in
 * pounds as a share of the household's own (flat) target, by band of years, the first retired year, and from age 76; the
 * years below 80% of that target.
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
const STEP_AGE = 76, STEP = Number(process.env.STEP || 0.85), TIMES = 10;
const args = process.argv.slice(2);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const arr = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const unitOf = (dir, id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));
const codeHash = () => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); };

if (args[0] !== '--read') {
  const M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
  const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
  const { armA } = await imp('research/solver/select-phase4.mjs');
  const { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
  const { withTable } = await imp('src/solver/bridge.js');
  const [dir, dialDir, ...ids] = args;
  if (!dir || !dialDir || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: stagger.mjs <levers unit dir> <dial unit dir> <id>...  |  --read <levers unit dir> <dial unit dir>'); process.exit(2); }
  const P = Object.fromEntries(readPanel().map(x => [x.id, x])), code = codeHash(), arm = `STAG${TIMES}`;
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  for (const id of ids) {
    const t0 = Date.now(), h = P[id], ref = unitOf(dialDir, id, 'dial10');
    const pk = JSON.parse(readFileSync(join(dir, `${id}-pick-app.json`), 'utf8'));
    if (armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy !== pk.decumulationPolicy) throw new Error(`${id}: APP's pick differs from the unit's`);
    const flat = solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy });
    if ((flat.spending.spendBands || []).length) throw new Error(`${id}: the plan has spending bands of its own`);
    const target = E.num(flat.spending.targetSpend, 0);
    const plan = { ...flat, spending: { ...flat.spending, spendBands: [{ id: 'stagger', fromAge: STEP_AGE, toAge: '', amount: Math.round(STEP * target) }] } };
    const r = C.solveCandidate(E, M, prep(plan), { lambda: LAMBDA * TIMES, points: CAND_PTS, bequestWeight: 0.02 });
    if (!r.meta.failDelivered || Math.abs(r.lambda - LAMBDA * TIMES) > 1e-15) throw new Error(`${id}: not the candidate at ${TIMES}x`);
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, N = ref.N, paths = E.pathsForSeed(ref.seed, N, T);
    // the band is what was asked: the target to 75, STEP of it from 76; and the plan is DIAL10's in every other input
    const sched = Array.from({ length: Y }, (_, t) => E.spendTargetAtAge(ctx, ctx.ageSelf0 + t));
    if (E.spendTargetAtAge(ctx, 75) !== target || E.spendTargetAtAge(ctx, 76) !== Math.round(STEP * target) || ctx.targetSpend !== target) throw new Error(`${id}: the band is not applied as asked`);
    const inputsFlat = inputsHash(E.buildContext(withTable({ ...r.m.ctx.plan, spending: { ...r.m.ctx.plan.spending, spendBands: [] } }, r)));
    const survived = new Uint8Array(N), level = new Uint8Array(N * Y), failYear = new Int16Array(N);
    let bad = 0;
    for (let k = 0; k < N; k++) {
      const zs = Float64Array.from(paths[k]), o = runPath(ctx, zs);
      survived[k] = o.survived ? 1 : 0; failYear[k] = o.failYear; level.set(o.level, k * Y);
      if (k < 100) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) bad++; }
    }
    if (bad) throw new Error(`${id}: runPath differs from E.runTrial on ${bad} of the first 100 paths`);
    const rec = { id, arm, times: TIMES, step: STEP, stepAge: STEP_AGE, code, inputs: inputsHash(ctx), inputsFlat, seed: ref.seed, N, Y, retireT: ref.retireT, ageSelf0: ctx.ageSelf0, target, sched, lambda: r.lambda,
      main: { survived: b64(survived), level: b64(level), failYear: b64(failYear) }, secs: (Date.now() - t0) / 1000 };
    writeFileSync(join(dialDir, `${id}-${arm.toLowerCase()}.json.gz`), gzipSync(JSON.stringify(rec)));
    console.log(`${id} ${arm}: survival ${(100 * survived.reduce((p, x) => p + x, 0) / N).toFixed(2)}% (DIAL10 flat ${(100 * arr(ref.main.survived, Uint8Array).reduce((p, x) => p + x, 0) / N).toFixed(2)}%); the inputs with the band removed ${inputsFlat === ref.inputs ? 'are DIAL10\'s' : 'DIFFER from DIAL10\'s'}; ${Math.round(rec.secs)} s; code ${code}`);
  }
} else {
  const [, dir, dialDir] = args;
  const ARMS = [['CAND', dir, 'cand'], ['DIAL10', dialDir, 'dial10'], ['STAG10', dialDir, 'stag10']];
  const BANDS = [[1, 5], [6, 10], [11, 20], [21, 99]];
  const pc = x => `${(100 * x).toFixed(0)}%`, f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), sg = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
  const fail = [], rows = Object.fromEntries(ARMS.map(([a]) => [a, []])), pairs = { vsDial: [], vsCand: [] };
  let step = null;
  const out = [];
  for (const id of IDS) {
    const us = Object.fromEntries(ARMS.map(([a, d, f]) => [a, unitOf(d, id, f)])), s = us.STAG10, Y = s.Y, N = s.N, retT = s.retireT;
    step = s.step;
    for (const [a] of ARMS) { const u = us[a]; if (u.seed !== s.seed || u.N !== N || u.Y !== Y || u.code !== s.code) fail.push(`${id} ${a}: seed, paths, years or code differ`); }
    if (s.inputsFlat !== us.DIAL10.inputs || us.CAND.inputs !== us.DIAL10.inputs) fail.push(`${id}: the inputs, the band set aside, differ`);
    const surv = Object.fromEntries(ARMS.map(([a]) => [a, arr(us[a].main.survived, Uint8Array)]));
    const pair = (x, y) => { let s1 = 0, s2 = 0, sv = 0, ls = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) sv++; if (d < 0) ls++; } const m = s1 / N; return { d: 100 * m, se: 100 * Math.sqrt((s2 / N - m * m) / N), sv, ls }; };
    const pD = pair(surv.STAG10, surv.DIAL10), pC = pair(surv.STAG10, surv.CAND);
    pairs.vsDial.push(pD); pairs.vsCand.push(pC);
    const parts = [];
    for (const [a] of ARMS) {
      const u = us[a], level = arr(u.main.level, Uint8Array), fy = arr(u.main.failYear, Int16Array);
      // the year's spend in pounds as a share of the flat target: the level is of that year's band (the flat target for CAND and DIAL10)
      const rel = t => (a === 'STAG10' ? s.sched[t] / s.target : 1);
      const band = BANDS.map(() => ({ n: 0, sum: 0, low: 0 })), late = { n: 0, sum: 0 };
      let open = 0, openN = 0;
      for (let k = 0; k < N; k++) {
        const end = fy[k] >= 0 ? fy[k] : Y;
        for (let t = retT; t < end; t++) {
          const lv = level[k * Y + t]; if (!lv) continue;
          const v = lv * rel(t), yr = t - retT + 1, b = BANDS.findIndex(([lo, hi]) => yr >= lo && yr <= hi);
          band[b].n++; band[b].sum += v; if (v < 80 - 1e-9) band[b].low++;
          if (s.ageSelf0 + t >= s.stepAge) { late.n++; late.sum += v; }
          if (t === retT) { openN++; open += v; }
        }
      }
      const r = { surv: 100 * surv[a].reduce((p, x) => p + x, 0) / N, open: openN ? open / openN : NaN, bands: band.map(x => ({ level: x.n ? x.sum / x.n : NaN, low: x.n ? x.low / x.n : NaN })), late: late.n ? late.sum / late.n : NaN };
      rows[a].push(r);
      parts.push(`${a} ${f1(r.surv)}%, first year ${f1(r.open)}%, by years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(r.bands[i].level)}%`).join(', ')}, from ${s.stepAge} ${f1(r.late)}%`);
    }
    out.push(`  ${id.padEnd(6)} (age ${s.ageSelf0}, retired year 1 at ${s.ageSelf0 + retT}) ${parts.join('\n         ')}\n         STAG10 less DIAL10 ${sg(pD.d)} (se ${pD.se.toFixed(2)}; ${pD.sv}/${pD.ls}); less CAND ${sg(pC.d)} (se ${pC.se.toFixed(2)}; ${pC.sv}/${pC.ls})`);
  }
  const mean = (xs, f) => { const v = xs.map(f).filter(Number.isFinite); return v.length ? v.reduce((p, x) => p + x, 0) / v.length : NaN; };
  const pool = xs => { const d = xs.reduce((p, x) => p + x.d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x.se ** 2, 0)) / xs.length; return `${sg(d)} (se ${se.toFixed(2)}; ${sg(d - 1.96 * se)} to ${sg(d + 1.96 * se)})`; };
  const head = [`A STAGGERED TARGET (EXPLORATORY): the target to age 75, ${Math.round(100 * step)}% of it from 76, at ten times the dislike of cuts (STAG10), against the flat target at ten times (DIAL10) and at one (CAND); the eight households, seed 7002, 1,000 paths each; spending in pounds as a share of the household's own target, in the retired years before any failure`];
  const pooled = ['', 'Pooled, each household once:'];
  for (const [a] of ARMS) pooled.push(`  ${a.padEnd(7)} survival ${f1(mean(rows[a], x => x.surv))}%; the first retired year ${f1(mean(rows[a], x => x.open))}%; by retired years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(mean(rows[a], x => x.bands[i].level))}%`).join(', ')}; from age ${STEP_AGE} ${f1(mean(rows[a], x => x.late))}%; years below 80% of the target ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${pc(mean(rows[a], x => x.bands[i].low))}`).join(', ')}`);
  pooled.push(`  STAG10 less DIAL10, survival ${pool(pairs.vsDial)}; STAG10 less CAND ${pool(pairs.vsCand)}`);
  pooled.push(fail.length ? `NOT FAIR: ${fail.join('; ')}` : 'FAIR: one seed, path count, years and code; every arm\'s inputs the same with the band set aside');
  console.log([...head, ...out, ...pooled].join('\n'));
  process.exit(fail.length ? 1 : 0);
}
