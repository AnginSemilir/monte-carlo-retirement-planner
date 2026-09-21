/*
 * GATE 5: couples by rollout, the versus protocol on the library's couple households, everything scored in
 * the exact reduced model (which steps couples to the pound) on the engine's own market (a yearly draw per
 * wrapper, a held shift per path). Arms: the rollout policy; the plan's own rule; the best of the same
 * 24-move menu picked on the search seed.
 *   node research/solver/couple-gate.mjs select [lo=70] [hi=98] [seed=7001]     -> results/couple-band-<lo>-<hi>-<seed>.json
 *   ONLY=<k> node research/solver/couple-gate.mjs run <tag> [points=30] [held=2000] [seedSearch=7001] [seedHeld=7002]
 *   node research/solver/couple-gate.mjs reduce <tag>
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildActions } from '../../src/solver/solve.js';
import { solveCouple, runCouplePolicy, runCoupleFixed } from '../../src/solver/couple.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(HERE, 'results');
const mode = process.argv[2];
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode !== 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const q = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
const stats = (rs) => ({ successRate: 100 * rs.filter(r => r.survived).length / rs.length, medianTerminalNet: q(rs.map(r => r.terminalNet), 0.5), p10TerminalNet: q(rs.map(r => r.terminalNet), 0.1), medianLifetimeTax: q(rs.map(r => r.lifetimeTax), 0.5), meanFailAge: rs.filter(r => !r.survived).length ? mean(rs.filter(r => !r.survived).map(r => r.failAge)) : null });
const paired = (a, b) => { const d = a.map((r, i) => (r.survived ? 1 : 0) - (b[i].survived ? 1 : 0)); const m = mean(d); const se = Math.sqrt(d.reduce((x, y) => x + (y - m) * (y - m), 0) / (d.length - 1) / d.length); return { diff: 100 * m, se: 100 * se }; };

if (mode === 'select') {
  const lo = Number(process.argv[3] || 70), hi = Number(process.argv[4] || 98), seed = Number(process.argv[5] || 7001);
  const band = [];
  couples.forEach((sc, i) => {
    const plan = prep(sc.plan); const m = M.prepare(E, plan);
    const zs = E.pathsForSeed(seed, 400, m.ctx.totalYears);
    const own = M.actionFromContext(m.ctx);
    const s = 100 * zs.filter(z => runCoupleFixed(m, M, own, z).survived).length / zs.length;
    if (s >= lo && s <= hi) band.push({ i, id: sc.id, name: sc.name, survival: s });
  });
  writeFileSync(join(RESULTS, `couple-band-${lo}-${hi}-${seed}.json`), JSON.stringify(band, null, 1));
  console.log(`${band.length} couple households with the plan's own rule between ${lo} and ${hi} on seed ${seed}`);
}

if (mode === 'run') {
  const tag = process.argv[3] || 'couple';
  const POINTS = Number(process.argv[4] || 30), HELD = Number(process.argv[5] || 2000);
  const seedSearch = Number(process.argv[6] || 7001), seedHeld = Number(process.argv[7] || 7002);
  const lo = Number(process.env.LO || 70), hi = Number(process.env.HI || 98);
  const band = JSON.parse(readFileSync(join(RESULTS, `couple-band-${lo}-${hi}-${seedSearch}.json`), 'utf8'));
  const k = Number(process.env.ONLY);
  const sc = couples[band[k].i];
  const plan = prep(sc.plan);
  const MIX = process.env.MIX !== undefined ? Number(process.env.MIX) : 3;
  const t0 = Date.now();
  const cp = solveCouple(E, M, plan, { points: POINTS, mix: MIX || undefined, topK: Number(process.env.TOPK || 2) });
  const m = cp.m;
  const search = E.pathsForSeed(seedSearch, 600, m.ctx.totalYears), held = E.pathsForSeed(seedHeld, HELD, m.ctx.totalYears);
  const own = M.actionFromContext(m.ctx);
  const menu = buildActions().map(a => ({ ...a, lump: m.ctx.fullLumpSum }));
  let pick = null; menu.forEach((a, i) => { const s = search.filter(z => runCoupleFixed(m, M, a, z).survived).length; if (!pick || s > pick.s) pick = { s, i, label: a.label }; });
  const t1 = Date.now();
  const roll = held.map(z => runCouplePolicy(cp, z));
  const rollMs = Date.now() - t1;
  const app = held.map(z => runCoupleFixed(m, M, own, z));
  const same = held.map(z => runCoupleFixed(m, M, menu[pick.i], z));
  const out = { tag, id: sc.id, name: sc.name, years: m.ctx.totalYears + 1, points: POINTS, mixture: MIX, held: HELD, seedSearch, seedHeld, solveMs: cp.meta.ms, rollMs, ms: Date.now() - t0,
    rollout: { ...stats(roll), splitMean: mean(roll.map(r => r.splitMean)), unevenYears: mean(roll.map(r => r.unevenYears)) }, app: stats(app), same: { ...stats(same), label: pick.label },
    pairedApp: paired(roll, app), pairedSame: paired(roll, same) };
  mkdirSync(join(RESULTS, tag), { recursive: true });
  writeFileSync(join(RESULTS, tag, `${sc.id}.json`), JSON.stringify(out, null, 1));
  const f = (x) => x.toFixed(1);
  console.log(`${sc.id} ${sc.name.slice(0, 32).padEnd(33)} rollout ${f(out.rollout.successRate)}  app ${f(out.app.successRate)} (${out.pairedApp.diff >= 0 ? '+' : ''}${out.pairedApp.diff.toFixed(2)}±${out.pairedApp.se.toFixed(2)})  same ${f(out.same.successRate)} (${out.pairedSame.diff >= 0 ? '+' : ''}${out.pairedSame.diff.toFixed(2)})  split ${out.rollout.splitMean.toFixed(2)}  uneven ${out.rollout.unevenYears.toFixed(0)}y  pot ${Math.round(out.rollout.medianTerminalNet / 1000)}k/${Math.round(out.same.medianTerminalNet / 1000)}k  ${(out.ms / 1000).toFixed(0)}s (roll ${(rollMs / 1000).toFixed(0)}s)`);
}

if (mode === 'reduce') {
  const tag = process.argv[3] || 'couple';
  const dir = join(RESULTS, tag);
  const rows = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const binom = (w, l) => { const n = w + l; if (!n) return 1; let p = 0; const C = (n, r) => { let v = 1; for (let i = 1; i <= r; i++) v = v * (n - r + i) / i; return v; }; for (let i = 0; i <= Math.min(w, l); i++) p += C(n, i) / Math.pow(2, n); return Math.min(1, 2 * p); };
  console.log(`${rows.length} couple households, tag ${tag}, ${rows[0].points} points, mixture ${rows[0].mixture}, ${rows[0].held} held-out paths\n`);
  console.log('id    rollout / app / same    Δapp±se    Δsame±se   split  uneven yrs   median pot roll/same   fail age roll/same');
  for (const r of rows) console.log(`${r.id}  ${r.rollout.successRate.toFixed(1).padStart(5)} / ${r.app.successRate.toFixed(1).padStart(5)} / ${r.same.successRate.toFixed(1).padStart(5)}   ${(r.pairedApp.diff >= 0 ? '+' : '') + r.pairedApp.diff.toFixed(2)}±${r.pairedApp.se.toFixed(2)}   ${(r.pairedSame.diff >= 0 ? '+' : '') + r.pairedSame.diff.toFixed(2)}±${r.pairedSame.se.toFixed(2)}   ${r.rollout.splitMean.toFixed(2)}   ${r.rollout.unevenYears.toFixed(0).padStart(4)}       ${Math.round(r.rollout.medianTerminalNet / 1000)}k/${Math.round(r.same.medianTerminalNet / 1000)}k        ${r.rollout.meanFailAge ? r.rollout.meanFailAge.toFixed(1) : '-'}/${r.same.meanFailAge ? r.same.meanFailAge.toFixed(1) : '-'}`);
  for (const [k, name] of [['pairedSame', 'the best of the same menu'], ['pairedApp', "the plan's own rule"]]) {
    const d = rows.map(r => r[k].diff); const up = rows.filter(r => r[k].diff > 2 * r[k].se).length, down = rows.filter(r => r[k].diff < -2 * r[k].se).length;
    console.log(`\nrollout against ${name}: survival mean ${mean(d) >= 0 ? '+' : ''}${mean(d).toFixed(2)} pts; beyond two standard errors ${up} up / ${down} down; sign test p = ${binom(up, down).toFixed(3)}; worst ${Math.min(...d).toFixed(2)}; median pot ${Math.round(mean(rows.map(r => r.rollout.medianTerminalNet - r[k === 'pairedSame' ? 'same' : 'app'].medianTerminalNet)) / 1000)}k`);
  }
  console.log(`mean split ${mean(rows.map(r => r.rollout.splitMean)).toFixed(2)} (0.5 is even); uneven years ${mean(rows.map(r => r.rollout.unevenYears)).toFixed(1)} a run; solve ${Math.round(mean(rows.map(r => r.solveMs)) / 1000)}s, rollout ${Math.round(mean(rows.map(r => r.rollMs)) / 1000)}s per household`);
  console.log('=== couple gate reduced ===');
}
