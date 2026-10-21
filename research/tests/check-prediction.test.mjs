/*
 * THE REGISTRATION CHECK AND THE SEED REGISTRY, PLANTED (research/solver/check-prediction.mjs; CHECKLIST.md items 2 and 5).
 * A complete registration passes; each fault fails on its own: a missing or empty field, a placeholder left in a field,
 * no configuration hash in Arms, no registry seed in Seed, and the design review: no file named, a named file that does not
 * exist, one whose verdict is FAIL or missing (21 Oct: a placeholder "<PASS, ...>" read as complete, since the check only
 * looked for the word). The seed registry: a reserved seed under a measurement or under another registration is refused;
 * its owner may use it, but only if its Seed field declares every seed the run uses.
 *   node research/tests/check-prediction.test.mjs
 */
import assert from 'node:assert/strict';
import { registrationProblems, seedLaunchProblems, verdictOf } from '../solver/check-prediction.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const REVIEW = 'research/solver/reviews/2026-10-21-fresh-7uf.md';
const files = { [REVIEW]: 'Subject: 7u-F\nVerdict: PASS\n1. MINOR ...', 'research/solver/reviews/fail.md': '**Verdict:** FAIL\n1. BLOCKING ...', 'research/solver/reviews/none.md': 'PASS, they said\n' };
const io = { root: '/r', exists: f => Object.keys(files).some(k => f === `/r/${k}`), read: f => files[f.slice(3)] };
const reg = (o = {}) => Object.entries({ Question: 'Does it harm?', Arms: 'SHIP `07c069b6e330`, CAND `e65e5e99ba49`', Households: 'nineteen, named', Seed: '7014, used once',
  Paths: '16,000', 'Primary metric': 'survival by the engine', 'Decision rule': 'D3', Outcomes: 'PASS: Phase 4', 'Design review': `PASS, ${REVIEW}`, ...o })
  .filter(([, v]) => v !== undefined).map(([k, v]) => `- **${k}:** ${v}`).join('\n');
const probs = (o, x = io) => registrationProblems(reg(o), x);

ok(probs({}).length === 0, `a complete registration passes (${probs({}).join('; ') || 'no problems'})`);
ok(probs({ Outcomes: undefined }).some(p => /no "- \*\*Outcomes/.test(p)), 'planted: a missing field fails');
ok(probs({ Paths: '' }).some(p => /"Paths" is empty/.test(p)), 'planted: an empty field fails');
ok(probs({ Households: '<the panel, named before the seed is read>' }).some(p => /placeholder/.test(p)), 'planted: a placeholder left in a field fails');
ok(probs({ Arms: 'SHIP and CAND' }).some(p => /configuration hash/.test(p)), 'planted: Arms with no configuration hash fails');
ok(probs({ Seed: '7002, the tuning seed' }).some(p => /held-out seed/.test(p)), 'planted: a Seed with no reserved seed fails');
ok(probs({ 'Design review': '<PASS, research/solver/reviews/<date>-fresh-7uf.md>' }).length > 0, 'planted (the 21 Oct fault): the template\'s placeholder, which holds the word PASS, fails');
ok(probs({ 'Design review': 'PASS' }).some(p => /names no review file/.test(p)), 'planted: the word PASS with no review file fails');
ok(probs({ 'Design review': 'PASS, research/solver/reviews/missing.md' }).some(p => /does not exist/.test(p)), 'planted: a review file that does not exist fails');
ok(probs({ 'Design review': 'PASS, research/solver/reviews/fail.md' }).some(p => /no "Verdict: PASS" \(FAIL\)/.test(p)), 'planted: a review whose verdict is FAIL fails, whatever the field says');
ok(probs({ 'Design review': 'PASS, research/solver/reviews/none.md' }).some(p => /no verdict line/.test(p)), 'planted: a review with no verdict line fails');
ok(verdictOf('**Verdict:** PASS') === 'PASS' && verdictOf('Verdict: FAIL') === 'FAIL' && verdictOf('verdict pass') === null, 'EDGE: the verdict line read with markdown emphasis; a line without the colon is not one');

// the seed registry at launch
const S = (name, predText, text) => seedLaunchProblems({ name, predText, texts: [text] });
ok(S(null, '', 'node audit-7uf.mjs 16000 part 0/1 7014').some(p => /reserved/.test(p)), 'planted: the held-out seed under a measurement is refused');
ok(S('research/solver/registrations/phase-4.md', reg({ Seed: '7003' }), 'node x.mjs 7014').some(p => /reserved/.test(p)), 'planted: 7014 under Phase 4\'s registration is refused');
ok(S('research/solver/registrations/fresh-7uf.md', reg(), 'node audit-7uf.mjs 16000 part 0/1 7014').length === 0, 'its owner (fresh-7uf*.md) may use 7014');
ok(S('research/solver/registrations/fresh-7uf.md', reg(), 'node audit-7uf.mjs 7014; node other.mjs 7002').some(p => /does not declare/.test(p)), 'planted: a seed the run uses that the Seed field does not declare is refused');

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} registration checks failed`);
