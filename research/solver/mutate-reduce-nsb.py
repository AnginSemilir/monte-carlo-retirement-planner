#!/usr/bin/env python3
# NSB'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (RULES.md rule 6 and the mutation rule): each mutation breaks one part of
# reduce-nsb.mjs's gate, file check, identity or items in a scratch copy, runs the planted set and must see PLANTED CHECK
# FAILED.
#   python3 research/solver/mutate-reduce-nsb.py > research/solver/results-reduce-nsb-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${id}: ${n} unit lines, not 1`);"),
  ("for (const u of units) if (u.plant) bad.push(", "for (const u of units) if (false) bad.push("),
  ("if (new Set(st.map(s => s.code)).size > 1 || new Set(st.map(s => s.audit)).size > 1)", "if (new Set(st.map(s => s.audit)).size > 1)"),
  ("if (st[i].prediction !== pred) bad.push(", "if (false) bad.push("),
  ("if (u.unit !== L) bad.push(", "if (false) bad.push("),
  ("if (!u.done) bad.push(", "if (false) bad.push("),
  ("if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-'))", "if (u.solve.COV && field(u.solve.COV, 'coverage') === '-')"),
  ("for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v)", "for (const [k, v] of Object.entries(want)) if (k !== 'pts' && field(u.ran, k) !== v)"),
  ("for (const q of CHECKS) if (!okFrac(c[q])) bad.push(", "for (const q of CHECKS) if (q !== 'restore' && !okFrac(c[q])) bad.push("),
  ("for (const q of MUST) if (!(c[q][1] > 0)) bad.push(", "for (const q of MUST) if (q !== 'wdRead' && !(c[q][1] > 0)) bad.push("),
  ("if (a === 'BASE' && want3) for (const q of MUST3)", "if (false) for (const q of MUST3)"),
  ("const before = (field(u.ran, 'before') || 'none').split(',').filter(x => x !== 'none').map(Number), want3 = before.some(t => t > 0);", "const before = (field(u.ran, 'before') || 'none').split(',').filter(x => x !== 'none').map(Number), want3 = before.length > 0;"),
  ("if (want3 && !(u.item3 && u.item3.reads > 0)) bad.push(", "if (false) bad.push("),
  # the file check and the identity
  ("if (!t.stamp || `code ${t.stamp.code} audit ${t.stamp.audit} prediction ${t.stamp.prediction} sha ${t.stamp.sha}` !== u.stamp)", "if (!t.stamp)"),
  ("if (u.item2[a] && (u.item2[a].states !== n2 || u.item2[a].changed !== ch))", "if (u.item2[a] && u.item2[a].states !== n2)"),
  ("A.wd.some(x => !(x >= 0 && x <= 1 + 1e-12))", "A.wd.some(x => !(x >= 0))"),
  ("Math.abs(I.vb[j] - X.vb[j]) <= IDT;", "true;"),
  ("const same = I.p[j] === x.p[j] && I.t[j] === x.t[j]", "const same = I.t[j] === x.t[j]"),
  ("Math.abs(I.ex5[j] - X.ex5[j]) <= IDT &&", "Math.abs(I.ex5[j] - X.ex5[j]) <= 10 * IDT &&"),
  # item 1
  ("const mwd = mean(J.map(j => A.wd[j])), counts = J.length > 0 && mwd > WD_MIN;", "const mwd = mean(J.map(j => A.wd[j])), counts = J.length > 0 && mwd >= WD_MIN;"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && (cls === 'all' || I.step[j] === 0)"),
  ("A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && (cls === 'all' || I.step[j] === 0)", "A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0"),
  ("tol: r.map(x => TOL1 - x)", "tol: r.map(x => TOL1 + 0.02 - x)"),
  ("quart: e.map((x, i) => QUART1 * w[i] - x)", "quart: e.map((x, i) => 0.6 * w[i] - x)"),
  ("heldCells = cells.filter(c => c.counts && (c.a === 'BASE' ? c.cls === 'all' : true))", "heldCells = cells.filter(c => c.counts && c.a === 'BASE' && c.cls === 'all')"),
  ("heldCells.every(c => c.tolP < ALPHA) ? 'HELD'", "heldCells.some(c => c.tolP < ALPHA) ? 'HELD'"),
  ("falsCells.length && falsCells.every(c => c.quartP < ALPHA) ? 'FALSIFIED'", "falsCells.some(c => c.quartP < ALPHA) ? 'FALSIFIED'"),
  ("const v = !heldCells.length ? 'INCONCLUSIVE' :", "const v = !heldCells.length ? 'HELD' :"),
  # item 2
  ("const held = (opening && opening.changed) || rows.some(r => r.n >= MIN_STATES && r.share >= CHANGE_HELD - 1e-12);", "const held = (opening && opening.changed) || rows.some(r => r.share >= CHANGE_HELD - 1e-12);"),
  ("const held = (opening && opening.changed) || rows.some(r => r.n >= MIN_STATES && r.share >= CHANGE_HELD - 1e-12);", "const held = (opening && opening.changed) || rows.some(r => r.n >= MIN_STATES && r.share > CHANGE_HELD);"),
  ("const held = (opening && opening.changed) || rows.some(r => r.n >= MIN_STATES && r.share >= CHANGE_HELD - 1e-12);", "const held = rows.some(r => r.n >= MIN_STATES && r.share >= CHANGE_HELD - 1e-12);"),
  ("const fals = opening && !opening.changed && rows.length > 0 && rows.every(r => r.share < CHANGE_FALS);", "const fals = rows.length > 0 && rows.every(r => r.share < 0.01);"),
  # item 3
  ("sg = Math.sign(P0.reduce((s, v) => s + v, 0)) || 1;", "sg = 1;"),
  ("r.pLo < ALPHA && r.s >= HI3 - 1e-12 ? 'REF'", "r.pLo < ALPHA && r.s > HI3 ? 'REF'"),
  ("r.pHi < ALPHA && r.s <= LO3 + 1e-12 ? 'NOTREF'", "r.s <= LO3 + 1e-12 ? 'NOTREF'"),
  ("!(r.s >= S_MIN && r.s <= S_MAX) ? 'CONSTRUCT'", "false ? 'CONSTRUCT'"),
  ("per.length && per.every(r => r.read === 'REF') ? 'HELD'", "per.length && per.some(r => r.read === 'REF') ? 'HELD'"),
  ("lo: D.map((d, i) => d - LO3 * P[i]), hi: D.map((d, i) => HI3 * P[i] - d)", "lo: D.map((d, i) => d - LO3 * P[i]), hi: D.map((d, i) => d - HI3 * P[i])"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-nsb.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
