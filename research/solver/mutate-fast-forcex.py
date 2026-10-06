#!/usr/bin/env python3
# FORCE-X'S FORCED DRAW'S TESTS, SHOWN TO FAIL (rule 6): each line plants one fault in src/solver/fast.js's step 7b' IN PLACE
# (the tests import the real module), runs research/tests/solver-forcex.test.mjs and must see a FAIL line; the file is
# restored from its bytes in a finally block, and the restored bytes are checked. Every plant must apply exactly as written;
# the true code must pass. Never run it while a batch runs from the real tree (the launcher's snapshot is not touched).
#   python3 research/solver/mutate-fast-forcex.py > research/solver/results-fast-forcex-mutations.txt
import os, subprocess, sys, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
FAST = os.path.join(ROOT, 'src', 'solver', 'fast.js')
TEST = os.path.join(ROOT, 'research', 'tests', 'solver-forcex.test.mjs')
P = [
    ("the flag not cleared", "const want = c.forceTF; c.forceTF = 0;", "const want = c.forceTF;"),
    ("the allowance left ignored", "Math.min(pen, Math.min(want, headroom) / P.pclsProp)", "Math.min(pen, want / P.pclsProp)"),
    ("forced before access", "const gross = access && retired && pen > 0", "const gross = retired && pen > 0"),
    ("forced while working", "const gross = access && retired && pen > 0", "const gross = access && pen > 0"),
    ("the lump-sum share ignored (the force taken as the gross)", "Math.min(pen, Math.min(want, headroom) / P.pclsProp)", "Math.min(pen, Math.min(want, headroom))"),
    ("the taxable part untaxed", "taxable += gross - taxFree;\n      const net", "const net"),
    ("the proceeds lost", "isa += toIsa; isaContrib += toIsa; addGia(net - toIsa);\n      c.forced = gross;", "c.forced = gross;"),
    ("the tax-free part not counted against the allowance", "      cumPcls += taxFree;\n      const before = netOf(tb, taxable);\n      taxable += gross - taxFree;\n      const net", "      const before = netOf(tb, taxable);\n      taxable += gross - taxFree;\n      const net"),
    ("c.forced not recorded", "      c.forced = gross;\n", ""),
    ("the force ignored", "  if (c.forceTF > 0) {\n    const want", "  if (false) {\n    const want"),
]
def run():
    p = subprocess.run(['node', TEST], capture_output=True, text=True, cwd=ROOT)
    return p.stdout + p.stderr
sha = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()[:12]
out = run()
last = next((l for l in out.splitlines() if 'passed,' in l), '')
if ' 0 failed' not in last or '\nFAIL' in out:
    print(f'FAIL: the true code does not pass: {last}'); sys.exit(1)
print(f'true code (fast.js {sha(FAST)}): {last.strip("= ")}')
base = open(FAST).read()
bad, escaped = 0, []
try:
    for name, a, b in P:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the plant does not apply ({base.count(a)} matches)'); bad = 1; escaped.append(name + ' (did not apply)'); continue
        open(FAST, 'w').write(base.replace(a, b))
        try: o = run()
        finally: open(FAST, 'w').write(base)
        fails = [l for l in o.splitlines() if l.startswith('FAIL')]
        if fails: print(f'caught  {name}: {len(fails)} test(s) fail, first: {fails[0][6:110]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1; escaped.append(name)
finally:
    open(FAST, 'w').write(base)
restored = open(FAST).read() == base
print(f'\n{len(P)} plants: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT: ' + '; '.join(escaped)) + f'; the file restored byte for byte: {restored}')
sys.exit(1 if bad or not restored else 0)
