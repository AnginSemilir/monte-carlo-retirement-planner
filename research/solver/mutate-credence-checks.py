# THE SECOND UNLOCK'S CHECKS, EACH SHOWN TO MATTER (RULES.md rule 2): every mutation of the new credence, ancestry,
# judged-order and base-rate checks must make research/tests/plan-checker.test.mjs fail. In place, restored after;
# run from anywhere: python3 research/solver/mutate-credence-checks.py (5 Oct: 19 of 19 caught)
import subprocess, os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
p=os.path.join(ROOT,'research/solver/check-prediction.mjs')
orig=open(p).read()
M=[
 ("if (m[1] in d) Object.defineProperty", "if (false) Object.defineProperty"),
 ("if (d.twice) P.push", "if (false) P.push"),
 ("if (!items.has(m[1])) P.push(`item ${m[1]}: the Decision rule", "if (false) P.push(`item ${m[1]}: the Decision rule"),
 ("else if (firstNum(line) !== Number(g.point))", "else if (!String(line).includes(String(g.point)))"),
 ("/(?<![\\w.])(\\d+(?:\\.\\d+)?|\\.\\d+)(?![\\w])/", "/(\\d+(?:\\.\\d+)?|\\.\\d+)/"),
 ("export const exemptBy = (commit, ancestors) => !!commit && ancestors.has(commit);", "export const exemptBy = (commit, ancestors) => !commit || ancestors.has(commit);"),
 ("export const CREDENCE_BOUNDARY = 'd4487bd'", "export const CREDENCE_BOUNDARY = 'ed5db5c'"),
 ("opts.judged === true || (onDisk(name) && heldBy(name, JUDGED_BOUNDARY))", "opts.judged === true || (onDisk(name) && heldBy(name, CREDENCE_BOUNDARY))"),
 ("if (J === D) return", "if (false) return"),
 ("if (git(['merge-base', '--is-ancestor', J, D]) === null) return", "if (false) return"),
 ("if (!J && !D) return [", "if (false) return ["),
 ("if (!J) return [`the derivation", "if (false) return [`the derivation"),
 ("if (/^\\s*-\\s*\\*\\*Judged:\\*\\*\\s*none\\b/mi.test(text)) return [];", ""),
 ("if (!line) return ['results-scorecard.txt has no KIND", "if (false) return ['results-scorecard.txt has no KIND"),
 ("if (!b) P.push(`item ${m[1]}: no \"- **Base rate", "if (false) P.push(`item ${m[1]}: no \"- **Base rate"),
 ("Math.abs(r - Number(b[1])) <= 0.01 + 1e-9", "Math.abs(r - Number(b[1])) <= 0.02 + 1e-9"),
 ("&& heldToJudged(name, { judged })) errs.push(...baseRateProblems(text), ...judgedOrderProblems(name, text));", "&& false) errs.push(...baseRateProblems(text), ...judgedOrderProblems(name, text));"),
 ("&& heldToCredence(name, { credence })) errs.push(...credenceProblems(text));", "&& false) errs.push(...credenceProblems(text));"),
 ("heldBy(name, CREDENCE_BOUNDARY)));", "true));"),
]
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
