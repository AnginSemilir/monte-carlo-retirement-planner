#!/usr/bin/env python3
# AN'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part of
# reduce-an.mjs's gate, parse or items in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED
# (mutate_lib.py, which logs the run to results-mutation-history.txt; the launcher refuses a reducer with no all-caught run
# as it stands, check-prediction.mjs mutationProblems).
#   python3 research/solver/mutate-reduce-an.py > research/solver/results-reduce-an-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (an.length !== 1) bad.push(", "if (an.length < 1) bad.push("),
  ("if (!j.done) bad.push('AN: no done line');", "if (false) bad.push('AN: no done line');"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("readerRef: 'adaptive', readerChance: 'null'", "readerChance: 'null'"),
  ("floor: '5000', shareNodes: NODES_A };", "floor: '5000' };"),
  ("for (const c of ['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook'])", "for (const c of ['armTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook'])"),
  ("for (const c of ['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook'])", "for (const c of ['armTook', 'adaptTook', 'ownTook', 'identity', 'qfTook', 'layerTook'])"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1] || ((c === 'armTook'", "if (!x || x[0] !== x[1] || ((c === 'armTook'"),
  ("if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(", "if (false) bad.push("),
  ("j.adaptive.lattice !== LATTICE || ", ""),
  ("j.adaptive.nz !== NZ || ", ""),
  ("j.adaptive.nonMono !== 0 || ", ""),
  ("if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push('AN: its file is stamped by other code');", ""),
  ("if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(", "if (!x) bad.push("),
  ("if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`AN: its file's", "if (!a) bad.push(`AN: its file's"),
  # item 1
  ("const inside = x => x.lo >= -IN1 && x.hi <= IN1,", "const inside = x => x.hi <= IN1,"),
  ("const inside = x => x.lo >= -IN1 && x.hi <= IN1,", "const inside = x => x.lo >= -IN1,"),
  ("under = x => x.hi <= -OUT1,", "under = x => x.m <= -OUT1,"),
  ("over = x => x.lo >= OUT1;", "over = x => false;"),
  ("g.some(x => under(x) || over(x)) ? 'FALSIFIED' : g.every(inside)", "g.every(x => under(x) || over(x)) ? 'FALSIFIED' : g.every(inside)"),
  ("const g = [0, 1].map(k => ({ k, ...meanOf(P('AN', 'GB', k)) }));", "const g = [0, 2].map(k => ({ k, ...meanOf(P('AN', 'GB', k)) }));"),
  ("IN1 = 0.5, OUT1 = 1.0,", "IN1 = 0.55, OUT1 = 1.0,"),
  ("Z = 2.241402727604947,", "Z = 1.959963984540054,"),
  # item 2
  ("if (bn[i] && !an[i]) lost++; else if (an[i] && !bn[i]) saved++;", "if (an[i] && !bn[i]) lost++; else if (bn[i] && !an[i]) saved++;"),
  ("out['2'] = { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED'", "out['2'] = { outcome: oc.every(x => x.outcome === 'harm') ? 'FALSIFIED'"),
  ("const pr = [0, 1].map(k => ({ k, ...paired(S('AN', k), S('BN', k)) }));", "const pr = [0, 2].map(k => ({ k, ...paired(S('AN', k), S('BN', k)) }));"),
  # item 3
  ("const y = meanOf(P('AN', 'Y1', 2), Z1);", "const y = meanOf(P('AN', 'Y1', 1), Z1);"),
  ("y.hi <= -OUT3 || y.lo >= OUT3 ? 'FALSIFIED'", "y.hi <= -OUT3 ? 'FALSIFIED'"),
  ("y.lo >= -IN3 && y.hi <= IN3 ? 'HELD'", "y.m >= -IN3 && y.m <= IN3 ? 'HELD'"),
  # the mean's interval
  ("const se = Math.sqrt(v / n);", "const se = Math.sqrt(v / n) / 2;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-an.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
