#!/usr/bin/env python3
# 7AK'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ak.mjs's gate or items in a
# scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7ak.py > research/solver/results-reduce-7ak-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ak.mjs'), os.path.join(HERE, 'zz-mut-7ak.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a unit not done", "if (!u.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores P's table", "if (P.table !== u.table) bad.push", "if (false) bad.push"),
    ("the gate ignores P's ran line", "if (normRan(P.ran) !== normRan(u.ran)) bad.push", "if (false) bad.push"),
    ("the gate accepts no P unit", "if (!P) bad.push(`${tag}: no P core:P unit`);", "if (!P) {}"),
    ("the gate ignores the node paths", "if (u.node.paths !== np) bad.push", "if (false) bad.push"),
    ("the gate ignores inconsistent counts", "if (S.dis !== S.oneWay + S.reverse || S.dead > S.dis || S.dis > S.held) bad.push", "if (false) bad.push"),
    ("the gate ignores the traces", "if (a[f][i] !== p[f][i]) { bad.push", "if (false) { bad.push"),
    ("item 1 reads live as dead", "const deadShare = p.dis ? p.dead / p.dis : NaN;", "const deadShare = p.dis ? p.live / p.dis : NaN;"),
    ("item 2 reads the W snap", "{ n: 2, x: share('reader'), outcome: tri(share('reader'), CARRY, NONE) }", "{ n: 2, x: share('W'), outcome: tri(share('W'), CARRY, NONE) }"),
    ("item 3 reads the b snap", "{ n: 3, x: share('a'), outcome: tri(share('a'), CARRY, NONE) }", "{ n: 3, x: share('b'), outcome: tri(share('b'), CARRY, NONE) }"),
    ("the carry threshold at 0.6", "CARRY = 0.5, NONE = 0.2,", "CARRY = 0.6, NONE = 0.2,"),
    ("item 4 ignores the interior", "const se = Math.sqrt((rb * (100 - rb)) / B.n + (ri * (100 - ri)) / I.n), d = (tb - rb) - (ti - ri);", "const se = Math.sqrt((rb * (100 - rb)) / B.n + (ri * (100 - ri)) / I.n), d = (tb - rb);"),
    ("the premise check off", "settled: p.live > 0 && share('all') >= ALLMIN,", "settled: true,"),
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
            first = next((l[5:180] for l in o.splitlines() if l.startswith('FAIL')), next((l[:180] for l in o.splitlines() if 'PLANTED CHECK FAILED' in l), ''))
            print(f'caught  {name}: {first}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
