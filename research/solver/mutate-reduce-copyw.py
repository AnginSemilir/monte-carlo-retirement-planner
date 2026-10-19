#!/usr/bin/env python3
# COPY-W'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-copyw.mjs's gate, inert check, reuse gate, items or rows in a scratch copy, runs the planted set on the copy and must
# see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-copyw.py > research/solver/results-reduce-copyw-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (j.id !== HOUSE) bad.push(`${arm}: run on", "if (false) bad.push(`${arm}: run on"),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("...COMMON, readerSplit: SPLIT[arm], readerCopy: COPY[arm], pts:", "...COMMON, readerSplit: SPLIT[arm], pts:"),
  ("...COMMON, readerSplit: SPLIT[arm], readerCopy: COPY[arm], pts:", "...COMMON, readerCopy: COPY[arm], pts:"),
  ("export const COPY = Object.freeze({ CW: 'null', CXW: 'extrap' });", "export const COPY = Object.freeze({ CW: 'null', CXW: 'null' });"),
  ("export const COPY = Object.freeze({ CW: 'null', CXW: 'extrap' });", "export const COPY = Object.freeze({ CW: 'extrap', CXW: 'extrap' });"),
  ("grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })", "grid: `total${pts}x${sn ? NODES_SN.length : 6}x6` })"),
  ("readerBlend: 'null', readerRef: 'null', readerChance: 'null'", "readerBlend: 'null', readerChance: 'null'"),
  ("if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor))", "if (!j.nodes)"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];"),
  ("if (!j.recount || !j.reader || j.recount.copied !== j.reader.copied || j.recount.tables !== j.reader.tables || j.recount.line !== 0.5)", "if (!j.recount)"),
  ("if (!j.bridge || YEARS.some(t => !j.bridge.includes(t)))", "if (!j.bridge)"),
  ("if (!j.split[w] || (j.bridge || []).some(", "if (false && (j.bridge || []).some("),
  ("const st = f.states && f.states[`S${w}`]; if (!st ||", "const st = f.states && f.states[`S${w}`]; if (false ||"),
  ("if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5)", "if (false)"),
  # the inert check against STEP-S370's W60
  ("if (saved && INERT[arm]) { const d = inertOf(f, saved[INERT[arm]]);", "if (false) { const d = inertOf(f, saved[INERT[arm]]);"),
  ("for (const x of INERT_PER) { const a = f.per && f.per[`${x}${w}`], b = s.per && s.per[`${x}${w}`]; if (!a || !b || a !== b) bad.push(`${x}${w}`); }", ""),
  ("for (const x of [`OWN${w}`, `OWN${w}b`]) { const a = f.bits && f.bits[x], b = s.bits && s.bits[x]; if (!a || !b || a !== b) bad.push(x); }", ""),
  ("const a = f.moves && f.moves[`MV${w}`], b = s.moves && s.moves[`MV${w}`]; if (!a || !b || a !== b) bad.push(`MV${w}`);", ""),
  ("if (!s) return ['no saved STEP-S370 file to compare'];", "if (!s) return [];"),
  # the reuse
  ("if (!xOk) bad.push(", "if (false) bad.push("),
  ("if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(", "if (false) bad.push("),
  ("if (!j.head || j.head.seed !== SEED) bad.push(`${j.label}: not on seed ${SEED}`);", ""),
  ("if (xs.some(j => !j)) { bad.push(", "if (xs.some(j => !j) && false) { bad.push("),
  ("    if (j.id !== HOUSE) bad.push(`${j.label}: on ${j.id}, not ${HOUSE}`);\n", "\n"),
  ("for (const f of Object.keys(COMMON)) if (field(j.ran || '', f) !== COMMON[f]) bad.push(", "for (const f of []) if (field(j.ran || '', f) !== COMMON[f]) bad.push("),
  # item 1
  ("const nothing = !(Math.abs(r.mc) >= MINRES);", "const nothing = !(r.mc >= MINRES);"),
  ("r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'", "r.R >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'"),
  ("r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED'", "r.lo >= HALF ? 'HELD' : r.R < QUARTER ? 'FALSIFIED'"),
  ("out['1'] = ratioItem(share(P.y456.CX, Float64Array.from(P.y456.CX, (v, i) => v - P.y456.CXW[i])));", "out['1'] = ratioItem(share(P.y456.CX, Float64Array.from(P.y456.CX, (v, i) => v + P.y456.CXW[i])));"),
  ("const y456 = a => { const y4 = perP(a, 1, 'Y4'), y5 = perP(a, 1, 'Y5'), y6 = perP(a, 1, 'Y6');", "const y456 = a => { const y4 = perP(a, 0, 'Y4'), y5 = perP(a, 1, 'Y5'), y6 = perP(a, 1, 'Y6');"),
  ("return Float64Array.from(y4, (v, i) => v + y5[i] + y6[i]); };", "return Float64Array.from(y4, (v, i) => v + y5[i]); };"),
  # items 2 and 3
  ("outcome: c.lo >= -CLOSE && c.hi <= CLOSE ? 'HELD' : c.hi < -CLOSE || c.lo > CLOSE ? 'FALSIFIED'", "outcome: c.d >= -CLOSE && c.d <= CLOSE ? 'HELD' : c.hi < -CLOSE || c.lo > CLOSE ? 'FALSIFIED'"),
  ("outcome: c.lo >= -CLOSE && c.hi <= CLOSE ? 'HELD' : c.hi < -CLOSE || c.lo > CLOSE ? 'FALSIFIED'", "outcome: c.lo >= -CLOSE && c.hi <= CLOSE ? 'HELD' : c.hi < -CLOSE ? 'FALSIFIED'"),
  ("out['2'] = closeItem(meanOf(P.g.CXW[1])); out['3'] = closeItem(meanOf(P.g.CXW[0]));", "out['2'] = closeItem(meanOf(P.g.CXW[0])); out['3'] = closeItem(meanOf(P.g.CXW[0]));"),
  ("const se = Math.sqrt(v / Math.max(1, n - 1) / n); return { d: m, lo: m - z * se, hi: m + z * se }; }", "const se = 0; return { d: m, lo: m - z * se, hi: m + z * se }; }"),
  ("return Float64Array.from(gb, (v, i) => v + ga[i]); });", "return gb; });"),
  # item 4
  ("v[i] = b.CXW[i] - b.CW[i] - b.CX[i] + b.C[i];", "v[i] = b.CXW[i] - b.CW[i];"),
  ("const se = 100 * Math.sqrt(q / Math.max(1, n - 1) / n), tab = T.CXW - T.CW - T.CX + T.C, d = tab - 100 * m;", "const se = 100 * Math.sqrt(q / Math.max(1, n - 1) / n), tab = T.CXW - T.CW - T.CX + T.C, d = tab;"),
  ("const interWorld = x => (x.lo >= -INTER && x.hi <= INTER ? 'additive'", "const interWorld = x => (x.d >= -INTER && x.d <= INTER ? 'additive'"),
  ("out['4'] = { outcome: per.some(x => x.read === 'interacting') ? 'FALSIFIED'", "out['4'] = { outcome: per.every(x => x.read === 'interacting') ? 'FALSIFIED'"),
  # item 5
  ("cells: { CW: K.map(k => cellsOf(bitsF('C', k), bitsF('CW', k))), CXW: K.map(k => cellsOf(bitsF('CX', k), bitsF('CXW', k))) }", "cells: { CW: K.map(k => cellsOf(bitsF('C', k), bitsF('CW', k))), CXW: K.map(k => cellsOf(bitsF('C', k), bitsF('CXW', k))) }"),
  ("ws: { CW: K.map(k => wsOf(wsF('C', k), wsF('CW', k))), CXW: K.map(k => wsOf(wsF('CX', k), wsF('CXW', k))) }", "ws: { CW: K.map(k => wsOf(wsF('C', k), wsF('CW', k))), CXW: K.map(k => wsOf(wsF('C', k), wsF('CXW', k))) }"),
  ("out['5'] = { outcome: hx.outcome, hw, hx };", "out['5'] = { outcome: hw.outcome, hw, hx };"),
  ("out['5'] = { outcome: hx.outcome, hw, hx };", "out['5'] = { outcome: hx.outcome === 'FALSIFIED' ? 'FALSIFIED' : 'HELD', hw, hx };"),
  # the rows
  ("if (o('5') === 'FALSIFIED') return 'R5';", ""),
  ("if (o('2') === 'HELD' && o('3') === 'HELD') return 'R1';", "if (o('2') === 'HELD') return 'R1';"),
  ("if (o('1') === 'HELD') return 'R2';", "if (o('1') !== 'FALSIFIED') return 'R2';"),
  ("if (o('1') === 'HELD' && (o('2') === 'FALSIFIED' || it['1'].r.lo > OVER)) return 'R4';", ""),
  ("if (o('1') === 'HELD' && (o('2') === 'FALSIFIED' || it['1'].r.lo > OVER)) return 'R4';", "if (o('1') === 'HELD' && o('2') === 'FALSIFIED') return 'R4';"),
  ("if (o('1') === 'HELD' && (o('2') === 'FALSIFIED' || it['1'].r.lo > OVER)) return 'R4';", "if (o('1') === 'HELD' && (o('2') !== 'HELD' || it['1'].r.lo > OVER)) return 'R4';"),
  ("if (o('1') === 'FALSIFIED') return 'R3';", ""),
  # the bands
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 0.5, OVER = 1.5;", "export const HALF = 0.4, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 0.5;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 0.5, OVER = 1.5;", "export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1.5, INTER = 0.5;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 0.5, OVER = 1.5;", "export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 1;"),
  ("export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 0.5, OVER = 1.5;", "export const HALF = 0.5, QUARTER = 0.25, MINRES = 0, CLOSE = 1, INTER = 0.5;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-copyw.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
