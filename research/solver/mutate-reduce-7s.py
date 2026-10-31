#!/usr/bin/env python3
# THE 7S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7s.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs.
#   python3 research/solver/mutate-reduce-7s.py > research/solver/results-reduce-7s-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7s.mjs'), os.path.join(HERE, 'zz-mut-7s.mjs')
base = open(SRC).read()
M = [
    ("the pairs' saved and lost swapped", "cur.pairs[`${m[1]}-${m[2]}`] = { saved: +m[3], lost: +m[4] }", "cur.pairs[`${m[1]}-${m[2]}`] = { saved: +m[4], lost: +m[3] }"),
    ("the gate ignores a second setting changed between arms", "if (strip(ran) !== strip(first || ''))", "if (false)"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the return points", "if (field(ran, 'quad') !== (q || '5'))", "if (false)"),
    ("the gate does not read the bridge read", "if (field(ran, 'bridgeRead') !== BR[name])", "if (false)"),
    ("the gate accepts a missing case", "if (k !== 1) bad.push", "if (k > 1) bad.push"),
    ("the gate accepts a missing pair", "for (const p of PAIRS) if (!c.pairs[p]) bad.push", "for (const p of PAIRS) if (false) bad.push"),
    ("the reproduction check ignores the counts", "if (p.saved !== R.saved || p.lost !== R.lost)", "if (false)"),
    ("the reproduction check ignores the reader's simulation", "!close(a.sim, R[l][1])", "false"),
    ("a gain without Holm", "const pGain = holm(rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost)));", "const pGain = rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost));"),
    ("the gain's p read as harm", "mcnemarHarmP(r.g.saved, r.g.lost)", "mcnemarHarmP(r.g.lost, r.g.saved)"),
    ("harm at 15 without Holm", "const pHarm = holm(rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved)));", "const pHarm = rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved));"),
    ("no material gain read by significance, not the interval", "noGain = gi.hi < MARGIN", "noGain = !(r.g.saved > r.g.lost && pGain[j] < ALPHA)"),
    ("no material harm read at the wrong end of the interval", "noHarm = hi.lo > -MARGIN", "noHarm = hi.hi > -MARGIN"),
    ("a significant gain below the margin read as no cure", "!gains && noGain && harms", "noGain && harms"),
    ("HELD on one case's cure", "reads.every(x => x.read === 'cures') ? 'HELD'", "reads.some(x => x.read === 'cures') ? 'HELD'"),
    ("harm without the point loss at the margin", "pHarm[j] < ALPHA && -hi.d >= MARGIN", "pHarm[j] < ALPHA"),
    ("item 3 reads only the lower end", "ok: iv.lo > -MARGIN && iv.hi < MARGIN", "ok: iv.lo > -MARGIN"),
    ("item 4 compares the reader at 15 with off", "arm(x, 'READER@15').tier - arm(x, 'READER').tier", "arm(x, 'READER@15').tier - arm(x, 'OFF').tier"),
    ("item 5 ignores a gap's sign", "Math.abs(g.g) <= 1", "g.g <= 1"),
    ("the wrong pair read as g", "g: c.pairs['READER@15-READER']", "g: c.pairs['READER@15-OFF']"),
]
run = lambda f: subprocess.run(['node', f, '--planted'], capture_output=True, text=True).stdout.strip()
bad = 0
out = run(SRC)
if not out.startswith('planted ('):
    print(f'FAIL: the true script does not pass its planted set: {out[:200]}'); sys.exit(1)
print(f'true script: {out}')
try:
    for name, a, b in M:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the mutation does not apply ({base.count(a)} matches)'); bad = 1; continue
        open(DST, 'w').write(base.replace(a, b))
        o = run(DST)
        if o.startswith('PLANTED CHECK FAILED'): print(f'caught  {name}: {o[22:190]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
