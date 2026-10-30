/*
 * THE SPENDING RULES ON THE CANDIDATE'S TIERS, ON THE REVIEW'S EIGHT HOUSEHOLDS (EXPLORATORY; LOCK.md section 3). On the
 * patched code (lock/solve-lock.patch on the agent's a0e6400 with ez/solve-ez.patch, a local worktree), each household is
 * solved as the levers harness solves CAND (levers-audit.mjs: the candidate's settings at its points, the estate weight
 * 0.02, the plan under APP's pick), and:
 *   CANDLK     the candidate, both options off: the lock's tiers. It must be the CAND unit (the levers harness, on the
 *              agent's 1b39400) on every path's survival, failure year, yearly level, spending delivered, unmet, estate and
 *              end wealth, and its inputs;
 *   D10MLK     the dial at ten with age weights (lambda times ten, ageWeight { mode 90, disp 9 }: DIAL10M's settings),
 *              its tiers locked to CANDLK's (lockTiers, the layer loop);
 *   EZLK<F>    EZ (gamma 4, rho 2, the price of failing F, for each F given), its tiers locked to CANDLK's.
 * A locked arm takes the candidate's own decision on the tier above (solvePlanAuto's), so the two menus are one. Each is
 * executed by the engine on the levers units' 1,000 paths (seed 7002), runPath held to E.runTrial on the first 100; on the
 * first 200 (runPolicy's visit, as levers-audit.mjs) the pension and ISA's equity share recorded by year, and at every
 * decision of a locked arm its move's pair held to the pair the candidate's chooser picks at that position (any other
 * stops the worker).
 * Worker:  node lock-run.mjs <levers unit dir> <lock unit dir> --prices F1,F2 [--points P] <id>...
 *          (from the root of the patched code; --points only for a smoke run, never the run)
 * Read:    node lock-run.mjs --read <levers unit dir> <dial unit dir> <ez unit dir> <lock unit dir> --prices F1,F2
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const IDS = ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F'], BESIDE = 200, CHECK = 100, W = 0.02;
const AW = { mode: 90, disp: 9 }, GAMMA = 4, RHO = 2;
const argv = process.argv.slice(2), flag = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const PRICES = (flag('--prices') || '').split(',').filter(Boolean).map(Number), PTS = flag('--points') ? Number(flag('--points')) : null;
const pos = argv.filter((x, i) => !x.startsWith('--') && !['--prices', '--points'].includes(argv[i - 1]));
if (!PRICES.length || PRICES.some(x => !(x > 0))) { console.error('lock-run: --prices F1,F2 is required'); process.exit(2); }
const sfx = PTS ? `-p${PTS}` : '', tagEZ = F => `ezlk-g${GAMMA}-r${RHO}-f${F}${sfx}`, TAGD = `d10mlk${sfx}`, TAGC = `candlk${sfx}`;
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
  const [dir, lkDir, ...ids] = pos;
  if (!dir || !lkDir || !ids.length || ids.some(id => !IDS.includes(id))) { console.error('usage: lock-run.mjs <levers unit dir> <lock unit dir> --prices F1,F2 [--points P] <id>...'); process.exit(2); }
  const P = Object.fromEntries(readPanel().map(x => [x.id, x])), code = codeHash();
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  const aboveOf = r => { const d = r.meta.riskAbove && r.meta.riskAbove.decision; if (typeof d !== 'string') throw new Error('the candidate records no decision on the tier above'); return d.startsWith('on'); };
  for (const id of ids) {
    const h = P[id], ref = unitOf(dir, id, 'cand'), pk = JSON.parse(readFileSync(join(dir, `${id}-pick-app.json`), 'utf8'));
    if (armA(appPlan(h.plan), { tournament: false }).planState.spending.decumulationPolicy !== pk.decumulationPolicy) throw new Error(`${id}: APP's pick differs from the unit's`);
    const plan = prep(solverPlanOf(h.plan, { decumulationPolicy: pk.decumulationPolicy }));
    const base = { lambda: LAMBDA, points: PTS || CAND_PTS, bequestWeight: W };
    let rc = null;
    const arms = [[TAGC, () => base], [TAGD, () => ({ ...base, lambda: 10 * LAMBDA, ageWeight: AW, tsOnce: false, lockTiers: rc, riskAbove: aboveOf(rc) })],
      ...PRICES.map(F => [tagEZ(F), () => ({ ...base, tsOnce: false, ez: { gamma: GAMMA, rho: RHO, failPrice: F }, lockTiers: rc, riskAbove: aboveOf(rc) })])];
    for (const [tag, optsOf] of arms) {
      const t0 = Date.now(), o = optsOf(), locked = tag !== TAGC;
      const r = C.solveCandidate(E, M, structuredClone(plan), o);
      const okArm = !locked ? !r.meta.lockTiers && !r.meta.ageWeight && !r.meta.ez
        : r.meta.lockTiers && r.lockTiers && r.lockTiers.rc === rc && r.meta.tsOnce === false && (tag === TAGD ? JSON.stringify(r.meta.ageWeight) === JSON.stringify(AW) && !r.meta.ez && Math.abs(r.lambda - 10 * LAMBDA) < 1e-15
          : !r.meta.ageWeight && r.meta.ez && r.meta.ez.gamma === GAMMA && r.meta.ez.rho === RHO && r.meta.ez.failPrice === o.ez.failPrice && r.meta.ez.mortality.mode === 90 && Math.abs(r.lambda - LAMBDA) < 1e-15);
      if (!r.meta.failDelivered || !okArm) throw new Error(`${id} ${tag}: not as asked (lambda ${r.lambda}, failDelivered ${r.meta.failDelivered}, lock ${JSON.stringify(r.meta.lockTiers)}, ageWeight ${JSON.stringify(r.meta.ageWeight)}, ez ${JSON.stringify(r.meta.ez)}, tsOnce ${r.meta.tsOnce})`);
      const secs = (Date.now() - t0) / 1000;
      const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, Y = T + 1, N = ref.N, paths = E.pathsForSeed(ref.seed, N, T);
      if (Y !== ref.Y) throw new Error(`${id} ${tag}: ${Y} years against the unit's ${ref.Y}`);
      const out = Object.fromEntries(Object.entries(TYPES).map(([k, Ty]) => [k, new Ty(k === 'level' ? N * Y : N)]));
      let bad = 0;
      for (let k = 0; k < N; k++) {
        const zs = Float64Array.from(paths[k]), q0 = runPath(ctx, zs);
        out.survived[k] = q0.survived ? 1 : 0; out.delivered[k] = q0.delivered; out.unmet[k] = q0.unmet; out.estate[k] = q0.estate; out.wealth[k] = q0.wealth; out.failYear[k] = q0.failYear; out.level.set(q0.level, k * Y);
        if (k < CHECK) { const q = E.runTrial(ctx, zs); if (q.survived !== q0.survived || q.unmetTotal !== q0.unmet) bad++; }
      }
      if (bad) throw new Error(`${id} ${tag}: runPath differs from E.runTrial on ${bad} of the first ${CHECK} paths`);
      // on the first BESIDE paths: the equity share held by year (the tiers entering each year, so year t's move is read at t + 1),
      // and at every decision of a locked arm its move's pair against the candidate's chooser's at that position
      const eq = new Float64Array(Y), en = new Float64Array(Y);
      let engineOnly = 0, policyOnly = 0, decisions = 0, offLock = 0, firstOff = null;
      for (let k = 0; k < Math.min(N, BESIDE); k++) {
        const p = S.runPolicy(r, Float64Array.from(paths[k]), { visit: (t, s, held, ai) => {
          const e = r.c.tiers.pen[held.pen].equity * s[0] + r.c.tiers.isa[held.isa].equity * s[1], wt = s[0] + s[1]; if (wt > 0 && t < Y) { eq[t] += e / wt; en[t]++; }
          if (locked) { decisions++; const ac = S.chooseAction(rc, s, t, held); if (r.tsLayerOf[ai] !== rc.tsLayerOf[ac]) { offLock++; if (!firstOff) firstOff = `path ${k} year ${t}`; } }
        } }).survived ? 1 : 0;
        if (out.survived[k] && !p) engineOnly++; if (p && !out.survived[k]) policyOnly++;
      }
      if (offLock) throw new Error(`${id} ${tag}: ${offLock} of ${decisions} decisions off the candidate's pair, the first at ${firstOff}`);
      const tierYears = Array.from(eq, (x, t) => (en[t] ? +(x / en[t]).toFixed(4) : null));
      const main = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, b64(v)]));
      const rec = { id, arm: tag, code, inputs: inputsHash(ctx), seed: ref.seed, N, Y, retireT: ref.retireT, lambda: r.lambda, ez: r.meta.ez || null, ageWeight: r.meta.ageWeight || null, lockTiers: r.meta.lockTiers || null, riskAbove: r.meta.riskAbove ? r.meta.riskAbove.decision : (o.riskAbove === undefined ? null : `set ${o.riskAbove}`), points: r.g.np, tierYears, lockCheck: locked ? { decisions, off: offLock } : null, beside: { N: Math.min(N, BESIDE), engineOnly, policyOnly }, main, secs, engineSecs: (Date.now() - t0) / 1000 - secs };
      const surv = 100 * out.survived.reduce((a, x) => a + x, 0) / N, refSurv = 100 * arr(ref.main.survived, Uint8Array).reduce((a, x) => a + x, 0) / N;
      const eqS = x => (x === null || x === undefined ? '-' : (100 * x).toFixed(1));
      if (!locked) {
        const diff = Object.keys(TYPES).filter(k => main[k] !== ref.main[k]);
        rec.identity = !PTS && diff.length === 0 && rec.inputs === ref.inputs;
        console.log(`${id} ${tag} on the patched code, both options off: ${PTS ? `${PTS} points (a smoke run, not the unit's settings)` : rec.identity ? 'THE SAME as the CAND unit on every path (survival, failure year, level, delivered, unmet, estate, wealth) and its inputs' : `DIFFERS from the CAND unit (${diff.join(', ') || 'inputs'})`}; the tier above ${rec.riskAbove}; solve ${Math.round(secs)} s`);
        if (!PTS && !rec.identity) process.exitCode = 1;
        rc = r;
      } else console.log(`${id} ${tag}: survival ${surv.toFixed(2)}% (CAND ${refSurv.toFixed(2)}%); the first retired year's move's equity ${eqS(tierYears[ref.retireT + 1])}% (CAND ${eqS(ref.tierYears && ref.tierYears[ref.retireT + 1])}%); the lock held at ${decisions} of ${decisions} decisions; beside: the engine alone ${engineOnly}, runPolicy alone ${policyOnly} of ${Math.min(N, BESIDE)}; solve ${Math.round(secs)} s, paths ${Math.round(rec.engineSecs)} s; code ${code}`);
      writeFileSync(join(lkDir, `${id}-${tag}.json.gz`), gzipSync(JSON.stringify(rec)));
    }
  }
} else {
  const [dir, dialDir, ezDir, lkDir] = pos;
  if (!dir || !dialDir || !ezDir || !lkDir || PTS) { console.error('usage: lock-run.mjs --read <levers unit dir> <dial unit dir> <ez unit dir> <lock unit dir> --prices F1,F2'); process.exit(2); }
  const [F1, F2] = [...PRICES].sort((a, b) => a - b);
  const EZ1 = `EZLK${F1}`, EZ2 = `EZLK${F2}`;
  const ARMS = [['APP', dir, 'app'], ['CAND', dir, 'cand'], ['DIAL10M', dialDir, 'dial10m'], ['EZ', ezDir, 'ez-g4-r2-f30'], ['D10MLK', lkDir, TAGD], [EZ1, lkDir, tagEZ(F1)], [EZ2, lkDir, tagEZ(F2)]];
  const LOCKED = ['D10MLK', EZ1, EZ2];
  const BANDS = [[1, 5], [6, 10], [11, 20], [21, 99]], EQ_YEARS = [1, 5, 10, 20];
  const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), sg = (x, d = 2) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(d)}` : '-'), pc = x => (Number.isFinite(x) ? `${(100 * x).toFixed(0)}%` : '-');
  const fail = [], per = {}, rows = Object.fromEntries(ARMS.map(([a]) => [a, []]));
  const out = [`THE SPENDING RULES ON THE CANDIDATE'S TIERS (EXPLORATORY): the dial at ten with age weights (D10MLK) and EZ (gamma ${GAMMA}, rho ${RHO}, the price of failing ${F1} and ${F2}: ${EZ1}, ${EZ2}), each with its tiers locked to the candidate's (lockTiers), against the candidate (CAND), the same rules unlocked (DIAL10M; EZ at the price of 30) and the app's guardrails (APP); the eight households, seed 7002, 1,000 paths each; the retired years before any failure`];
  for (const id of IDS) {
    const missing = ARMS.filter(([a, d, f]) => !existsSync(join(d, `${id}-${f}.json.gz`))).map(([a]) => a);
    if (missing.length) { fail.push(`${id}: no ${missing.join(', ')} unit`); continue; }
    const us = Object.fromEntries(ARMS.map(([a, d, f]) => [a, unitOf(d, id, f)])), u0 = us.CAND, Y = u0.Y, N = u0.N, retT = u0.retireT;
    for (const [a] of ARMS) { const u = us[a]; if (u.seed !== u0.seed || u.N !== N || u.Y !== Y || u.inputs !== u0.inputs) fail.push(`${id} ${a}: seed, paths, years or inputs differ`); }
    const cl = existsSync(join(lkDir, `${id}-${TAGC}.json.gz`)) ? unitOf(lkDir, id, TAGC) : null;
    if (!cl || cl.identity !== true) fail.push(`${id}: the lock's candidate is not shown the CAND unit`);
    for (const a of LOCKED) { const u = us[a]; if (!cl || u.code !== cl.code || !u.lockTiers || !u.lockCheck || u.lockCheck.off !== 0 || !(u.lockCheck.decisions > 0)) fail.push(`${id} ${a}: not shown locked to the candidate's tiers on the same code`); }
    const d10eq = existsSync(join(dialDir, `${id}-dial10eq.json.gz`)) ? unitOf(dialDir, id, 'dial10eq') : null;   // the age weights' code with them off: the DIAL10 unit (dial/ageweight.mjs)
    if (!d10eq || d10eq.identity !== true || d10eq.code !== us.DIAL10M.code || JSON.stringify(us.DIAL10M.ageWeight) !== JSON.stringify(AW) || JSON.stringify(us.D10MLK.ageWeight) !== JSON.stringify(AW) || Math.abs(us.DIAL10M.lambda - us.D10MLK.lambda) > 1e-15) fail.push(`${id}: DIAL10M's code or settings not shown, or not the same unlocked and locked`);
    if (!us.EZ.ez || us.EZ.ez.failPrice !== 30 || us[EZ2].ez.failPrice !== F2 || us[EZ1].ez.failPrice !== F1) fail.push(`${id}: EZ's prices not as named`);
    const paths = E.pathsForSeed(u0.seed, N, Y - 1);
    per[id] = {};
    const parts = [];
    for (const [a] of ARMS) {
      const u = us[a], level = arr(u.main.level, Uint8Array), fy = arr(u.main.failYear, Int16Array), sv = arr(u.main.survived, Uint8Array), est = arr(u.main.estate, Float32Array);
      // per path: the sums the read pools (so the bootstrap below can resample paths)
      const P5 = { n: new Float64Array(N), sum: new Float64Array(N), floor: new Float64Array(N) };
      const band = BANDS.map(() => ({ n: 0, sum: 0, floor: 0, top: 0 })), dec = [];
      let open = 0, openN = 0, eS = 0, eN = 0;
      for (let k = 0; k < N; k++) {
        const end = fy[k] >= 0 ? fy[k] : Y;
        for (let t = retT; t < end; t++) {
          const lv = level[k * Y + t]; if (!lv) continue;
          const yr = t - retT + 1, b = BANDS.findIndex(([lo, hi]) => yr >= lo && yr <= hi);
          band[b].n++; band[b].sum += lv; if (lv <= 80) band[b].floor++; if (lv >= 110) band[b].top++;
          if (b === 0) { P5.n[k]++; P5.sum[k] += lv; if (lv <= 80) P5.floor[k]++; }
          if (t === retT) { openN++; open += lv; } else { const prev = level[k * Y + t - 1]; if (prev) dec.push({ lv, prev, z: paths[k][t - 1] }); }
        }
        if (sv[k]) { eS += est[k]; eN++; }
      }
      const zs = dec.map(d => d.z).sort((x, y) => x - y), lo = zs[Math.floor(zs.length / 3)], cuts = dec.filter(d => d.lv < d.prev && d.lv < 100);
      const eqAt = yr => (u.tierYears && u.tierYears[retT + yr] !== null && u.tierYears[retT + yr] !== undefined ? 100 * u.tierYears[retT + yr] : NaN);
      const r = { surv: 100 * sv.reduce((x, y) => x + y, 0) / N, open: openN ? open / openN : NaN, bands: band.map(x => ({ level: x.n ? x.sum / x.n : NaN, floor: x.n ? x.floor / x.n : NaN, top: x.n ? x.top / x.n : NaN })),
        afterWorst: cuts.length ? cuts.filter(d => d.z <= lo).length / cuts.length : NaN, cutsPer100: dec.length ? 100 * cuts.length / dec.length : NaN, eq: EQ_YEARS.map(eqAt), retired0: retT === 0, estate: eN ? eS / eN : NaN };
      rows[a].push(r);
      per[id][a] = { sv, P5, open: r.open };
      parts.push(`${a} ${f1(r.surv)}%, first year ${f1(r.open)}%, by years ${BANDS.map(([l, hh], i) => `${l}-${hh === 99 ? 'on' : hh} ${f1(r.bands[i].level)}%`).join(', ')}, at the floor in years 1-5 ${pc(r.bands[0].floor)}${a === 'APP' ? '' : `; equity at retired years ${EQ_YEARS.join(', ')}: ${r.eq.map(f1).join(' / ')}%`}`);
    }
    out.push(`  ${id.padEnd(6)} ${parts.join('\n         ')}`);
  }
  // the paired survival differences, by household and pooled (each household once); se by path
  const pair = (id, a, b) => { const x = per[id][a].sv, y = per[id][b].sv, N = x.length; let s1 = 0, s2 = 0, aOnly = 0, bOnly = 0; for (let k = 0; k < N; k++) { const d = x[k] - y[k]; s1 += d; s2 += d * d; if (d > 0) aOnly++; if (d < 0) bOnly++; } const m = s1 / N; return { d: 100 * m, se: 100 * Math.sqrt((s2 / N - m * m) / N), aOnly, bOnly }; };
  const done = IDS.filter(id => per[id]);
  const pool = (a, b) => { const xs = done.map(id => pair(id, a, b)), d = xs.reduce((p, x) => p + x.d, 0) / xs.length, se = Math.sqrt(xs.reduce((p, x) => p + x.se ** 2, 0)) / xs.length; return { d, se, s: `${sg(d)} (se ${se.toFixed(2)}; ${sg(d - 1.96 * se)} to ${sg(d + 1.96 * se)}; ${xs.reduce((p, x) => p + x.aOnly, 0)} paths survive in the first alone, ${xs.reduce((p, x) => p + x.bOnly, 0)} in the second, of ${1000 * xs.length})`, by: done.map((id, i) => `${id} ${sg(xs[i].d)}`).join(', ') }; };
  const mean = (xs, f) => { const v = xs.map(f).filter(Number.isFinite); return v.length ? v.reduce((p, x) => p + x, 0) / v.length : NaN; };
  out.push('', 'Pooled, each household once (the retirees: the households retired at the start):');
  for (const [a] of ARMS) {
    const xs = rows[a], ret = xs.filter(x => x.retired0);
    out.push(`  ${a.padEnd(8)} survival ${f1(mean(xs, x => x.surv))}%; the first retired year ${f1(mean(xs, x => x.open))}% (the retirees ${f1(mean(ret, x => x.open))}%); by retired years ${BANDS.map(([l, hh], i) => `${l}-${hh === 99 ? 'on' : hh} ${f1(mean(xs, x => x.bands[i].level))}%`).join(', ')}; at the floor ${BANDS.map(([l, hh], i) => `${l}-${hh === 99 ? 'on' : hh} ${pc(mean(xs, x => x.bands[i].floor))}`).join(', ')}; at 110% ${BANDS.map(([l, hh], i) => `${l}-${hh === 99 ? 'on' : hh} ${pc(mean(xs, x => x.bands[i].top))}`).join(', ')}; cuts after year 1 ${f1(mean(xs, x => x.cutsPer100))} a hundred years, ${pc(mean(xs, x => x.afterWorst))} after the worst third of market years${a === 'APP' ? '' : `; the pension and ISA's equity share at retired years ${EQ_YEARS.join(', ')} ${EQ_YEARS.map((_, i) => f1(mean(xs, x => x.eq[i]))).join(' / ')}% (the retirees ${EQ_YEARS.map((_, i) => f1(mean(ret, x => x.eq[i]))).join(' / ')}%)`}; the estate where it survives, the households' mean ${Math.round(mean(xs, x => x.estate))}`);
  }
  out.push('', 'Survival, paired by path (points; the first arm less the second):');
  for (const [a, b] of [['D10MLK', 'CAND'], [EZ1, 'CAND'], [EZ2, 'CAND'], ['D10MLK', 'DIAL10M'], ...(PRICES.includes(30) ? [['EZLK30', 'EZ']] : []), [EZ1, 'D10MLK'], [EZ2, 'D10MLK']]) { const p = pool(a, b); out.push(`  ${a} less ${b}: ${p.s}; by household ${p.by}`); }
  // THE COMPARISON AT EQUAL SURVIVAL (LOCK.md section 3): EZ's two prices give two points; at D10MLK's pooled survival, EZ's
  // years 1-5 level and its share of them at the floor are read off the line between them, and set against D10MLK's. The
  // interval: 2,000 bootstrap replicates resampling paths within each household (every arm resampled on the same paths)
  const stat = (idsel) => { // pooled figures for the given path index per household (idsel[id] = Int32Array of path indexes)
    const o = {};
    for (const a of ['D10MLK', EZ1, EZ2]) {
      let sv = 0, lvl = 0, fl = 0;
      for (const id of done) { const q = per[id][a], ix = idsel[id]; let s = 0, n = 0, sm = 0, f = 0; for (let i = 0; i < ix.length; i++) { const k = ix[i]; s += q.sv[k]; n += q.P5.n[k]; sm += q.P5.sum[k]; f += q.P5.floor[k]; } sv += 100 * s / ix.length; lvl += n ? sm / n : NaN; fl += n ? 100 * f / n : NaN; }
      o[a] = { sv: sv / done.length, lvl: lvl / done.length, fl: fl / done.length };
    }
    const al = (o.D10MLK.sv - o[EZ1].sv) / (o[EZ2].sv - o[EZ1].sv);
    return { al, lvl: o[EZ1].lvl + al * (o[EZ2].lvl - o[EZ1].lvl) - o.D10MLK.lvl, fl: o[EZ1].fl + al * (o[EZ2].fl - o[EZ1].fl) - o.D10MLK.fl, o };
  };
  if (done.length === IDS.length) {
    const full = Object.fromEntries(done.map(id => [id, Int32Array.from({ length: per[id].CAND.sv.length }, (_, k) => k)])), base = stat(full);
    let seed = 7002; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };   // mulberry32
    const B = 2000, bl = [], bf = [], ba = [];
    for (let b = 0; b < B; b++) { const sel = Object.fromEntries(done.map(id => { const n = full[id].length; return [id, Int32Array.from({ length: n }, () => Math.floor(rnd() * n))]; })); const s = stat(sel); bl.push(s.lvl); bf.push(s.fl); ba.push(s.al); }
    const q = (xs, p) => { const v = xs.filter(Number.isFinite).sort((x, y) => x - y); return v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))]; };
    const o = base.o, bracket = base.al >= 0 && base.al <= 1;
    out.push('', `At equal survival (EZ read at D10MLK's pooled survival, ${f1(o.D10MLK.sv)}%, on the line between ${EZ1} at ${f1(o[EZ1].sv)}% and ${EZ2} at ${f1(o[EZ2].sv)}%: the weight on ${EZ2} ${base.al.toFixed(3)}, ${bracket ? 'BRACKETED' : 'NOT BRACKETED: extrapolated'}; 95% intervals from ${B} bootstrap replicates of the paths, the weight's own from ${q(ba, 0.025).toFixed(3)} to ${q(ba, 0.975).toFixed(3)}):`);
    out.push(`  retired years 1-5, EZ less D10MLK: ${sg(base.lvl, 1)} points of the target (${sg(q(bl, 0.025), 1)} to ${sg(q(bl, 0.975), 1)}); D10MLK ${f1(o.D10MLK.lvl)}%, ${EZ1} ${f1(o[EZ1].lvl)}%, ${EZ2} ${f1(o[EZ2].lvl)}%: ${q(bl, 0.025) > 0 ? 'EZ HIGHER' : q(bl, 0.975) < 0 ? 'EZ LOWER' : 'NOT SEPARATED'}`);
    out.push(`  retired years 1-5 at the floor, EZ less D10MLK: ${sg(base.fl, 1)} points (${sg(q(bf, 0.025), 1)} to ${sg(q(bf, 0.975), 1)}); D10MLK ${f1(o.D10MLK.fl)}%, ${EZ1} ${f1(o[EZ1].fl)}%, ${EZ2} ${f1(o[EZ2].fl)}%: ${q(bf, 0.975) < 0 ? 'EZ LESS AT THE FLOOR' : q(bf, 0.025) > 0 ? 'EZ MORE AT THE FLOOR' : 'NOT SEPARATED'}`);
  }
  out.push(fail.length ? `NOT FAIR: ${fail.join('; ')}` : `FAIR: one seed, path count, years and inputs; the lock's candidate the CAND unit on every household; every locked arm on the lock's code, locked at every decision checked; DIAL10M unlocked on the code shown the DIAL10 unit with the age weights off, and the same lambda and age weights as locked`);
  console.log(out.join('\n'));
  process.exit(fail.length ? 1 : 0);
}
