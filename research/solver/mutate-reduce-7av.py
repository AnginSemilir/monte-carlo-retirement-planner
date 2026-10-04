#!/usr/bin/env python3
# 7AV'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7av.mjs's gate, items or
# arithmetic (or extrap-7av.mjs's extrapolation) in a scratch copy beside it, runs the planted set on the copy, and must see
# PLANTED CHECK FAILED. Every mutation must apply exactly as written; the true script must pass. Any mutation not applied or
# not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7av.py > research/solver/results-reduce-7av-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7av.mjs'), os.path.join(HERE, 'zz-mut-7av.mjs')
XSRC, XDST = os.path.join(HERE, 'extrap-7av.mjs'), os.path.join(HERE, 'zz-mut-extrap-7av.mjs')
base, xbase = open(SRC).read(), open(XSRC).read()
M = [
    ("the gate accepts an unregistered unit", "if (!reg) { bad.push(`${tag}: not a registered unit`); continue; }", "if (!reg) { continue; }"),
    ("the gate ignores a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`);", ""),
    ("the gate ignores the share points", " || gd.a !== SH || gd.b !== SH", ""),
    ("the gate ignores the reference", "if ((u.arm === 'ORDER') !== / readerRef order( |$)/.test(u.ran) || / readerRef (?!order)/.test(u.ran)) bad.push", "if (false) bad.push"),
    ("the identity skips the table", "for (const f of ['table', 'ran', 'gap', 'joint', 'access', 'axis', 'xcount'])", "for (const f of ['ran', 'gap', 'joint', 'access', 'axis', 'xcount'])"),
    ("the identity skips 7at's bdec lines", "'pstage', 'bdec', 'pbstage', 'pafter'];", "'pstage', 'pbstage', 'pafter'];"),
    ("the twins skip the ran line", "if (normRan(u.ran) !== normRan(tw.ran)) bad.push", "if (false) bad.push"),
    ("normRan keeps the reference", ".replace(/ readerRef order/, '')", ""),
    ("the gate skips 7at's own checks", "if (atBad.length) bad.push(", "if (false) bad.push("),
    ("the gate ignores a missing sdec year", "if (sd.filter(x => x.t === t).length !== 1) {", "if (sd.filter(x => x.t === t).length > 1) {"),
    ("the gate ignores a step-spread split off the reads", "if (y.ns + y.np + y.no !== y.reads) {", "if (false) {"),
    ("the flat reads not held to the read term", "if (y.reads > 0 && !(Math.abs(flat - d.d * d.n) <= tol(y.reads) + 5e-4 * d.n)) {", "if (false) {"),
    ("the straight-line reads not held to read (b)", "if (y.reads > 0 && !(Math.abs(lin - b.db * b.reads) <= tol(y.reads) + 5e-4 * b.reads)) {", "if (false) {"),
    ("the quadratic not held to the flat read where there is no unsupported weight", "if (y.reads > 0 && d.unsup === 0 && (y.qm !== 0 ||", "if (false && (y.qm !== 0 ||"),
    ("the gate ignores a missing psplit line", "if (ps.length !== 1 || ps[0].paths.length !== npw", "if (ps.length > 1 || (ps.length && ps[0].paths.length !== npw)"),
    ("the psplit paths not held to pstage and pbstage", "if (off >= 0) bad.push", "if (false) bad.push"),
    ("the gate ignores a missing qcount line", "if (!u.qcount) bad.push(`${tag}: no qcount line`);", "if (!u.qcount) {}"),
    ("the qcount steps not bounded", "else if (!(u.qcount.steps <= u.qcount.tables) ||", "else if ("),
    ("the quadratic's responsiveness check dropped", "if (k === WORLD && u.arm === 'READER' && X === 'PCLSI' && !bridge.some(y => y.qm > 0)) bad.push", "if (false) bad.push"),
    ("item 1's premise ignores p", "premise: pP < ALPHA && mean(F6) > 0,", "premise: mean(F6) > 0,"),
    ("item 1's HELD band at 0.8", "pU: flipP(lin(F6, 0.6, F12, -1), b, 7002)", "pU: flipP(lin(F6, 0.8, F12, -1), b, 7002)"),
    ("item 1's FALSIFIED band at 0.7", "pD: flipP(lin(F12, 1, F6, -0.9), b, 7003)", "pD: flipP(lin(F12, 1, F6, -0.7), b, 7003)"),
    ("item 1 HELD on either household", "const both = hs => (hs.length === HH.length && hs.every(h => h.read === 'HELD') ? 'HELD'", "const both = hs => (hs.some(h => h.read === 'HELD') ? 'HELD'"),
    ("item 2's HELD side one-sided", "pU: Math.max(flipP(lin(L6, 1 / 3, Q6, -1), b, 7005), flipP(lin(Q6, 1, L6, 1 / 3), b, 7006))", "pU: flipP(lin(L6, 1 / 3, Q6, -1), b, 7005)"),
    ("item 2's FALSIFIED band at a third", "pD: flipP(lin(Q6, 1, L6, -2 / 3), b, 7007)", "pD: flipP(lin(Q6, 1, L6, -1 / 3), b, 7007)"),
    ("item 2 without Holm", "const adj = holm(hs.flatMap(h => [h.pU, h.pD]));\n  hs.forEach((h, i) => { h.hU = adj[2 * i]; h.hD = adj[2 * i + 1]; h.read = !h.premise ? 'INCONCLUSIVE' : h.hU < ALPHA ? 'HELD' : h.hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'; h.note = !h.premise ? 'NO RESIDUAL'", "const adj = hs.flatMap(h => [h.pU, h.pD]);\n  hs.forEach((h, i) => { h.hU = adj[2 * i]; h.hD = adj[2 * i + 1]; h.read = !h.premise ? 'INCONCLUSIVE' : h.hU < ALPHA ? 'HELD' : h.hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'; h.note = !h.premise ? 'NO RESIDUAL'"),
    ("item 2's overshoot flag dropped", "h.pO < ALPHA ? 'OVERSHOT' : ''", "''"),
    ("item 3's premise sign flipped", "premise = pP < ALPHA && mean(P6) < 0;", "premise = pP < ALPHA || mean(P6) > 0;"),
    ("item 3's HELD band at a quarter", "flipP(lin(O6, 1, P6, -0.5), b, 7010)", "flipP(lin(O6, 1, P6, -0.75), b, 7010)"),
    ("item 3's FALSIFIED band at a half", "flipP(lin(P6, 0.75, O6, -1), b, 7011)", "flipP(lin(P6, 0.5, O6, -1), b, 7011)"),
    ("item 4's bar at 1", "WORLD = 0, BAR = 0.5;", "WORLD = 0, BAR = 1;"),
    ("item 4's TOST one-sided", "pT: Math.max(flipP(X.map(x => BAR - x), b, s), flipP(X.map(x => x + BAR), b, s + 1))", "pT: flipP(X.map(x => BAR - x), b, s)"),
    ("item 4 OVER on one read", "h.L.read === 'OVER' && h.Q.read === 'OVER' ? 'OVER'", "h.L.read === 'OVER' || h.Q.read === 'OVER' ? 'OVER'"),
    ("item 4 ignores the negative side", "Math.min(X.hA, X.hB) < ALPHA ? 'OVER'", "X.hA < ALPHA ? 'OVER'"),
]
# extrap-7av.mjs's mutations, run through the reducer's planted set (it imports the module)
XM = [
    ("order 1 drops extrap-7at's arithmetic (the Lagrange line instead)", "      if (js.length === 2) v = RD.c[idx(js[0])] + (RD.c[idx(js[0])] - RD.c[idx(js[1])]) / (A[js[0]] - A[js[1]]) * (x - A[js[0]]);", "      if (js.length === 2) v = v * (1 + 1e-12);"),
    ("the quadratic takes two nodes (a straight line)", "js.length < order + 1; jj += dir)", "js.length < 2; jj += dir)"),
    ("no clip at 0", "c[idx(ii)] = Math.min(1, Math.max(0, v));", "c[idx(ii)] = Math.min(1, v);"),
    ("the clip counts dropped", "if (v < 0) clipLo++; else if (v > 1) clipHi++;", ""),
    ("the fall-back count dropped", "if (order === 2 && js.length < 3) fellBack++;", ""),
    ("R left as the reader's (S not reproduced)", "for (let i = 0; i < n; i++) R[i] = S[i] - RD.p[i] * c[i];", "for (let i = 0; i < n; i++) R[i] = RD.R[i];"),
    ("isStep takes a half chance as a step", "if (!(q <= 1e-12 || q >= 1 - 1e-12)) return false;", "if (!(q <= 1e-12 || q >= 0.5)) return false;"),
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
for name, old, new in XM:
    if xbase.count(old) != 1: bad.append(f'NOT APPLIED ({xbase.count(old)} matches): {name}'); continue
    open(XDST, 'w').write(xbase.replace(old, new))
    open(DST, 'w').write(base.replace("from './extrap-7av.mjs';", "from './zz-mut-extrap-7av.mjs';"))
    r = subprocess.run(['node', DST, '--planted'], capture_output=True, text=True)
    if 'PLANTED CHECK FAILED' in r.stdout: caught += 1; print(f'caught: {name}')
    else: bad.append(f'NOT CAUGHT: {name}')
for f in (DST, XDST):
    if os.path.exists(f): os.remove(f)
for b in bad: print(b)
print(f'{caught} of {len(M) + len(XM)} mutations caught')
sys.exit(1 if bad else 0)
