#!/usr/bin/env python3
# TAIL'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-tail.mjs's gate, identity,
# items or arithmetic in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED (the shared
# runner, mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-tail.py > research/solver/results-reduce-tail-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${k}: ${n} unit lines, not 1`);"),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("mix: '3', tables: A.tables, read: A.read,", "mix: '3', read: A.read,"),
  ("mix: '3', tables: A.tables, read: A.read,", "mix: '3', tables: A.tables,"),
  ("deathTax: u.dt ? DT_RATE : '0' };", "};"),
  ("if (num(u.ran, 'tieMargin') !== A.tie)", "if (false)"),
  ("if (new Set(us.map(u => u.sum.pathsum)).size > 1)", "if (false)"),
  ("if (s !== u.sum.survived) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])", "false"),
  ("if (!t) return [`${tag}: missing`];", "if (!t) return [];"),
  # the identity
  ("if (t.survived[j] !== o.survived[j] || t.tax[j] !== o.tax[j] || t.net[j] !== o.net[j]) n++;", "if (t.survived[j] !== o.survived[j] || t.net[j] !== o.net[j]) n++;"),
  ("if (n) bad.push(`identity", "if (false) bad.push(`identity"),
  # item 1
  ("const ph = holm(pr.map(p => mcnemarHarmP(p.b, p.c)));", "const ph = pr.map(p => mcnemarHarmP(p.b, p.c));"),
  ("const pass = ex.outcome === 'no material harm' && u.lo > -margin;", "const pass = ex.outcome === 'no material harm';"),
  ("const pass = ex.outcome === 'no material harm' && u.lo > -margin;", "const pass = u.lo > -margin;"),
  ("const v1 = one.some(r => r.read === 'harm') ? 'FALSIFIED'", "const v1 = one.every(r => r.read === 'harm') ? 'FALSIFIED'"),
  ("margin = marginFor(100 * p.snap)", "margin = 0.5"),
  ("paired(F(`${id} PCLSI`), F(`${id} PCLSI-TIE`))", "paired(F(`${id} PCLSI-TIE`), F(`${id} PCLSI`))"),
  # items 2 and 3
  ("const gj = P.tax[j] - S.tax[j], xj = P.tax[j] - T.tax[j]; g.push(gj); up.push(xj - gj / 2);", "const gj = P.tax[j] - S.tax[j], xj = P.tax[j] - T.tax[j]; g.push(gj); up.push(xj - gj);"),
  ("const gj = P.tax[j] - S.tax[j], xj = P.tax[j] - T.tax[j];", "const gj = P.tax[j] - S.tax[j], xj = T.tax[j] - S.tax[j];"),
  ("pre: mg > 0, noPre: 'NO GAP'", "pre: true, noPre: 'NO GAP'"),
  ("const ps = rows.flatMap(r => (r.pre ? [flipP(r.up, b, 7002), flipP(r.up.map(x => -x), b, 7003)] : [1, 1])), ph = holm(ps);", "const ps = rows.flatMap(r => (r.pre ? [flipP(r.up, b, 7002), flipP(r.up, b, 7003)] : [1, 1])), ph = holm(ps);"),
  ("ph[2 * i] < ALPHA ? 'HELD' : ph[2 * i + 1] < ALPHA ? 'FALSIFIED'", "ph[2 * i] < ALPHA ? 'HELD' : ph[2 * i + 1] < 0.5 ? 'FALSIFIED'"),
  ("out.filter(r => r.read === 'FALSIFIED').length >= 3 ? 'FALSIFIED'", "out.filter(r => r.read === 'FALSIFIED').length >= 2 ? 'FALSIFIED'"),
  ("const v = out.every(r => r.read === 'HELD') ? 'HELD'", "const v = out.filter(r => r.read === 'HELD').length >= 3 ? 'HELD'"),
  ("const a = P.net[j] - S.net[j], c = PD.net[j] - SD.net[j]; n0.push(a); up.push(c - a / 2);", "const a = P.net[j] - S.net[j], c = PD.net[j] - SD.net[j]; n0.push(a); up.push(a / 2 - c);"),
  ("closed: mg ? (mean(up) + mg / 2) / mg : NaN", "closed: mg ? mean(up) / mg : NaN"),
  # item 4
  ("return Array.from({ length: S.N }, (_, j) => P.survived[j] - 2 * H.survived[j] + S.survived[j]);", "return Array.from({ length: S.N }, (_, j) => P.survived[j] - H.survived[j]);"),
  ("const p4 = ys.flatMap(y => [flipP(y, b, 7002), flipP(y.map(x => -x), b, 7003)]), h4 = holm(p4);", "const p4 = ys.flatMap(y => [flipP(y, b, 7002), flipP(y, b, 7003)]), h4 = holm(p4);"),
  ("read: h4[2 * i] < ALPHA ? 'READ' : h4[2 * i + 1] < ALPHA ? 'TABLES' : 'SPLIT'", "read: h4[2 * i] < ALPHA ? 'READ' : 'TABLES'"),
  ("v4 = s130 === 'READ' ? 'HELD' : s130 === 'TABLES' ? 'FALSIFIED'", "v4 = s130 === 'READ' ? 'HELD' : s130 !== 'BOTH' ? 'FALSIFIED'"),
  ("readShare: tot ? (r.c - r.b) / tot : NaN", "readShare: tot ? (t.c - t.b) / tot : NaN"),
  # the split
  ("if (S.net[j] > cap || P.net[j] > cap) { nTail++;", "if (S.net[j] > cap && P.net[j] > cap) { nTail++;"),
]
run('reduce-tail.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
