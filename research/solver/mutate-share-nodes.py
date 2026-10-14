#!/usr/bin/env python3
# NODE-1'S OPTION'S TESTS, SHOWN TO FAIL (rule 6): each mutation breaks one part of grid.js's or solve.js's `shareNodes`
# code in a scratch copy of src/solver (beside links to the rest of the tree, so the tree is never touched), runs
# research/tests/share-nodes.test.mjs on the copy and must see it fail; a control run of the unmutated copy must pass.
#   python3 research/solver/mutate-share-nodes.py > research/solver/results-share-nodes-mutations.txt
import subprocess, tempfile, os, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
tmp = tempfile.mkdtemp(prefix='mutate-share-nodes.')
os.makedirs(os.path.join(tmp, 'research/tests')); os.makedirs(os.path.join(tmp, 'src'))
for d in ['research/engine.mjs', 'research/policy-study']: os.symlink(os.path.join(ROOT, d), os.path.join(tmp, d))
shutil.copy(os.path.join(ROOT, 'research/tests/share-nodes.test.mjs'), os.path.join(tmp, 'research/tests/share-nodes.test.mjs'))
shutil.copytree(os.path.join(ROOT, 'src/solver'), os.path.join(tmp, 'src/solver'))
M = [
  ('grid.js', "while (i < ax.n - 2 && x >= p[i + 1]) i++;", "while (i < ax.n - 2 && x > p[i + 1]) i++;"),
  ('grid.js', "return { i, w: (x - p[i]) / (p[i + 1] - p[i]) };", "return { i, w: (x - p[i]) / p[i + 1] };"),
  ('grid.js', "function locLinInto(ax, v, k) { if (ax.nodes) { const r = locateNodes(ax, v); LOC[k] = r.i; LOC[k + 1] = r.w; return; }", "function locLinInto(ax, v, k) {"),
  ('grid.js', "function locateLin(ax, v) { if (ax.nodes) return locateNodes(ax, v);", "function locateLin(ax, v) {"),
  ('grid.js', "axes.a = linAxis(COV ? n2 - 1 : n2); if (SN) axes.a = nodesAxis(SN);", "axes.a = linAxis(COV ? n2 - 1 : n2);"),
  ('grid.js', "SN.some((x, i) => i > 0 && !(x > SN[i - 1]))", "false"),
  ('grid.js', "SN.length < 3 ||", ""),
  ('grid.js', "if (!total || cov) throw new Error('shareNodes needs the total-wealth coordinates and no coverage');", ""),
  ('grid.js', "const n2 = total ? (SN ? SN.length : ", "const n2 = total ? (SN ? 6 : "),
  ('solve.js', "if (g.axes.a && g.axes.a.nodes) meta.shareNodes = Array.from(g.axes.a.pts);", ""),
]
def runtest():
  return subprocess.run(['node', os.path.join(tmp, 'research/tests/share-nodes.test.mjs')], capture_output=True, text=True).returncode
caught = 0
try:
  r = runtest(); print(f"control (no mutation): {'passes' if r == 0 else 'FAILS'}")
  if r != 0: raise SystemExit('the unmutated copy fails: no mutation can be read')
  for i, (f, a, b) in enumerate(M):
    p = os.path.join(tmp, 'src/solver', f); orig = open(p).read()
    assert orig.count(a) == 1, a
    open(p, 'w').write(orig.replace(a, b))
    r = runtest(); open(p, 'w').write(orig)
    if r != 0: caught += 1
    print(f"{'caught' if r != 0 else 'NOT CAUGHT'}: {i + 1}: {f}: {a[:70]}")
finally:
  shutil.rmtree(tmp)
print(f"{caught} of {len(M)} mutations caught")
