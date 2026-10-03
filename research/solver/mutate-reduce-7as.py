#!/usr/bin/env python3
# 7AS'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7as.mjs's gate, items or
# arithmetic in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation
# must apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7as.py > research/solver/results-reduce-7as-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7as.mjs'), os.path.join(HERE, 'zz-mut-7as.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing job", "if (k !== 1) bad.push(`${kind} ${id} ${a}/W${w}: ${k} job lines, not 1`); }", "if (k > 1) bad.push(`${kind} ${id} ${a}/W${w}: ${k} job lines, not 1`); }"),
    ("the gate accepts an unregistered job", "{ bad.push(`${tag}: not a registered job`); continue; }", "{ continue; }"),
    ("the gate ignores a job not done", "if (!j.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores the ran line", "if (!sameRan(t.ran, sizeRan(chargeRan(r.ran, c), pts, n)))", "if (false)"),
    ("the gate ignores the joint line's margin", "t.joint.margin !== '0' || ", ""),
    ("the gate ignores the joint line's charge", "t.joint.charge !== c || ", ""),
    ("the gate ignores the joint line's scale", " || t.joint.scale !== r.joint.scale", ""),
    ("the gate ignores a missing world line", " || t.worlds.filter(Boolean).length !== 3", ""),
    ("the identity skips the table", "for (const f of ['table', 'gap', 'movesRaw', 'priceRaw', 'worlds'])", "for (const f of ['gap', 'movesRaw', 'priceRaw', 'worlds'])"),
    ("the identity skips the gap", "for (const f of ['table', 'gap', 'movesRaw', 'priceRaw', 'worlds'])", "for (const f of ['table', 'movesRaw', 'priceRaw', 'worlds'])"),
    ("the identity lets an identity job run forward", "if (t.node || t.all) bad.push(`${tag}: an identity job ran forward`);", ""),
    ("the gate ignores the all-world paths", "if (!t.all || t.all.paths !== na)", "if (!t.all)"),
    ("the gate ignores a missing all-world line", "if (!t.all || t.all.paths !== na)", "if (t.all && t.all.paths !== na)"),
    ("the gate ignores the node paths", "if (!t.node || t.node.paths !== wn)", "if (!t.node)"),
    ("the gate ignores a missing node line", "if (!t.node || t.node.paths !== wn)", "if (t.node && t.node.paths !== wn)"),
    ("the gate ignores a missing log year", "if (!t.log[rule][y]) { bad.push", "if (false) { bad.push"),
    ("the gate ignores OPEN2 holding", "if (t.node && t.node.held0.OPEN2 !== 0)", "if (false)"),
    ("the gate allows a node line on bridge 4", "} else if (t.node) bad.push(`${tag}: a node line on a unit 7as does not run at the node`);", "}"),
    ("a leg FLAT without the up direction", "l.down.outcome === 'no material harm' && l.up.outcome === 'no material harm' && l.u.lo", "l.down.outcome === 'no material harm' && l.u.lo"),
    ("a leg CHANGES without the up direction", "const changes = l.down.outcome === 'harm' || l.up.outcome === 'harm' ||", "const changes = l.down.outcome === 'harm' ||"),
    ("a leg FLAT without the whole score", " && l.w.lo > -MW && l.w.hi < MW;", ";"),
    ("a leg CHANGES without the whole score above", " || l.w.lo > MW;", ";"),
    ("a leg FLAT without the guarded interval", " && l.u.lo > -mg && l.u.hi < mg", ""),
    ("no Holm on the down direction", "const hD = holm(legs.map(l => l.pDown))", "const hD = legs.map(l => l.pDown)"),
    ("item 1 HELD on any FLAT", "legs.every(l => l.read === 'FLAT') ? 'HELD'", "legs.some(l => l.read === 'FLAT') ? 'HELD'"),
    ("item 2 HELD at the margin", "o2 = w2.lo > -MW ? 'HELD'", "o2 = w2.lo >= -MW ? 'HELD'"),
    ("item 2 FALSIFIED on the lower end", "w2.hi < -MW ? 'FALSIFIED'", "w2.lo < -MW ? 'FALSIFIED'"),
    ("chargeRan replaces the first charge", "ran.replace(/ switchCharge 0\\.001$/, ` switchCharge ${c}`)", "ran.replace(/ switchCharge 0\\.001/, ` switchCharge ${c}`)"),
    ("slice keeps the levels whole", "level: T.level.subarray(0, n * T.Y)", "level: T.level"),
]
r = subprocess.run(['node', SRC, '--planted'], capture_output=True, text=True)
if r.returncode != 0: print('THE TRUE SCRIPT FAILS ITS PLANTED SET:\n' + r.stdout); sys.exit(1)
caught, bad = 0, []
for name, old, new in M:
    if base.count(old) != 1: bad.append(f'NOT APPLIED ({base.count(old)} matches): {name}'); continue
    open(DST, 'w').write(base.replace(old, new))
    r = subprocess.run(['node', DST, '--planted'], capture_output=True, text=True)
    if 'PLANTED CHECK FAILED' in r.stdout: caught += 1; print(f'caught: {name}')
    else: bad.append(f'NOT CAUGHT: {name}')
if os.path.exists(DST): os.remove(DST)
for b in bad: print(b)
print(f'{caught} of {len(M)} mutations caught')
sys.exit(1 if bad else 0)
