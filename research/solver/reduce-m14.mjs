/*
 * REDUCER FOR PROBE M14 (PLAN.md finding M14): one tier ABOVE the plan's allowed, against down-only, both with the
 * plan held at Medium, paired on the same 3,000 paths. Reports survival (paired), running out within 20 years,
 * the worst 5% of years funded, years unfunded per path, and WHERE the up-moves happen: the share of up-move years
 * in which the path's wealth sits below that year's median across all paths (the toy's "only when behind").
 *
 *   node research/solver/reduce-m14.mjs
 */
import { readRecord } from './record.mjs';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
// UP / DOWN: the two arms' tags (m14-up / m14-down by default; m14b-up / m14b-down for the re-check under the step-6 defaults)
const UP = process.env.UP || 'm14-up', DOWN = process.env.DOWN || 'm14-down';
const ids = existsSync(join(R, UP)) ? readdirSync(join(R, UP)).filter(f => f.endsWith('.solver.record.json.gz')).map(f => f.slice(0, 4)).sort() : [];
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
function stats(rec) {
  const { N, Y, trace: tr, paths: P } = rec;
  let surv = 0, early = 0, unfunded = 0; const funded = [];
  for (let i = 0; i < N; i++) {
    if (P.survived[i]) { surv++; funded.push(Y); continue; }
    const t = tr.failYear[i] > 0 ? tr.failYear[i] : Y; funded.push(t); unfunded += Math.max(0, (Y - 1) - t); if (t < 20) early++;
  }
  funded.sort((a, b) => a - b);
  // where up-moves happen: tier code 15 = pension and ISA both one above (index 3)
  let up = 0, upBehind = 0, years = 0;
  for (let t = 0; t < Y; t++) {
    const w = []; for (let i = 0; i < N; i++) { const k = i * Y + t; if (tr.level[k]) w.push(tr.wealth[k]); }
    if (!w.length) continue; w.sort((a, b) => a - b); const med = w[w.length >> 1];
    for (let i = 0; i < N; i++) { const k = i * Y + t; if (!tr.level[k]) continue; years++; if (tr.tier[k] === 15) { up++; if (tr.wealth[k] < med) upBehind++; } }
  }
  return { ok: P.survived, surv: 100 * surv / N, early: 100 * early / N, p5: funded[Math.floor(0.05 * (N - 1))], unfunded: unfunded / N, upShare: years ? 100 * up / years : 0, upBehind: up ? 100 * upBehind / up : NaN };
}
console.log('PROBE M14 - one tier above allowed (plan held at Medium), paired against down-only on the same paths');
console.log('  id     survival down -> up (paired +/- se)    ran out < 20y   worst 5% funded   unfunded/path   years above   of which behind (below median wealth)');
for (const id of ids) {
  const fd = join(R, DOWN, `${id}.solver.record.json.gz`), fu = join(R, UP, `${id}.solver.record.json.gz`);
  if (!existsSync(fd) || !existsSync(fu)) continue;
  const d = stats(readRecord(fd)), u = stats(readRecord(fu));
  let disc = 0; for (let i = 0; i < d.ok.length; i++) if (d.ok[i] !== u.ok[i]) disc++;
  const se = 100 * Math.sqrt(disc) / d.ok.length;
  console.log(`  ${id}   ${f(d.surv, 2)} -> ${f(u.surv, 2)} (${(u.surv - d.surv >= 0 ? '+' : '') + f(u.surv - d.surv, 2)} +/- ${f(se, 2)})    ${f(d.early)} -> ${f(u.early)}%      ${d.p5} -> ${u.p5} yrs        ${f(d.unfunded, 2)} -> ${f(u.unfunded, 2)}      ${f(u.upShare)}%        ${f(u.upBehind)}%`);
}
