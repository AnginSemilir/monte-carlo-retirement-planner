#!/usr/bin/env python3
# THE 7V REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7v.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs. The whole score's
# arithmetic (scorePaths, paired) and the switching count are reduce-7t.mjs's and read-7t-deep.mjs's, mutated there.
#   python3 research/solver/mutate-reduce-7v.py > research/solver/results-reduce-7v-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7v.mjs'), os.path.join(HERE, 'zz-mut-7v.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing case", "if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`)", "if (k > 1) bad.push(`${id}: ${k} case lines, not 1`)"),
    ("the gate ignores the case line's settings", "for (const k of Object.keys(want)) if (got[k] !== want[k])", "for (const k of Object.keys(want)) if (false)"),
    ("the gate ignores a second setting changed between arms", "if (strip(ran) !== strip(c.ran[R.arms[0]]))", "if (false)"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the points", "pts: PTS, seed", "seed"),
    ("the gate does not read the lambda", "lambda: R.lambda, levels", "levels"),
    ("the gate does not read the tier above", "tiersAbove: R.tiersAbove, finalIntegral", "finalIntegral"),
    ("the gate does not read the mixture", "const w = { mix: R.mix, pts", "const w = { pts"),
    ("the gate ignores a joint line that does not match its label", "if (j.joint !== l.endsWith('+J'))", "if (false)"),
    ("the gate ignores the risk-above decision", "if (j.decided !== R.decided)", "if (false)"),
    ("the gate accepts a missing run", "if (Object.keys(c.runs).sort().join(',') !== [...runs].sort().join(','))", "if (false)"),
    ("the gate reads the worlds with some() and skips a missing one", "[0, 1, 2].some(k => !ws[k] || Math.abs(ws[k].z - NODES[k]) > 1e-3 || ws[k].paths !== WP)", "ws.some((x, k) => !x || Math.abs(x.z - NODES[k]) > 1e-3 || x.paths !== WP)"),
    ("the gate accepts world lines on a case that registers none", "if (!R.worlds && Object.keys(c.worlds).length)", "if (false)"),
    ("the gate accepts a short done line", "if (c.done !== runs.length)", "if (false)"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
    ("a trace's stamp sha not compared", "['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k])", "['code', 'audit', 'prediction'].every(k => j.stamp[k] === ST[k])"),
    ("a trace's survival not compared with the run line's", " && Math.abs(j.sim - sim) < 5e-4);", ");"),
    ("a trace name keeps the learner's +", ".replace(/\\+/g, '_')", ""),
    # the rule
    ("lost and saved swapped in the paired cells", "else if (A[i]) lost++; else if (B[i]) saved++;", "else if (A[i]) saved++; else if (B[i]) lost++;"),
    ("harm without Holm", "const ps = holm(legs.map(x => mcnemarHarmP(x.k.lost, x.k.saved)));", "const ps = legs.map(x => mcnemarHarmP(x.k.lost, x.k.saved));"),
    ("a gain without Holm", "const ps = holm(legs.map(x => mcnemarHarmP(x.k.saved, x.k.lost)));", "const ps = legs.map(x => mcnemarHarmP(x.k.saved, x.k.lost));"),
    ("the gain's p read as harm", "const ps = holm(legs.map(x => mcnemarHarmP(x.k.saved, x.k.lost)));", "const ps = holm(legs.map(x => mcnemarHarmP(x.k.lost, x.k.saved)));"),
    ("no material gain at the wrong end", "noGain = iv.hi < x.margin", "noGain = iv.lo < x.margin"),
    ("the margin fixed at 0.25 whatever the survival", "  const margin = id => marginFor(survivedShare(S(id, PRODUCT)));\n  const leg =", "  const margin = id => 0.25;\n  const leg ="),
    ("the count guard dropped from the unconditional interval", "lo: saved === 0 ? Math.min(u.lo, bh) : u.lo", "lo: u.lo"),
    ("the unconditional reading's disagreement read at the wrong end", "read: kind === 'harm' ? u.lo > -margin : u.hi < margin", "read: kind === 'harm' ? u.hi > -margin : u.hi < margin"),
    # the items
    ("item 1 reads the product against the reader", "harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/1e-3')))", "harmFamily(HARMED.map(id => leg(id, 'READER/1e-3', PRODUCT)))"),
    ("item 2 reads the reader at 0 against the product, not off at 0", "harmFamily(HARMED.map(id => leg(id, 'OFF/0', 'READER/0')))", "harmFamily(HARMED.map(id => leg(id, PRODUCT, 'READER/0')))"),
    ("item 3 without the tolerance", "v >= ns[q - 1] - TOL", "v >= ns[q - 1]"),
    ("item 3 without the rise from 0.001 to 0", " && ns[3] > ns[0];", ";"),
    ("item 3 without the no-harm condition at 0", "rises: mono && i3h[j].o === 'no material harm'", "rises: mono"),
    ("item 4 always against 1e-4", "pk = ns[0] >= ns[1] ? '3e-4' : '1e-4'", "pk = '1e-4'"),
    ("item 4 HELD only when every case harms", "outcome: i4h.some(x => x.o === 'harm') ? 'HELD'", "outcome: i4h.every(x => x.o === 'harm') ? 'HELD'"),
    ("item 5 at margin 0 alone", "HARMED.flatMap(id => ['1e-4', '0'].map(m => leg(id, `READER/${m}`, `READER+J/${m}`)))", "HARMED.flatMap(id => ['0'].map(m => leg(id, `READER/${m}`, `READER+J/${m}`)))"),
    ("item 6 reads the learner the wrong way round", "leg(id, 'READER+J/0', 'READER+J/0+L')", "leg(id, 'READER+J/0+L', 'READER+J/0')"),
    ("item 7 reads S330's pair as a harm", "const g7 = gainFamily([pairLeg('S330 mix3', 'S330 mix5', '1e-3'), pairLeg('S330 mix3', 'S330 mix5', '0')]);", "const g7 = harmFamily([pairLeg('S330 mix3', 'S330 mix5', '1e-3'), pairLeg('S330 mix3', 'S330 mix5', '0')]);"),
    ("item 7 without the reproduction at 0.001", "p.read = !p.shows ? 'NOT REPRODUCED' : p.meets", "p.read = p.meets"),
    ("item 8 at the whole of margin 0's switching, not half", "i8.every(x => x.a <= x.z / 2)", "i8.every(x => x.a <= x.z)"),
    # the candidates and the attribution
    ("a reader candidate without its gains", "h.every(x => x.o === 'no material harm') && g.every(x => x.o === 'gain')", "h.every(x => x.o === 'no material harm')"),
    ("a candidate on S194 read on the reader's own (missing) run", "cells(S(id, PRODUCT), S(id, armOn(id, l)))", "cells(S(id, PRODUCT), S(id, l))"),
    ("the product listed as its own candidate", "    if (X === 'OFF' && m === '1e-3') continue;   // the product itself\n", ""),
    ("the attribution names P on item 2 alone", "if (o(2) === 'HELD' && o(3) === 'HELD')", "if (o(2) === 'HELD')"),
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
