/*
 * WHEN THE CUTS COME (EXPLORATORY; DIAL-TIMING.md; the maintainer's question of 30 Oct 11:28: at ten times the dislike of
 * cuts, do the cuts still come early in the plan, or do they follow the guardrails' pattern of a cut after a bad year?).
 * Three arms on the eight households of the review, seed 7002, the levers units' 1,000 paths:
 *   APP     the app's rules with its guardrails (Phase 4's arm A), the levers unit;
 *   CAND    the candidate (failDelivered on, D43; the dial at one), the levers unit;
 *   DIAL10  the candidate with ten times the dislike of cuts, nothing else changed: the agent's DIAL10
 *           (research/solver/audit-curve.mjs armOf), built here as levers-audit.mjs builds CAND, lambda times ten.
 * Worker:  node dial-timing.mjs <levers unit dir> <out dir> <id>...      (from the root of the code under test)
 *          DIAL_TIMES=1 runs the same at one, which must reproduce the levers CAND unit bit for bit (the harness's check).
 * Read:    node dial-timing.mjs --read <levers unit dir> <out dir>       (from the root of the code under test)
 * The read, in each household's retired years before any failure: the level of spending by band of years (1-5, 6-10,
 * 11-20, 21 on), the share of years below the target and at the floor; the opening level; and the cuts after the first
 * retired year (a year below target lower than the year before), against the market of the year before the decision
 * (its shock, in thirds over the household's retired decision years): how many follow the worst third, the cut rate after
 * the worst third and after the best, and their depth.
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'];
const args = process.argv.slice(2);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const arr = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const codeHash = () => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); };
const unitOf = (dir, id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));

if (args[0] !== '--read') {
  const M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
  const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
  const { armA } = await imp('research/solver/select-phase4.mjs');
  const { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
  const { withTable } = await imp('src/solver/bridge.js');
  const [dir, OUT, ...ids] = args, TIMES = Number(process.env.DIAL_TIMES || 10), arm = TIMES === 1 ? 'CAND1' : `DIAL${TIMES}`;
  if (!dir || !OUT || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: dial-timing.mjs <levers unit dir> <out dir> <id>...  |  --read <levers unit dir> <out dir>'); process.exit(2); }
  mkdirSync(OUT, { recursive: true });
  const P = Object.fromEntries(readPanel().map(x => [x.id, x])), code = codeHash();
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  for (const id of ids) {
    const t0 = Date.now(), h = P[id], ref = unitOf(dir, id, 'cand');
    // as levers-audit.mjs builds CAND: the household's own plan under APP's policy name, the candidate, lambda times TIMES
    const pk = JSON.parse(readFileSync(join(dir, `${id}-pick-app.json`), 'utf8'));
    const a = armA(appPlan(h.plan), { tournament: false });
    if (a.planState.spending.decumulationPolicy !== pk.decumulationPolicy) throw new Error(`${id}: APP's pick differs from the unit's`);
    const r = C.solveCandidate(E, M, prep(solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy })), { lambda: LAMBDA * TIMES, points: CAND_PTS, bequestWeight: 0.02 });
    const levels = [...new Set(r.levelOf)].sort((x, y) => x - y);
    if (!r.meta.failDelivered || Math.abs(r.lambda - LAMBDA * TIMES) > 1e-15 || !(levels.some(l => l < 1) && levels.some(l => l > 1))) throw new Error(`${id}: not the candidate at ${TIMES}x: lambda ${r.lambda}, failDelivered ${r.meta.failDelivered}, levels ${levels}`);
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, N = ref.N, paths = E.pathsForSeed(ref.seed, N, T);
    const survived = new Uint8Array(N), level = new Uint8Array(N * Y), failYear = new Int16Array(N);
    let bad = 0;
    for (let k = 0; k < N; k++) {
      const zs = Float64Array.from(paths[k]), o = runPath(ctx, zs);
      survived[k] = o.survived ? 1 : 0; failYear[k] = o.failYear; level.set(o.level, k * Y);
      if (k < 100) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) bad++; }
    }
    if (bad) throw new Error(`${id}: runPath differs from E.runTrial on ${bad} of the first 100 paths`);
    const rec = { id, arm, times: TIMES, code, inputs: inputsHash(ctx), seed: ref.seed, N, Y, retireT: ref.retireT, lambda: r.lambda, levels, failDelivered: r.meta.failDelivered,
      main: { survived: b64(survived), level: b64(level), failYear: b64(failYear) }, secs: (Date.now() - t0) / 1000 };
    if (TIMES === 1) {
      // the harness's check: at one it must be the levers CAND unit, path for path and year for year
      const same = b64(survived) === ref.main.survived && b64(level) === ref.main.level && b64(failYear) === ref.main.failYear && rec.inputs === ref.inputs && code === ref.code;
      console.log(`${id} ${arm}: ${same ? 'THE SAME as the levers CAND unit' : 'DIFFERS from the levers CAND unit'} (survival ${(100 * survived.reduce((p, x) => p + x, 0) / N).toFixed(2)}%); ${Math.round(rec.secs)} s`);
      if (!same) process.exitCode = 1;
      continue;
    }
    writeFileSync(join(OUT, `${id}-${arm.toLowerCase()}.json.gz`), gzipSync(JSON.stringify(rec)));
    console.log(`${id} ${arm}: survival ${(100 * survived.reduce((p, x) => p + x, 0) / N).toFixed(2)}%; levels ${levels.join(',')}; ${Math.round(rec.secs)} s; code ${code}`);
  }
} else {
  const [, dir, OUT] = args;
  const ARMS = [['APP', dir, 'app'], ['CAND', dir, 'cand'], ['DIAL10', OUT, 'dial10']];
  const BANDS = [[1, 5], [6, 10], [11, 20], [21, 99]];
  const pc = x => `${(100 * x).toFixed(0)}%`, f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-');
  const out = ["WHEN THE CUTS COME (EXPLORATORY): the app's guardrails (APP), the candidate (CAND, the dial at one) and the dial at ten (DIAL10), the eight households, seed 7002, 1,000 paths each; retired years before any failure"];
  const fail = [], pooled = Object.fromEntries(ARMS.map(([a]) => [a, []]));
  for (const id of IDS) {
    const us = Object.fromEntries(ARMS.map(([a, d, f]) => [a, unitOf(d, id, f)]));
    const u0 = us.CAND, Y = u0.Y, T = Y - 1, N = u0.N, retT = u0.retireT;
    // the fair test: one seed, path count, years, code and inputs (APP hashed as the levers read hashes it)
    for (const [a] of ARMS) { const u = us[a]; if (u.seed !== u0.seed || u.N !== N || u.Y !== Y || u.code !== u0.code || u.inputs !== u0.inputs) fail.push(`${id} ${a}: seed ${u.seed}, N ${u.N}, Y ${u.Y}, code ${u.code}, inputs ${u.inputs} against CAND's ${u0.seed}, ${N}, ${Y}, ${u0.code}, ${u0.inputs}`); }
    const paths = E.pathsForSeed(u0.seed, N, T);
    const line = [];
    for (const [a] of ARMS) {
      const u = us[a], level = arr(u.main.level, Uint8Array), fy = arr(u.main.failYear, Int16Array);
      const band = BANDS.map(() => ({ n: 0, sum: 0, below: 0, floor: 0 }));
      const dec = [];   // each retired decision after the first: the level, the year before's, the shock of the year before
      let open = 0, openBelow = 0, openN = 0;
      for (let k = 0; k < N; k++) {
        const end = fy[k] >= 0 ? fy[k] : Y;   // the years before the failure year
        for (let t = retT; t < end; t++) {
          const lv = level[k * Y + t]; if (!lv) continue;
          const yr = t - retT + 1, b = BANDS.findIndex(([lo, hi]) => yr >= lo && yr <= hi);
          band[b].n++; band[b].sum += lv; if (lv < 100) band[b].below++; if (lv <= 80) band[b].floor++;
          if (t === retT) { openN++; open += lv; if (lv < 100) openBelow++; }
          else { const prev = level[k * Y + t - 1]; if (prev) dec.push({ lv, prev, z: paths[k][t - 1] }); }
        }
      }
      const zs = dec.map(d => d.z).sort((x, y) => x - y), lo = zs[Math.floor(zs.length / 3)], hi = zs[Math.floor(2 * zs.length / 3)];
      const isCut = d => d.lv < d.prev && d.lv < 100;
      const cuts = dec.filter(isCut), after = f => dec.filter(f), rate = ds => (ds.length ? ds.filter(isCut).length / ds.length : NaN);
      const depth = ds => { const c = ds.filter(isCut); return c.length ? c.reduce((p, d) => p + (d.prev - d.lv), 0) / c.length : NaN; };
      const r = { bands: band.map(x => ({ level: x.n ? x.sum / x.n : NaN, below: x.n ? x.below / x.n : NaN, floor: x.n ? x.floor / x.n : NaN })), open: openN ? open / openN : NaN, openBelow: openN ? openBelow / openN : NaN,
        cutsPer100: dec.length ? 100 * cuts.length / dec.length : NaN, afterWorst: cuts.length ? cuts.filter(d => d.z <= lo).length / cuts.length : NaN,
        rateWorst: rate(after(d => d.z <= lo)), rateBest: rate(after(d => d.z >= hi)), depthWorst: depth(after(d => d.z <= lo)), depthBest: depth(after(d => d.z >= hi)), cuts: cuts.length };
      pooled[a].push(r);
      line.push(`${a} opening ${f1(r.open)}% (below target ${pc(r.openBelow)}); by years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(r.bands[i].level)}%`).join(', ')}; cuts after year 1: ${r.cuts}, ${pc(r.afterWorst)} after the worst third of years, rate ${pc(r.rateWorst)} after the worst against ${pc(r.rateBest)} after the best`);
    }
    out.push(`  ${id.padEnd(6)} ${line.join('\n         ')}`);
  }
  const mean = (xs, f) => { const v = xs.map(f).filter(Number.isFinite); return v.length ? v.reduce((p, x) => p + x, 0) / v.length : NaN; };
  out.push('');
  out.push('Pooled, each household once (households with no cut in a measure left out of its mean):');
  for (const [a] of ARMS) {
    const xs = pooled[a];
    out.push(`  ${a.padEnd(7)} the first retired year ${f1(mean(xs, x => x.open))}% of target, below target on ${pc(mean(xs, x => x.openBelow))} of paths`);
    out.push(`          the level by retired years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(mean(xs, x => x.bands[i].level))}%`).join(', ')}`);
    out.push(`          years below target ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${pc(mean(xs, x => x.bands[i].below))}`).join(', ')}; at the floor ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${pc(mean(xs, x => x.bands[i].floor))}`).join(', ')}`);
    out.push(`          cuts after the first year: ${f1(mean(xs, x => x.cutsPer100))} a hundred years; ${pc(mean(xs, x => x.afterWorst))} of them after the worst third of market years (a third by chance); the chance of a cut after the worst third ${pc(mean(xs, x => x.rateWorst))}, after the best ${pc(mean(xs, x => x.rateBest))}; the mean cut ${f1(mean(xs, x => x.depthWorst))} points of target after the worst, ${f1(mean(xs, x => x.depthBest))} after the best`);
  }
  out.push(fail.length ? `NOT FAIR: ${fail.join('; ')}` : 'FAIR: every household\'s three arms on one seed, path count, code and inputs');
  console.log(out.join('\n'));
  process.exit(fail.length ? 1 : 0);
}
