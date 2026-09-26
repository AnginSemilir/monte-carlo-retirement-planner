#!/usr/bin/env python3
# READ-7R-FAILURES' PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of read-7r-failures.mjs's reading in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs.
#   python3 research/solver/mutate-read-7r-failures.py > research/solver/results-read-7r-failures-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'read-7r-failures.mjs'), os.path.join(HERE, 'zz-mut-7rf.mjs')
base = open(SRC).read()
M = [
    ("every loss counted as in life", "if (fy >= 0) inLife.push", "if (true) inLife.push"),
    ("the arm's end wealth and off's swapped", "end: lastWealth(B, i), offEnd: lastWealth(A, i)", "end: lastWealth(A, i), offEnd: lastWealth(B, i)"),
    ("the median failure year ignores end-of-plan failures", "...atEnd.map(() => A.Y - 1)]", "]"),
    ("the median failure year takes an end-of-plan failure's -1 as a year", "...atEnd.map(() => A.Y - 1)]", "...atEnd.map(() => -1)]"),
    ("the estate not capped", "Math.min(lastWealth(T, i), cap)", "lastWealth(T, i)"),
    ("a failed path keeps its estate", "(T.survived[i] ? Math.min(lastWealth(T, i), cap) : 0)", "Math.min(lastWealth(T, i), cap)"),
    ("the estate weight wrong", "export const WB = 0.02, CAP = 4;", "export const WB = 0.2, CAP = 4;"),
    ("the survival change's sign reversed", "100 * (B.survived[i] - A.survived[i])", "100 * (A.survived[i] - B.survived[i])"),
    ("the covered share's sign reversed", "Math.round(-100 * e.dE / e.dS)", "Math.round(100 * e.dE / e.dS)"),
    ("the shortfall taken from off's end wealth", "Number(pot) - x.end)", "Number(pot) - x.offEnd)"),
    ("within 5k counted the wrong way", "sh.filter(x => x <= 5000)", "sh.filter(x => x >= 5000)"),
    ("the pot left read from off's end wealth", "median(atEnd.map(x => x.end)) / Number(pot)", "median(atEnd.map(x => x.offEnd)) / Number(pot)"),
    ("the prediction's version (its sha) not compared", "['code', 'audit', 'prediction', 'sha'].every", "['code', 'audit', 'prediction'].every"),
    ("the stamp line's prediction read from the wrong field", "prediction: m[3]", "prediction: m[2]"),
]
run = lambda f: subprocess.run(['node', f, '--planted'], capture_output=True, text=True).stdout.strip()
bad = 0
out = run(SRC)
if not out.startswith('planted ('):
    print(f'FAIL: the true script does not pass its planted set: {out[:200]}'); sys.exit(1)
print(f'true script: {out}')
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
