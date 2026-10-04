#!/usr/bin/env python3
# 7AT'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7at.mjs's gate, items or
# arithmetic (or extrap-7at.mjs's extrapolation) in a scratch copy beside it, runs the planted set on the copy, and must see
# PLANTED CHECK FAILED. Every mutation must apply exactly as written; the true script must pass. Any mutation not applied or
# not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7at.py > research/solver/results-reduce-7at-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7at.mjs'), os.path.join(HERE, 'zz-mut-7at.mjs')
XSRC, XDST = os.path.join(HERE, 'extrap-7at.mjs'), os.path.join(HERE, 'zz-mut-extrap-7at.mjs')
base, xbase = open(SRC).read(), open(XSRC).read()
M = [
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`);", ""),
    ("the gate ignores the axis's buckets", " || u.axis.pcls !== BUCKETS[X]", ""),
    ("the WALL buckets read as three", "WALL: '0,0.5,0.75,1' };", "WALL: '0,0.5,1' };"),
    ("the identity skips the table", "for (const f of ['table', 'ran', 'gap', 'joint', 'access', 'axis'])", "for (const f of ['ran', 'gap', 'joint', 'access', 'axis'])"),
    ("the S130 identity skips 7ar's pstage lines", "AR_LINES = [...AP_LINES, 'dec', 'dbin', 'moves', 'pstage'];", "AR_LINES = [...AP_LINES, 'dec', 'dbin', 'moves'];"),
    ("the S370 identity skips the node lines", "const AP_LINES = ['bref', 'node', ", "const AP_LINES = ['bref', "),
    ("the gate skips 7ar's own checks", "if (arBad.length) bad.push(", "if (false) bad.push("),
    ("the gate ignores a missing bdec year", "if (bd.filter(x => x.t === t).length !== 1) {", "if (bd.filter(x => x.t === t).length > 1) {"),
    ("the gate ignores bdec reads off the dec reads", "if (!d || d.reads !== y.reads) {", "if (!d) {"),
    ("read (b) not held to the read where there is no unsupported weight", "if (none && y.reads > 0 && !(Math.abs(y.db * y.reads - d.d * d.n) <= tol(y.reads) + 5e-4 * d.n)) {", "if (false) {"),
    ("read (b) allowed to move a read with no unsupported weight", "if (none && y.moved !== 0) {", "if (false) {"),
    ("the unsupported sums not bounded", "[y.flat, y.extra, y.unsS].some(v => !(v >= -1e-4 && v <= 100 + 1e-4) || (none && Math.abs(v) > 1e-4))", "false"),
    ("the gate ignores a missing pbstage line", "if (pb.length !== 1 || pb[0].paths.length !== npw", "if (pb.length > 1 || (pb.length && pb[0].paths.length !== npw)"),
    ("the pbstage sums not checked", "if (!(Math.abs(sum - bsum) <= tol(npw * Math.max(1, ac.year)))) bad.push", "if (false) bad.push"),
    ("the gate ignores a missing pafter line", "if (pa.length !== 1 || pa[0].paths.length !== npw", "if (pa.length > 1 || (pa.length && pa[0].paths.length !== npw)"),
    ("the pafter count not checked", "if (!sa || A.length !== sa.n) bad.push", "if (!sa) bad.push"),
    ("the pafter mean not checked", "else if (A.length && !(Math.abs(A.reduce((t, x) => t + x, 0) / A.length - sa.mean) <= 5e-4 + 1e-4 * Math.abs(sa.mean))) bad.push", "else if (false) bad.push"),
    ("the gate ignores a missing xcount line", "if (!u.xcount) bad.push(`${tag}: no xcount line`);", ""),
    ("the responsiveness check dropped (O79)", "if (k === WORLD && !bd.some(y => y.t < ac.year && y.moved > 0)) bad.push", "if (false) bad.push"),
    ("item 1 reads either unit calibrated as HELD", "us.every(u => u.read === 'CALIBRATED') ? 'HELD'", "us.some(u => u.read === 'CALIBRATED') ? 'HELD'"),
    ("item 1 ignores a pessimistic unit", "us.some(u => u.read === 'OPTIMISTIC' || u.read === 'PESSIMISTIC') ? 'FALSIFIED'", "us.some(u => u.read === 'OPTIMISTIC') ? 'FALSIFIED'"),
    ("item 2's TOST on one side only", "Math.max(h.pLo, h.pHi) < ALPHA ? 'EQUIVALENT'", "h.pLo < ALPHA ? 'EQUIVALENT'"),
    ("item 2 without Holm on DIFFERS", "const adj = holm(hs.flatMap(h => [h.pAbove, h.pBelow]));", "const adj = hs.flatMap(h => [h.pAbove, h.pBelow]);"),
    ("item 2 ignores a WALL arm below PCLSI", "h.hAbove < ALPHA || h.hBelow < ALPHA ? 'DIFFERS'", "h.hAbove < ALPHA ? 'DIFFERS'"),
    ("item 2's margin at 3 points", "WORLD = 0, M = 1, LEFT_MAX", "WORLD = 0, M = 3, LEFT_MAX"),
    ("items 3 and 4's premise ignores p", "rise = pR < ALPHA && r > 0;", "rise = r > 0;"),
    ("items 3 and 4's HELD side at a half", "X.map((x, j) => x - (2 / 3) * Rd[j])", "X.map((x, j) => x - (1 / 2) * Rd[j])"),
    ("items 3 and 4's FALSIFIED side at a half", "X.map((x, j) => Rd[j] / 3 - x)", "X.map((x, j) => Rd[j] / 2 - x)"),
    ("items 3 and 4 read read (b)'s rise as the part taken away", "X = Rd.map((x, j) => x - Rb[j])", "X = Rb.map((x, j) => x)"),
    ("the partial-read guard dropped (a read (b) that did not act can falsify)", "if (it.read === 'FALSIFIED' && !(leftShare <= LEFT_MAX))", "if (false)"),
    ("the left-flat bound at 1", "LEFT_MAX = 0.25;", "LEFT_MAX = 1;"),
    ("the overshoot flag dropped", "if (it.read === 'HELD' && pOver < ALPHA)", "if (false)"),
    ("the gate ignores read (b) leaving more than the unsupported weight flat", "if (y.reads > 0 && !(y.left >= -1e-4 && y.left <= (none ? 1e-4 : d.unsup + 1e-4))) {", "if (false) {"),
]
from mutate_lib import run
run('reduce-7at.mjs', M)
