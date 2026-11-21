# candidate.test.mjs's pins for D138, under the maintainer's unlock (D137 (2)): the candidate 17ff82379838 -> 06bc8f910b3f
# (saveSplit: true and saveIsaFirst: 'selfEmployed' added); BEFORE_D138_OPTS reproduces 17ff82379838; the split alone is the
# registered CANDSA's bf1cac401c13; the D90 check re-based on BEFORE_D138_OPTS (its hash af001697ce1b unchanged).
# Run: python3 <this> /path/to/research/tests/candidate.test.mjs
import sys
p = sys.argv[1]
s = open(p).read()
pairs = [
("BEFORE_D90_OPTS, BEFORE_D90_HASH, D90_KEYS } from '../solver/candidate.mjs';",
 "BEFORE_D90_OPTS, BEFORE_D90_HASH, D90_KEYS, BEFORE_D138_OPTS, BEFORE_D138_HASH, D138_KEYS } from '../solver/candidate.mjs';"),
("""// D90 (1) (13 Nov): item 13's tie-break above the estate cap joined after the couples' registered read. The candidate before it
// (af001697ce1b, the candidate that read read) is candidate.json less its one key; every earlier candidate is built from it
ok(BEFORE_D90_HASH === 'af001697ce1b' && hashOf(BEFORE_D90_OPTS) === BEFORE_D90_HASH && Object.keys(CANDIDATE_OPTS).length === Object.keys(BEFORE_D90_OPTS).length + D90_KEYS.length && D90_KEYS.every(k => k in CANDIDATE_OPTS && !(k in BEFORE_D90_OPTS))
  && CANDIDATE_OPTS.tieAboveCap === 1e-4 && CANDIDATE_HASH === '17ff82379838',
  `the candidate before D90's tie-break reproduces its hash af001697ce1b (${BEFORE_D90_HASH}); the candidate ${CANDIDATE_HASH} adds ${D90_KEYS.join(', ')} at 1e-4 (D85's margin)`);
ok(hashOf({ ...CANDIDATE_OPTS, tieAboveCap: 1e-5 }) !== CANDIDATE_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 1e-4 }) === CANDIDATE_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 0 }) !== BEFORE_D90_HASH, 'planted: another margin, or the margin written out as nought on the candidate before it, moves the hash; the candidate before it with the margin added is the candidate');""",
"""// D138 (21 Nov): the savings split joined for singles who work and save, by the savings split's v2 read (registered, seed 7025,
// PASS: results-save-v2.txt), with the ISA first held back for an employee (D137 (4)). The candidate before it (17ff82379838,
// the candidate that read and step 8's read read) is candidate.json less its two keys; with the split alone it is the
// registered CANDSA's configuration (bf1cac401c13); every earlier candidate is built from it
ok(BEFORE_D138_HASH === '17ff82379838' && hashOf(BEFORE_D138_OPTS) === BEFORE_D138_HASH && Object.keys(CANDIDATE_OPTS).length === Object.keys(BEFORE_D138_OPTS).length + D138_KEYS.length && D138_KEYS.every(k => k in CANDIDATE_OPTS && !(k in BEFORE_D138_OPTS))
  && CANDIDATE_OPTS.saveSplit === true && CANDIDATE_OPTS.saveIsaFirst === 'selfEmployed' && CANDIDATE_HASH === '06bc8f910b3f' && hashOf({ ...BEFORE_D138_OPTS, saveSplit: true }) === 'bf1cac401c13',
  `the candidate before D138 reproduces its hash 17ff82379838 (${BEFORE_D138_HASH}); the candidate ${CANDIDATE_HASH} adds ${D138_KEYS.join(', ')}; with the split alone, the registered CANDSA's bf1cac401c13 (${hashOf({ ...BEFORE_D138_OPTS, saveSplit: true })})`);
ok(hashOf({ ...BEFORE_D138_OPTS, saveSplit: true, saveIsaFirst: 'selfEmployed' }) === CANDIDATE_HASH && hashOf({ ...BEFORE_D138_OPTS, saveSplit: false }) !== BEFORE_D138_HASH && hashOf({ ...CANDIDATE_OPTS, saveIsaFirst: 'all' }) !== CANDIDATE_HASH && hashOf({ ...CANDIDATE_OPTS, saveSplit: 'yes' }) !== CANDIDATE_HASH, 'planted: the split written out as off on the candidate before it, the hold or the split given another value, each moves the hash; the candidate before it with the two keys added is the candidate');
// D90 (1) (13 Nov): item 13's tie-break above the estate cap joined after the couples' registered read. The candidate before it
// (af001697ce1b, the candidate that read read) is the candidate before D138 less its one key; every earlier candidate is built from it
ok(BEFORE_D90_HASH === 'af001697ce1b' && hashOf(BEFORE_D90_OPTS) === BEFORE_D90_HASH && Object.keys(BEFORE_D138_OPTS).length === Object.keys(BEFORE_D90_OPTS).length + D90_KEYS.length && D90_KEYS.every(k => k in BEFORE_D138_OPTS && !(k in BEFORE_D90_OPTS))
  && BEFORE_D138_OPTS.tieAboveCap === 1e-4 && CANDIDATE_OPTS.tieAboveCap === 1e-4,
  `the candidate before D90's tie-break reproduces its hash af001697ce1b (${BEFORE_D90_HASH}); the candidate after it (${BEFORE_D138_HASH}) adds ${D90_KEYS.join(', ')} at 1e-4 (D85's margin)`);
ok(hashOf({ ...BEFORE_D138_OPTS, tieAboveCap: 1e-5 }) !== BEFORE_D138_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 1e-4 }) === BEFORE_D138_HASH && hashOf({ ...BEFORE_D90_OPTS, tieAboveCap: 0 }) !== BEFORE_D90_HASH, 'planted: another margin, or the margin written out as nought on the candidate before it, moves the hash; the candidate before it with the margin added is the candidate before D138');"""),
]
for old, new in pairs:
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
open(p, 'w').write(s)
print('applied')
