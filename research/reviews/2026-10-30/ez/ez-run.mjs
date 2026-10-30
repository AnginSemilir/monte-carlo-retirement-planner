/*
 * EPSTEIN-ZIN SPENDING ON THE REVIEW'S EIGHT HOUSEHOLDS (EXPLORATORY; EZ.md section 6). On the patched code (ez/solve-ez.patch
 * on the agent's a0e6400, a local worktree), each household is solved as the levers harness solves CAND (levers-audit.mjs:
 * the candidate's settings at its points, the estate weight 0.02, the plan under APP's pick), and:
 *   CANDEQ  EZ off: must be the CAND unit (the levers harness, on the agent's 1b39400) on every path's survival, failure year,
 *           yearly level, spending delivered, unmet, estate and end wealth, and its inputs; the patch's identity at full scale
 *           and across the agent's four commits since;
 *   EZ      EZ on, { gamma, rho } as given (mortality Gompertz mode 90, dispersion 9; ruinMin 0.1; beta 1), on the layer loop
 *           (tsOnce: false), every other setting the candidate's.
 * Each is executed by the engine on the levers units' 1,000 paths (seed 7002), runPath held to E.runTrial on the first 100,
 * and the pension and ISA's equity share recorded by year on the first 200 (runPolicy's visit, as levers-audit.mjs).
 * Worker:  node ez-run.mjs <levers unit dir> <ez unit dir> --gamma G --rho R [--points P] [--no-identity] <id>...
 *          (from the root of the patched code; --points only for a calibration look, never the run)
 * Read:    node ez-run.mjs --read <levers unit dir> <dial unit dir> <ez unit dir> --gamma G --rho R
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'], BESIDE = 200, CHECK = 100, W = 0.02;
const argv = process.argv.slice(2), flag = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const GAMMA = Number(flag('--gamma')), RHO = Number(flag('--rho')), PTS = flag('--points') ? Number(flag('--points')) : null;
const pos = argv.filter((x, i) => !x.startsWith('--') && !['--gamma', '--rho', '--points'].includes(argv[i - 1]));
if (!(GAMMA > 0) || !(RHO > 0)) { console.error('ez-run: --gamma and --rho are required'); process.exit(2); }
const TAG = `ez-g${GAMMA}-r${RHO}${PTS ? `-p${PTS}` : ''}`;
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const arr = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const unitOf = (dir, id, arm) => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${arm}.json.gz`))));
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, wealth: Float32Array, failYear: Int16Array, level: Uint8Array };
const codeHash = () => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/engine.mjs')); h.update(readFileSync('research/solver/candidate.json')); return h.digest('hex').slice(0, 12); };

if (argv[0] !== '--read') {
  const M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs'), S = await imp('src/solver/solve.js');
  const { readPanel, appPlan } = await imp('research/solver/phase4-panel.mjs');
  const { armA } = await imp('research/solver/select-phase4.mjs');
  const { runPath, solverPlanOf, inputsHash, LAMBDA, CAND_PTS } = await imp('research/solver/audit-phase4.mjs');
  const { withTable } = await imp('src/solver/bridge.js');
  const [dir, ezDir, ...ids] = pos;
  if (!dir || !ezDir || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: ez-run.mjs <levers unit dir> <ez unit dir> --gamma G --rho R [--points P] [--no-identity] <id>...'); process.exit(2); }
  const P = Object.fromEntries(readPanel().map(x => [x.id, x])), code = codeHash(), identity = !argv.includes('--no-identity') && !PTS;
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  for (const id of ids) {
    const h = P[id], ref = unitOf(dir, id, 'cand'), pk = JSON.parse(readFileSync(join(dir, `${id}-pick-app.json`), 'utf8'));
    if (armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy !== pk.decumulationPolicy) throw new Error(`${id}: APP's pick differs from the unit's`);
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy }));
    for (const arm of identity ? ['CANDEQ', 'EZ'] : ['EZ']) {
      const t0 = Date.now(), ez = { gamma: GAMMA, rho: RHO };
      const r = C.solveCandidate(E, M, structuredClone(plan), { lambda: LAMBDA, points: PTS || CAND_PTS, bequestWeight: W, ...(arm === 'EZ' ? { tsOnce: false, ez } : {}) });
      const okEz = arm === 'EZ' ? r.meta.ez && r.meta.ez.gamma === GAMMA && r.meta.ez.rho === RHO && r.meta.ez.mortality.mode === 90 && r.meta.ez.ruinMin === 0.1 && r.meta.tsOnce === false : r.meta.ez === undefined && r.ez === null;
      if (!r.meta.failDelivered || Math.abs(r.lambda - LAMBDA) > 1e-15 || !okEz) throw new Error(`${id} ${arm}: not as asked (lambda ${r.lambda}, failDelivered ${r.meta.failDelivered}, ez ${JSON.stringify(r.meta.ez)}, tsOnce ${r.meta.tsOnce})`);
      const secs = (Date.now() - t0) / 1000;
      const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, N = ref.N, paths = E.pathsForSeed(ref.seed, N, T);
      if (Y !== ref.Y) throw new Error(`${id} ${arm}: ${Y} years against the unit's ${ref.Y}`);
      const out = Object.fromEntries(Object.entries(TYPES).map(([k, Ty]) => [k, new Ty(k === 'level' ? N * Y : N)]));
      let bad = 0;
      for (let k = 0; k < N; k++) {
        const zs = Float64Array.from(paths[k]), o = runPath(ctx, zs);
        out.survived[k] = o.survived ? 1 : 0; out.delivered[k] = o.delivered; out.unmet[k] = o.unmet; out.estate[k] = o.estate; out.wealth[k] = o.wealth; out.failYear[k] = o.failYear; out.level.set(o.level, k * Y);
        if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== o.survived || q.unmetTotal !== o.unmet) bad++; }
      }
      if (bad) throw new Error(`${id} ${arm}: runPath differs from E.runTrial on ${bad} of the first ${CHECK} paths`);
      // the pension and ISA's equity share the policy holds, by year, on the first BESIDE paths (levers-audit.mjs's record: the
      // tiers held entering each year, so the read takes year t's move from t + 1)
      const eq = new Float64Array(Y), en = new Float64Array(Y);
      let engineOnly = 0, policyOnly = 0;
      for (let k = 0; k < Math.min(N, BESIDE); k++) {
        const p = S.runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held) => { const e = r.c.tiers.pen[held.pen].equity * s[0] + r.c.tiers.isa[held.isa].equity * s[1], wt = s[0] + s[1]; if (wt > 0 && t < Y) { eq[t] += e / wt; en[t]++; } } }).survived ? 1 : 0;
        if (out.survived[k] && !p) engineOnly++; if (p && !out.survived[k]) policyOnly++;
      }
      const tierYears = Array.from(eq, (x, t) => (en[t] ? +(x / en[t]).toFixed(4) : null));
      const main = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, b64(v)]));
      const rec = { id, arm, code, inputs: inputsHash(ctx), seed: ref.seed, N, Y, retireT: ref.retireT, lambda: r.lambda, ez: r.meta.ez || null, points: r.g.np, tierYears, beside: { N: Math.min(N, BESIDE), engineOnly, policyOnly }, main, secs, engineSecs: (Date.now() - t0) / 1000 - secs };
      const surv = 100 * out.survived.reduce((p, x) => p + x, 0) / N, refSurv = 100 * arr(ref.main.survived, Uint8Array).reduce((p, x) => p + x, 0) / N;
      if (arm === 'CANDEQ') {
        const diff = Object.keys(TYPES).filter(k => main[k] !== ref.main[k]);
        rec.identity = diff.length === 0 && rec.inputs === ref.inputs;
        console.log(`${id} CANDEQ on the patched code, EZ off: ${rec.identity ? 'THE SAME as the CAND unit on every path (survival, failure year, level, delivered, unmet, estate, wealth) and its inputs' : `DIFFERS from the CAND unit (${diff.join(', ') || 'inputs'})`}; solve ${Math.round(secs)} s`);
        if (!rec.identity) process.exitCode = 1;
      } else console.log(`${id} ${TAG}: survival ${surv.toFixed(2)}% (CAND ${refSurv.toFixed(2)}%); the first retired year's move's equity ${tierYears[ref.retireT + 1] === null ? '-' : (100 * tierYears[ref.retireT + 1]).toFixed(1)}% (CAND ${ref.tierYears && ref.tierYears[ref.retireT + 1] !== null ? (100 * ref.tierYears[ref.retireT + 1]).toFixed(1) : '-'}%); beside: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${Math.min(N, BESIDE)}; solve ${Math.round(secs)} s; code ${code}`);
      writeFileSync(join(ezDir, `${id}-${arm === 'CANDEQ' ? 'candeq' : TAG}.json.gz`), gzipSync(JSON.stringify(rec)));
    }
  }
} else {
  const [dir, dialDir, ezDir] = pos;
  const ARMS = [['APP', dir, 'app'], ['CAND', dir, 'cand'], ['DIAL10', dialDir, 'dial10eq'], ['DIAL10M', dialDir, 'dial10m'], ['EZ', ezDir, TAG]];
  const BANDS = [[1, 5], [6, 10], [11, 20], [21, 99]], EQ_YEARS = [1, 5, 10, 20];
  const pc = x => `${(100 * x).toFixed(0)}%`, f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), sg = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
  const fail = [], rows = Object.fromEntries(ARMS.map(([a]) => [a, []])), pairs = { vsCand: [], vsDial: [], vsDialM: [] }, est = [];
  const out = [`EPSTEIN-ZIN SPENDING (EXPLORATORY): EZ (gamma ${GAMMA}, rho ${RHO}; each year weighted by the chance of being alive, Gompertz mode 90, dispersion 9; running out lived on the guaranteed income) against the candidate (CAND, the dial at one), the dial at ten (DIAL10) and with age weights (DIAL10M), and the app's guardrails (APP); the eight households, seed 7002, 1,000 paths each; the retired years before any failure`];
  for (const id of IDS) {
    if (!existsSync(join(ezDir, `${id}-${TAG}.json.gz`))) { fail.push(`${id}: no ${TAG} unit`); continue; }
    const us = Object.fromEntries(ARMS.map(([a, d, f]) => [a, unitOf(d, id, f)])), u0 = us.EZ, Y = u0.Y, N = u0.N, retT = u0.retireT;
    for (const [a] of ARMS) { const u = us[a]; if (u.seed !== u0.seed || u.N !== N || u.Y !== Y || u.inputs !== u0.inputs) fail.push(`${id} ${a}: seed, paths, years or inputs differ`); }
    const eqUnit = existsSync(join(ezDir, `${id}-candeq.json.gz`)) ? unitOf(ezDir, id, 'candeq') : null;
    if (!eqUnit || eqUnit.identity !== true || eqUnit.code !== u0.code) fail.push(`${id}: CAND on the patched code is not shown the CAND unit`);
    if (us.DIAL10.identity !== true) fail.push(`${id}: DIAL10 on the age-weight code is not the DIAL10 unit`);
    const surv = Object.fromEntries(ARMS.map(([a]) => [a, arr(us[a].main.survived, Uint8Array)]));
    const pair = (x, y) => { let s1 = 0, s2 = 0, sv = 0, ls = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) sv++; if (d < 0) ls++; } const m = s1 / N; return { d: 100 * m, se: 100 * Math.sqrt((s2 / N - m * m) / N), sv, ls }; };
    const pC = pair(surv.EZ, surv.CAND), pD = pair(surv.EZ, surv.DIAL10), pM = pair(surv.EZ, surv.DIAL10M);
    pairs.vsCand.push(pC); pairs.vsDial.push(pD); pairs.vsDialM.push(pM);
    // the estate (the engine's, after the pension's death tax), EZ against CAND, its mean over the paths each survives
    const eE = arr(u0.main.estate, Float32Array), eC = arr(us.CAND.main.estate, Float32Array);
    const mE = (e, s) => { let a = 0, n = 0; for (let k = 0; k < N; k++) if (s[k]) { a += e[k]; n++; } return n ? a / n : NaN; };
    est.push({ id, ez: mE(eE, surv.EZ), cand: mE(eC, surv.CAND) });
    const paths = E.pathsForSeed(u0.seed, N, Y - 1);
    const parts = [];
    for (const [a] of ARMS) {
      const u = us[a], level = arr(u.main.level, Uint8Array), fy = arr(u.main.failYear, Int16Array);
      const band = BANDS.map(() => ({ n: 0, sum: 0, floor: 0, top: 0 })), dec = [];
      let open = 0, openN = 0;
      for (let k = 0; k < N; k++) {
        const end = fy[k] >= 0 ? fy[k] : Y;
        for (let t = retT; t < end; t++) {
          const lv = level[k * Y + t]; if (!lv) continue;
          const yr = t - retT + 1, b = BANDS.findIndex(([lo, hi]) => yr >= lo && yr <= hi);
          band[b].n++; band[b].sum += lv; if (lv <= 80) band[b].floor++; if (lv >= 110) band[b].top++;
          if (t === retT) { openN++; open += lv; } else { const prev = level[k * Y + t - 1]; if (prev) dec.push({ lv, prev, z: paths[k][t - 1] }); }
        }
      }
      const zs = dec.map(d => d.z).sort((x, y) => x - y), lo = zs[Math.floor(zs.length / 3)];
      const cuts = dec.filter(d => d.lv < d.prev && d.lv < 100);
      // the tiers of retired year yr's move: tierYears[t] is what entered year t (the visit's held, before the move), so read one on
      const eqAt = yr => (u.tierYears && u.tierYears[retT + yr] !== null && u.tierYears[retT + yr] !== undefined ? 100 * u.tierYears[retT + yr] : NaN);
      const r = { surv: 100 * surv[a].reduce((p, x) => p + x, 0) / N, open: openN ? open / openN : NaN, bands: band.map(x => ({ level: x.n ? x.sum / x.n : NaN, floor: x.n ? x.floor / x.n : NaN, top: x.n ? x.top / x.n : NaN })),
        afterWorst: cuts.length ? cuts.filter(d => d.z <= lo).length / cuts.length : NaN, cutsPer100: dec.length ? 100 * cuts.length / dec.length : NaN, eq: EQ_YEARS.map(eqAt), retired0: retT === 0 };
      rows[a].push(r);
      parts.push(`${a} ${f1(r.surv)}%, first year ${f1(r.open)}%, by years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(r.bands[i].level)}%`).join(', ')}${a === 'APP' ? '' : `; equity at retired years ${EQ_YEARS.join(', ')}: ${r.eq.map(f1).join(' / ')}%`}`);
    }
    out.push(`  ${id.padEnd(6)} ${parts.join('\n         ')}\n         EZ less CAND ${sg(pC.d)} (se ${pC.se.toFixed(2)}; ${pC.sv}/${pC.ls}); less DIAL10 ${sg(pD.d)} (se ${pD.se.toFixed(2)}); less DIAL10M ${sg(pM.d)} (se ${pM.se.toFixed(2)}); the estate where each survives, EZ ${Math.round(est.at(-1).ez)}, CAND ${Math.round(est.at(-1).cand)}`);
  }
  const mean = (xs, f) => { const v = xs.map(f).filter(Number.isFinite); return v.length ? v.reduce((p, x) => p + x, 0) / v.length : NaN; };
  const pool = xs => { const d = xs.reduce((p, x) => p + x.d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x.se ** 2, 0)) / xs.length; return `${sg(d)} (se ${se.toFixed(2)}; ${sg(d - 1.96 * se)} to ${sg(d + 1.96 * se)})`; };
  out.push('', 'Pooled, each household once (the retirees: the households retired at the start):');
  for (const [a] of ARMS) {
    const xs = rows[a], ret = xs.filter(x => x.retired0);
    out.push(`  ${a.padEnd(8)} survival ${f1(mean(xs, x => x.surv))}%; the first retired year ${f1(mean(xs, x => x.open))}% (the retirees ${f1(mean(ret, x => x.open))}%); by retired years ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${f1(mean(xs, x => x.bands[i].level))}%`).join(', ')}; at the floor ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${pc(mean(xs, x => x.bands[i].floor))}`).join(', ')}; at 110% ${BANDS.map(([l, h], i) => `${l}-${h === 99 ? 'on' : h} ${pc(mean(xs, x => x.bands[i].top))}`).join(', ')}; cuts after year 1 ${f1(mean(xs, x => x.cutsPer100))} a hundred years, ${pc(mean(xs, x => x.afterWorst))} after the worst third of market years${a === 'APP' ? '' : `; the pension and ISA's equity share at retired years ${EQ_YEARS.join(', ')} ${EQ_YEARS.map((_, i) => f1(mean(xs, x => x.eq[i]))).join(' / ')}% (the retirees ${EQ_YEARS.map((_, i) => f1(mean(ret, x => x.eq[i]))).join(' / ')}%)`}`);
  }
  out.push(`  EZ less CAND, survival ${pool(pairs.vsCand)}; less DIAL10 ${pool(pairs.vsDial)}; less DIAL10M ${pool(pairs.vsDialM)}`);
  out.push(`  the estate where each survives, the households' mean: EZ ${Math.round(mean(est, x => x.ez))}, CAND ${Math.round(mean(est, x => x.cand))}`);
  out.push(fail.length ? `NOT FAIR: ${fail.join('; ')}` : 'FAIR: one seed, path count, years and inputs; CAND on the patched code the CAND unit, and DIAL10 on the age-weight code the DIAL10 unit, on every household');
  console.log(out.join('\n'));
  process.exit(fail.length ? 1 : 0);
}
