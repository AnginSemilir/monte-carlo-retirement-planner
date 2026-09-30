#!/usr/bin/env python3
# THE INTERPOLATED ALLOWANCE AXIS'S TESTS, SHOWN TO FAIL (rule 6; PLAN.md 7ap; the plan-auditor's MINOR 2 of 30 Sep 23:32 UK):
# each line plants one fault in src/solver/grid.js or solve.js's `pclsInterp` code IN PLACE (the tests import the real
# modules; a copy of src/ is refused by the hook), runs research/tests/solver-gridfidelity.test.mjs's section E
# (GRIDFID_ONLY=E) and must see a FAIL line; the file is restored from its bytes in a finally block, and the restored bytes
# are checked. Every plant must apply exactly as written; the true code must pass. Any plant not applied or not caught fails
# the script (exit 1). Never run it while a batch runs from the real tree (the launcher's snapshot is not touched).
#   python3 research/solver/mutate-grid-pclsinterp.py > research/solver/results-grid-pclsinterp-mutations.txt
import os, subprocess, sys, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
GRID, SOLVE = os.path.join(ROOT, 'src', 'solver', 'grid.js'), os.path.join(ROOT, 'src', 'solver', 'solve.js')
TEST = os.path.join(ROOT, 'research', 'tests', 'solver-gridfidelity.test.mjs')
P = [
    ("readValues drops the upper allowance corners", GRID, "W[k + NC] = W[k] * cw; W[k] *= 1 - cw;", "W[k + NC] = 0; W[k] *= 1 - cw;"),
    ("readValues ignores the option", GRID, "const cb = g.pclsInterp ? bracket(g.pcls, pf) : null;\n  const ic = cb ? cb.i : g.pclsStrict ? nearestPclsStrict(g.pcls, pf) : nearest(g.pcls, pf);\n  const gb = g.gainInterp", "const cb = null;\n  const ic = cb ? cb.i : g.pclsStrict ? nearestPclsStrict(g.pcls, pf) : nearest(g.pcls, pf);\n  const gb = g.gainInterp"),
    ("interp() ignores the allowance weight", GRID, "const cw = g.pclsInterp && loc.icw > 0", "const cw = false && loc.icw > 0"),
    ("the option is never set", GRID, "  return !!opts.pclsInterp;", "  return false;"),
    ("pclsInterp and pclsStrict accepted together", GRID, "if (opts.pclsInterp && opts.pclsStrict) throw", "if (false) throw"),
    ("nearestIndex takes the lower allowance bracket", SOLVE, "loc.ic + (loc.icw > 0.5 ? 1 : 0))", "loc.ic)"),
    ("nearestIndex takes the lower gain bracket", SOLVE, "loc.ig + (loc.igw > 0.5 ? 1 : 0), loc.ic", "loc.ig, loc.ic"),
]
def run():
    p = subprocess.run(['node', TEST], capture_output=True, text=True, cwd=ROOT, env={**os.environ, 'GRIDFID_ONLY': 'E'})
    return p.stdout + p.stderr
sha = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()[:12]
out = run()
last = next((l for l in out.splitlines() if 'passed,' in l), '')
if ' 0 failed' not in last or '\nFAIL' in out:
    print(f'FAIL: the true code does not pass section E: {last}'); sys.exit(1)
print(f'true code (grid.js {sha(GRID)}, solve.js {sha(SOLVE)}): {last.strip("= ")}')
orig = {GRID: open(GRID).read(), SOLVE: open(SOLVE).read()}
bad, escaped = 0, []
try:
    for name, f, a, b in P:
        base = orig[f]
        if base.count(a) != 1:
            print(f'FAIL  {name}: the plant does not apply ({base.count(a)} matches)'); bad = 1; escaped.append(name + ' (did not apply)'); continue
        open(f, 'w').write(base.replace(a, b))
        try: o = run()
        finally: open(f, 'w').write(base)
        fails = [l for l in o.splitlines() if l.startswith('FAIL')]
        if fails: print(f'caught  {name}: {len(fails)} E-test(s) fail, first: {fails[0][6:110]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1; escaped.append(name)
finally:
    for f, t in orig.items(): open(f, 'w').write(t)
restored = all(open(f).read() == t for f, t in orig.items())
print(f'\n{len(P)} plants: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT') + f'; the files restored byte for byte: {restored}')
sys.exit(1 if bad or not restored else 0)
