#!/usr/bin/env python3
# EDGE-SPLIT'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-edge.mjs's gate,
# identity, items or legs in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED (the shared
# runner, mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-edge.py > research/solver/results-reduce-edge-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${k}: ${n} unit lines, not 1`);"),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("mix: '3', tables: A.tables, read: A.read, seg: A.seg,", "mix: '3', read: A.read, seg: A.seg,"),
  ("mix: '3', tables: A.tables, read: A.read, seg: A.seg,", "mix: '3', tables: A.tables, read: A.read,"),
  ("seg: A.seg, deathTax: '0' };", "seg: A.seg };"),
  ("if (num(u.ran, 'tieMargin') !== 0)", "if (false)"),
  ("if (new Set(us.map(u => u.sum.pathsum)).size > 1)", "if (false)"),
  ("if (s !== u.sum.survived) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])", "false"),
  ("if (!t) return [`${tag}: missing`];", "if (!t) return [];"),
  # the identity
  ("if (t.survived[j] !== o.survived[j] || t.tax[j] !== o.tax[j] || t.net[j] !== o.net[j]) n++;", "if (t.survived[j] !== o.survived[j] || t.net[j] !== o.net[j]) n++;"),
  ("if (n) bad.push(`identity", "if (false) bad.push(`identity"),
  ("for (const id of PANEL) for (const a of ['SNAP', 'PCLSI']) {\n    const t = files[`${id} ${a}`], o = hyb[`${id} ${a}`];", "for (const id of PANEL) for (const a of ['SNAP']) {\n    const t = files[`${id} ${a}`], o = hyb[`${id} ${a}`];"),
  # the items
  ("return Array.from({ length: X.N }, (_, j) => X.survived[j] - Z.survived[j]);", "return Array.from({ length: X.N }, (_, j) => Z.survived[j] - X.survived[j]);"),
  ("const p = ys.map((y, i) => [flipP(y, nb, 7002 + 2 * i), flipP(y.map(x => -x), nb, 7003 + 2 * i)]);", "const p = ys.map((y, i) => [flipP(y, nb, 7002 + 2 * i), flipP(y, nb, 7003 + 2 * i)]);"),
  ("const read = d < 0 ? 'REPORTED' : hU < ALPHA ? up : hD < ALPHA ? dn : 'SPLIT';", "const read = d < 0 ? 'REPORTED' : hU < ALPHA ? up : dn;"),
  ("const read = d < 0 ? 'REPORTED' : hU < ALPHA ? up : hD < ALPHA ? dn : 'SPLIT';", "const read = d < 0 ? 'REPORTED' : hU < 0.5 ? up : hD < ALPHA ? dn : 'SPLIT';"),
  ("const s = rows.find(r => r.id === 'S130').read", "const s = rows.find(r => r.id === 'S128').read"),
  ("const h = holm(DECIDE.flatMap(id => p[PANEL.indexOf(id)]));", "const h = DECIDE.flatMap(id => p[PANEL.indexOf(id)]);"),
  ("one: splitItem(files, 'P-LO', 'P-HI', 'LO', 'HI', opts)", "one: splitItem(files, 'P-HI', 'P-LO', 'LO', 'HI', opts)"),
  ("two: splitItem(files, 'S-HI', 'S-LO', 'HI', 'LO', opts)", "two: splitItem(files, 'S-LO', 'S-HI', 'HI', 'LO', opts)"),
  ("const legs = rows.filter(r => r.id !== 'S130' && DECIDE.includes(r.id))", "const legs = rows.filter(r => r.id !== 'S130')"),
  # the share rule
  ("s >= SHARE_BAR ? 'SETTLED'", "s > SHARE_BAR ? 'SETTLED'"),
  ("v !== 'HELD' || !g ? 'NOT APPLICABLE'", "!g ? 'NOT APPLICABLE'"),
  ("const F = k => files[`S130 ${k}`];", "const F = k => files[`S128 ${k}`];"),
  ("lo = share(diff(F('P-LO'), F('HYB')), diff(F('PCLSI'), F('HYB')))", "lo = share(diff(F('P-HI'), F('HYB')), diff(F('PCLSI'), F('HYB')))"),
  ("hi = share(diff(F('S-HI'), F('SNAP')), diff(F('S-INT'), F('SNAP')))", "hi = share(diff(F('S-HI'), F('SNAP')), diff(F('PCLSI'), F('SNAP')))"),
  # the gain guard
  ("v !== 'HELD' || !g ? 'NOT APPLICABLE'", "v !== 'HELD' ? 'NOT APPLICABLE'"),
  ("gHi = shown(F('S-INT'), F('SNAP'), 7102)", "gHi = true"),
  ("const gLo = shown(F('PCLSI'), F('HYB'), 7101)", "const gLo = true"),
  ("nb, seed) < ALPHA;", "nb, seed) < 0.5;"),
]
run('reduce-edge.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
