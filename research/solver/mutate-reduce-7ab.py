#!/usr/bin/env python3
# THE 7AB REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ab.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); 7aa's gate and whole-score leg are reduce-7aa.mjs's (mutated there,
# results-reduce-7aa-mutations.txt); the paired cells and the Holm families are reduce-7v.mjs's.
#   python3 research/solver/mutate-reduce-7ab.py > research/solver/results-reduce-7ab-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ab.mjs'), os.path.join(HERE, 'zz-mut-7ab.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)"),
    ("the gate ignores the table", "else if (u.table !== r.table) bad.push", "else if (false) bad.push"),
    ("the gate ignores a ran line not 7aa's", "if (u.ran !== r.ran) bad.push", "if (false) bad.push"),
    ("the gate does not read the estate weight", "if (field(u.ran, 'bequestWeight') !== u.w) bad.push", "if (false) bad.push"),
    ("the gate does not read the tier state, held tier, Q's fix or reference", "for (const k of ['tierState', 'holdTier', 'bridgeStep', 'readerRef'])", "for (const k of [])"),
    ("the gate ignores the gap", "else if (!r.gap || u.gap !== `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}`) bad.push", "else if (!r.gap) bad.push"),
    ("the gate ignores one policy for every world", "if (u.joint.joint) bad.push", "if (false) bad.push"),
    ("the gate ignores the solved margin", "if (u.joint.margin !== '0.001') bad.push", "if (false) bad.push"),
    ("the gate ignores the scale", "if (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap)", "if (!r.joint || u.joint.cap !== r.joint.cap)"),
    ("the gate ignores PRODUCT's survival against 7aa's", "else if (!r.run || Math.abs(u.runs.PRODUCT.sim - r.run.sim) > 1e-9) bad.push", "else if (!r.run) bad.push"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${tag}: no solve line`);\n    else if (u.table !== r.table)", "if (false) bad.push(`${tag}: no solve line`);\n    else if (u.table !== undefined && u.table !== r.table)"),
    ("the gate accepts a missing gap line", "if (!u.gap) bad.push(`${tag}: no gap line`);\n    else if (!r.gap || u.gap !== `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}`) bad.push", "if (false) bad.push(`${tag}: no gap line`);\n    else if (u.gap && (!r.gap || u.gap !== `${r.gap.gap} opening ${r.gap.open1e3},${r.gap.open0}`)) bad.push"),
    ("the gate accepts a missing PRODUCT run", "if (!u.runs.PRODUCT) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing FREED run", "if (!u.runs.FREED) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing done line", "if (!u.done) bad.push", "if (false) bad.push"),
    # the identity
    ("the identity ignores the wealth", "export const TRACE_KEYS = ['survived', 'level', 'tier', 'wealth', 'taxPaid', 'failYear'];", "export const TRACE_KEYS = ['survived', 'level', 'tier', 'taxPaid', 'failYear'];"),
    ("the identity ignores the survival", "export const TRACE_KEYS = ['survived', 'level', 'tier', 'wealth', 'taxPaid', 'failYear'];", "export const TRACE_KEYS = ['level', 'tier', 'wealth', 'taxPaid', 'failYear'];"),
    ("the identity accepts a missing array", "TRACE_KEYS.every(x => typeof j[x] === 'string' && j[x] === k[x])", "TRACE_KEYS.every(x => j[x] === k[x])"),
    ("the identity ignores the count", "j.N === k.N && j.Y === k.Y && ", ""),
    # the tier differences
    ("the tier read counts year 0 as later", "if (t === 0) y0++; else later++;", "later++;"),
    ("the tier read counts past a failure", "end = Math.min(endP, endQ, P.Y);", "end = P.Y;"),
    # the loss read
    ("the loss read ignores survival harm", "if (survO === 'harm' || (w.hi < 0 && -w.d >= m)) return 'loss';", "if (w.hi < 0 && -w.d >= m) return 'loss';"),
    ("the loss read ignores a whole-score loss", "if (survO === 'harm' || (w.hi < 0 && -w.d >= m)) return 'loss';", "if (survO === 'harm') return 'loss';"),
    ("the loss read ignores survival's unconditional end", "if (w.lo > -m && unLo > -m) return 'no material loss';", "if (w.lo > -m) return 'no material loss';"),
    ("the loss read takes the point for the interval", "if (w.lo > -m && unLo > -m) return 'no material loss';", "if (w.d > -m && unLo > -m) return 'no material loss';"),
    # both reads
    ("no material harm by the exact reading alone", "o: x.o === 'no material harm' && !(x.un.lo > -x.margin) ? 'inconclusive' : x.o", "o: x.o"),
    # the items
    ("the legs the wrong way round", "k: cells(S(id, arm, a, w), S(id, arm, b, w))", "k: cells(S(id, arm, b, w), S(id, arm, a, w))"),
    ("the margin from TS+J's survival", "mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'PRODUCT', w)));", "mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'TS+J', w)));"),
    ("the margin from W0.02 on every leg", "mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'PRODUCT', w)));", "mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'PRODUCT', '0.02')));"),
    ("item 1 against PRODUCT", "leg(id, arm, 'FREED', 'TS+J', '0'))));", "leg(id, arm, 'FREED', 'PRODUCT', '0'))));"),
    ("item 1 held on one leg", "outcome: i1.every(x => x.o === 'no material harm') ? 'HELD' : i1.some", "outcome: i1.some(x => x.o === 'no material harm') ? 'HELD' : i1.some"),
    ("item 2 survival against PRODUCT", "s2 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'TS+J', '0.02')));", "s2 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', '0.02')));"),
    ("item 2's whole leg against PRODUCT", "const w = WL(id, arm, 'FREED', 'TS+J', '0.02', a2)", "const w = WL(id, arm, 'FREED', 'PRODUCT', '0.02', a2)"),
    ("item 2 held on one leg", "outcome: i2.every(x => x.o === 'no material loss') ? 'HELD' : i2.some", "outcome: i2.some(x => x.o === 'no material loss') ? 'HELD' : i2.some"),
    ("item 3 at W0 only", "WEIGHTS.flatMap(w => harmLegs.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', w)))", "['0'].flatMap(w => harmLegs.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', w)))"),
    ("item 3 against TS+J", "harmLegs.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', w))", "harmLegs.map(([id, arm]) => leg(id, arm, 'FREED', 'TS+J', w))"),
    ("item 3 held on one leg", "outcome: i3.every(x => x.o === 'no material harm') ? 'HELD' : i3.some", "outcome: i3.some(x => x.o === 'no material harm') ? 'HELD' : i3.some"),
    ("item 4 against TS+J", "const i4 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'PRODUCT', '0')));", "const i4 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'FREED', 'TS+J', '0')));"),
    ("item 4 held on one case", "outcome: tri(i4, x => x.o === 'gain', x => x.o === 'no material gain') });", "outcome: i4.some(x => x.o === 'gain') ? 'HELD' : 'INCONCLUSIVE' });"),
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
