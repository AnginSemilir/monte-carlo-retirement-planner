/*
 * 7U-F'S READ, PLANTED (registrations/fresh-7uf.md; CHECKLIST.md item 5). reduce-7uf.mjs's rule on synthetic units: every
 * planted case reads as written (P1's three outcomes and its edge, P2's harm, the band, the loss size and Holm, the outcome's
 * four branches, the fair-test gate). Then each fault the rule could carry, made in a copy of the reducer, must turn at
 * least one case red: Holm dropped (the raw p), the band ignored, the loss size ignored, the gate accepting any setting,
 * P1 read against zero instead of minus 0.1.
 *   node research/tests/reduce-7uf.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOLVER = fileURLToPath(new URL('../solver/', import.meta.url)), SRC = join(SOLVER, 'reduce-7uf.mjs');
let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const badCases = cases => cases.filter(([, got, want]) => String(got) !== String(want)).map(([what]) => what);

const R = await import(pathToFileURL(SRC).href), cases = R.planted();
ok(cases.length >= 19 && badCases(cases).length === 0, `the rule reads all ${cases.length} planted cases as written${badCases(cases).length ? ` (not: ${badCases(cases).join('; ')})` : ''}`);

const MUTANTS = [
  ['Holm dropped (the raw p)', 'x.harm = x.pHolm < HARM_P && x.change <= -HARM_LOSS;', 'x.harm = x.p < HARM_P && x.change <= -HARM_LOSS;'],
  ['the band ignored', 'const inBand = shipS >= BAND[0] && shipS <= BAND[1];', 'const inBand = true;'],
  ['the loss size ignored', 'x.harm = x.pHolm < HARM_P && x.change <= -HARM_LOSS;', 'x.harm = x.pHolm < HARM_P;'],
  ['the gate accepting any setting', "if (px[k] !== py[k] && !ok.has(k)) out.push(", "if (false) out.push("],
  ['P1 against zero', "outcome: lo > -POOLED ? 'HELD' : hi < -POOLED ? 'FALSIFIED' : 'INCONCLUSIVE'", "outcome: lo > 0 ? 'HELD' : hi < 0 ? 'FALSIFIED' : 'INCONCLUSIVE'"]
];
const text = readFileSync(SRC, 'utf8');
for (const [name, from, to] of MUTANTS) {
  ok(text.includes(from), `the mutant's site is in the reducer (${name})`);
  const f = join(SOLVER, `.reduce-7uf-mutant-${process.pid}.mjs`);
  try {
    writeFileSync(f, text.replace(from, to));
    const red = badCases((await import(pathToFileURL(f).href + `?m=${encodeURIComponent(name)}`)).planted());
    ok(red.length > 0, `planted fault, ${name}: ${red.length} case(s) turn red (${red.slice(0, 2).join('; ')})`);
  } finally { rmSync(f, { force: true }); }
}
console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} checks of 7u-F's read failed`);
