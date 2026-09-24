/*
 * REDUCER FOR K5 (PLAN.md "K5. Guardrail matching"): the guardrails-with-floor targets, and the grid against them.
 *
 *   node research/solver/reduce-k5.mjs targets             the targets under each world / cap / minimum-pot setting
 *   TARGET=k5t-fold-cap node research/solver/reduce-k5.mjs  the stage-1 grid (results/k5-c<c>-x<exp>) against a target
 *
 * The target must be measured under the SAME settings as the solver cells it is compared with: the market world
 * (MIX), the raise cap (the guardrails honour the user's cap, M23) and the minimum pot. Stage 1's cells are MIX=0,
 * RAISECAP=1.1, MINPOTYEARS=1, so their target is k5t-fold-cap. Found 24 Sep ~08:45: the first target used,
 * results/flex-tiers, was the mixture world, uncapped, with each plan's own pot - three mismatches.
 *
 * total cut = years below target x (1 - level when below), in years of target spending (per household, means over
 * the 3,000 held paths, seed 7002); raise total = years above x (level when above - 1). Medians over households.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = join(dirname(fileURLToPath(import.meta.url)), 'results');
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const load = (tag, id, arm) => { const p = join(D, tag, `${id}.json`); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8'))[arm] : null; };
const cut = g => g.belowYearsMean * (1 - g.levelWhenBelowMean);
const raise = g => g.aboveTargetYearsMean * (g.levelWhenAboveMean - 1);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const IDS = readdirSync(join(D, 'k5t-fold-cap')).filter(x => /^S\d+\.json$/.test(x)).map(x => x.slice(0, -5)).sort();

if (process.argv[2] === 'targets') {
  const SETS = [
    ['flex-tiers', 'mixture, no cap, own pot (the target first used)'],
    ['k5t-mix-nocap-ownpot', 'mixture, no cap, own pot (re-run: must reproduce flex-tiers)'],
    ['k5t-mix-nocap', 'mixture, no cap, 1-year pot'],
    ['k5t-mix-cap', 'mixture, cap 1.1, 1-year pot (stage 3 and Phase 4)'],
    ['k5t-fold-nocap', 'fold, no cap, 1-year pot'],
    ['k5t-fold-cap', 'fold, cap 1.1, 1-year pot (stage 1)']
  ].filter(([t]) => existsSync(join(D, t)));
  console.log(`K5 TARGETS: the guardrails with the floor (gkFloor), ${IDS.length} households, 3,000 held paths (seed 7002)`);
  console.log('  per household: years below @ level when below / total cut / raise total / survival');
  for (const id of IDS) console.log(`  ${id}  ${SETS.map(([t]) => { const g = load(t, id, 'gkFloor'); return g ? `${f(g.belowYearsMean, 1).padStart(4)}@${f(g.levelWhenBelowMean, 3)} ${f(cut(g))} ${f(raise(g))} ${f(g.successRate, 1).padStart(5)}` : '-'; }).join(' | ')}`);
  console.log('  medians over the households:');
  for (const [t, what] of SETS) {
    const gs = IDS.map(id => load(t, id, 'gkFloor')).filter(Boolean);
    console.log(`  ${t.padEnd(22)} total cut ${f(med(gs.map(cut)))} (${f(Math.min(...gs.map(cut)))}-${f(Math.max(...gs.map(cut)))})  depth ${f(med(gs.map(g => g.levelWhenBelowMean)), 3)}  years below ${f(med(gs.map(g => g.belowYearsMean)), 1)}  raise total ${f(med(gs.map(raise)))}  survival ${f(med(gs.map(g => g.successRate)), 1)}   ${what}`);
  }
  process.exit(0);
}

const TARGET = process.env.TARGET || 'k5t-fold-cap';
const tg = IDS.map(id => load(TARGET, id, 'gkFloor'));
const tCut = med(tg.map(cut)), tDepth = med(tg.map(g => g.levelWhenBelowMean)), tRaise = med(tg.map(raise));
console.log(`K5 STAGE 1 against ${TARGET}: guardrails' median total cut ${f(tCut)}, depth ${f(tDepth, 3)}, raise total ${f(tRaise)}`);
console.log('  match (i) median total cut within 10%; (ii) median depth within 0.03; R4: stage 2 runs if the median raise total is outside +/-10% of the target');
const cells = readdirSync(D).map(t => /^k5-c([\d.]+)-x([\d.]+)$/.exec(t)).filter(Boolean).map(m => ({ tag: m[0], c: Number(m[1]), x: Number(m[2]) })).sort((a, b) => a.x - b.x || a.c - b.c);
for (const { tag, c, x } of cells) {
  const sv = IDS.map(id => load(tag, id, 'solver'));
  const n = sv.filter(Boolean).length;
  if (!n) continue;
  const have = IDS.map((id, i) => [sv[i], tg[i]]).filter(([s]) => s);
  const sCut = med(have.map(([s]) => cut(s))), sDepth = med(have.map(([s]) => s.levelWhenBelowMean).filter(Number.isFinite)), sRaise = med(have.map(([s]) => raise(s)));
  const ahead = have.filter(([s, g]) => s.successRate >= g.successRate).length;
  const ok1 = Math.abs(sCut / tCut - 1) <= 0.1, ok2 = Math.abs(sDepth - tDepth) <= 0.03;
  console.log(`  c ${String(c).padEnd(6)} exp ${x}  n ${String(n).padStart(2)}  total cut ${f(sCut)} (${f(100 * (sCut / tCut - 1), 0).padStart(4)}%)${ok1 ? ' OK' : '   '}  depth ${f(sDepth, 3)}${ok2 ? ' OK' : '   '}  raise total ${f(sRaise)} (${f(100 * (sRaise / tRaise - 1), 0)}%)  survival at/above the guardrails' on ${ahead}/${n}`);
}
