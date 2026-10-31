#!/usr/bin/env python3
# HYB'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-hyb.mjs's gate, identity,
# item or arithmetic in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED (the shared runner,
# mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-hyb.py > research/solver/results-reduce-hyb-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${k}: ${n} unit lines, not 1`);"),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("mix: '3', tables: A.tables, read: A.read,", "mix: '3', read: A.read,"),
  ("mix: '3', tables: A.tables, read: A.read,", "mix: '3', tables: A.tables,"),
  ("read: A.read, deathTax: '0' };", "read: A.read };"),
  ("if (num(u.ran, 'tieMargin') !== 0)", "if (false)"),
  ("if (new Set(us.map(u => u.sum.pathsum)).size > 1)", "if (false)"),
  ("if (s !== u.sum.survived) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])", "false"),
  ("if (!t) return [`${tag}: missing`];", "if (!t) return [];"),
  # the identity
  ("if (t.survived[j] !== o.survived[j] || t.tax[j] !== o.tax[j] || t.net[j] !== o.net[j]) n++;", "if (t.survived[j] !== o.survived[j] || t.net[j] !== o.net[j]) n++;"),
  ("if (n) bad.push(`identity", "if (false) bad.push(`identity"),
  ("for (const id of PANEL) for (const a of ['SNAP', 'PCLSI']) {", "for (const id of PANEL) for (const a of ['SNAP']) {"),
  # item 1
  ("return Array.from({ length: S.N }, (_, j) => P.survived[j] - 2 * H.survived[j] + S.survived[j]);", "return Array.from({ length: S.N }, (_, j) => P.survived[j] - H.survived[j]);"),
  ("return Array.from({ length: S.N }, (_, j) => P.survived[j] - 2 * H.survived[j] + S.survived[j]);", "return Array.from({ length: S.N }, (_, j) => P.survived[j] - S.survived[j]);"),
  ("const p1 = ys.flatMap(y => [flipP(y, b, 7002), flipP(y.map(x => -x), b, 7003)]), h1 = holm(p1);", "const p1 = ys.flatMap(y => [flipP(y, b, 7002), flipP(y, b, 7003)]), h1 = holm(p1);"),
  ("read: h1[2 * i] < ALPHA ? 'READ' : h1[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'", "read: h1[2 * i] < ALPHA ? 'READ' : 'TABLES'"),
  ("read: h1[2 * i] < ALPHA ? 'READ' : h1[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'", "read: h1[2 * i] < 0.5 ? 'READ' : h1[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'"),
  ("v1 = s130 === 'READ' ? 'HELD' : s130 === 'TABLES' ? 'FALSIFIED'", "v1 = s130 === 'READ' ? 'HELD' : s130 !== 'BOTH' ? 'FALSIFIED'"),
  ("const s130 = one.find(r => r.id === 'S130').read", "const s130 = one.find(r => r.id === 'S370').read"),
  ("readShare: tot ? (r.c - r.b) / tot : NaN", "readShare: tot ? (t.c - t.b) / tot : NaN"),
  ("const t = paired(F(`${id} SNAP`), F(`${id} HYB`)), r = paired(F(`${id} HYB`), F(`${id} PCLSI`))", "const t = paired(F(`${id} SNAP`), F(`${id} HYB`)), r = paired(F(`${id} SNAP`), F(`${id} PCLSI`))"),
]
run('reduce-hyb.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
