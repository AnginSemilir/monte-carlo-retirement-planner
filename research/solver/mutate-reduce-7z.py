#!/usr/bin/env python3
# THE 7Z REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7z.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs. The paired cells and the
# Holm families are reduce-7v.mjs's (mutated there, results-reduce-7v-mutations.txt); the switching count is read-7t-deep.mjs's.
#   python3 research/solver/mutate-reduce-7z.py > research/solver/results-reduce-7z-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7z.mjs'), os.path.join(HERE, 'zz-mut-7z.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)"),
    ("the gate ignores a second setting changed within a case", "if (strip(u.ran) !== strip(first.ran))", "if (false)"),
    ("the gate strips the minimum pot with the fix", "const strip = s => (s || '').replace(/ bridgeStep \\S+/, '');", "const strip = s => (s || '').replace(/ bridgeStep \\S+/, '').replace(/ minPot \\S+/, '');"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the path count", "paths: String(N), grid", "grid"),
    ("the gate does not read the points", "pts: PTS, seed", "seed"),
    ("the gate does not read the return points", "quad: '5', finalIntegral", "finalIntegral"),
    ("the gate does not read the bridge read", ", bridgeRead: 'reader' };", " };"),
    ("the gate does not read the fix on the ran line", "if (field(u.ran, 'bridgeStep') !== (step ? 'exact' : null))", "if (false)"),
    ("the gate ignores the solved margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate ignores the reader years", "if ((u.id === 'S194') !== (u.joint.readerYears === 0))", "if (false)"),
    ("the gate accepts a missing run line", "if (!u.run) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing done line", "if (!u.done) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing gap line", "if (!u.gap) bad.push", "if (false) bad.push"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
    ("a trace's arm not compared", "j.arm === label && ", ""),
    ("a trace's survival allowed at three decimals", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-4 + 1e-9;"),
    ("a trace's survival compared strictly inside the rounding", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-5 - 1e-9;"),
    # the items
    ("item 1's leg the wrong way round", "k: cells(S(id, 'READER'), S(id, 'READER+STEP'))", "k: cells(S(id, 'READER+STEP'), S(id, 'READER'))"),
    ("item 1 held on no material gain", "outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain')", "outcome: tri(i1, x => x.o !== 'inconclusive', x => false)"),
    ("item 1 falsified when inconclusive", "outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain')", "outcome: tri(i1, x => x.o === 'gain', x => x.o !== 'gain')"),
    ("item 2 held on the gap alone", "outcome: gn >= GAP_HELD && g.open1e3 !== 0 ? 'HELD'", "outcome: gn >= GAP_HELD ? 'HELD'"),
    ("item 2 held at the margin", "export const MARGIN = 0.001, GAP_HELD = 2e-3;", "export const MARGIN = 0.001, GAP_HELD = 1e-3;"),
    ("item 2 falsified at the margin", "gn < MARGIN ? 'FALSIFIED'", "gn <= MARGIN ? 'FALSIFIED'"),
    ("item 2 read on the arm without the fix", "const g = U('share 0.95', 'READER+STEP').gap", "const g = U('share 0.95', 'READER').gap"),
    ("item 3 held on one leg", "outcome: i3.every(x => x.o === 'no material harm') ? 'HELD'", "outcome: i3.some(x => x.o === 'no material harm') ? 'HELD'"),
    ("item 3 falsified only on both", "i3.some(x => x.o === 'harm') ? 'FALSIFIED'", "i3.every(x => x.o === 'harm') ? 'FALSIFIED'"),
    ("item 3 reads bridge 4 alone", "harmFamily(['S126', 'bridge 4'].map(leg))", "harmFamily(['bridge 4'].map(leg))"),
    ("item 4 on survival alone", "for (let i = 0; i < A.level.length; i++) if (A.level[i] !== B.level[i] || A.tier[i] !== B.tier[i]) return false;", ""),
    ("item 4 ignores the tier", "if (A.level[i] !== B.level[i] || A.tier[i] !== B.tier[i]) return false;", "if (A.level[i] !== B.level[i]) return false;"),
    ("item 4 ignores the table", "&& U('S194', 'READER').solve.table === U('S194', 'READER+STEP').solve.table", ""),
    ("the margin from the wrong run", "const out = [], mar = id => marginFor(survivedShare(S(id, 'READER')));", "const out = [], mar = id => 0.5;"),
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
