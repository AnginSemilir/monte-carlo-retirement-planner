# THE SECOND UNLOCK'S CHECKS, EACH SHOWN TO MATTER (RULES.md rule 2): every mutation of the new credence, ancestry,
# judged-order and base-rate checks must make research/tests/plan-checker.test.mjs fail. In place, restored after;
# run from anywhere: python3 research/solver/mutate-credence-checks.py (5 Oct: items 1-3 23 of 23, item 4 12 of 12, item 5 3 of 3, labels 8 of 8;
# the fourth unlock, the judged order's first commit and the receipt's test (O107): items 1-3 25 of 25, item 4 17 of 17 -
# results-unlock-judged-order.txt; the fifth, the tests since a review by close (MINOR 6): uncertainty 4 of 4 -
# results-unlock-uncertainty.txt)
import subprocess, os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
p=os.path.join(ROOT,'research/solver/check-prediction.mjs')
orig=open(p).read()
M=[
 ("if (m[1] in d) Object.defineProperty", "if (false) Object.defineProperty"),
 ("if (d.twice) P.push", "if (false) P.push"),
 ("if (!items.has(m[1])) P.push(`item ${m[1]}: the Decision rule", "if (false) P.push(`item ${m[1]}: the Decision rule"),
 ("else if (firstNum(line) !== Number(g.point))", "else if (!String(line).includes(String(g.point)))"),
 ("/(?<![\\w.])(-?(?:", "/(-?(?:"),
 ("/(?<![\\w.])(-?(?:", "/(?<![\\w.])((?:"),
 ("export const exemptBy = (commit, ancestors) => !!commit && ancestors.has(commit);", "export const exemptBy = (commit, ancestors) => !commit || ancestors.has(commit);"),
 ("export const CREDENCE_BOUNDARY = 'd4487bd'", "export const CREDENCE_BOUNDARY = 'ed5db5c'"),
 ("opts.judged === true || (onDisk(name) && heldBy(name, JUDGED_BOUNDARY))", "opts.judged === true || (onDisk(name) && heldBy(name, CREDENCE_BOUNDARY))"),
 ("if (J === D) return", "if (false) return"),
 ("if (git(['merge-base', '--is-ancestor', J, D]) === null) return", "if (false) return"),
 ("if (!J && !D) { const st", "if (false) { const st"),
 ("return st && st.trim() ? [`the \"Judged, item\" lines and the derivation", "return false ? [`the \"Judged, item\" lines and the derivation"),
 ("return st && st.trim() ? [`the \"Judged, item\" lines and the derivation", "return true ? [`the \"Judged, item\" lines and the derivation"),
 ("if (!J) return [`the derivation", "if (false) return [`the derivation"),
 ("if (/^\\s*-\\s*\\*\\*Judged:\\*\\*\\s*none\\b/mi.test(text)) return [];", ""),
 ("if (!line) return ['results-scorecard.txt has no KIND", "if (false) return ['results-scorecard.txt has no KIND"),
 ("if (!b) P.push(`item ${m[1]}: no \"- **Base rate", "if (false) P.push(`item ${m[1]}: no \"- **Base rate"),
 ("Math.abs(r - Number(b[1])) <= 0.01 + 1e-9", "Math.abs(r - Number(b[1])) <= 0.02 + 1e-9"),
 ("&& heldToJudged(name, { judged })) errs.push(...baseRateProblems(text, { name }), ...judgedOrderProblems(name, text));", "&& false) errs.push(...baseRateProblems(text, { name }), ...judgedOrderProblems(name, text));"),
 ("&& heldToCredence(name, { credence })) errs.push(...credenceProblems(text));", "&& false) errs.push(...credenceProblems(text));"),
 ("heldBy(name, CREDENCE_BOUNDARY)));", "true));"),
 ("(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+))(?![\\w])", "((?:\\d+(?:\\.\\d+)?|\\.\\d+))(?![\\w])"),
 ("if (judgedOf(then) !== judgedOf(text)) return", "if (false) return"),
 ("const sc = scorecard ?? atAdd ??", "const sc = scorecard ??"),
]
# item 4: the deep reviews' causes (record-deep-review.mjs; its planted checks, then scorecard.mjs's, must fail)
M4=[
 ("if (best === null || v >= bt) { best = t; bt = v; }", "if (true) { best = t; bt = v; }"),
 ("v = c === undefined || c === null ? -Infinity : c;", "v = c === undefined || c === null ? Infinity : c;"),
 ("closes.set(m[1], stamp(m[2]));", "closes.set(m[1], Number(m[2].split(' ')[0]));"),
 ("export const coveredOf = rd => latestCovered(rd('results-scorecard.txt'), rd('lessons.md'));", "export const coveredOf = rd => (scoredTests(rd('results-scorecard.txt')).pop() || {}).name;"),
 ("receiptLine({ when, covered: coveredOf(rd), level, findings })", "receiptLine({ when, covered: (scoredTests(rd('results-scorecard.txt')).pop() || {}).name, level, findings })"),
 ("if (missing.length) return `CAUSE CREDENCES names", "if (false) return `CAUSE CREDENCES names"),
 ("const named = id => [id, id.split('-').pop()]", "const named = id => [id]"),
 ("if (sum > SUM_MAX + 1e-9 && !/CAUSES OVERLAP:/i.test(pre))", "if (sum > SUM_MAX + 1e-9)"),
 ("if (sum > SUM_MAX + 1e-9 && !/CAUSES OVERLAP:/i.test(pre))", "if (false)"),
 ("export const SUM_MAX = 1.05;", "export const SUM_MAX = 1.5;"),
 ("const pre = c.slice(0, c.search(/CAUSE CREDENCES:/i))", "const pre = c"),
 ("if (!DECIDING.test(q)) { errs.push(", "if (false) { errs.push("),
 ("if (!String(text).split('\\n').some(l => l.trim() === q)) { errs.push(", "if (!String(text).includes(q)) { errs.push("),
 ("if (!String(text).split('\\n').some(l => l.trim() === q)) { errs.push(", "if (false) { errs.push("),
 ("if (!m) { errs.push(`\"${raw.slice(0, 60)}\" is not", "if (!m) { continue; errs.push(`\"${raw.slice(0, 60)}\" is not"),
 ("committed != null && !String(now).startsWith(committed)", "false"),
 ("if (seen.has(k)) { errs.push(`${at}: settled twice`); continue; }", ""),
]
q='/home/user/vitejs-vite-kdvuf9qw/research/solver/record-deep-review.mjs'
orig4=open(q).read()
caught4=0
try:
  for a,b in M4:
    assert orig4.count(a)==1,(orig4.count(a),a[:60])
    open(q,'w').write(orig4.replace(a,b))
    r=subprocess.run(['node','research/solver/record-deep-review.mjs','--planted'],cwd=ROOT,capture_output=True,text=True)
    ok = r.returncode!=0
    caught4+=ok
    print(('CAUGHT  ' if ok else 'SURVIVED'), 'record-deep-review:', a[:60])
finally:
  open(q,'w').write(orig4)
print(f'item 4: {caught4}/{len(M4)} caught')

caught=0
try:
  for a,b in M:
    assert orig.count(a)==1,(orig.count(a),a[:60])
    open(p,'w').write(orig.replace(a,b))
    r=subprocess.run(['node','research/tests/plan-checker.test.mjs'],cwd=ROOT,capture_output=True,text=True)
    ok = r.returncode!=0
    caught+=ok
    print(('CAUGHT  ' if ok else 'SURVIVED'), a[:70])
finally:
  open(p,'w').write(orig)
print(f'{caught}/{len(M)} caught')

# item 5: the retro's hyphenated names and windows by date (check-plan.mjs; plan-checker.test.mjs must fail)
M5=[
 ("matchAll(/^(\\S+) \\(.*\\): Brier /gm)", "matchAll(/^(\\w+) \\(.*\\): Brier /gm)"),
 ("  found.sort((a, b) => a.c.at - b.c.at);\n", ""),
 ("if (c !== penult) continue;", "if (c !== L.closes[L.closes.length - 2]) continue;"),
]
r5='/home/user/vitejs-vite-kdvuf9qw/research/solver/check-plan.mjs'.replace('/home/user/vitejs-vite-kdvuf9qw', ROOT)
orig5=open(r5).read()
caught5=0
try:
  for a,b in M5:
    assert orig5.count(a)==1,(orig5.count(a),a[:60])
    open(r5,'w').write(orig5.replace(a,b))
    r=subprocess.run(['node','research/tests/plan-checker.test.mjs'],cwd=ROOT,capture_output=True,text=True)
    ok = r.returncode!=0
    caught5+=ok
    print(('CAUGHT  ' if ok else 'SURVIVED'), 'check-plan:', a[:60])
finally:
  open(r5,'w').write(orig5)
print(f'item 5: {caught5}/{len(M5)} caught')

# the third unlock: a label-only edit, declared and checked (relook-label.mjs, relook.mjs; plan-checker.test.mjs must fail)
M6=[
 ("research/solver/relook-label.mjs", "if (oldRow.split(from).join(to) !== newRow) return", "if (false) return"),
 ("research/solver/relook-label.mjs", "export const hasFigure = s => /\\d/.test(", "export const hasFigure = s => false && /\\d/.test("),
 ("research/solver/relook-label.mjs", "export const LABEL_MAX = 40;", "export const LABEL_MAX = 4000;"),
 ("research/solver/relook-label.mjs", "if (!oldRow.includes(from)) return", "if (false) return"),
 ("research/solver/relook-label.mjs", "if (!from || from === to) return", "if (false) return"),
 ("research/solver/relook-label.mjs", "if (STANDING.test(from) || STANDING.test(to)) return", "if (false) return"),
 ("research/solver/relook.mjs", "if (labelErrs.length) {", "if (false) {"),
 ("research/solver/relook.mjs", "ids.delete(id); labelled.push(id);", "labelled.push(id);"),
]
caught6=0
for f,a,b in M6:
  fp=os.path.join(ROOT,f); o=open(fp).read()
  assert o.count(a)==1,(f,o.count(a),a[:50])
  try:
    open(fp,'w').write(o.replace(a,b))
    r=subprocess.run(['node','research/tests/plan-checker.test.mjs'],cwd=ROOT,capture_output=True,text=True)
    ok=r.returncode!=0; caught6+=ok
    print(('CAUGHT  ' if ok else 'SURVIVED'), f.split('/')[-1]+':', a[:55])
  finally:
    open(fp,'w').write(o)
print(f'labels: {caught6}/{len(M6)} caught')

# the tests since a review by close time (uncertainty.mjs testsAfter; the plan-auditor's MINOR 6 on 967f853, kept on the
# maintainer's 'Unlock enforcement' of 5 Oct, the fifth): its planted checks must fail (uncertainty.mjs --planted)
M7=[
 ("return tests.filter(t => { const v = closes.get(key(t.name)); return v !== undefined && v !== null && v > c; });", "return tests.slice(tests.findIndex(t => t.name === covered) + 1);"),
 ("return v !== undefined && v !== null && v > c; });", "return v !== undefined && v !== null && v >= c; });"),
 ("if (c === undefined || c === null) return tests.slice(", "if (true) return tests.slice("),
 ("  const after = testsAfter(tests, covered, lessons);", "  const after = testsAfter(tests, covered, null);"),
]
u='/home/user/vitejs-vite-kdvuf9qw/research/solver/uncertainty.mjs'
origu=open(u).read()
caught7=0
try:
  for a,b in M7:
    assert origu.count(a)==1,(origu.count(a),a[:60])
    open(u,'w').write(origu.replace(a,b))
    r=subprocess.run(['node','research/solver/uncertainty.mjs','--planted'],cwd=ROOT,capture_output=True,text=True)
    ok = r.returncode!=0
    caught7+=ok
    print(('CAUGHT  ' if ok else 'SURVIVED'), 'uncertainty:', a[:60])
finally:
  open(u,'w').write(origu)
print(f'uncertainty: {caught7}/{len(M7)} caught')
