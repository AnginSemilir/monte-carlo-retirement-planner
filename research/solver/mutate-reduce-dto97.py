#!/usr/bin/env python3
# DT-O97'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of reduce-dto97.mjs's gate,
# pairing with ADOPT-PI, items, last-pension read or per-arm split in a scratch copy, runs the planted set and must see PLANTED CHECK FAILED.
#   python3 research/solver/mutate-reduce-dto97.py > research/solver/results-reduce-dto97-mutations.txt
from mutate_lib import run
M = [
  ("if (!t || !(t.pen instanceof Float32Array) || t.pen.length !== t.N * t.Y) bad.push(", "if (!t) bad.push("),
  ("for (const k of UNIT_KEYS) { const n = units.filter(u => keyOf(u) === k).length; if (n !== 1) bad.push(", "for (const k of UNIT_KEYS) { const n = units.filter(u => keyOf(u) === k).length; if (n > 1) bad.push("),
  ("if (!UNIT_KEYS.includes(tag)) { bad.push(`${tag}: not a registered unit`); continue; }", "if (!UNIT_KEYS.includes(tag)) { continue; }"),
  ("if (!u.done) bad.push(`${tag}: not done`);", ""),
  ("pclsInterp: ARMS[u.arm], mix: '3', deathTax: DT_RATE };", "pclsInterp: ARMS[u.arm], mix: '3' };"),
  ("pclsInterp: ARMS[u.arm], mix: '3', deathTax: DT_RATE };", "mix: '3', deathTax: DT_RATE };"),
  ("if (new Set(us.map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: its units ran different paths`);", ""),
  ("if (ref.length !== 2) { bad.push(", "if (ref.length < 1) { bad.push("),
  ("if (paths && ps.size !== 1) bad.push(`${id}: not ADOPT-PI's paths", "if (paths && ps.size > 2) bad.push(`${id}: not ADOPT-PI's paths"),
  ("if (paths && ps.size !== 1) bad.push(`${id}: not ADOPT-PI's paths", "if (ps.size !== 1) bad.push(`${id}: not ADOPT-PI's paths"),
  ("else if (t.N !== r.N || t.Y !== r.Y) bad.push(", "else if (t.Y !== r.Y) bad.push("),
  ("const ph = holm(ids.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c)));", "const ph = ids.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c));"),
  ("one.some(r => r.outcome === 'harm') || pool.hi < -pool.margin ? 'FALSIFIED'", "one.some(r => r.outcome === 'harm') ? 'FALSIFIED'"),
  ("pool.lo > -pool.margin ? 'HELD' : 'INCONCLUSIVE';", "pool.d > -pool.margin ? 'HELD' : 'INCONCLUSIVE';"),
  ("if (!(mean(r.d0) < 0)) return [1, 1];", ""),
  ("flipP(r.d4.map((x, j) => x - KEEP_DT * r.d0[j]), b, 7701 + 2 * i)", "flipP(r.d4.map((x, j) => x - 0.5 * r.d0[j]), b, 7701 + 2 * i)"),
  ("flipP(r.d0.map((x, j) => KEEP_TAIL * x - r.d4[j]), b, 7702 + 2 * i)", "flipP(r.d0.map((x, j) => 0.25 * x - r.d4[j]), b, 7702 + 2 * i)"),
  ("const h = holm(ps);", "const h = ps;"),
  ("h[2 * i] < ALPHA ? 'DT' : h[2 * i + 1] < ALPHA ? 'TAIL' : 'UNCLEAR';", "h[2 * i] < 0.5 ? 'DT' : h[2 * i + 1] < ALPHA ? 'TAIL' : 'UNCLEAR';"),
  ("h[2 * i] < ALPHA ? 'DT' : h[2 * i + 1] < ALPHA ? 'TAIL' : 'UNCLEAR';", "h[2 * i] < ALPHA ? 'DT' : h[2 * i + 1] < 0.5 ? 'TAIL' : 'UNCLEAR';"),
  ("v: nDT >= NEED ? 'HELD' : nTAIL >= NEED ? 'FALSIFIED' : 'INCONCLUSIVE'", "v: nDT >= 4 ? 'HELD' : nTAIL >= NEED ? 'FALSIFIED' : 'INCONCLUSIVE'"),
  ("v: nDT >= NEED ? 'HELD' : nTAIL >= NEED ? 'FALSIFIED' : 'INCONCLUSIVE'", "v: nDT >= 6 ? 'HELD' : nTAIL >= NEED ? 'FALSIFIED' : 'INCONCLUSIVE'"),
  ("v: nDT >= NEED ? 'HELD' : nTAIL >= NEED ? 'FALSIFIED' : 'INCONCLUSIVE'", "v: nDT >= NEED ? 'HELD' : nTAIL >= 3 ? 'FALSIFIED' : 'INCONCLUSIVE'"),
  ("if (v === v) return v; } return 0; }", "if (v === v) return v; } return NaN; }"),
  ("for (let y = t.Y - 1; y >= 0; y--) { const v = t.pen[j * t.Y + y];", "for (let y = 0; y < t.Y; y++) { const v = t.pen[j * t.Y + y];"),
  ("x[j] = A4.net[j] - (A0.net[j] - DT * lastPension(A0, j) * A0.survived[j]);", "x[j] = A4.net[j] - (A0.net[j] - DT * lastPension(A0, j));"),
  ("x[j] = A4.net[j] - (A0.net[j] - DT * lastPension(A0, j) * A0.survived[j]);", "x[j] = A4.net[j] - A0.net[j];"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-dto97.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
