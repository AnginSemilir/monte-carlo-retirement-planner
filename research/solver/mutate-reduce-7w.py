#!/usr/bin/env python3
# THE 7W REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7w.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs. The whole score's
# paired cells and the Holm families are reduce-7v.mjs's (mutated there, results-reduce-7v-mutations.txt); the switching
# count is read-7t-deep.mjs's.
#   python3 research/solver/mutate-reduce-7w.py > research/solver/results-reduce-7w-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7w.mjs'), os.path.join(HERE, 'zz-mut-7w.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)"),
    ("the gate ignores a second setting changed within a case", "if (strip(u.ran) !== strip(first.ran))", "if (false)"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the points", "pts: PTS, seed", "seed"),
    ("the gate does not read the return points against the label", ", quad: quadOf(u.label) };", " };"),
    ("the gate strips the minimum pot with the return points", "const strip = s => (s || '').replace(/ quad \\S+/, '')", "const strip = s => (s || '').replace(/ minPot \\S+/, '').replace(/ quad \\S+/, '')"),
    ("the gate accepts a short done line", "if (u.done !== RUNS.length)", "if (false)"),
    ("the gate ignores the solved margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate accepts a missing run", "if (Object.keys(u.runs).sort().join(',') !== [...RUNS].sort().join(','))", "if (false)"),
    ("the gate accepts a missing gap line", "if (!u.gap) bad.push", "if (false) bad.push"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
    ("a trace's arm not compared", "j.arm === label && ", ""),
    ("a trace's survival not compared with the run line's", " && Math.abs(j.sim - sim) <= SIM_TOL);", ");"),
    ("a trace's survival compared strictly inside the print's rounding", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-5 - 1e-9;"),
    ("a trace's survival allowed at 7v's three-decimal tolerance", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-4 + 1e-9;"),
    # the gap and the rule
    ("a logged gap of >1 read as 1", "g === '>1' ? Infinity", "g === '>1' ? 1"),
    ("the ratio from a 0 gap read as 1", "b === 0 ? (a === 0 ? 1 : Infinity) : a / b", "b === 0 ? 1 : a / b"),
    ("item 1 held without passing the product's margin", "outcome: tri(i1, x => x.r >= TEN && x.moves, x => x.r < THREE) });", "outcome: tri(i1, x => x.r >= TEN, x => x.r < THREE) });"),
    ("item 1 held at threefold", "export const TEN = 10, THREE = 3,", "export const TEN = 3, THREE = 3,"),
    ("the margin passed at the margin itself", "moves: gapNum(U('share 0.95', `${a}@15`).gap.gap) > MARGIN }", "moves: gapNum(U('share 0.95', `${a}@15`).gap.gap) >= MARGIN }"),
    ("item 5 read at the margin itself", "m5 = gapNum(U('share 0.95', 'OFF@15').gap.gap) > MARGIN;", "m5 = gapNum(U('share 0.95', 'OFF@15').gap.gap) >= MARGIN;"),
    ("item 2 held on one leg's gain", "legs: i2, outcome: tri(i2, x => x.o === 'gain', x => x.o === 'no material gain') });", "legs: i2, outcome: i2.some(x => x.o === 'gain') ? 'HELD' : tri(i2, x => x.o === 'gain', x => x.o === 'no material gain') });"),
    ("item 2 compares the wrong way round", "leg('share 0.95', `${a}@5`, '1e-3', `${a}@15`, '1e-3')", "leg('share 0.95', `${a}@15`, '1e-3', `${a}@5`, '1e-3')"),
    ("item 3 held at any ratio under ten", "outcome: r3 < TWO && r3 > 1 / TWO ? 'HELD'", "outcome: r3 < TEN ? 'HELD'"),
    ("item 3 never falsified", ": r3 >= TEN ? 'FALSIFIED' : 'INCONCLUSIVE' });", ": 'INCONCLUSIVE' });"),
    ("item 4 held without the switch count", "const ok4 = i4.map((x, j) => x.o === 'no material harm' && sw4[j].open <= sw4[j].zero / 2);", "const ok4 = i4.map(x => x.o === 'no material harm');"),
    ("item 4 compares the freed opening against the product's margin, not 0", "leg(id, l, '0', l, '1e-3+open')", "leg(id, l, '1e-3', l, '1e-3+open')"),
    ("item 4 falsified on one leg's harm", ": i4.every(x => x.o === 'harm') ? 'FALSIFIED'", ": i4.some(x => x.o === 'harm') ? 'FALSIFIED'"),
    ("item 5 held without passing the margin", "outcome: r5 >= TEN && m5 ? 'HELD'", "outcome: r5 >= TEN ? 'HELD'"),
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
            first = next((l for l in o.splitlines() if l.startswith('FAIL')), 'an error before the planted set')
            print(f'caught  {name}: {first[5:180]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
