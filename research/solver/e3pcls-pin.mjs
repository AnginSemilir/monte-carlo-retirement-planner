/*
 * THE GUARD ON E3'S LUMP-SUM HALF (e3pcls; the maintainer, 7 Oct 22:50 UK: 'yes, go ahead.' to 'Should e3pcls become
 * the research default, with the e3pcls test run on every solver change as the guard?'). e3pcls is exact only while two
 * lists stay complete (solve.js's comment above `E3P`): the places money can enter a pension, which the inflow rule
 * (`lastPenIn`) must name, and the places the lump-sum allowance is read, each behind a pension-above-zero guard. A later
 * edit that adds an inflow (a contribution by an owner not working, a deposit booked a year later) or an unguarded read
 * makes the copied tables wrong with no error, and no running check watched them. So, as agreed:
 *   - FINGERPRINT: a hash of the whole text of the solver's code - every file under src/solver, and the research files
 *     that decide what the candidate solves and how it is split (CODE below) - with each file's name. Any edit to any of
 *     them, a comment included, or a file added or removed, changes it. A narrower fingerprint of chosen lines was
 *     built first and missed an inflow edit (fast.js's dated deposit booked a year later; the plan-auditor, 8 Oct): the
 *     agreed guard is every solver change.
 *   - THE PIN (e3pcls-pin.json): the fingerprint the e3pcls identity test last passed on, written only by
 *     research/tests/solver-e3pcls.test.mjs --pin after every check in it has passed, and only if the fingerprint taken
 *     before its first solve is the one after its last.
 *   - THE CHECK (checkE3pclsPin): candidate.mjs's solveCandidate and e2.mjs's solveSplit refuse e3pcls while the pin is
 *     stale - re-run the test with --pin, or pass e3pcls: false (and declare it). A script that calls solvePlan itself
 *     with the candidate's or the research options calls checkE3pclsPin first: research/tests/e3pcls-guard.test.mjs scans
 *     every research/solver and research/tests script first committed from E3PCLS_FROM (the decision) for it, and the
 *     three older callers (solver-q-tsj.test.mjs, e3-default.test.mjs, e2.test.mjs) were given the call by hand.
 * What it does not see (RULES.md known limit 34): a direct solvePlan call with those options in a research script or test
 * first committed before E3PCLS_FROM that is not one of the three (audit-e2x.mjs, registered and left as it ran, calls
 * solveCandidate before its direct solve in every unit, so it refuses there first), or one whose options reach it through
 * a variable the scan cannot read; and a change outside CODE that alters the solve (the engine the plans come from).
 *   node research/solver/e3pcls-pin.mjs           prints the fingerprint and whether the pin matches
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '../..');
export const PIN_FILE = join(HERE, 'e3pcls-pin.json');
// the research files that decide what the candidate solves (its options and plan) and how a solve is split across cores
export const RESEARCH_CODE = ['research/solver/candidate.mjs', 'research/solver/research-opts.mjs', 'research/solver/e2.mjs', 'research/solver/e2-worker.mjs'];
const walk = (root, rel) => readdirSync(join(root, rel)).flatMap(n => { const r = `${rel}/${n}`; return statSync(join(root, r)).isDirectory() ? walk(root, r) : [r]; });
/* every file the fingerprint covers, sorted: all of src/solver, and RESEARCH_CODE */
export const codeFiles = (root = ROOT) => [...walk(root, 'src/solver'), ...RESEARCH_CODE].sort();
export const readSources = (root = ROOT) => Object.fromEntries(codeFiles(root).map(f => [f, readFileSync(join(root, f), 'utf8')]));
/* the hash of the texts given, keyed by file (the test passes planted copies): names and whole texts, in name order */
export function fingerprintOf(texts) {
  const h = createHash('sha256');
  for (const f of Object.keys(texts).sort()) { const t = texts[f]; if (typeof t !== 'string') throw new Error(`e3pcls-pin: no source for ${f}`); h.update(`${f}\0${t.length}\0`).update(t).update('\0'); }
  return h.digest('hex').slice(0, 16);
}
export const fingerprint = (root = ROOT) => fingerprintOf(readSources(root));
export const readPin = (file = PIN_FILE) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);

export const E3PCLS_FROM = '2026-10-07T22:50:00+01:00';   // the maintainer's decision: every script first committed from it is scanned
/* null when the pin matches the code; else the reason, to throw */
export function pinProblem(root = ROOT, file = PIN_FILE) {
  const pin = readPin(file);
  if (!pin) return `no e3pcls pin (${file}): run node research/tests/solver-e3pcls.test.mjs 4 --pin, or pass e3pcls: false`;
  const now = fingerprint(root);
  if (pin.fingerprint !== now) return `the e3pcls pin is stale: the solver's code changed since the identity test last passed (pinned ${pin.fingerprint} on ${pin.at}, now ${now}). Re-run node research/tests/solver-e3pcls.test.mjs 4 --pin, or pass e3pcls: false and declare it`;
  return null;
}

/* the check solveCandidate, solveSplit and a direct caller make before a solve with e3pcls on: throws when the pin is
   stale (`e3pclsPinFile`: tests only) */
export function checkE3pclsPin(opts = {}) {
  // e3pclsPinning: research/tests/solver-e3pcls.test.mjs alone, the check that writes the pin (the guard test refuses
  // the flag in any other file)
  if (!opts.e3pcls || opts.e3pclsPinning) return;
  const p = pinProblem(ROOT, opts.e3pclsPinFile || PIN_FILE);
  if (p) throw new Error(p);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const f = fingerprint(), p = readPin();
  console.log(`fingerprint ${f} over ${codeFiles().length} files; pin ${p ? `${p.fingerprint} (${p.at}, ${p.test} blob ${p.testBlob})` : 'none'}: ${p && p.fingerprint === f ? 'MATCHES' : 'STALE'}`);
}
