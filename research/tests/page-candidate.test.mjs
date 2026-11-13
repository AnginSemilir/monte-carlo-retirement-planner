/*
 * THE CANDIDATE THE PAGE NAMES IS THE CANDIDATE THE APP SOLVES (13 Nov 2026; the reviewer on the change of default D95, finding 7).
 * Details' settings line (src/PlannerCards.jsx) says "The candidate <hash>." as plain text, held by nothing: D95's port had to
 * change it by hand. Here: the hash it names is the app's candidate's (src/solverSettings.js APP_CANDIDATE, hashed as
 * candidate.mjs hashes the research candidate), which is the research candidate's.
 * The plant (--planted): the page's text with the hash of the candidate before D95; the check fails.
 *   node research/tests/page-candidate.test.mjs [--planted]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashOf, CANDIDATE_HASH, BEFORE_D90_HASH } from '../solver/candidate.mjs';
import { APP_CANDIDATE } from '../../src/solverSettings.js';
const HERE = dirname(fileURLToPath(import.meta.url)), PLANTED = process.argv.includes('--planted');
let text = readFileSync(join(HERE, '../../src/PlannerCards.jsx'), 'utf8');
if (PLANTED) text = text.replace(`The candidate ${CANDIDATE_HASH}.`, `The candidate ${BEFORE_D90_HASH}.`);
const named = [...text.matchAll(/The candidate ([0-9a-f]{12})\./g)].map(m => m[1]), app = hashOf({ ...APP_CANDIDATE });
const ok = named.length === 1 && named[0] === app && app === CANDIDATE_HASH;
console.log(`${ok ? 'PASS' : 'FAIL'}  the page names the candidate once, by the hash of the app's candidate, which is the research candidate's  -- the page ${named.join(', ') || 'names none'}; the app's ${app}; the research candidate's ${CANDIDATE_HASH}`);
if (PLANTED) { console.log(`planted (the page naming the candidate before D95): the check ${ok ? 'PASSES: NOT CAUGHT' : 'fails, as it should'}`); process.exit(ok ? 1 : 0); }
console.log(ok ? '\nALL PASS: 1 check' : '\nFAILED: 1 of 1 checks');
process.exit(ok ? 0 : 1);
