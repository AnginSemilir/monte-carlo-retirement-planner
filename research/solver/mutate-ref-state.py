#!/usr/bin/env python3
# REF-S'S UNIT TESTS, SHOWN TO FAIL (rule 6): each mutation breaks one part of a scratch copy of ref-state.mjs (beside a
# copy of research/tests/ref-state.test.mjs and a link to src/, so the tree is never touched, even if the run is killed),
# runs the test on the copy and must see it fail. The running maximum's mutant
# is declared equivalent (at a fixed share more money pays every path no worse, so it binds on no schedule) and listed.
#   python3 research/solver/mutate-ref-state.py > research/solver/results-ref-state-mutations.txt
import subprocess, tempfile, os, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
orig = open(os.path.join(ROOT, 'research/solver/ref-state.mjs')).read()
tmp = tempfile.mkdtemp(prefix='mutate-ref-state.')
os.makedirs(os.path.join(tmp, 'research/solver')); os.makedirs(os.path.join(tmp, 'research/tests'))
os.symlink(os.path.join(ROOT, 'src'), os.path.join(tmp, 'src'))
shutil.copy(os.path.join(ROOT, 'research/tests/ref-state.test.mjs'), os.path.join(tmp, 'research/tests/ref-state.test.mjs'))
shutil.copy(os.path.join(ROOT, 'research/tests/refs-s364-fixture.json'), os.path.join(tmp, 'research/tests/refs-s364-fixture.json'))
p = os.path.join(tmp, 'research/solver/ref-state.mjs')
M = [
  ("if (j > 0) c *= 1 + rate[j - 1].cash[0];", "if (j > 0) c *= 1;"),
  ("const left = bills.map((b, j) => (j < js ? 0 : j === js ? rem : b));", "const left = bills.map((b, j) => (j <= js ? 0 : b));"),
  ("cash = Math.min(tax, Math.max(0, cashOf(tax)));", "cash = tax / 2;"),
  ("cash = Math.min(tax, Math.max(0, cashOf(tax)));", "cash = Math.max(0, cashOf(tax));"),
  ("if (c > best) best = c;", "if (oi === 0) best = c;"),
  ("return row(i, acc) * (1 - u) + row(i + 1, acc) * u;", "return row(i, acc);"),
  ("p.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * a);", "p.isa *= Math.exp(Math.log(1 + r.isa[0]) + r.isa[1] * c);"),
  ("return { isa: a * acc, gia: tax - cash, cash };", "return { isa: a * acc, gia: tax - cash, cash: cash * 0.9 };"),
  ("if (need < 0) { p.cash -= need; continue; }", "if (need < 0) { continue; }"),
  ("return bills.every(b => b >= 0) && rate.every(", "return rate.every("),
  ("const rho = rate.map(r => Math.log(1 + r.isa[0])), vol = rate.map(r => r.isa[1]);", "const rho = rate.map(r => r.isa[0]), vol = rate.map(r => r.isa[1]);"),
  ("const x = Math.max(0, Math.min(1, a)) * (shares - 1)", "const x = Math.max(0, Math.min(1, 1 - a)) * (shares - 1)"),
  ("if (acc - d0 < -tol) return 0;\n    const x", "if (acc - d0 < -tol) return 0.01;\n    const x"),
]
EQUIV = [("val[i][g] = Math.max(best, g > 0 ? val[i][g - 1] : 0);", "val[i][g] = best;")]
caught = 0
try:
  open(p, 'w').write(orig)
  r = subprocess.run(['node', os.path.join(tmp, 'research/tests/ref-state.test.mjs')], capture_output=True, text=True)
  print(f"control (no mutation): {'passes' if r.returncode == 0 else 'FAILS'}")
  if r.returncode != 0: raise SystemExit('the unmutated copy fails: no mutation can be read')
  for i, (a, b) in enumerate(M + EQUIV):
    assert orig.count(a) == 1, a
    open(p, 'w').write(orig.replace(a, b))
    r = subprocess.run(['node', os.path.join(tmp, 'research/tests/ref-state.test.mjs')], capture_output=True, text=True)
    eq = i >= len(M)
    if r.returncode != 0 and not eq: caught += 1
    print(f"{'caught' if r.returncode != 0 else ('equivalent (declared)' if eq else 'NOT CAUGHT')}: {i + 1}: {a[:70]}")
finally:
  shutil.rmtree(tmp)
print(f"{caught} of {len(M)} mutations caught; {len(EQUIV)} declared equivalent")
