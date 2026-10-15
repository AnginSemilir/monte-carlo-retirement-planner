#!/usr/bin/env python3
# AREF STEP 0'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one
# part of reduce-aref0.mjs's gate, parse or items in a scratch copy, runs the planted set on the copy and must see PLANTED
# CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt; the launcher refuses a reducer with no
# all-caught run as it stands, check-prediction.mjs mutationProblems).
#   python3 research/solver/mutate-reduce-aref0.py > research/solver/results-reduce-aref0-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (j.cases !== 1) bad.push(", "if (j.cases < 1) bad.push("),
  ("if (!j.done) bad.push('no done line');", "if (false) bad.push('no done line');"),
  ("j.head.scale !== scale || j.head.nsim !== nsim || j.head.seed !== seed", "j.head.nsim !== nsim || j.head.seed !== seed"),
  ("j.head.scale !== scale || j.head.nsim !== nsim || j.head.seed !== seed", "j.head.scale !== scale || j.head.seed !== seed"),
  ("j.head.scale !== scale || j.head.nsim !== nsim || j.head.seed !== seed", "j.head.scale !== scale || j.head.nsim !== nsim"),
  ("for (const c of ['gridTook', 'recTook', 'dpTook'])", "for (const c of ['recTook', 'dpTook'])"),
  ("for (const c of ['gridTook', 'recTook', 'dpTook'])", "for (const c of ['gridTook', 'dpTook'])"),
  ("for (const c of ['gridTook', 'recTook', 'dpTook'])", "for (const c of ['gridTook', 'recTook'])"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1])", "if (!x || x[0] !== x[1])"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1])", "if (!x || !(x[1] > 0))"),
  ("if (j.cal[k].length !== 5 || [0, 1, 2, 3, 4].some(b => !j.cal[k][b])) bad.push(", "if (false) bad.push("),
  ("if (!j.flat[k]) bad.push(", "if (false) bad.push("),
  ("if (!j.nodeax) bad.push('no NODE-AX file line');", "if (false) bad.push('no NODE-AX file line');"),
  ("else if (axSha !== null && j.nodeax !== axSha)", "else if (false)"),
  ("['code', 'audit', 'prediction', 'sha'].some(x => file.stamp[x] !== (j.stamp || {})[x])", "['audit'].some(x => file.stamp[x] !== (j.stamp || {})[x])"),
  ("if (file.nodeax !== j.nodeax) bad.push(", "if (false) bad.push("),
  ("!['X', 'RD', 'world', 'path', 'year'].every(", "!['X', 'world', 'path', 'year'].every("),
  ("if (!(j.checks.recTook && j.checks.recTook[1] === n)) bad.push(", "if (false) bad.push("),
  ("Buffer.from(f.S, 'base64').length / 4 === j.flat[k].band)", "true)"),
  # the parse
  ("j.cal[Number(m[1])][Number(m[2])] = { n: Number(m[3]) };", "{}"),
  ("else if (l === `done ${LABEL}`) j.done = true;", "else if (l === `done`) j.done = true;"),
  # item 1
  ("outside = x => x.lo > CAL || x.hi < -CAL", "outside = x => x.lo > CAL"),
  ("outside = x => x.lo > CAL || x.hi < -CAL", "outside = x => x.hi < -CAL"),
  ("used.some(w => w.some(outside))", "used.every(w => w.some(outside))"),
  ("const used = cal.map(w => w.filter(x => x.n >= MIN_N));", "const used = cal;"),
  ("CAL = 0.03, UNDER_H", "CAL = 0.05, UNDER_H"),
  ("by[b].d.push(R.X[i] - R.P[i]);", "by[b].d.push(R.X[i] - R.P[i] + 0.05);"),
  # item 2
  ("under.every(x => x.lo >= UNDER_H) ? 'HELD'", "under.some(x => x.lo >= UNDER_H) ? 'HELD'"),
  ("d.push(R.X[i] - R.RD[i]);", "d.push(R.RD[i] - R.X[i]);"),
  ("UNDER_H = 0.03, UNDER_F", "UNDER_H = 0.02, UNDER_F"),
  # item 3
  ("if (p[i] >= 0.5) { sup++;", "if (p[i] >= 0) { sup++;"),
  ("if (c >= 0.9 && c <= 1) fl++;", "if (c >= 0.9) fl++;"),
  ("flat.every(x => x.share >= FLAT_H) ? 'HELD'", "flat.some(x => x.share >= FLAT_H) ? 'HELD'"),
  ("FLAT_H = 0.8, FLAT_F", "FLAT_H = 0.85, FLAT_F"),
  ("FLAT_F = 0.6;", "FLAT_F = 0.55;"),
  # GO and the cluster mean
  ("out.go = ['1', '2', '3'].every(", "out.go = ['1', '2'].every("),
  ("Math.sqrt(v * G / (G - 1)) / n", "Math.sqrt(v * G / (G - 1)) / n / 3"),
]
run('reduce-aref0.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
