#!/usr/bin/env python3
# 7AL'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7al.mjs's gate, item or arithmetic in a
# scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7al.py > research/solver/results-reduce-7al-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7al.mjs'), os.path.join(HERE, 'zz-mut-7al.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }", "if (k > 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }", "if (k < 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores a unit not done", "if (!u.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores the unit settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate ignores the path count", "paths: String(NPW), ", ""),
    ("the gate ignores the tier state", "if (TSJ !== (field(u.ran, 'tierState') !== null))", "if (false)"),
    ("the gate ignores readerRef", "if ((u.arm === 'ORDER') !== (field(u.ran, 'readerRef') === 'order') || (u.arm !== 'ORDER' && field(u.ran, 'readerRef') !== null))", "if (false)"),
    ("the gate ignores the switch margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate ignores a death charge", "if (u.joint.deathTax !== 0)", "if (false)"),
    ("the gate ignores the reference's table", "if (r.table !== u.table)", "if (false)"),
    ("the gate ignores the reference's gap", "if (!r.gap || r.gap.gap !== u.gap.gap", "if (!r.gap || false"),
    ("the gate ignores a missing access line", "if (!ac) { bad.push(`${tag}: no access line`); continue; }", "if (!ac) { continue; }"),
    ("the gate ignores the world count", "if (ac.worlds !== K)", "if (false)"),
    ("the gate ignores a missing resid year", "if (rs.filter(x => x.t === t).length !== 1) {", "if (false) {"),
    ("the gate ignores missing cell lines", "if (cl.length !== 16)", "if (false)"),
    ("the gate ignores the paths through the bridge", "if (sb[0].through !== br[0].paid)", "if (false)"),
    ("the gate ignores the after stage's paths", "if (sa[0].n !== br[0].paid)", "if (false)"),
    ("the gate ignores the node's survivors", "if (Math.abs(100 * sa[0].through / NPW - nd[0].sim) > 5e-5 + 1e-9)", "if (false)"),
    ("the gate ignores the telescoping", "if (s.n > 0 && !(Math.abs(sum - s.n * s.mean) <= tol))", "if (false)"),
    ("the margin a flat 0.5", "const m = marginFor(x.c), pt", "const m = 0.5, pt"),
    ("the test at c, not c less the margin", "binomLower(x.s, x.n, Math.max(0, (x.c - m) / 100))", "binomLower(x.s, x.n, x.c / 100)"),
    ("no Holm", "const adj = holm(r.map(x => x.p));", "const adj = r.map(x => x.p);"),
    # not listed: OPTIMISTIC without its point condition is an equivalent mutation (a p under 0.05 at c - m needs s/n under
    # (c - m)/100, which is the point at the margin), so no planted case can catch it; the condition stays, as rule 3 writes it
    ("NO MATERIAL OPTIMISM on the point", "x.lo >= x.c - x.m ? 'NO MATERIAL OPTIMISM'", "x.pt <= x.m ? 'NO MATERIAL OPTIMISM'"),
    ("HELD at one unit", "const outcome = held >= 2 ? 'HELD'", "const outcome = held >= 1 ? 'HELD'"),
    ("HELD counts any unit", "const held = O66.filter(([id, a]) => r.some(x => x.id === id && x.arm === a && x.read === 'OPTIMISTIC')).length;", "const held = new Set(r.filter(x => x.read === 'OPTIMISTIC').map(x => x.id + x.arm)).size;"),
    ("FALSIFIED despite an OPTIMISTIC unit-world", "!r.some(x => x.read === 'OPTIMISTIC') && o66.length", "o66.length"),
    ("the lower tail read as the upper", "betaInc(n - s, s + 1, 1 - q))", "1 - betaInc(n - s, s + 1, 1 - q))"),
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
