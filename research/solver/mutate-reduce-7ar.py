#!/usr/bin/env python3
# 7AR'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ar.mjs's gate, items or
# arithmetic in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation
# must apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7ar.py > research/solver/results-reduce-7ar-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ar.mjs'), os.path.join(HERE, 'zz-mut-7ar.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("7ap's checks miss the switch margin (the margin is 7ap's check alone)", "const apBad = AP.gate([asAP], () => null, { pts, npw })", "const apBad = AP.gate([{ ...asAP, joint: { ...asAP.joint, margin: '0.001' } }], () => null, { pts, npw })"),
    ("7ap's checks miss the axis line (the axis line's presence is 7ap's check alone)", "const apBad = AP.gate([asAP], () => null, { pts, npw })", "const apBad = AP.gate([{ ...asAP, axis: asAP.axis || {} }], () => null, { pts, npw })"),
    ("the gate ignores the axis's interpolation", "u.axis.interp !== (X !== 'DEFAULT') || ", ""),
    ("the gate ignores the axis's buckets", " || u.axis.pcls !== BUCKETS[X]", ""),
    ("the identity skips READER PCLSI", "if (u.arm === 'READER' && X !== 'PCLSF') {", "if (u.arm === 'READER' && X === 'DEFAULT') {"),
    ("the identity skips the table", "for (const f of ['table', 'ran', 'gap', 'joint', 'access', 'axis'])", "for (const f of ['ran', 'gap', 'joint', 'access', 'axis'])"),
    ("the identity skips the lsa lines", "'cells', 'lsa', 'pcell', 'wall']", "'cells', 'pcell', 'wall']"),
    ("the twins skip the ran line", "if (u.ran !== twin.ran) bad.push(`${tag}: its ran line is not its twin's`);", ""),
    ("the gate skips 7ap's own checks", "if (apBad.length) bad.push(", "if (false) bad.push("),
    ("7ap's checks see the unit under its own label", "const apBad = AP.gate([asAP]", "const apBad = AP.gate([u]"),
    ("the gate ignores a missing dec year", "if (dc.filter(x => x.t === t).length !== 1) {", "if (dc.filter(x => x.t === t).length > 1) {"),
    ("the gate ignores a missing dbin line", "if (db.length !== 8) {", "if (db.length > 8) {"),
    ("the gate ignores a missing pstage line", "if (ps.length !== 1 || ps[0].paths.length !== npw", "if (ps.length > 1 || (ps.length && ps[0].paths.length !== npw)"),
    ("the gate ignores a short pstage line", " || ps[0].paths.length !== npw || ", " || "),
    ("the gate ignores dec paths off the resid paths", "if (!r || r.n !== y.n) {", "if (!r) {"),
    ("the gate ignores terms off the residual", "if (y.n > 0 && !(Math.abs(y.q + y.d + y.e - (r.table - r.next)) <= 5e-4)) {", "if (false) {"),
    ("the gate ignores more reads than paths", "if (y.reads > y.n) {", "if (false) {"),
    ("the pstage terms' sums not checked", "if (!(Math.abs(a - bsum) <= tol(npw * Math.max(1, ac.year)))) {", "if (false) {"),
    ("the gate ignores a row copy above the unsupported weight", " && y.rowcopy <= y.unsup + 1e-4", ""),
    ("the gate ignores an unsupported weight with no reader", "if (u.arm === 'OFF' && y.reads > 0 && (y.unsup !== 0 || y.rowcopy !== 0)) {", "if (false) {"),
    ("the gate ignores a quad term in the end bin", "(b.bin === 'end' ? Math.abs(b.q) + Math.abs(b.d) > 1e-4 : Math.abs(b.e) > 1e-4)", "(b.bin === 'end' ? false : Math.abs(b.e) > 1e-4)"),
    ("the gate ignores a moves count off the paths", "else if (!r || n !== r.n) bad.push", "else if (!r) bad.push"),
    ("readTwo without Holm", "const [hU, hD] = holm([pU, pD]);", "const [hU, hD] = [pU, pD];"),
    ("the premise ignores p (any positive mean is a rise)", "rise = pR < ALPHA && r > 0;", "rise = r > 0;"),
    ("the premise ignores the sign", "rise = pR < ALPHA && r > 0;", "rise = pR < ALPHA || r > 0;"),
    ("item 1's HELD side at a half, not two thirds", "dd.map((x, j) => x - (2 / 3) * R[j])", "dd.map((x, j) => x - (1 / 2) * R[j])"),
    ("item 1's FALSIFIED side at a half, not a third", "dd.map((x, j) => R[j] / 3 - x)", "dd.map((x, j) => R[j] / 2 - x)"),
    ("item 1 reads the quad term", "const dd = ri.map((p, j) => p[1] - rd[j][1]);", "const dd = ri.map((p, j) => p[0] - rd[j][0]);"),
    ("item 2 reads READER, not OFF", "const O = oi.map((p, j) => S(p) - S(od[j]));", "const O = ri.map((p, j) => S(p) - S(rd[j]));"),
    ("item 2 against r taken as known", "twoWay(O.map((x, j) => R[j] / 3 - x), O.map((x, j) => x - (2 / 3) * R[j])", "twoWay(O.map(x => r / 3 - x), O.map(x => x - (2 / 3) * r)"),
    ("item 3 against r taken as known", "twoWay(F.map((x, j) => R[j] / 3 - x), F.map((x, j) => x - (2 / 3) * R[j])", "twoWay(F.map(x => r / 3 - x), F.map(x => x - (2 / 3) * r)"),
    ("item 3's F reversed", "const F = ri.map((p, j) => S(p) - S(rf[j]));", "const F = rf.map((p, j) => S(p) - S(ri[j]));"),
    ("readTwo's sides swapped", "read: hU < ALPHA ? 'HELD' : hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'", "read: hD < ALPHA ? 'HELD' : hU < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'"),
    ("flipP counts ties as below", "if (s >= obs - 1e-9 * Math.max(1, Math.abs(obs))) ge++;", "if (s > obs + 1e-9 * Math.max(1, Math.abs(obs))) ge++;"),
    ("flipP without the +1", "return (1 + ge) / (1 + b);", "return ge / b;"),
    ("flipP flips nothing", "s += r() < 0.5 ? -xs[j] : xs[j];", "s += xs[j];"),
    ("the units are not audit-7ar.mjs's", "['S130', 'OFF', 'TS+J', 'PCLSI']];\nexport const labelOf", "['S130', 'OFF', 'TS+J', 'DEFAULT']];\nexport const labelOf"),
    ("the PCLSF buckets differ", "PCLSF: '0,0.01,0.5,1' };", "PCLSF: '0,0.05,0.5,1' };"),
]
# the true script passes
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
