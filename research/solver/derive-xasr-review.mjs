/*
 * THE DEEP REVIEW AFTER XAS-R'S FIGURES, over XAS-R's gated files (deep-review-log.md 5 Oct 23:18 UK read them by scratch;
 * committed here so the plan can cite them: CHECKLIST item 4). Every gate but the BASE guard is run first, as
 * derive-xasr-observed.mjs runs it (rule 3). Then, per household, arm and year before a step:
 *   1. the arm-blind node cache's signature (O109): mean (va - ex5), and the reads with va at the clamp (1e-6 or 1 - 1e-6),
 *      by world - COV's (v-a) built on BASE's nodes moves like BASE's;
 *   2. BASE's midpoint node (vb) against the reader: mean (vb - read), and the share of top-cell reads whose 0.9 node is
 *      supported (vbs above 0);
 *   3. S126's opening terms (case2.txt): score = surv + beq - short; the move-59-less-move-5 gap per arm, its terms, and
 *      COV's change in each.
 * Grade: the figures A (exact over the gated files); what they mean is the review's (grade C, post hoc).
 *   node research/solver/derive-xasr-review.mjs > research/solver/results-derive-xasr-review.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, checkFile, openCheck, xasFiles, stampOf, PRED, READ_UNITS } from './reduce-xasr.mjs';
import { logsOf } from './reduce-xas.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const CLAMP = 1e-6;
export const atClamp = v => v <= CLAMP * (1 + 1e-9) || v >= 1 - CLAMP * (1 + 1e-9);
export function termsOf(text) {
  const T = {};
  for (const m of text.matchAll(/terms (BASE|COV) (BASE|COV)-move (\d+): score (\S+) surv (\S+) resil (\S+) beq (\S+) short (\S+)/g))
    T[`${m[1]} ${m[3]}`] = { score: +m[4], surv: +m[5], resil: +m[6], beq: +m[7], short: +m[8] };
  return T;
}
// the score's terms as they enter it: surv + resil + beq - short
export const gapOf = (T, arm, a, b) => { const x = T[`${arm} ${a}`], y = T[`${arm} ${b}`]; return { surv: x.surv - y.surv, resil: x.resil - y.resil, beq: x.beq - y.beq, short: -(x.short - y.short), score: x.score - y.score }; };
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const e = x => x.toExponential(4);

// PLANTED (rule 6): the clamp test, the terms parser and the gap's sign on short
{
  const T = termsOf('terms BASE BASE-move 59: score 1.5e+0 surv 1.0e+0 resil 0.0e+0 beq 6.0e-1 short 1.0e-1\nterms BASE COV-move 5: score 1.0e+0 surv 9.0e-1 resil 0.0e+0 beq 2.0e-1 short 1.0e-1');
  const g = gapOf(T, 'BASE', '59', '5');
  const ok = atClamp(1e-6) && atClamp(1 - 1e-6) && !atClamp(2e-6) && !atClamp(0.5) && Object.keys(T).length === 2 && Math.abs(g.beq - 0.4) < 1e-12 && Math.abs(g.short) < 1e-12 && Math.abs(g.surv - 0.1) < 1e-12
    && Math.abs(gapOf(termsOf('terms COV BASE-move 1: score 0 surv 0 resil 0 beq 0 short 2.0e-1\nterms COV COV-move 2: score 0 surv 0 resil 0 beq 0 short 1.0e-1'), 'COV', '1', '2').short + 0.1) < 1e-12;
  if (!ok) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify({ T, g })}`); process.exit(1); }
}

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagxasr');
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units), files = {};
const X = bad.length ? null : xasFiles();
if (X && X.bad.length) bad.push(...X.bad.map(x => `XAS's own gate: ${x}`));
if (!bad.length) {
  const st = stampOf(Object.values(logs)[0]);
  for (const u of units) { const f = join(DIR, fileOf(u.id)), t = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(t, u, st, X.files[u.id])); files[u.id] = t; }
  bad.push(...openCheck(units.find(u => u.id === 'S126'), X.s126));
}
if (bad.length) { console.log(`GATE (all but the BASE guard): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('GATE (all but the BASE guard, which results-xasr.txt reports failed): passed; planted: passed\n');

console.log('1. THE NODE CACHE\'S SIGNATURE (O109): mean (va - ex5), reads with va at the clamp (all, by world), per arm');
for (const id of READ_UNITS) {
  const t = files[id];
  for (const y of [...new Set(t.t)].sort((a, b) => a - b)) {
    const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), K = [...new Set(J.map(j => t.k[j]))].sort();
    for (const a of ['BASE', 'COV']) {
      const A = t.arms[a], c = J.filter(j => atClamp(A.va[j]));
      console.log(`  ${id.padEnd(9)} year ${y} ${a.padEnd(4)} reads ${J.length}  mean (va - ex5) ${e(mean(J.map(j => A.va[j] - A.ex5[j])))}  at the clamp ${c.length} (by world ${K.map(k => `${k}:${c.filter(j => t.k[j] === k).length}/${J.filter(j => t.k[j] === k).length}`).join(' ')})`);
    }
  }
}
console.log('\n2. BASE\'S MIDPOINT NODE AGAINST THE READER: mean (vb - read); top-cell reads with the 0.9 node supported (vbs above 0)');
for (const id of READ_UNITS) {
  const t = files[id], A = t.arms.BASE;
  for (const y of [...new Set(t.t)].sort((a, b) => a - b)) {
    const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), Jt = J.filter(j => t.top[j] === 1), s = Jt.filter(j => A.vbs[j] > 0).length;
    console.log(`  ${id.padEnd(9)} year ${y} mean (vb - read) ${e(mean(J.map(j => A.vb[j] - A.read[j])))}  max |vb - read| ${e(Math.max(...J.map(j => Math.abs(A.vb[j] - A.read[j]))))}  supported ${s} of ${Jt.length} top-cell reads (${(100 * s / Jt.length).toFixed(1)}%)`);
  }
}
console.log('\n3. S126\'S OPENING TERMS (results/diagxasr/case2.txt; score = surv + resil + beq - short): the move-59-less-move-5 gap');
const T = termsOf(readFileSync(join(DIR, 'case2.txt'), 'utf8'));
if (Object.keys(T).length !== 4) { console.log(`  the terms lines: ${Object.keys(T).length} of 4 - refused`); process.exit(1); }
const gB = gapOf(T, 'BASE', '59', '5'), gC = gapOf(T, 'COV', '59', '5');
for (const [nm, g] of [['BASE', gB], ['COV', gC]]) console.log(`  ${nm.padEnd(4)} gap: surv ${e(g.surv)} resil ${e(g.resil)} beq ${e(g.beq)} -short ${e(g.short)}  sum ${e(g.surv + g.resil + g.beq + g.short)} (score ${e(g.score)}, rounded)`);
const d = k => gC[k] - gB[k];
console.log(`  COV's change: surv ${e(d('surv'))} beq ${e(d('beq'))} -short ${e(d('short'))}  sum ${e(d('surv') + d('resil') + d('beq') + d('short'))}`);
