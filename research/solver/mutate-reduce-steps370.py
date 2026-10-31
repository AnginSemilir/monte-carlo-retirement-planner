#!/usr/bin/env python3
# STEP-S370'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-steps370.mjs's gate, items or rows in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK
# FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-steps370.py > research/solver/results-reduce-steps370-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (j.id !== HOUSE) bad.push(", "if (false) bad.push("),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })", "grid: `total${pts}x${sn ? NODES_SN.length : 6}x6` })"),
  ("grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })", "shareNodes: sn ? NODES_SN.join(',') : 'none' })"),
  ("readerRef: 'null', readerChance: 'null'", "readerChance: 'null'"),
  ("if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor))", "if (!j.nodes)"),
  ("if (!j.nodes || j.nodes.list !== (sn ? NODES_SN.join(',') : 'the uniform six'))", "if (!j.nodes)"),
  ("const NEED = ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];", "const NEED = ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook'];"),
  ("if (!j.bridge || STEPS.some(t => !j.bridge.includes(t)))", "if (!j.bridge)"),
  ("const t = j.tables[w]; if (!t ||", "const t = j.tables[w]; if (false ||"),
  ("for (const x of [...KEYS, 'WS', ...STEPS.map(t => `Y${t}`)]) {", "for (const x of [...KEYS, 'WS']) {"),
  ("if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5)", "if (false)"),
  ("const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw", "const s = j.sims[`OWN${w}`]; if (!s"),
  # the removal
  ("const mc = sc / n, R = sc !== 0 ? sd / sc : NaN;", "const mc = sc / n, R = sc !== 0 ? sd / n : NaN;"),
  ("const e = (c[i] - x[i]) - R * c[i]; v += e * e;", "const e = (c[i] - x[i]); v += e * e;"),
  ("r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'", "r.R >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'"),
  ("r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'", "r.lo >= HALF ? 'HELD' : r.R < QUARTER ? 'FALSIFIED'"),
  ("outcome: !(r.mc >= MINRES) || !Number.isFinite(r.R) ? 'INCONCLUSIVE'", "outcome: !Number.isFinite(r.R) ? 'INCONCLUSIVE'"),
  ("out['2'] = removalItem(removal(P.y.C, P.y.W60));", "out['2'] = removalItem(removal(P.y.C, P.y.SN));"),
  # the harm item
  ("const ok = ex.outcome === 'no material harm' && u.lo > -margin && w.lo > -margin,", "const ok = ex.outcome === 'no material harm' && w.lo > -margin,"),
  ("const ok = ex.outcome === 'no material harm' && u.lo > -margin && w.lo > -margin,", "const ok = ex.outcome === 'no material harm' && u.lo > -margin,"),
  ("harm = ex.outcome === 'harm' || w.hi < -margin;", "harm = ex.outcome === 'harm';"),
  ("const ph = holm(cells.map(x => mcnemarHarmP(x.b, x.c))), z = zFor(level);", "const ph = cells.map(x => mcnemarHarmP(x.b, x.c)), z = zFor(level);"),
  ("const N = x.a + x.b + x.c + x.d, margin = marginRel(100 * (x.a + x.b) / N);", "const N = x.a + x.b + x.c + x.d, margin = 0.25;"),
  ("const u = guarded(survivalChangeU(x.a, x.b, x.c, x.d, level), x.b, x.c, N, level);", "const u = survivalChangeU(x.a, x.b, x.c, x.d, level);"),
  ("return { outcome: per.some(x => x.harm) ? 'FALSIFIED' : per.every(x => x.ok) ? 'HELD' : 'INCONCLUSIVE', per };", "return { outcome: per.some(x => x.harm) ? 'FALSIFIED' : per.some(x => x.ok) ? 'HELD' : 'INCONCLUSIVE', per };"),
  # the drop
  ("return { gapC, gapSN, d: (tabC - tabSN) + u.d, lo: (tabC - tabSN) + u.lo, hi: (tabC - tabSN) + u.hi };", "return { gapC, gapSN, d: (tabC - tabSN), lo: (tabC - tabSN), hi: (tabC - tabSN) };"),
  ("dr.lo >= HALF * dr.gapC ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED'", "dr.lo >= HALF ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED'"),
  ("dr.lo >= HALF * dr.gapC ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED'", "dr.lo >= HALF * dr.gapC ? 'HELD' : dr.d < QUARTER * dr.gapC ? 'FALSIFIED'"),
  ("outcome: !(dr.gapC >= MINRES) ? 'INCONCLUSIVE'", "outcome: false ? 'INCONCLUSIVE'"),
  # the rows
  ("if (o('3') === 'FALSIFIED') return 'R2';", ""),
  ("if (o('1') === 'HELD') return 'R1';", "if (o('1') !== 'FALSIFIED') return 'R1';"),
  ("if (o('1') === 'FALSIFIED' && o('2') === 'HELD') return 'R3';", "if (o('2') === 'HELD') return 'R3';"),
  ("if (o('1') === 'FALSIFIED' && o('2') === 'FALSIFIED') return 'R4';", "if (o('2') === 'FALSIFIED') return 'R4';"),
  # the bands
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;", "export const HALF = 0.4, QUARTER = 0.25, MINRES = 1;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;", "export const HALF = 0.5, QUARTER = 0.05, MINRES = 1;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;", "export const HALF = 0.5, QUARTER = 0.25, MINRES = 0;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-steps370.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
