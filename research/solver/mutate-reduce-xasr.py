#!/usr/bin/env python3
# XAS-R'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-xasr.mjs's gate,
# identity, guard, items or arithmetic in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK
# FAILED (the shared runner, mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-xasr.py > research/solver/results-reduce-xasr-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${id}: ${n} unit lines, not 1`);"),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("if (u.solve.BASE && (field(u.solve.BASE, 'readerTax') !== '-' || field(u.solve.BASE, 'coverage') !== '-'))", "if (false)"),
  ("if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-'))", "if (u.solve.COV && field(u.solve.COV, 'readerTax') === '-')"),
  ("const want = { mix: '3', pts, seed: SEED,", "const want = { mix: '3', pts,"),
  ("if (!(c[1] > 0 && c[3] > 0 && c[5] > 0 && c[7] > 0)) bad.push(", "if (!(c[1] > 0)) bad.push("),
  ("if (c[0] !== c[1] || c[2] !== c[3] || c[4] !== c[5] || c[6] !== c[7]) bad.push(", "if (c[4] !== c[5] || c[6] !== c[7]) bad.push("),
  ("if (u.termsOk !== 4) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])", "false"),
  ("if (!t) return [`${tag}: missing`];", "if (!t) return [];"),
  ("if (t.top.some(x => x !== 0 && x !== 1)) bad.push(", "if (t.top.some(x => x > 1)) bad.push("),
  ("COLS.some(q => !Array.isArray(A[q]) || A[q].length !== n)", "['read', 'ex5'].some(q => !Array.isArray(A[q]) || A[q].length !== n)"),
  ("if (u.xasr[a] && u.xasr[a].reads !== n) bad.push(", "if (false) bad.push("),
  # the identity
  ("if (at.size !== n) bad.push(", "if (false) bad.push("),
  ("Math.abs(X.arms[a].read[i] - t.arms[a].read[j]) > 2e-9 || ", ""),
  ("if (off) bad.push(`${tag}: ${off} reads differ", "if (false) bad.push(`${tag}: ${off} reads differ"),
  ("for (const a of ARMS) if (u.open[a] !== xu.open[a]) bad.push(", "for (const a of ['BASE']) if (u.open[a] !== xu.open[a]) bad.push("),
  ("if (!tb || !(Math.abs(tb.score - xu.scoreBase) <= 1e-4)) bad.push(", "if (!tb) bad.push("),
  # the guard
  ("if (!(m <= GUARD + 1e-12)) bad.push(", "if (!(m <= GUARD + 2e-3)) bad.push("),
  ("const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), A = t.arms.BASE,", "const J = t.t.map((_, j) => j).filter(j => t.t[j] === y), A = t.arms.COV,"),
  # item 1
  ("const D = perPath(S, J, j => A.read[j] - A.va[j]),", "const D = perPath(S, J, j => A.read[j] - A.vb[j] + (A.vb[j] - A.va[j]) * 0.5),"),
  ("const S = files.S370, A = S.arms.COV,", "const S = files.S370, A = S.arms.BASE,"),
  ("lo: D.map((d, i) => d - LO * P[i]), hi: D.map((d, i) => HI * P[i] - d)", "lo: D.map((d, i) => d - HI * P[i]), hi: D.map((d, i) => LO * P[i] - d)"),
  ("r.read = r.pLo < ALPHA && r.s >= HI ? 'COPY' : r.pHi < ALPHA && r.s <= LO ? 'GRID' : 'MID';", "r.read = r.s >= HI ? 'COPY' : r.s <= LO ? 'GRID' : 'MID';"),
  ("r.read = r.pLo < ALPHA && r.s >= HI ? 'COPY' : r.pHi < ALPHA && r.s <= LO ? 'GRID' : 'MID';", "r.read = r.pLo < ALPHA && r.s > HI ? 'COPY' : r.pHi < ALPHA && r.s <= LO ? 'GRID' : 'MID';"),
  ("r.read = r.pLo < ALPHA && r.s >= HI ? 'COPY' : r.pHi < ALPHA && r.s <= LO ? 'GRID' : 'MID';", "r.read = r.pLo < ALPHA && r.s >= HI ? 'COPY' : r.pHi < ALPHA && r.s < LO ? 'GRID' : 'MID';"),
  ("v: per.length && per.every(r => r.read === 'COPY') ? 'HELD'", "v: per.length && per.some(r => r.read === 'COPY') ? 'HELD'"),
  ("per.length && per.every(r => r.read === 'GRID') ? 'FALSIFIED'", "per.length && per.some(r => r.read === 'GRID') ? 'FALSIFIED'"),
  ("const key = t.k[j] * 1e6 + t.p[j];", "const key = t.p[j];"),
  # item 2
  ("q: (d('resil') + d('beq') - d('short')) / d('score')", "q: (d('resil') + d('beq') + d('short')) / d('score')"),
  ("q: (d('resil') + d('beq') - d('short')) / d('score')", "q: (d('beq') - d('short')) / d('score')"),
  ("q: (d('resil') + d('beq') - d('short')) / d('score')", "q: (d('resil') - d('short')) / d('score')"),
  ("two = { mv, v: mv.every(x => x.q >= Q_HELD) ? 'HELD'", "two = { mv, v: mv.some(x => x.q >= Q_HELD) ? 'HELD'"),
  ("mv.every(x => x.q <= Q_FALS) ? 'FALSIFIED'", "mv.some(x => x.q <= Q_FALS) ? 'FALSIFIED'"),
  ("const b = u.terms[`BASE ${lab}`], c = u.terms[`COV ${lab}`]", "const b = u.terms[`BASE BASE-move`], c = u.terms[`COV ${lab}`]"),
  # the scorecard's line
  ("out(`\\nOUTCOME: 1 ${R.one.v}; 2 ${R.two.v}`);", "out(`\\nOUTCOME: 1 ${R.one.v}; 2 ${R.one.v}`);"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-xasr.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
