# PROPOSED, NOT APPLIED: candidate.test.mjs's pins for D137, to be applied only under the maintainer's unlock naming the file.
# The candidate 17ff82379838 -> bf1cac401c13 (saveSplit: true added); BEFORE_D137_OPTS reproduces 17ff82379838; the D90 check
# re-based on BEFORE_D137_OPTS (its hash af001697ce1b unchanged). Run: python3 <this> /path/to/research/tests/candidate.test.mjs
import sys
p = sys.argv[1]
s = open(p).read()
pairs = [
("BEFORE_D90_OPTS, BEFORE_D90_HASH, D90_KEYS } from '../solver/candidate.mjs';",
 "BEFORE_D90_OPTS, BEFORE_D90_HASH, D90_KEYS, BEFORE_D137_OPTS, BEFORE_D137_HASH, D137_KEYS } from '../solver/candidate.mjs';"),
("""// D90 (1) (13 Nov): item 13's tie-break above the estate cap joined after the couples' registered read. The candidate before it
// (af001697ce1b, the candidate that read read) is candidate.json less its one key; every earlier candidate is built from it
ok(BEFORE_D90_HASH === 'af001697ce1b' && hashOf(BEFORE_D90_OPTS) === BEFORE_D90_HASH && Object.keys(CANDIDATE_OPTS).length === Object.keys(BEFORE_D90_OPTS).length + D90_KEYS.length && D90_KEYS.every(k => k in CANDIDATE_OPTS && !(k in BEFORE_D90_OPTS))
  && CANDIDATE_OPTS.tieAboveCap === 1e-4 && CANDIDATE_HASH === '17ff82379838',
  `the candidate before D90's tie-break reproduces its hash af001697ce1b (${BEFORE_D90_HASH}); the candidate ${CANDIDATE_HASH} adds ${D90_KEYS.join(', ')} at 1e-4 (D85's margin)`);
ok(hashOf({ ...CANDIDATE_OPTS, tieAboveCap: 1e-5 }) !== CANDIDATE_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 1e-4 }) === CANDIDATE_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 0 }) !== BEFORE_D90_HASH, 'planted: another margin, or the margin written out as nought on the candidate before it, moves the hash; the candidate before it with the margin added is the candidate');""",
"""// D137 (21 Nov): the savings split joined for singles who work and save, by the savings split's v2 read (registered, seed 7025,
// PASS: results-save-v2.txt). The candidate before it (17ff82379838, the candidate that read and step 8's read read) is
// candidate.json less its one key; every earlier candidate is built from it
ok(BEFORE_D137_HASH === '17ff82379838' && hashOf(BEFORE_D137_OPTS) === BEFORE_D137_HASH && Object.keys(CANDIDATE_OPTS).length === Object.keys(BEFORE_D137_OPTS).length + D137_KEYS.length && D137_KEYS.every(k => k in CANDIDATE_OPTS && !(k in BEFORE_D137_OPTS))
  && CANDIDATE_OPTS.saveSplit === true && CANDIDATE_HASH === 'bf1cac401c13',
  `the candidate before D137's savings split reproduces its hash 17ff82379838 (${BEFORE_D137_HASH}); the candidate ${CANDIDATE_HASH} adds ${D137_KEYS.join(', ')} true`);
ok(hashOf({ ...BEFORE_D137_OPTS, saveSplit: true }) === CANDIDATE_HASH && hashOf({ ...BEFORE_D137_OPTS, saveSplit: false }) !== BEFORE_D137_HASH && hashOf({ ...CANDIDATE_OPTS, saveSplit: 'yes' }) !== CANDIDATE_HASH, 'planted: the split written out as off on the candidate before it, or given another value, moves the hash; the candidate before it with the split added is the candidate');
// D90 (1) (13 Nov): item 13's tie-break above the estate cap joined after the couples' registered read. The candidate before it
// (af001697ce1b, the candidate that read read) is the candidate before D137 less its one key; every earlier candidate is built from it
ok(BEFORE_D90_HASH === 'af001697ce1b' && hashOf(BEFORE_D90_OPTS) === BEFORE_D90_HASH && Object.keys(BEFORE_D137_OPTS).length === Object.keys(BEFORE_D90_OPTS).length + D90_KEYS.length && D90_KEYS.every(k => k in BEFORE_D137_OPTS && !(k in BEFORE_D90_OPTS))
  && BEFORE_D137_OPTS.tieAboveCap === 1e-4 && CANDIDATE_OPTS.tieAboveCap === 1e-4,
  `the candidate before D90's tie-break reproduces its hash af001697ce1b (${BEFORE_D90_HASH}); the candidate after it (${BEFORE_D137_HASH}) adds ${D90_KEYS.join(', ')} at 1e-4 (D85's margin)`);
ok(hashOf({ ...BEFORE_D137_OPTS, tieAboveCap: 1e-5 }) !== BEFORE_D137_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 1e-4 }) === BEFORE_D137_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 0 }) !== BEFORE_D90_HASH, 'planted: another margin, or the margin written out as nought on the candidate before it, moves the hash; the candidate before it with the margin added is the candidate before D137');"""),
]
for old, new in pairs:
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
open(p, 'w').write(s)
print('applied')
