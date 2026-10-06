#!/usr/bin/env python3
# FORCE-X'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-forcex.mjs's gate,
# identity, recovery, reading or re-pause count in a scratch copy, runs the planted set and must see PLANTED CHECK FAILED.
#   python3 research/solver/mutate-reduce-forcex.py > research/solver/results-reduce-forcex-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("for (const u of units) if (u.plant) bad.push(", "for (const u of []) if (u.plant) bad.push("),
  ("if (n !== 1) bad.push(`${id} ${a}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${id} ${a}: ${n} unit lines, not 1`);"),
  ("for (const [f, v] of Object.entries(want)) if (field(u.ran, f) !== v)", "for (const [f, v] of Object.entries(want)) if (f !== 'price' && field(u.ran, f) !== v)"),
  ("if (new Set(h.filter(u => u.sum).map(u => u.sum.pathsum)).size > 1) bad.push(", "if (false) bad.push("),
  ("else if (f.acting / f.pauses < ACT) bad.push(", "else if (f.acting / f.pauses <= ACT) bad.push("),
  ("else if (f.acting / f.pauses < ACT) bad.push(", "else if (false) bad.push("),
  ("for (const u of real.filter(x => x.id === DECIDE && DECIDING.includes(x.arm)", "for (const u of real.filter(x => DECIDING.includes(x.arm)"),
  ("if (!(f.pauses > 0)) bad.push(", "if (false) bad.push("),
  # the identity
  ("for (let y = 0; y <= last; y++) {", "for (let y = 0; y < last; y++) {"),
  ("const last = t.first[j] >= 0 ? t.first[j] : t.Y - 1;", "const last = t.first[j] >= 0 ? t.first[j] + 1 : t.Y - 1;"),
  ("if (t.first[j] < 0) { ends++; if (t.survived[j] !== ref.survived[j]", "if (false) { ends++; if (t.survived[j] !== ref.survived[j]"),
  ("if (!(cells > 0)) bad.push(", "if (false) bad.push("),
  # the recovery and item 1
  ("for (let j = 0; j < n; j++) { D[j] = X[j] - A[j]; G[j] = P[j] - A[j]; }", "for (let j = 0; j < n; j++) { D[j] = X[j] - A[j]; G[j] = P[j] - X[j]; }"),
  ("R: sG > 0 ? sD / sG : NaN", "R: sG !== 0 ? sD / sG : NaN"),
  ("lo: D.map((d, j) => d - LO * G[j]), hi: D.map((d, j) => HI * G[j] - d)", "lo: D.map((d, j) => d - HI * G[j]), hi: D.map((d, j) => LO * G[j] - d)"),
  ("pLo < ALPHA && r.R >= HI ? 'RECOVERS'", "r.R >= HI ? 'RECOVERS'"),
  ("pLo < ALPHA && r.R >= HI ? 'RECOVERS'", "pLo < ALPHA && r.R > HI ? 'RECOVERS'"),
  ("pHi < ALPHA && r.R <= LO ? 'KEEPS'", "pHi < ALPHA && r.R < LO ? 'KEEPS'"),
  ("const v = reads.every(r => r.read === 'RECOVERS') ? 'HELD'", "const v = reads.some(r => r.read === 'RECOVERS') ? 'HELD'"),
  (": reads.every(r => r.read === 'KEEPS') ? 'FALSIFIED'", ": reads.some(r => r.read === 'KEEPS') ? 'FALSIFIED'"),
  ("(!(r.sG > 0) ? 'NO GAP'", "(false ? 'NO GAP'"),
  # the re-pause count
  ("if (!f || t.pt[i] <= f.t) continue;", "if (!f) continue;"),
  ("if (t.pu[i] >= f.p - 1e-12 && t.pu[i] < f.p + PAST) near++;", "if (t.pu[i] >= f.p - 1e-12 && t.pu[i] <= f.p + PAST) near++;"),
  ("if (t.pu[i] >= f.p - 1e-12 && t.pu[i] < f.p + PAST) near++;", "if (t.pu[i] > f.p && t.pu[i] < f.p + PAST) near++;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-forcex.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
