#!/usr/bin/env python3
# THE 7R REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7r.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Python, not sed:
# a sed expression that matched nothing once passed silently (26 Sep). Every mutation must apply exactly as written; the
# true reducer must pass. Any mutation not applied or not caught fails the script (exit 1). The stamp gate lives in
# fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs.
#   python3 research/solver/mutate-reduce-7r.py > research/solver/results-reduce-7r-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7r.mjs'), os.path.join(HERE, 'zz-mut-7r.mjs')
base = open(SRC).read()
M = [
    ("the tier above ranked least risky", "riskRank = idx => (idx === 3 ? 1 : -idx)", "riskRank = idx => (idx === 3 ? -3 : -idx)"),
    ("pension and ISA swapped in the tier code", "({ pen: code >> 2, isa: code & 3 })", "({ pen: code & 3, isa: code >> 2 })"),
    ("a tier-lift path needs every year riskier, not half", "2 * penRisk >= end", "penRisk >= end"),
    ("a failure in the first year of access counted inside the bridge", "const after = end >= bridge", "const after = end > bridge"),
    ("a failed path keeps its end wealth", "(T.survived[i] ? T.wealth[i * T.Y + T.Y - 1] : 0)", "(T.wealth[i * T.Y + T.Y - 1])"),
    ("the paired end wealth over every path, not the paths both survive", "if (A.survived[i] && B.survived[i]) {\n      dW.push", "if (true) {\n      dW.push"),
    ("the median's interval at alpha, not alpha/2", "1 - binomUpperHalf(k + 1, n) <= alpha / 2", "1 - binomUpperHalf(k + 1, n) <= alpha"),
    ("estate bought without the margin on the point", "ci.lo > 0 && ci.med >= margin ?", "ci.lo > 0 ?"),
    ("item 1 without Holm", "hp[j] < ALPHA", "res[id].p < ALPHA"),
    ("too few lost paths not checked", "|| pooledLost < MIN_LOST)", ")"),
    ("the falsifier at two-thirds, not half", "if (share < LIFT_FALSIFIED)", "if (share < LIFT_HELD)"),
    ("the gate does not read the bridge read", "bridgeRead: BR[l] };", "};"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("a trace's stamp is not compared with the logs'", "['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === st[k])", "true"),
    ("the prediction's version (its sha) not compared", "['code', 'audit', 'prediction', 'sha'].every", "['code', 'audit', 'prediction'].every"),
    ("the stamp line's prediction read from the wrong field", "prediction: m[3]", "prediction: m[2]"),
]
run = lambda f: subprocess.run(['node', f, '--planted'], capture_output=True, text=True).stdout.strip()
bad = 0
out = run(SRC)
if not out.startswith('planted ('):
    print(f'FAIL: the true reducer does not pass its planted set: {out[:200]}'); sys.exit(1)
print(f'true reducer: {out}')
try:
    for name, a, b in M:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the mutation does not apply ({base.count(a)} matches)'); bad = 1; continue
        open(DST, 'w').write(base.replace(a, b))
        o = run(DST)
        if o.startswith('PLANTED CHECK FAILED'): print(f'caught  {name}: {o[22:190]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
