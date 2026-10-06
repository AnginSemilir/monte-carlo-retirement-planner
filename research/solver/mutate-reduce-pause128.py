#!/usr/bin/env python3
# PAUSE-S128'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-pause128.mjs's gate,
# figures or reading in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED (mutate_lib.py).
#   python3 research/solver/mutate-reduce-pause128.py > research/solver/results-reduce-pause128-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("for (const u of units) if (u.plant) bad.push(", "for (const u of []) if (u.plant) bad.push("),
  ("for (const u of units) if (u.stray) bad.push(", "for (const u of []) if (u.stray) bad.push("),
  ("if (n !== 1) bad.push(`${a}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${a}: ${n} unit lines, not 1`);"),
  ("if (field(u.ran, k) !== v) bad.push(", "if (k !== 'seg' && field(u.ran, k) !== v) bad.push("),
  ("if (!(s.n > 0)) bad.push(", "if (false) bad.push("),
  ("if (s.ok !== s.n) bad.push(", "if (s.ok > s.n) bad.push("),
  ("if (new Set(real.filter(u => u.sum).map(u => u.sum.pathsum)).size > 1) bad.push(", "if (false) bad.push("),
  # the figures
  ("if (fi < 0 && d < -MARGIN) fi = i;", "if (fi < 0 && d < 0) fi = i;"),
  ("for (let i = Math.max(0, ib); i + 1 < G.length; i++)", "for (let i = Math.max(0, ib + 1); i + 1 < G.length; i++)"),
  ("PRICE[a].some(p => u >= p - 0.05 - 1e-12 && u < p)", "PRICE[a].some(p => u >= p - 0.05 - 1e-12 && u <= p)"),
  ("PRICE[a].some(p => u >= p - 0.05 - 1e-12 && u < p)", "PRICE[a].some(p => u > p - 0.05 && u < p)"),
  ("HYB: [0.25, 0.75] };", "HYB: [0.75] };"),
  ("if (!(u >= LO_U && u < HI_U)) continue;", "if (!(u < HI_U)) continue;"),
  ("if (r.first - u <= NEAR + 1e-12) first++;", "if (r.first - u < NEAR) first++;"),
  ("if (r.first - u <= NEAR + 1e-12) first++;", "first++;"),
  ("read: n >= MIN_N,", "read: true,"),
  # the verdict
  ("if (rd.some(a => F[a].loc < FALL || F[a].first < FALL)) return 'FALSIFIED';", "if (rd.some(a => F[a].first < FALL)) return 'FALSIFIED';"),
  ("if (rd.some(a => F[a].loc < FALL || F[a].first < FALL)) return 'FALSIFIED';", "if (rd.some(a => F[a].loc <= FALL || F[a].first < FALL)) return 'FALSIFIED';"),
  ("if (rd.length === ARMS.length && rd.every(a => F[a].loc >= HOLD && F[a].first >= HOLD)) return 'HELD';", "if (rd.every(a => F[a].loc >= HOLD && F[a].first >= HOLD)) return 'HELD';"),
  ("if (rd.length === ARMS.length && rd.every(a => F[a].loc >= HOLD && F[a].first >= HOLD)) return 'HELD';", "if (rd.length === ARMS.length && rd.every(a => F[a].loc > HOLD && F[a].first >= HOLD)) return 'HELD';"),
  ("if (rd.length === ARMS.length && rd.every(a => F[a].loc >= HOLD && F[a].first >= HOLD)) return 'HELD';", "if (rd.length === ARMS.length && rd.every(a => F[a].first >= HOLD)) return 'HELD';"),
  # the reading's line
  ("LOC ${f3(F[a].loc)}   FIRST ${f3(F[a].first)}", "LOC ${f3(F[a].first)}   FIRST ${f3(F[a].loc)}"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-pause128.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
