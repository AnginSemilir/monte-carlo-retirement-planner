#!/usr/bin/env python3
# 7AH'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ah.mjs's gate or items
# in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The stamp
# gate lives in fair-gate.mjs (requireFairLogs); the exact rule is stats.mjs's, the whole score reduce-7aa.mjs's.
#   python3 research/solver/mutate-reduce-7ah.py > research/solver/results-reduce-7ah-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ah.mjs'), os.path.join(HERE, 'zz-mut-7ah.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }", "if (k > 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }", "if (k < 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores the unit settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate ignores readerRef", "if (field(u.ran, 'readerRef') !== (u.arm === 'ORDER' ? 'order' : null))", "if (false)"),
    ("the gate lets ORDER differ from READER", "if (u.arm === 'ORDER' && u.ran && R && R.ran && noRef(u.ran) !== R.ran)", "if (false)"),
    ("the gate lets 0.01 differ from 0.02", "if (u.ran && R2 && R2.ran && atW(u.ran, '0.02') !== R2.ran)", "if (false)"),
    ("the gate ignores the reference's table", "if (u.table !== c.table)", "if (false)"),
    ("the gate ignores the reference's ran line", "if (u.ran && withPaths(c.ran, n) !== u.ran)", "if (false)"),
    ("the gate ignores the switch margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate ignores a death charge", "if (u.joint.deathTax !== 0)", "if (false)"),
    ("the gate ignores a unit not done", "if (!u.done) bad.push(`${tag}: no done line`);", ""),
    ("item 1 passes on the exact rule alone", "l.pass = o.outcome === 'no material harm' && l.u.lo > -l.margin;", "l.pass = true;"),
    ("item 1 ignores harm", "legs.some(l => l.o === 'harm')", "false"),
    ("the margins are all 0.25", "const legs = PANEL.map(([id]) => { const k = K(id, w); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });", "const legs = PANEL.map(([id]) => { const k = K(id, w); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: 0.25 }; });"),
    ("items 1 and 3 read one setting", "surv(1, '0.02'); whole(2, '0.02'); surv(3, '0.01'); whole(4, '0.01');", "surv(1, '0.02'); whole(2, '0.02'); surv(3, '0.02'); whole(4, '0.01');"),
    ("items 2 and 4 read one setting", "surv(1, '0.02'); whole(2, '0.02'); surv(3, '0.01'); whole(4, '0.01');", "surv(1, '0.02'); whole(2, '0.02'); surv(3, '0.01'); whole(4, '0.02');"),
    ("the whole score's harm test off", "legs.some(l => l.hi < -MW)", "false"),
    ("the whole score's pass too loose", "legs.every(l => l.lo > -MW)", "legs.every(l => l.lo > -2 * MW)"),
    ("item 5 reads another household", "const eR = err('S360', 'READER', '0.02'), eO = err('S360', 'ORDER', '0.02')", "const eR = err('S370', 'READER', '0.02'), eO = err('S370', 'ORDER', '0.02')"),
    ("item 5's HELD threshold loose", "tri(ratio <= R5.held, ratio >= R5.falsified)", "tri(ratio <= R5.falsified, ratio >= R5.falsified)"),
    ("item 5's FALSIFIED threshold off", "tri(ratio <= R5.held, ratio >= R5.falsified)", "tri(ratio <= R5.held, false)"),
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
