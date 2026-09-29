#!/usr/bin/env python3
# THE 7AC REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ac.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); 7aa's gate and whole-score leg are reduce-7aa.mjs's (mutated there,
# results-reduce-7aa-mutations.txt); lossRead, bothReads and the identity's sameTrace are reduce-7ab.mjs's (mutated there,
# results-reduce-7ab-mutations.txt); the paired cells and the Holm families are reduce-7v.mjs's.
#   python3 research/solver/mutate-reduce-7ac.py > research/solver/results-reduce-7ac-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ac.mjs'), os.path.join(HERE, 'zz-mut-7ac.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/W${w}: ${k} unit lines, not 1`)"),
    ("the gate accepts an unregistered unit", "if (!UNITS.some(([id, a, w]) => id === u.id && a === u.arm && w === u.w)) { bad.push(`${tag}: not a registered unit`); continue; }", ""),
    ("the gate ignores 7aa's product opening tier 2", "if (!p.gap || p.gap.open1e3 !== 0) bad.push", "if (false) bad.push"),
    ("the gate ignores the table", "else if (u.table !== r.table) bad.push", "else if (false) bad.push"),
    ("the gate ignores a ran line not 7aa's TS+J's", "if (u.ran !== r.ran) bad.push", "if (false) bad.push"),
    ("the gate does not require the tier state", "if (!field(u.ran, 'tierState')) bad.push", "if (false) bad.push"),
    ("the gate does not read a held tier, Q's fix or the reader's reference", "for (const k of ['holdTier', 'bridgeStep', 'readerRef'])", "for (const k of [])"),
    ("the gate ignores the gap", "else if (!r.gap || u.gap.gap !== r.gap.gap || u.gap.open1e3 !== r.gap.open1e3 || u.gap.open0 !== r.gap.open0) bad.push", "else if (!r.gap || u.gap.open1e3 !== r.gap.open1e3 || u.gap.open0 !== r.gap.open0) bad.push"),
    ("the gate accepts TS+J opening in the plan's tier", "else if (u.gap.open1e3 === 0) bad.push", "else if (false) bad.push"),
    ("the gate accepts per-world tables", "if (!u.joint.joint) bad.push", "if (false) bad.push"),
    ("the gate ignores the solved margin", "if (u.joint.margin !== '0.001') bad.push", "if (false) bad.push"),
    ("the gate ignores a pension death charge (O53)", "if (u.joint.deathTax !== 0) bad.push", "if (false) bad.push"),
    ("the gate ignores the scale", "if (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap)", "if (!r.joint || u.joint.cap !== r.joint.cap)"),
    ("the gate ignores the mixture's price", "else if (u.gap && !(Math.abs(u.price.mixture / 100 - Number(u.gap.gap)) <= PRICE_TOL * Number(u.gap.gap))) bad.push", "else if (false) bad.push"),
    ("the gate's price tolerance ten times looser", "export const PRICE_TOL = 1e-3;", "export const PRICE_TOL = 1e-2;"),
    ("the gate accepts a missing price line", "if (!u.price) bad.push(`${tag}: no price line`);\n    else if", "if (false) bad.push(`${tag}: no price line`);\n    else if (u.price) if"),
    ("the gate accepts two world lines", "if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k] || u.worlds[k].paths !== WP)) bad.push", "if (u.worlds.length > 3) bad.push"),
    ("the gate ignores the world lines' TS+J survival", "else if (!r.worlds || [0, 1, 2].some(k => !r.worlds[k] || Math.abs(u.worlds[k].simJ - r.worlds[k].sim) > 1e-9)) bad.push", "else if (false) bad.push"),
    ("the gate ignores TS+J's survival against 7aa's", "if (!r.run || Math.abs(u.runs['TS+J'].sim - r.run.sim) > 1e-9) bad.push", "if (!r.run) bad.push"),
    ("the gate ignores TS+J keeping the plan's tiers", "if (u.runs['TS+J'].held0 !== 0) bad.push", "if (false) bad.push"),
    ("the gate ignores OPEN0 leaving the plan's tiers", "else if (u.runs.OPEN0.held0 !== N) bad.push", "else if (false) bad.push"),
    ("the gate accepts a missing TS+J run", "if (!u.runs['TS+J']) bad.push(`${tag}: no TS+J run line`);\n    else {", "if (false) bad.push(`${tag}: no TS+J run line`);\n    else if (u.runs['TS+J']) {"),
    ("the gate accepts a missing OPEN0 run", "if (!u.runs.OPEN0) bad.push(`${tag}: no OPEN0 run line`);\n    else if", "if (false) bad.push(`${tag}: no OPEN0 run line`);\n    else if (u.runs.OPEN0) if"),
    ("the gate accepts a missing done line", "if (!u.done) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${tag}: no solve line`);\n    else if (u.table !== r.table)", "if (false) bad.push(`${tag}: no solve line`);\n    else if (u.table !== undefined && u.table !== r.table)"),
    ("the gate accepts a missing 7aa unit", "if (!r || !p) { bad.push(`${tag}: no 7aa TS+J or PRODUCT unit to compare with`); continue; }", "if (!r || !p) continue;"),
    # the items
    ("item 1 against PRODUCT", "one.map(([id, arm]) => leg(id, arm, 'OPEN0', 'TS+J', '0'))", "one.map(([id, arm]) => leg(id, arm, 'OPEN0', 'PRODUCT', '0'))"),
    ("item 1 at W0.02", "one.map(([id, arm]) => leg(id, arm, 'OPEN0', 'TS+J', '0'))", "one.map(([id, arm]) => leg(id, arm, 'OPEN0', 'TS+J', '0.02'))"),
    ("item 1 legs the wrong way round", "k: cells(S(id, arm, a, w), S(id, arm, b, w))", "k: cells(S(id, arm, b, w), S(id, arm, a, w))"),
    ("item 1 by the exact reading alone", "const i1 = bothReads(harmFamily(", "const i1 = (x => x)(harmFamily("),
    ("item 1 held on one leg", "outcome: tri(i1, x => x.o === 'harm', x => x.o === 'no material harm') });", "outcome: i1.some(x => x.o === 'harm') ? 'HELD' : i1.every(x => x.o === 'no material harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });"),
    ("the margin from TS+J's survival", "mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'PRODUCT', w)));", "mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, 'TS+J', w)));"),
    ("item 2's whole leg against PRODUCT", "const w = WL(id, arm, 'OPEN0', 'TS+J', '0.02', a2)", "const w = WL(id, arm, 'OPEN0', 'PRODUCT', '0.02', a2)"),
    ("item 2's whole leg at W0", "const w = WL(id, arm, 'OPEN0', 'TS+J', '0.02', a2)", "const w = WL(id, arm, 'OPEN0', 'TS+J', '0', a2)"),
    ("item 2's survival family against PRODUCT", "const s2 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'OPEN0', 'TS+J', '0.02')));", "const s2 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'OPEN0', 'PRODUCT', '0.02')));"),
    ("item 2 held on one leg", "outcome: tri(i2, x => x.o === 'loss', x => x.o === 'no material loss') });", "outcome: i2.some(x => x.o === 'loss') ? 'HELD' : i2.every(x => x.o === 'no material loss') ? 'FALSIFIED' : 'INCONCLUSIVE' });"),
    ("item 3 on every path, not the product's survivors", "A.cellsWhere(S(id, arm, 'PRODUCT', '0.02'), S(id, arm, 'TS', '0.02'), S(id, arm, 'OPEN0', '0.02'))", "A.cellsWhere(new Uint8Array(N).fill(1), S(id, arm, 'TS', '0.02'), S(id, arm, 'OPEN0', '0.02'))"),
    ("item 3 against TS+J", "A.cellsWhere(S(id, arm, 'PRODUCT', '0.02'), S(id, arm, 'TS', '0.02'), S(id, arm, 'OPEN0', '0.02'))", "A.cellsWhere(S(id, arm, 'PRODUCT', '0.02'), S(id, arm, 'TS+J', '0.02'), S(id, arm, 'OPEN0', '0.02'))"),
    ("item 3 at the case margin, not the pooled", "OPEN0 against TS at W0.02', k: kp, margin: MARGINS.pooled }]);\n  // the same cells", "OPEN0 against TS at W0.02', k: kp, margin: 0.25 }]);\n  // the same cells"),
    # item 3's loss read and its branches (the plan-auditor's review of 7ac's registration, 28 Sep 12:36 UK, BLOCKING 1)
    ("item 3's loss read by the gain family", "const h3 = harmFamily([{ id: 'pooled'", "const h3 = gainFamily([{ id: 'pooled'"),
    ("item 3's loss read at the case margin, not the pooled", "read for a loss: OPEN0 against TS at W0.02', k: kp, margin: MARGINS.pooled }]);", "read for a loss: OPEN0 against TS at W0.02', k: kp, margin: 0.25 }]);"),
    ("item 3's branch ignores a loss", "h3[0].o === 'harm' ? 'FALSIFIED BY A LOSS", "false ? 'FALSIFIED BY A LOSS"),
    ("item 3's no-loss branch on any read", "h3[0].o === 'no material harm' ? 'FALSIFIED WITHOUT", "true ? 'FALSIFIED WITHOUT"),
    ("item 3's branch printed on every outcome", "const branch3 = o3 !== 'FALSIFIED' ? '' :", "const branch3 = false ? '' :"),
    ("item 3 on S126 alone", "const kp = two.map(([id, arm]) =>", "const kp = two.slice(0, 1).map(([id, arm]) =>"),
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
