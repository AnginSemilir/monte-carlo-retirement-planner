#!/usr/bin/env python3
# NS-COND'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (RULES.md rule 6 and the mutation rule): each mutation breaks one part of
# reduce-nscond.mjs's gate, its table checks, its file check or item 1 in a scratch copy, runs the planted set and must see
# PLANTED CHECK FAILED. Items 2 and 3 and the identity are reduce-nsb.mjs's functions, imported unchanged (their mutation
# run: results-reduce-nsb-mutations.txt).
#   python3 research/solver/mutate-reduce-nscond.py > research/solver/results-reduce-nscond-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${id}: ${n} unit lines, not 1`);"),
  ("for (const u of units) if (u.plant) bad.push(", "for (const u of units) if (false) bad.push("),
  ("if (new Set(st.map(s => s.code)).size > 1 || new Set(st.map(s => s.audit)).size > 1)", "if (new Set(st.map(s => s.audit)).size > 1)"),
  ("if (st[i].prediction !== pred) bad.push(", "if (false) bad.push("),
  ("if (u.unit !== L) bad.push(", "if (false) bad.push("),
  ("if (u.blind) bad.push(", "if (false) bad.push("),
  ("if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-'))", "if (u.solve.COV && field(u.solve.COV, 'coverage') === '-')"),
  ("for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v)", "for (const [k, v] of Object.entries(want)) if (k !== 'pts' && field(u.ran, k) !== v)"),
  ("if (Object.keys(u.tables).length) bad.push(", "if (false) bad.push("),
  ("if (!u.done) bad.push(", "if (false) bad.push("),
  ("for (const q of CHECKS) if (!okFrac(c[q])) bad.push(", "for (const q of CHECKS) if (q !== 'restore' && !okFrac(c[q])) bad.push("),
  ("for (const q of CHECKS) if (!okFrac(c[q])) bad.push(", "for (const q of CHECKS) if (q !== 'deadstepNext' && !okFrac(c[q])) bad.push("),
  ("for (const q of MUST) if (!(c[q][1] > 0)) bad.push(", "for (const q of MUST) if (q !== 'wdRead' && !(c[q][1] > 0)) bad.push("),
  ("if (!(c.noAccessDead > 0)) bad.push(", "if (false) bad.push("),
  ("if (a === 'BASE' && want3) for (const q of MUST3)", "if (false) for (const q of MUST3)"),
  ("const before = (field(u.ran, 'before') || 'none').split(',').filter(x => x !== 'none').map(Number), want3 = before.some(t => t > 0);", "const before = (field(u.ran, 'before') || 'none').split(',').filter(x => x !== 'none').map(Number), want3 = before.length > 0;"),
  ("if (want3 && !(u.item3 && u.item3.reads > 0)) bad.push(", "if (false) bad.push("),
  # the table checks
  ("if (!okFrac(d.fail)) bad.push(", "if (false) bad.push("),
  ("if (!okFrac(d.next)) bad.push(", "if (false) bad.push("),
  ("if (!(d.fail[1] + d.next[1] > 0)) bad.push(", "if (false) bad.push("),
  ("if (e > 0 && tol / e < RATIO_MIN) bad.push(", "if (e > 0 && tol / e < 1) bad.push("),
  ("if (e > 0 && tol / e < RATIO_MIN) bad.push(", "if (e > 0 && tol / e <= RATIO_MIN) bad.push("),
  ("if (d.failPlant !== 'NaN' || d.nextPlant !== 'NaN') bad.push(", "if (d.nextPlant !== 'NaN') bad.push("),
  ("if (!(u.census[a] && u.census[a].length)) bad.push(", "if (false) bad.push("),
  ("for (const a of ARMS) if (!(u.tables[a] && u.tables[a].noAccessDead > 0)) bad.push(", "for (const a of ARMS) if (!u.tables[a]) bad.push("),
  ("bad.push(...tableChecks(u));", "bad.push(...[]);"),
  # the file check
  ("if (!t.stamp || `code ${t.stamp.code} audit ${t.stamp.audit} prediction ${t.stamp.prediction} sha ${t.stamp.sha}` !== u.stamp)", "if (!t.stamp)"),
  ("if (A.wd.some((w, j) => Math.abs(w + A.w0x[j] + A.wL[j] - 1) > 1e-9)) bad.push(", "if (false) bad.push("),
  ("if (A.wK.some((w, j) => w > A.wL[j] + 1e-12)) bad.push(", "if (false) bad.push("),
  ("if (!A || COLS1.some(q => !Array.isArray(A[q]) || A[q].length !== n1))", "if (!A || ['top', 'wd'].some(q => !Array.isArray(A[q]) || A[q].length !== n1))"),
  ("if (u.item2[a] && (u.item2[a].states !== n2 || u.item2[a].changed !== ch))", "if (u.item2[a] && u.item2[a].states !== n2)"),
  # item 1
  ("const counts = J.length > 0 && mwd > WD_MIN, material = counts && mel > MAT + 1e-12;", "const counts = J.length > 0 && mwd >= WD_MIN, material = counts && mel > MAT + 1e-12;"),
  ("const counts = J.length > 0 && mwd > WD_MIN, material = counts && mel > MAT + 1e-12;", "const counts = J.length > 0 && mwd > WD_MIN, material = counts && mel >= MAT - 1e-12;"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && (cls === 'all' || I.step[j] === 0)"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0"),
  ("return Math.abs(x.el) - Math.abs((1 + x.el) / x.rho - 1); }", "return Math.abs(x.el) - Math.abs(x.el / x.rho); }"),
  ("return Math.abs(x.eC) - Math.abs(x.eK); }", "return Math.abs(x.eC) - Math.abs(x.el); }"),
  ("eK: A.BL[j] / A.SL[j] * A.sR[j] / A.bE[j] - 1", "eK: A.BL[j] / A.bE[j] - 1"),
  ("mc.every(c => c.pR < ALPHA && c.pK < ALPHA) ? 'HELD'", "mc.every(c => c.pR < ALPHA) ? 'HELD'"),
  ("mc.every(c => c.pR < ALPHA && c.pK < ALPHA) ? 'HELD'", "mc.some(c => c.pR < ALPHA && c.pK < ALPHA) ? 'HELD'"),
  ("mc.every(c => c.pN < ALPHA) ? 'FALSIFIED'", "mc.some(c => c.pN < ALPHA) ? 'FALSIFIED'"),
  ("const v = !mc.length ? 'INCONCLUSIVE' :", "const v = !mc.length ? 'HELD' :"),
  ("const cells = cellsOf(files), mc = cells.filter(c => c.material);", "const cells = cellsOf(files), mc = cells.filter(c => c.counts);"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-nscond.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
