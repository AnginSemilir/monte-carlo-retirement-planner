#!/usr/bin/env python3
# 7AI'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ai.mjs's gate or items in a
# scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7ai.py > research/solver/results-reduce-7ai-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ai.mjs'), os.path.join(HERE, 'zz-mut-7ai.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }", "if (k > 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }", "if (k < 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores a unit not done", "if (!u.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores the unit settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate ignores the bridge read", "bridgeRead: u.arm === 'READER' ? 'reader' : 'false'", "bridgeRead: field(u.ran, 'bridgeRead')"),
    ("the gate ignores the switch margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate ignores a death charge", "if (u.joint.deathTax !== 0)", "if (false)"),
    ("the gate ignores the reference's table", "if (r.table !== u.table)", "if (false)"),
    ("the gate ignores the reference's gap", "if (!r.gap || r.gap.gap !== u.gap.gap", "if (!r.gap || false"),
    ("the gate lets a shifted ran line differ", "if (L && L.ran && L.ran !== u.ran)", "if (false)"),
    ("the gate ignores a tier that did not move", "if (!(mv >= 0.1 - 1e-9))", "if (false)"),
    ("the gate ignores linear tiers off O60's", "if (TIERS.includes(n) && Math.abs(v - o60[n].linear) > 0.01 + 1e-9)", "if (false)"),
    ("the gate ignores shifted tiers off their figures", "if (Math.abs(b - want) > 1e-9)", "if (false)"),
    ("the gate ignores a missing opening2 line", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} opening2 lines, not 1`); }", "}"),
    ("the reversed arm reads the blend's figures", "export const reversedOf = (o, k) => +(2 * o[k].linear - o[k].blend).toFixed(2);", "export const reversedOf = (o, k) => o[k].blend;"),
    ("item 1 counts same as opposite", "if (b && r) { if (b === -r) opp++; else same++; }", "if (b && r) { opp++; }"),
    ("item 1 counts ties", "if (b && r) { if (b === -r) opp++; else same++; }", "if (b === -r) opp++; else same++;"),
    ("item 1's HELD at 0.7", "UMIN = 7, OPP = 0.8, SAME = 0.4, DIR = 0.7;", "UMIN = 7, OPP = 0.7, SAME = 0.4, DIR = 0.7;"),
    ("item 1's FALSIFIED off", "U >= UMIN && same >= SAME * U ? 'FALSIFIED'", "false ? 'FALSIFIED'"),
    ("the untied floor at 6", "UMIN = 7, OPP = 0.8, SAME = 0.4, DIR = 0.7;", "UMIN = 6, OPP = 0.8, SAME = 0.4, DIR = 0.7;"),
    ("item 2 reads down as up", "B >= UMIN && up >= DIR * B ? 'HELD' : B >= UMIN && dn >= DIR * B ? 'FALSIFIED'", "B >= UMIN && dn >= DIR * B ? 'HELD' : B >= UMIN && up >= DIR * B ? 'FALSIFIED'"),
    ("item 2 reads the reversed arm", "const b = dirOf(p.lin.gap, p.bl.gap), r = dirOf(p.lin.gap, p.rv.gap);\n    if (b && r) { if (b === -r) opp++; else same++; }\n    if (b > 0) up++; else if (b < 0) dn++;", "const b = dirOf(p.lin.gap, p.bl.gap), r = dirOf(p.lin.gap, p.rv.gap);\n    if (b && r) { if (b === -r) opp++; else same++; }\n    if (r > 0) up++; else if (r < 0) dn++;"),
    ("the gap order puts 0 last", "(g === '0' ? 0 : g === '>1' ? Infinity : Number(g))", "(g === '0' ? Infinity : g === '>1' ? Infinity : Number(g))"),
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
