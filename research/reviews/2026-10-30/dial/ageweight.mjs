/*
 * AGE-WEIGHTED CUTS AT TEN TIMES (EXPLORATORY; AGE-WEIGHT.md; the maintainer, 30 Oct 13:12 and 13:15: a way of handling cuts
 * and raises that is disconnected from the tiers' risk-taking and dislikes cuts more when younger). On the patched code
 * (dial/solve-ageweight.patch, a local worktree), each of the eight households is solved as dial-timing.mjs solves DIAL10
 * (the levers harness's CAND, lambda times ten):
 *   DIAL10   ageWeight off: must be the DIAL10 unit (dial-timing.mjs, the original code) on every path, year and failure;
 *   DIAL10M  ageWeight { mode 90, disp 9 }: each year's cut cost and raise credit weighted by the chance of being alive.
 * Each is executed by the engine on the levers units' 1,000 paths (seed 7002), runPath held to E.runTrial on the first 100,
 * and the pension and ISA's equity share recorded by year on the first 200 (runPolicy, as levers-audit.mjs records it).
 * Worker:  node ageweight.mjs <levers unit dir> <dial unit dir> <id>...      (from the root of the patched code)
 * Read:    node ageweight.mjs --read <levers unit dir> <dial unit dir>
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'], AW = { mode: 90, disp: 9 }, TIMES = 10, BESIDE = 200;
const args = process.argv.slice(2);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const arr = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const unitOf = (dir, id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));
const codeHash = () => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); };

if (args[0] !== '--read') {
  const M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs'), S = await imp('src/solver/solve.js');
  const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
  const { armA } = await imp('research/solver/select-phase4.mjs');
  const { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
  const { withTable } = await imp('src/solver/bridge.js');
  const [dir, dialDir, ...ids] = args;
  if (!dir || !dialDir || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: ageweight.mjs <levers unit dir> <dial unit dir> <id>...  |  --read <levers unit dir> <dial unit dir>'); process.exit(2); }
  const P = Object.fromEntries(readPanel().map(x => [x.id, x])), code = codeHash();
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  for (const id of ids) {
    const h = P[id], ref = unitOf(dialDir, id, 'dial10'), pk = JSON.parse(readFileSync(join(dir, `${id}-pick-app.json`), 'utf8'));
    if (armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy !== pk.decumulationPolicy) throw new Error(`${id}: APP's pick differs from the unit's`);
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy }));
    for (const arm of ['DIAL10', 'DIAL10M']) {
      const t0 = Date.now();
      const r = C.solveCandidate(E, M, plan, { lambda: LAMBDA * TIMES, points: CAND_PTS, bequestWeight: 0.02, ...(arm === 'DIAL10M' ? { ageWeight: AW } : {}) });
      if (!r.meta.failDelivered || Math.abs(r.lambda - LAMBDA * TIMES) > 1e-15 || (arm === 'DIAL10M') !== !!r.meta.ageWeight) throw new Error(`${id} ${arm}: not as asked (lambda ${r.lambda}, failDelivered ${r.meta.failDelivered}, ageWeight ${JSON.stringify(r.meta.ageWeight)})`);
      const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, N = ref.N, paths = E.pathsForSeed(ref.seed, N, T);
      const survived = new Uint8Array(N), level = new Uint8Array(N * Y), failYear = new Int16Array(N);
      let bad = 0;
      for (let k = 0; k < N; k++) {
        const zs = Float64Array.from(paths[k]), o = runPath(ctx, zs);
        survived[k] = o.survived ? 1 : 0; failYear[k] = o.failYear; level.set(o.level, k * Y);
        if (k < 100) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) bad++; }
      }
      if (bad) throw new Error(`${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first 100 paths`);
      // the pension and ISA's equity share the policy holds, by year, on the first BESIDE paths (levers-audit.mjs's record)
      const eq = new Float64Array(Y), en = new Float64Array(Y);
      for (let k = 0; k < Math.min(N, BESIDE); k++) S.runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held) => { const e = r.c.tiers.pen[held.pen].equity * s[0] + r.c.tiers.isa[held.isa].equity * s[1], wt = s[0] + s[1]; if (wt > 0 && t < Y) { eq[t] += e / wt; en[t]++; } } });
      const tierYears = Array.from(eq, (x, t) => (en[t] ? +(x / en[t]).toFixed(4) : null));
      const main = { survived: b64(survived), level: b64(level), failYear: b64(failYear) };
      const rec = { id, arm, code, inputs: inputsHash(ctx), seed: ref.seed, N, Y, retireT: ref.retireT, lambda: r.lambda, ageWeight: r.meta.ageWeight || null, tierYears, main, secs: (Date.now() - t0) / 1000 };
      if (arm === 'DIAL10') {
        const same = main.survived === ref.main.survived && main.level === ref.main.level && main.failYear === ref.main.failYear && rec.inputs === ref.inputs;
        rec.identity = same;
        console.log(`${id} DIAL10 on the patched code, the option off: ${same ? 'THE SAME as the DIAL10 unit on every path, year and failure' : 'DIFFERS from the DIAL10 unit'}; ${Math.round(rec.secs)} s`);
        if (!same) process.exitCode = 1;
      } else console.log(`${id} DIAL10M: survival ${(100 * survived.reduce((p, x) => p + x, 0) / N).toFixed(2)}% (DIAL10 ${(100 * arr(ref.main.survived, Uint8Array).reduce((p, x) => p + x, 0) / N).toFixed(2)}%); ${Math.round(rec.secs)} s; code ${code}`);
      writeFileSync(join(dialDir, `${id}-${arm === 'DIAL10' ? 'dial10eq' : 'dial10m'}.json.gz`), gzipSync(JSON.stringify(rec)));
    }
  }
} else {
  const [, dir, dialDir] = args;
  const ARMS = [['APP', dir, 'app'], ['CAND', dir, 'cand'], ['DIAL10', dialDir, 'dial10eq'], ['DIAL10M', dialDir, 'dial10m']];
  const BANDS = [[1, 5], [6, 10], [11, 20], [21, 99]], EQ_YEARS = [1, 5, 10, 20];
  const pc = x => `${(100 * x).toFixed(0)}%`, f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), sg = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
  const fail = [], rows = Object.fromEntries(ARMS.map(([a]) => [a, []])), pairs = { vsDial: [], vsCand: [] };
  const out = ["AGE-WEIGHTED CUTS AT TEN TIMES (EXPLORATORY): DIAL10M (each year's cut cost and raise credit weighted by the chance of being alive, Gompertz mode 90, dispersion 9) against DIAL10, the candidate (CAND, the dial at one) and the app's guardrails (APP); the eight households, seed 7002, 1,000 paths each; the retired years before any failure"];
  for (const id of IDS) {
    const us = Object.fromEntries(ARMS.map(([a, d, f]) => [a, unitOf(d, id, f)])), u0 = us.DIAL10M, Y = u0.Y, N = u0.N, retT = u0.retireT;
    for (const [a] of ARMS) { const u = us[a]; if (u.seed !== u0.seed || u.N !== N || u.Y !== Y || u.inputs !== u0.inputs) fail.push(`${id} ${a}: seed, paths, years or inputs differ`); }
    if (us.DIAL10.code !== u0.code || us.CAND.code !== us.APP.code) fail.push(`${id}: the codes are not as declared`);
    if (us.DIAL10.identity !== true) fail.push(`${id}: DIAL10 on the patched code is not the DIAL10 unit`);
    const surv = Object.fromEntries(ARMS.map(([a]) => [a, arr(us[a].main.survived, Uint8Array)]));
    const pair = (x, y) => { let s1 = 0, s2 = 0, sv = 0, ls = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) sv++; if (d < 0) ls++; } const m = s1 / N; return { d: 100 * m, se: 100 * Math.sqrt((s2 / N - m * m) / N), sv, ls }; };
    const pD = pair(surv.DIAL10M, surv.DIAL10), pC = pair(surv.DIAL10M, surv.CAND);
    pairs.vsDial.push(pD); pairs.vsCand.push(pC);
    const paths = E.pathsForSeed(u0.seed, N, Y - 1);
    const parts = [];
    for (const [a] of ARMS) {
      const u = us[a], level = arr(u.main.level, Uint8Array), fy = arr(u.main.failYear, Int16Array);
      const band = BANDS.map(() => ({ n: 0, sum: 0, floor: 0 })), dec = [];
      let open = 0, openN = 0;
      for (let k = 0; k < N; k++) {
        const end = fy[k] >= 0 ? fy[k] : Y;
        for (let t = retT; t < end; t++) {
          const lv = level[k * Y + t]; if (!lv) continue;
          const yr = t - retT + 1, b = BANDS.findIndex(([lo, hi]) => yr >= lo && yr <= hi);
          band[b].n++; band[b].sum += lv; if (lv <= 80) band[b].floor++;
          if (t === retT) { openN++; open += lv; } else { const prev = level[k * Y + t - 1]; if (prev) dec.push({ lv, prev, z: paths[k][t - 1] }); }
        }
      }
      const zs = dec.map(d => d.z).sort((x, y) => x - y), lo = zs[Math.floor(zs.length / 3)];
      const cuts = dec.filter(d => d.lv < d.prev && d.lv < 100);
      const eqAt = yr => (u.tierYears && u.tierYears[retT + yr - 1] !== null && u.tierYears[retT + yr - 1] !== undefined ? 100 * u.tierYears[retT + yr - 1] : NaN);
      const r = { surv: 100 * surv[a].reduce((p, x) => p + x, 0) / N, open: openN ? open / openN : NaN, bands: band.map(x => ({ level: x.n ? x.sum / x.n : NaN, floor: x.n ? x.floor / x.n : NaN })),
        afterWorst: cuts.length ? cuts.filter(d => d.z <= lo).length / cuts.length : NaN, cutsPer100: dec.length ? 100 * cuts.length / dec.length : NaN, eq: EQ_YEARS.map(eqAt), retired0: retT === 0 };
      rows[a].push(r);
      parts.push(`${a} ${f1(r.surv)}%, first year ${f1(r.open)}%, by years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(r.bands[i].level)}%`).join(', ')}${a === 'APP' ? '' : `; equity at retired years ${EQ_YEARS.join(', ')}: ${r.eq.map(f1).join(' / ')}%`}`);
    }
    out.push(`  ${id.padEnd(6)} ${parts.join('\n         ')}\n         DIAL10M less DIAL10 ${sg(pD.d)} (se ${pD.se.toFixed(2)}; ${pD.sv}/${pD.ls}); less CAND ${sg(pC.d)} (se ${pC.se.toFixed(2)}; ${pC.sv}/${pC.ls})`);
  }
  const mean = (xs, f) => { const v = xs.map(f).filter(Number.isFinite); return v.length ? v.reduce((p, x) => p + x, 0) / v.length : NaN; };
  const pool = xs => { const d = xs.reduce((p, x) => p + x.d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x.se ** 2, 0)) / xs.length; return `${sg(d)} (se ${se.toFixed(2)}; ${sg(d - 1.96 * se)} to ${sg(d + 1.96 * se)})`; };
  out.push('', 'Pooled, each household once (the retirees: the four retired at the start):');
  for (const [a] of ARMS) {
    const xs = rows[a], ret = xs.filter(x => x.retired0);
    out.push(`  ${a.padEnd(8)} survival ${f1(mean(xs, x => x.surv))}%; the first retired year ${f1(mean(xs, x => x.open))}% (the retirees ${f1(mean(ret, x => x.open))}%); by retired years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(mean(xs, x => x.bands[i].level))}%`).join(', ')}; at the floor ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${pc(mean(xs, x => x.bands[i].floor))}`).join(', ')}; cuts after year 1 ${f1(mean(xs, x => x.cutsPer100))} a hundred years, ${pc(mean(xs, x => x.afterWorst))} after the worst third of market years${a === 'APP' ? '' : `; the pension and ISA's equity share at retired years ${EQ_YEARS.join(', ')} ${EQ_YEARS.map((_, i) => f1(mean(xs, x => x.eq[i]))).join(' / ')}% (the retirees ${EQ_YEARS.map((_, i) => f1(mean(ret, x => x.eq[i]))).join(' / ')}%)`}`);
  }
  out.push(`  DIAL10M less DIAL10, survival ${pool(pairs.vsDial)}; DIAL10M less CAND ${pool(pairs.vsCand)}`);
  out.push(fail.length ? `NOT FAIR: ${fail.join('; ')}` : 'FAIR: one seed, path count, years and inputs; DIAL10 on the patched code the DIAL10 unit on every household');
  console.log(out.join('\n'));
  process.exit(fail.length ? 1 : 0);
}
