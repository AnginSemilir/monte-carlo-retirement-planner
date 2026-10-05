#!/usr/bin/env python3
# XAS-R2'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-xasr2.mjs's gate,
# per-arm checks, files, guard, items or arithmetic in a scratch copy, runs the planted set on the copy and must see PLANTED
# CHECK FAILED (the shared runner, mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-xasr2.py > research/solver/results-reduce-xasr2-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("for (const u of units) if (u.plant) bad.push(", "for (const u of []) if (u.plant) bad.push("),
  ("if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${id}: ${n} unit lines, not 1`);"),
  ("if (!(P.nodes[1] > 0 && P.cross[1] > 0 && P.fine[1] > 0)) bad.push(", "if (!(P.nodes[1] > 0 || P.cross[1] > 0)) bad.push("),
  ("if (!(P.nodes[1] > 0 && P.cross[1] > 0 && P.fine[1] > 0)) bad.push(", "if (!(P.nodes[1] > 0 && P.fine[1] > 0)) bad.push("),
  ("if (!okFrac(P.nodes) || !okFrac(P.cr) || !okFrac(P.fine)) bad.push(", "if (!okFrac(P.nodes) || !okFrac(P.cr)) bad.push("),
  ("if (!okFrac(P.cross)) bad.push(", "if (false) bad.push("),
  ("if (ARMS.every(a => u.per[a] && u.per[a].cr && !(u.per[a].cr[1] > 0))) bad.push(", "if (false) bad.push("),
  ("for (const a of ARMS) if (!u.blend[a] || !(u.blend[a].top > 0)) bad.push(", "for (const a of ARMS) if (!u.blend[a]) bad.push("),
  ("const okFrac = f => f && f[0] === f[1];", "const okFrac = f => !!f;"),
  # the files
  ("if (!N || !(k > 0) || ['arm', 'k', 't', 's41', 'p', 'cL'].some(", "if (!N || ['arm'].some("),
  ("if (b.top.some(x => x !== 0 && x !== 1)) bad.push(", "if (b.top.some(x => x > 1)) bad.push("),
  ("['bR', 'bE', 'hR', 'hE'].some(q => !Array.isArray(A[q]) || A[q].length !== n)", "['bR', 'bE'].some(q => !Array.isArray(A[q]) || A[q].length !== n)"),
  # the guard
  ("if (!(m <= GUARD + 1e-12)) bad.push(`the BASE guard:", "if (false) bad.push(`the BASE guard:"),
  ("if (!(Math.abs(m) <= Math.abs(r) + GUARD + 1e-12)) bad.push(", "if (!(m <= Math.abs(r) + GUARD + 1e-12)) bad.push("),
  ("for (const id of READ_UNITS) {\n    const t = files[id]; if (!t) continue;\n    for (const y of", "for (const id of ['S370']) {\n    const t = files[id]; if (!t) continue;\n    for (const y of"),
  ("if (!bad.length) bad.push(...guard(fs));", "if (!bad.length) bad.push(...guard(fs, 'va41'));"),
  # item 1
  ("const D = perPath(S, J, j => A.read[j] - A.vb[j])", "const D = perPath(S, J, j => A.read[j] - A.va[j])"),
  ("lo: D.map((d, i) => d - LO1 * P[i]), hi: D.map((d, i) => HI1 * P[i] - d)", "lo: D.map((d, i) => d - HI1 * P[i]), hi: D.map((d, i) => LO1 * P[i] - d)"),
  ("r.pLo < ALPHA && r.s >= HI1 ? 'TOPCELL'", "r.s >= HI1 ? 'TOPCELL'"),
  ("r.pHi < ALPHA && r.s <= LO1 ? 'REF'", "r.s <= LO1 ? 'REF'"),
  ("!(r.s >= S_MIN && r.s <= S_MAX) ? 'CONSTRUCT'", "!(r.s <= S_MAX) ? 'CONSTRUCT'"),
  ("per.every(r => r.read === 'TOPCELL') ? 'HELD'", "per.some(r => r.read === 'TOPCELL') ? 'HELD'"),
  ("A = S.arms.COV, years", "A = S.arms.BASE, years"),
  # item 2
  ("const qr = quantRatio(S.nodes, 'BASE');", "const qr = quantRatio(S.nodes, 'COV');"),
  ("const J = N.s5.map((_, j) => j).filter(j => N.arm[j] === arm);", "const J = N.s5.map((_, j) => j);"),
  ("Math.abs(N.s5[j] - N.p[j] * N.cL[j])", "Math.abs(N.s5[j] - N.cL[j])"),
  ("qr.ratio >= Q2_HELD - 1e-12 ? 'HELD'", "qr.ratio > Q2_HELD + 1e-9 ? 'HELD'"),
  ("qr.ratio <= Q2_FALS + 1e-12 ? 'FALSIFIED'", "qr.ratio < Q2_FALS - 1e-9 ? 'FALSIFIED'"),
  # item 3
  ("const signs = pB < ALPHA && pH < ALPHA && eB.b < 0 && eB.h > 0;", "const signs = eB.b < 0 && eB.h > 0;"),
  # (dropping the explicit signs beside the one-sided tests is an equivalent mutant: each test is one-sided in that sign)
  ("Math.abs(eC.b) <= REMOVE * Math.abs(eB.b) + 1e-15 && Math.abs(eC.h) <= REMOVE * Math.abs(eB.h) + 1e-15", "Math.abs(eC.b) <= REMOVE * Math.abs(eB.b) + 1e-15"),
  ("Math.abs(eC.b) <= REMOVE * Math.abs(eB.b) + 1e-15 && Math.abs(eC.h)", "Math.abs(eC.b) < REMOVE * Math.abs(eB.b) - 1e-9 && Math.abs(eC.h)"),
  ("const noSmaller = Math.abs(eC.b) >= Math.abs(eB.b) && Math.abs(eC.h) >= Math.abs(eB.h);", "const noSmaller = Math.abs(eC.b) >= Math.abs(eB.b) || Math.abs(eC.h) >= Math.abs(eB.h);"),
  ("const b = files.S126.blend, J = b.top.map((x, j) => (x === 1 ? j : -1)).filter(j => j >= 0);", "const b = files.S126.blend, J = b.top.map((x, j) => j);"),
  # the scorecard's line
  ("out(`\\nOUTCOME: 1 ${R.one.v}; 2 ${R.two.v}; 3 ${R.three.v}`);", "out(`\\nOUTCOME: 1 ${R.one.v}; 2 ${R.two.v}; 3 ${R.one.v}`);"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-xasr2.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
