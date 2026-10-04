#!/usr/bin/env python3
# ADOPT-PI'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-adoptpi.mjs's gate,
# items, pairing or arithmetic in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED (the
# shared runner, mutate_lib.py, which also logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-adoptpi.py > research/solver/results-reduce-adoptpi-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`);", "if (n > 1) bad.push(`${k}: ${n} unit lines, not 1`);"),
  ("if (!UNIT_KEYS.includes(tag)) { bad.push(", "if (false) { bad.push("),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("bridgeRead: 'false', switchMargin", "switchMargin"),
  ("const want = { pts, seed: SEED,", "const want = { pts,"),
  ("pclsInterp: ARMS[u.arm], mix", "mix"),
  ("deathTax: u.dt ? DT_RATE : '0' }", "}"),
  ("if (new Set(us.map(u => u.access)).size > 1)", "if (false)"),
  ("if (new Set(us.map(u => u.sum.pathsum)).size > 1)", "if (false)"),
  ("if (s !== u.sum.survived) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])", "false"),
  ("if (!t) return [`${tag}: missing`];", "if (!t) return [];"),
  # the pairing and the counts
  ("if (x && y) a++; else if (x) b++; else if (y) c++; else d++;", "if (x && y) a++; else if (x) c++; else if (y) b++; else d++;"),
  ("const dt = B.tax[j] - A.tax[j], dn = B.net[j] - A.net[j];", "const dt = B.tax[j] - A.tax[j], dn = A.net[j] - B.net[j];"),
  ("return { a, b, c, d, N, snap: (a + b) / N,", "return { a, b, c, d, N, snap: (a + c) / N,"),
  ("s2 / N - (s / N) ** 2", "s2 / N"),
  # item 1
  ("const ph = holm(ids.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c)));", "const ph = ids.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c));"),
  ("one.some(r => r.outcome === 'harm') || pool.hi < -pool.margin ? 'FALSIFIED'", "pool.hi < -pool.margin ? 'FALSIFIED'"),
  ("|| pool.hi < -pool.margin ? 'FALSIFIED'", "? 'FALSIFIED'"),
  ("pool.lo > -pool.margin ? 'HELD'", "pool.d > -pool.margin ? 'HELD'"),
  ("margin: MARGINS.pooled,", "margin: 0.5,"),
  ("survivalChange(sb, sc, sN)", "survivalChange(sc, sb, sN)"),
  ("margin = marginFor(100 * p.snap)", "margin = 5"),
  # item 2
  ("binomUpperHalf(pairs[id].c, pairs[id].b + pairs[id].c)", "binomUpperHalf(pairs[id].b, pairs[id].b + pairs[id].c)"),
  # not mutated: "gain: p.c > p.b && pg[i] < 0.05" - dropping c > b is an equivalent mutant (with c <= b the one-sided p is
  # at least a half, so the adjusted p is never under 0.05): no plant can tell it from the true script
  ("two.some(r => r.c <= r.b) ? 'FALSIFIED'", "two.some(r => r.c < r.b) ? 'FALSIFIED'"),
  ("const v2 = two.every(r => r.gain) ? 'HELD'", "const v2 = two.some(r => r.gain) ? 'HELD'"),
  # the secondary and the hold
  ("${sign(z.net.m) !== sign(q.net.m) ? ' FLIPS' : ''}", ""),
  ("if (x >= 0.75) c = true;", "if (x > 0.8) c = true;"),
  ("if (r) { reach++; yrs += y; }", "if (r) { reach++; yrs += y + 1; }"),
]
run('reduce-adoptpi.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
