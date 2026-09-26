#!/usr/bin/env python3
# THE 7T REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7t.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs.
#   python3 research/solver/mutate-reduce-7t.py > research/solver/results-reduce-7t-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7t.mjs'), os.path.join(HERE, 'zz-mut-7t.mjs')
base = open(SRC).read()
M = [
    ("the gate ignores a second setting changed between arms", "if (strip(ran) !== strip(c.ran[want[0]] || ''))", "if (false)"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate ignores a joint line that does not match its label", "if (j.joint !== l.endsWith('+J'))", "if (false)"),
    ("the gate accepts a missing margin-0 run", "if (!c.m0[`${l}/M0`]) bad.push", "if (false) bad.push"),
    ("the gate reads the worlds with some() and skips a missing one", "[0, 1, 2].some(k => !ws[k] || Math.abs(ws[k].z - NODES[k]) > 1e-3 || ws[k].paths !== WP)", "ws.some((x, k) => !x || Math.abs(x.z - NODES[k]) > 1e-3 || x.paths !== WP)"),
    ("the gate accepts a missing case", "if (k !== 1) bad.push", "if (k > 1) bad.push"),
    ("the reproduction check ignores the counts", "if (p.saved !== R.saved || p.lost !== R.lost)", "if (false)"),
    ("g read from the wrong pair", "g: c.pairs['READER+J-READER']", "g: c.pairs['READER+J-OFF']"),
    ("h read from the wrong pair", "h: c.pairs['READER+J-OFF+J']", "h: c.pairs['READER+J-OFF']"),
    ("the clairvoyance gap's sign reversed", "map(w => w.table - w.sim)", "map(w => w.sim - w.table)"),
    ("a raise credited on a failed path", "(alive ? raise : 0)", "raise"),
    ("the estate not capped", "Math.min(T.wealth[i * T.Y + T.Y - 1], cap)", "T.wealth[i * T.Y + T.Y - 1]"),
    ("a failure in life charged from the year after", "for (let t = T.failYear[i]; t < T.Y; t++)", "for (let t = T.failYear[i] + 1; t < T.Y; t++)"),
    ("the paired difference's sign reversed", "Array.from(z, (x, i) => x - a[i])", "Array.from(z, (x, i) => a[i] - x)"),
    ("item 3 without the normal world", "x.g[0] >= 1 && x.g[0] > x.g[1]", "x.g[0] >= 1"),
    ("item 4 without the absolute gap", "Math.abs(x.j) <= Math.abs(x.a) / 2", "x.j <= x.a / 2"),
    ("item 5 reads only the lower end", "x.v.lo > -MARGIN && x.v.hi < MARGIN", "x.v.lo > -MARGIN"),
    ("item 6 without the no-harm condition", "g6.every(x => x.gain && x.noHarm)", "g6.every(x => x.gain)"),
    ("item 7 without significance", "p7.saved > p7.lost && mcnemarHarmP(p7.saved, p7.lost) < ALPHA", "p7.saved > p7.lost"),
    ("item 8 without the comparison to off with one policy", "w8.every(x => x.a.d > 0 && x.b.d > -2 * x.b.se)", "w8.every(x => x.a.d > 0)"),
    ("a trace's stamp sha not compared", "['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k])", "['code', 'audit', 'prediction'].every(k => j.stamp[k] === ST[k])"),
    ("the gate accepts a missing prefix line", "bad.push(`${c.id}: no prefix line for the first ${P0} paths`);", ";"),
    ("the reproduction check ignores the prefix's survival", "!close(sim, R[l][1])", "false"),
    ("a gain without Holm", "const pGain = holm(rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost)));", "const pGain = rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost));"),
    ("the gain's p read as harm", "mcnemarHarmP(r.g.saved, r.g.lost)", "mcnemarHarmP(r.g.lost, r.g.saved)"),
    ("harm without Holm", "const pHarm = holm(rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved)));", "const pHarm = rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved));"),
    ("harm without the point loss at the margin", "pHarm[j] < ALPHA && -hi.d >= MARGIN", "pHarm[j] < ALPHA"),
    ("no material gain read by significance", "noGain = gi.hi < MARGIN", "noGain = !(r.g.saved > r.g.lost && pGain[j] < ALPHA)"),
    ("no material harm at the wrong end", "noHarm = hi.lo > -MARGIN", "noHarm = hi.hi > -MARGIN"),
    ("a significant gain below the margin read as no cure", "!gains && noGain && harms", "noGain && harms"),
    ("HELD on one case's cure", "reads.every(x => x.read === 'cures') ? 'HELD'", "reads.some(x => x.read === 'cures') ? 'HELD'"),
    ("the rule's intervals on 3,000 paths", "export function decide(rows, n = N)", "export function decide(rows, n = 3000)"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
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
