#!/usr/bin/env python3
# XAS'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-xas.mjs's gate, identity,
# draw check, items or arithmetic in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED (the
# shared runner, mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-xas.py > research/solver/results-reduce-xas-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${id}: ${n} unit lines, not 1`);"),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("if (u.solve.BASE && (field(u.solve.BASE, 'readerTax') !== '-' || field(u.solve.BASE, 'coverage') !== '-'))", "if (false)"),
  ("if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-'))", "if (u.solve.COV && field(u.solve.COV, 'readerTax') === '-')"),
  ("const want = { mix: '3', pts, seed: SEED,", "const want = { mix: '3', pts,"),
  ("if (!(R > 0 && N > 0 && X > 0)) bad.push(", "if (false) bad.push("),
  ("if (r !== R || n !== N || x !== X) bad.push(", "if (r !== R || x !== X) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])", "false"),
  ("if (!t) return [`${tag}: missing`];", "if (!t) return [];"),
  ("if (A.read.length !== n) {}", "if (A.read.length !== n) {}"),
  ("['read', 'ex5', 'exF', 'claim'].some(q => !Array.isArray(A[q]) || A[q].length !== n)", "['read', 'exF', 'claim'].some(q => !Array.isArray(A[q]) || A[q].length !== n)"),
  # the identity
  ("Math.abs(F.arms[a].read[j] - t.arms[a].read[j]) > 2e-9 || ", ""),
  ("if (off) bad.push(`${tag}: ${off} reads differ", "if (false) bad.push(`${tag}: ${off} reads differ"),
  # the draw
  ("if (!(Math.abs(m) <= DRAW_Z * se + 1e-12)) bad.push(", "if (false) bad.push("),
  ("const A = t.arms[a], y = perPath(t, J, j => A.exF[j] - A.claim[j])", "const A = t.arms[a], y = perPath(t, J, j => A.ex5[j] - A.exF[j])"),
  # the split and the items
  ("const rq = (t, a) => j => { const A = t.arms[a]; return (A.read[j] - A.ex5[j]) - (A.ex5[j] - A.exF[j]); };", "const rq = (t, a) => j => { const A = t.arms[a]; return (A.read[j] - A.ex5[j]) + (A.ex5[j] - A.exF[j]); };"),
  ("const rq = (t, a) => j => { const A = t.arms[a]; return (A.read[j] - A.ex5[j]) - (A.ex5[j] - A.exF[j]); };", "const rq = (t, a) => j => { const A = t.arms[a]; return (A.read[j] - A.exF[j]) - (A.ex5[j] - A.exF[j]); };"),
  ("const S = files.S370, before = new Set(stepYears(S).map(x => x - 1));", "const S = files.S130, before = new Set(stepYears(S).map(x => x - 1));"),
  ("before.has(S.t[j]) && S.kind[j] === 0), rq(S, 'COV'));", "before.has(S.t[j]) && S.kind[j] === 0), rq(S, 'BASE'));"),
  ("before.has(S.t[j]) && S.kind[j] === 0), rq(S, 'COV'));", "S.kind[j] === 1), rq(S, 'COV'));"),
  ("const h1 = holm([flipP(y1, B, 7002), flipP(y1.map(x => -x), B, 7003)]);", "const h1 = holm([flipP(y1, B, 7002), flipP(y1, B, 7003)]);"),
  ("const r1 = h1[0] < ALPHA ? 'REP' : h1[1] < ALPHA ? 'QUAD' : 'SPLIT';", "const r1 = h1[0] < ALPHA ? 'REP' : 'QUAD';"),
  ("const r1 = h1[0] < ALPHA ? 'REP' : h1[1] < ALPHA ? 'QUAD' : 'SPLIT';", "const r1 = h1[0] < 0.5 ? 'REP' : h1[1] < ALPHA ? 'QUAD' : 'SPLIT';"),
  ("v: r2.every(x => x === 'REP') ? 'HELD' : r2.some(x => x === 'QUAD') ? 'FALSIFIED' : 'INCONCLUSIVE'", "v: r2.some(x => x === 'REP') ? 'HELD' : r2.some(x => x === 'QUAD') ? 'FALSIFIED' : 'INCONCLUSIVE'"),
  ("v: r2.every(x => x === 'REP') ? 'HELD' : r2.some(x => x === 'QUAD') ? 'FALSIFIED' : 'INCONCLUSIVE'", "v: r2.every(x => x === 'REP') ? 'HELD' : r2.every(x => x === 'QUAD') ? 'FALSIFIED' : 'INCONCLUSIVE'"),
  ("const ids = ['S370', 'S130'], ys", "const ids = ['S370', 'S370'], ys"),
  ("return perPath(t, sel(t, j => t.kind[j] === 1), rq(t, 'BASE'));", "return perPath(t, sel(t, j => t.kind[j] === 1), rq(t, 'COV'));"),
  ("const key = t.k[j] * 1e6 + t.p[j];", "const key = t.p[j];"),
  # the detectable size beside each item
  ("return { sd: s, mdd: z * s / Math.sqrt(y.length) };", "return { sd: s, mdd: z * s / y.length };"),
  ("const Z2 = 1.96 + 0.8416,", "const Z2 = 1.96,"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-xas.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
