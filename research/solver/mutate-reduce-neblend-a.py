#!/usr/bin/env python3
# NE-BLEND STAGE A'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; the retirement pass of 11 Oct 15:36 UK: the mutation
# rule had lapsed for reduce-nesplit, reduce-neroot and this reducer, and NE-GRID's reducer builds on this one): each
# mutation breaks one part of reduce-neblend-a.mjs's gate, intervals or items in a scratch copy, runs the planted set on
# the copy and must see PLANTED CHECK FAILED (the shared runner, mutate_lib.py, which also logs the run to
# results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-neblend-a.py > research/solver/results-reduce-neblend-a-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${key(id, w, arm)}:", "if (n > 1) bad.push(`${key(id, w, arm)}:"),
  ("if (!j.done) bad.push(", "if (false) bad.push("),
  ("j.head.npw !== npw || j.head.seed !== seed", "j.head.npw !== npw"),
  ("j.head.pts !== pts || j.head.npw", "false || j.head.npw"),
  ("if (!j.checks.armTook || j.checks.armTook[0] !== 1)", "if (!j.checks.armTook)"),
  ("Object.entries({ ...WANT[j.arm], ...COMMON })", "Object.entries({ ...COMMON })"),
  ("if (!j.own) bad.push(", "if (false) bad.push("),
  ("j.world.some((x, i) => x.k !== i || x.n !== npw)", "j.world.some((x, i) => x.k !== i)"),
  ("j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi", "j.checks.forceIdentity[0] !== j.checks.forceIdentity[1]"),
  ("if (!f) bad.push(`${k}: its file ${j.file} is missing`);", "if (!f) ;"),
  ("sha16(Buffer.from(f.bits[`OWN${x.k}`], 'base64')) !== x.bits", "false"),
  ("x.table.toFixed(4) !== ref[i].toFixed(4)", "x.table.toFixed(1) !== ref[i].toFixed(1)"),
  ("if (!ref) bad.push(", "if (false) bad.push("),
  # the intervals
  ("lo: y.table - 100 * h, hi: y.table - 100 * l", "lo: y.table - 100 * l, hi: y.table - 100 * h"),
  ("lo: dT / (100 * (h2 - l0))", "lo: dT / dS"),
  ("return Math.min(1, 2 * binomUpperHalf(Math.max(b, c), n));", "return Math.min(1, 2 * binomUpperHalf(Math.min(b, c), n));"),
  ("else if (x && !y) b++; else if (!x && y) c++;", "else if (x && !y) c++; else if (!x && y) b++;"),
  # items 1 and 2
  ("c.every(x => Math.abs(x.d) <= CTRL)", "c.every(x => Math.abs(x.d) < CTRL)"),
  ("c.some(x => x.lo > CTRL || x.hi < -CTRL)", "c.some(x => x.lo > CTRL)"),
  ("out[2] = keep(J[key('bridge 4', '0.02', 'LOR')]);", "out[2] = keep(J[key('bridge 4', '0.02', 'RZ')]);"),
  # item 3
  ("const within = cw.every(x => Math.abs(x.d) <= WORLD)", "const within = true"),
  ("over = sp.lo > SPREAD_OUT[1]", "over = sp.point > SPREAD_OUT[1]"),
  ("sp.point >= SPREAD[0] && sp.point <= SPREAD[1]", "sp.point > SPREAD[0] && sp.point <= SPREAD[1]"),
  ("sp.hi < SPREAD_OUT[0] ? 'FALSIFIED'", "sp.point < SPREAD_OUT[0] ? 'FALSIFIED'"),
  # item 4
  ("pairOf(bitsOf(base, k), bitsOf(lor, k))", "pairOf(bitsOf(lor, k), bitsOf(base, k))"),
  ("const held = pv < ALPHA && Math.abs(p0.change) >= MAT;", "const held = Math.abs(p0.change) >= MAT;"),
  ("const held = pv < ALPHA && Math.abs(p0.change) >= MAT;", "const held = pv < ALPHA && p0.change >= MAT;"),
  ("(g.lo >= -MAT && g.hi <= MAT)", "(g.lo >= -MAT || g.hi <= MAT)"),
  ("g = guarded(survivalChangeU(p0.a, p0.b, p0.c, p0.d, ALPHA), p0.b, p0.c, N0, ALPHA)", "g = survivalChangeU(p0.a, p0.b, p0.c, p0.d, ALPHA)"),
  ("p0.change > 0 ? 'up' : 'down'", "p0.change > 0 ? 'up' : 'up'"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-neblend-a.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
