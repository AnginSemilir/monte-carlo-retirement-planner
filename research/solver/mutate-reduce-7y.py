#!/usr/bin/env python3
# THE 7Y REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7y.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs. The paired cells and the
# Holm families are reduce-7v.mjs's (mutated there, results-reduce-7v-mutations.txt); the switching count is read-7t-deep.mjs's.
#   python3 research/solver/mutate-reduce-7y.py > research/solver/results-reduce-7y-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7y.mjs'), os.path.join(HERE, 'zz-mut-7y.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${kind}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/${kind}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${kind}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/${kind}: ${k} unit lines, not 1`)"),
    ("the gate ignores a second setting changed within a case", "if (u.solves[s] && u.solves[s].ran && ref && strip(u.solves[s].ran) !== strip(ref.ran))", "if (false)"),
    ("the gate strips the minimum pot with the tier state", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ holdTier \\S+/, '');", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ holdTier \\S+/, '').replace(/ minPot \\S+/, '');"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the path count", "paths: String(N), grid", "grid"),
    ("the gate does not read the points", "pts: PTS, seed", "seed"),
    ("the gate does not read the return points", "quad: '5', finalIntegral", "finalIntegral"),
    ("the gate does not read the final year", "finalIntegral: 'true', bridgeRead", "bridgeRead"),
    ("the gate does not read the tier state", "if (!!field(x.ran, 'tierState') !== (s === 'TS'))", "if (false)"),
    ("the gate does not read the held tier", "if ((field(x.ran, 'holdTier') === '0/0') !== (s === 'H0') || (s !== 'H0' && field(x.ran, 'holdTier') !== null))", "if (false)"),
    ("the gate does not read Q's fix", "if (field(x.ran, 'bridgeStep') !== null)", "if (false)"),
    ("the gate reads the bridge read the wrong way for OFF", "bridgeRead: u.arm === 'READER' ? 'reader' : 'false' }", "bridgeRead: 'reader' }"),
    ("the gate ignores the solved margin", "if (x.joint.margin !== '0.001')", "if (false)"),
    ("the gate accepts a missing solve", "if (Object.keys(u.solves).sort().join(',') !== [...want].sort().join(','))", "if (false)"),
    ("the gate accepts a missing run", "if (Object.keys(u.runs).sort().join(',') !== [...rw].sort().join(','))", "if (false)"),
    ("the gate accepts a missing swap line", "if (u.kind === 'S' && Object.keys(u.swaps).sort().join(',') !== 'TS-REST,TS-TIER')", "if (false)"),
    ("the gate accepts a missing gap line", "if (s !== 'H0' && !x.gap) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing done line", "if (!u.done) bad.push", "if (false) bad.push"),
    ("the gate ignores a PRODUCT re-solve that differs", "P.solves.PRODUCT.table !== S.solves.PRODUCT.table", "false"),
    ("the gate ignores a TS re-solve that differs", "T.solves.TS.table !== S.solves.TS.table", "false"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
    ("a trace's arm not compared", "j.arm === `${arm}/${label}` && ", ""),
    ("a trace's survival allowed at three decimals", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-4 + 1e-9;"),
    ("a trace's survival compared strictly inside the rounding", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-5 - 1e-9;"),
    # the items
    ("the legs the wrong way round", "k: cells(S(id, arm, 'PRODUCT'), S(id, arm, label))", "k: cells(S(id, arm, label), S(id, arm, 'PRODUCT'))"),
    ("item 1 held on one case", "outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain') });", "outcome: i1.some(x => x.o === 'gain') ? 'HELD' : 'INCONCLUSIVE' });"),
    ("item 2 held without the rest's null", "const held2 = tier.every(x => x.o === 'gain') && rest.every(x => x.o === 'no material gain');", "const held2 = tier.every(x => x.o === 'gain');"),
    ("item 2 falsified on the rest's gain alone", "const fals2 = rest.every(x => x.o === 'gain') && tier.every(x => x.o === 'no material gain');", "const fals2 = rest.every(x => x.o === 'gain');"),
    ("item 2 reads the tier state for TS-TIER", "const tier = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS-TIER')))", "const tier = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS')))"),
    ("item 3's ratio inverted", "r: ratio(G(id, arm, 'TS').gap, G(id, arm, 'PRODUCT').gap)", "r: ratio(G(id, arm, 'PRODUCT').gap, G(id, arm, 'TS').gap)"),
    ("item 3 held at the flat bound", "outcome: r3.every(x => x.r >= UP) ? 'HELD'", "outcome: r3.every(x => x.r >= FLAT) ? 'HELD'"),
    ("item 3 held on one case", "outcome: r3.every(x => x.r >= UP) ? 'HELD'", "outcome: r3.some(x => x.r >= UP) ? 'HELD'"),
    ("item 4 held on one leg", "outcome: i4.every(x => x.o === 'no material harm') ? 'HELD'", "outcome: i4.some(x => x.o === 'no material harm') ? 'HELD'"),
    ("item 4 leaves out S360", "[['share 0.95', 'READER'], ['bridge 4', 'READER'], ['S360', 'READER']].map", "[['share 0.95', 'READER'], ['bridge 4', 'READER']].map"),
    ("item 5 reads the reader's S360", "const i5 = harmFamily([leg('S360', 'OFF', 'TS')]);", "const i5 = harmFamily([leg('S360', 'READER', 'TS')]);"),
    ("item 5 held without harm", "outcome: i5[0].o === 'harm' ? 'HELD'", "outcome: i5[0].o !== 'no material harm' ? 'HELD'"),
    ("the margin from the wrong run", "const out = [], mar = (id, arm) => marginFor(survivedShare(S(id, arm, 'PRODUCT')));", "const out = [], mar = (id, arm) => 0.5;"),
]
def run(f):
    p = subprocess.run(['node', f, '--planted'], capture_output=True, text=True)
    return p.stdout.strip() + p.stderr.strip()
bad = 0
out = run(SRC)
last = out.splitlines()[-1] if out else ''
if not last.startswith('planted (') or 'FAIL' in out:
    print(f'FAIL: the true script does not pass its planted set: {last[:200]}'); sys.exit(1)
print(f'true script: {last}')
try:
    for name, a, b in M:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the mutation does not apply ({base.count(a)} matches)'); bad = 1; continue
        open(DST, 'w').write(base.replace(a, b))
        o = run(DST)
        if 'PLANTED CHECK FAILED' in o:
            first = next((l for l in o.splitlines() if l.startswith('FAIL')), 'an error before the planted set')
            print(f'caught  {name}: {first[5:180]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
