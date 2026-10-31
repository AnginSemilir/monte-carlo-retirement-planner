#!/usr/bin/env python3
# STEP-O182'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-o182.mjs's gate, inert check, items or rows in a scratch copy, runs the planted set on the copy and must see PLANTED
# CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-o182.py > research/solver/results-reduce-o182-mutations.txt
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
  ("...COMMON, readerSplit: SPLIT[arm], pts:", "...COMMON, pts:"),
  ("export const SPLIT = Object.freeze({ C: 'null', SN: 'null', SNR: 'ru' });", "export const SPLIT = Object.freeze({ C: 'null', SN: 'ru', SNR: 'ru' });"),
  ("grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })", "grid: `total${pts}x${sn ? NODES_SN.length : 6}x6` })"),
  ("readerBlend: 'null', readerRef: 'null', readerChance: 'null'", "readerBlend: 'null', readerChance: 'null'"),
  ("if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor))", "if (!j.nodes)"),
  ("if (!j.nodes || j.nodes.list !== (sn ? NODES_SN.join(',') : 'the uniform six'))", "if (!j.nodes)"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];"),
  ("if (!j.recount || !j.reader || j.recount.copied !== j.reader.copied || j.recount.tables !== j.reader.tables || j.recount.line !== 0.5)", "if (!j.recount)"),
  ("if (!j.bridge || YEARS.some(t => !j.bridge.includes(t)))", "if (!j.bridge)"),
  ("if (!j.split[w] || (j.bridge || []).some(", "if (false && (j.bridge || []).some("),
  ("for (const x of [...KEYS, 'WS', ...YEARS.flatMap(t => [`Y${t}`, `PC${t}`, `RS${t}`, `RC${t}`])]) {", "for (const x of [...KEYS, 'WS', ...YEARS.flatMap(t => [`Y${t}`])]) {"),
  ("const st = f.states && f.states[`S${w}`]; if (!st ||", "const st = f.states && f.states[`S${w}`]; if (false ||"),
  ("if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5)", "if (false)"),
  # inert off
  ("if (saved && INERT[arm]) { const d = inertOf(f, saved[INERT[arm]]);", "if (false) { const d = inertOf(f, saved[INERT[arm]]);"),
  ("for (const x of INERT_PER) { const a = f.per && f.per[`${x}${w}`], b = s.per && s.per[`${x}${w}`]; if (!a || !b || a !== b) bad.push(`${x}${w}`); }", ""),
  ("for (const x of [`OWN${w}`, `OWN${w}b`]) { const a = f.bits && f.bits[x], b = s.bits && s.bits[x]; if (!a || !b || a !== b) bad.push(x); }", ""),
  ("const a = f.moves && f.moves[`MV${w}`], b = s.moves && s.moves[`MV${w}`]; if (!a || !b || a !== b) bad.push(`MV${w}`);", ""),
  ("if (!s) return ['no saved STEP-S370 file to compare'];", "if (!s) return [];"),
  ("export const INERT_PER = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD', 'WS', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'];", "export const INERT_PER = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD', 'WS', 'Y1', 'Y2', 'Y3', 'Y4', 'Y6', 'Y7'];"),
  # the share and the removal
  ("const my = sy / n, S = sy !== 0 ? sx / sy : NaN;", "const my = sy / n, S = sy !== 0 ? sx / n : NaN;"),
  ("const e = x[i] - S * y[i]; v += e * e;", "const e = x[i]; v += e * e;"),
  ("export const removal = (c, x, z = zFor(0.05)) => share(c, Float64Array.from(c, (v, i) => v - x[i]), z);", "export const removal = (c, x, z = zFor(0.05)) => share(c, x, z);"),
  ("r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'", "r.R >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'"),
  ("r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'", "r.lo >= HALF ? 'HELD' : r.R < QUARTER ? 'FALSIFIED'"),
  ("outcome: !(r.mc >= MINRES) || !Number.isFinite(r.R) ? 'INCONCLUSIVE'", "outcome: !Number.isFinite(r.R) ? 'INCONCLUSIVE'"),
  ("out['1'] = ratioItem(share(P.y.SN, P.rc));", "out['1'] = ratioItem(share(P.y.SNR, P.rc));"),
  ("out['2'] = ratioItem(removal(P.y.SN, P.y.SNR));", "out['2'] = ratioItem(share(P.y.SN, P.y.SNR));"),
  # the drop
  ("return { gapC, gapX, d: (tabC - tabX) + u.d, lo: (tabC - tabX) + u.lo, hi: (tabC - tabX) + u.hi };", "return { gapC, gapX, d: (tabC - tabX), lo: (tabC - tabX), hi: (tabC - tabX) };"),
  ("dr.lo >= HALF * dr.gapC ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED'", "dr.lo >= HALF ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED'"),
  ("dr.lo >= HALF * dr.gapC ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED'", "dr.lo >= HALF * dr.gapC ? 'HELD' : dr.d < QUARTER * dr.gapC ? 'FALSIFIED'"),
  ("outcome: !(dr.gapC >= MINRES) ? 'INCONCLUSIVE'", "outcome: false ? 'INCONCLUSIVE'"),
  # the harm item
  ("const ok = ex.outcome === 'no material harm' && u.lo > -margin && w.lo > -margin,", "const ok = ex.outcome === 'no material harm' && w.lo > -margin,"),
  ("const ok = ex.outcome === 'no material harm' && u.lo > -margin && w.lo > -margin,", "const ok = ex.outcome === 'no material harm' && u.lo > -margin,"),
  ("harm = ex.outcome === 'harm' || w.hi < -margin;", "harm = ex.outcome === 'harm';"),
  ("const N = x.a + x.b + x.c + x.d, margin = marginRel(100 * (x.a + x.b) / N);", "const N = x.a + x.b + x.c + x.d, margin = 0.25;"),
  ("const u = guarded(survivalChangeU(x.a, x.b, x.c, x.d, level), x.b, x.c, N, level);\n    const w =", "const u = survivalChangeU(x.a, x.b, x.c, x.d, level);\n    const w ="),
  ("return { outcome: per.some(x => x.harm) ? 'FALSIFIED' : per.every(x => x.ok) ? 'HELD' : 'INCONCLUSIVE', per };", "return { outcome: per.some(x => x.harm) ? 'FALSIFIED' : per.some(x => x.ok) ? 'HELD' : 'INCONCLUSIVE', per };"),
  # the rows
  ("if (o('4') === 'FALSIFIED') return 'R4';", ""),
  ("if (o('2') === 'HELD' && o('3') === 'HELD') return 'R1';", "if (o('2') === 'HELD') return 'R1';"),
  ("if (o('2') === 'HELD' && o('3') === 'FALSIFIED') return 'R2';", "if (o('3') === 'FALSIFIED') return 'R2';"),
  ("if (o('1') === 'FALSIFIED') return 'R3';", "if (o('1') !== 'HELD') return 'R3';"),
  # the bands
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;", "export const HALF = 0.4, QUARTER = 0.25, MINRES = 1;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;", "export const HALF = 0.5, QUARTER = 0.05, MINRES = 1;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;", "export const HALF = 0.5, QUARTER = 0.25, MINRES = 0;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-o182.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
