#!/usr/bin/env python3
# COPY-B'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-copyb.mjs's gate, reuse gate, items, rows or wiring in a scratch copy, runs the planted set on the copy and must
# see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-copyb.py > research/solver/results-reduce-copyb-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the jobs are not on one code", "if (false) bad.push(`the jobs are not on one code"),
  ("if (!j.done) bad.push(`${K}: no done line`);", "if (false) bad.push(`${K}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("['S362', 'CXW', 60], ['S370', 'CW', 120]", "['S362', 'CXW', 60], ['S370', 'CW', 60]"),
  ("...COMMON, readerSplit: 'null', readerCopy: COPY[w.arm], pts:", "...COMMON, readerSplit: 'null', pts:"),
  ("...COMMON, readerSplit: 'null', readerCopy: COPY[w.arm], pts:", "...COMMON, readerCopy: COPY[w.arm], pts:"),
  ("export const COPY = Object.freeze({ C: 'null', CX: 'extrap', CW: 'null', CXW: 'extrap' });", "export const COPY = Object.freeze({ C: 'null', CX: 'extrap', CW: 'extrap', CXW: 'extrap' });"),
  ("export const COPY = Object.freeze({ C: 'null', CX: 'extrap', CW: 'null', CXW: 'extrap' });", "export const COPY = Object.freeze({ C: 'null', CX: 'null', CW: 'null', CXW: 'extrap' });"),
  ("grid: `total${w.pts}x6x6`, shareNodes: 'none' })", "grid: `total${w.pts}x6x6` })"),
  ("readerBlend: 'null', readerRef: 'null', readerChance: 'null'", "readerBlend: 'null', readerChance: 'null'"),
  ("if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor))", "if (!j.nodes)"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];"),
  ("if (!j.recount || !j.reader || j.recount.copied !== j.reader.copied || j.recount.tables !== j.reader.tables || j.recount.line !== 0.5)", "if (!j.recount)"),
  ("if (!j.bridge || !j.bridge.length) bad.push(`${K}: no bridge years`);", ""),
  ("if (j.bridge && peers.some(x => x.bridge.join(',') !== j.bridge.join(','))) bad.push(", "if (false) bad.push("),
  ("if (!j.split[k] || (j.bridge || []).some(", "if (false && (j.bridge || []).some("),
  ("if (!j.years[k].some(Boolean)) bad.push(", "if (false) bad.push("),
  ("const st = f.states && f.states[`S${k}`]; if (!st ||", "const st = f.states && f.states[`S${k}`]; if (false ||"),
  ("if (ws && j.whole[k] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[k].mean) > 1e-5)", "if (false)"),
  ("if (f.id !== j.id || f.job !== j.label) bad.push(", "if (false) bad.push("),
  ("if ((f.bridge || []).join(',') !== (j.bridge || []).join(',')) bad.push(`${K}: its file's bridge years", "if (false) bad.push(`${K}: its file's bridge years"),
  ("for (const x of [...KEYS, 'WS', ...(f.bridge || []).flatMap(t2 => [`Y${t2}`, ...PARTS.map(p => `${p}${t2}`)])])", "for (const x of [...KEYS, 'WS'])"),
  # the reuse
  ("if (!wOk) bad.push(", "if (false) bad.push("),
  ("if (!cw.stamp || !b.stamp || cw.stamp.code !== b.stamp.code) bad.push(", "if (false) bad.push("),
  ("if (!cw.head || cw.head.seed !== SEED) bad.push(", "if (false) bad.push("),
  ("if (cw.id !== 'S370') bad.push(", "if (false) bad.push("),
  ("|| field(cw.ran || '', 'readerCopy') !== 'null') bad.push(", ") bad.push("),
  ("if ((cw.bridge || []).join(',') !== (b.bridge || []).join(',')) bad.push(", "if (false) bad.push("),
  ("if (!cw || !b) { bad.push(", "if (false) { bad.push("),
  # items 1, 3 and 6 (the removal)
  ("const read = cells.filter(x => Math.abs(mean(x.c)) >= min)", "const read = cells.filter(x => mean(x.c) >= min)"),
  ("const read = cells.filter(x => Math.abs(mean(x.c)) >= min)", "const read = cells.filter(x => Math.abs(mean(x.c)) > min)"),
  ("r.lo >= line ? 'removed' : r.hi < QUARTER ? 'kept'", "r.R >= line ? 'removed' : r.hi < QUARTER ? 'kept'"),
  ("r.lo >= line ? 'removed' : r.hi < QUARTER ? 'kept'", "r.lo >= line ? 'removed' : r.R < QUARTER ? 'kept'"),
  ("a: H[h].gb.CX[k] }))), MINRES, HALF);", "a: H[h].gb.CX[k] }))), MINRES, THREEQ);"),
  ("a: H[h].ga.CW[k] }))), MINGA, THREEQ);", "a: H[h].ga.CW[k] }))), MINGA, HALF);"),
  ("a: P.s370.ga120[k] })), MINGA, THREEQ);", "a: P.s370.ga120[k] })), MINGA, HALF);"),
  ("return { outcome: per.length ? allOf(per, 'removed', 'kept') : 'INCONCLUSIVE'", "return { outcome: per.length ? allOf(per, 'removed', 'kept') : 'HELD'"),
  ("const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD'", "const allOf = (per, yes, no) => (per.every(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD'"),
  ("const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD'", "const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.some(x => x.read === yes) ? 'HELD'"),
  ("({ h, k, c: H[h].gb.C[k], a: H[h].gb.CX[k] })", "({ h, k, c: H[h].gb.C[k], a: H[h].gb.CXW[k] })"),
  ("({ h, k, c: H[h].ga.C[k], a: H[h].ga.CW[k] })", "({ h, k, c: H[h].gb.C[k], a: H[h].gb.CW[k] })"),
  ("out['3'] = removalItem(WH.flatMap(", "out['3'] = removalItem(FACT.flatMap("),
  ("({ h: 'S370', k, c: P.s370.ga60[k], a: P.s370.ga120[k] })", "({ h: 'S370', k, c: P.s370.ga120[k], a: P.s370.ga60[k] })"),
  # item 2
  ("const interWorld = x => (x.lo >= -INTER && x.hi <= INTER ? 'additive'", "const interWorld = x => (x.d >= -INTER && x.d <= INTER ? 'additive'"),
  ("const interWorld = x => (x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting'", "const interWorld = x => (x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER ? 'interacting'"),
  ("out['2'] = { outcome: allOf(per, 'additive', 'interacting'), per };", "out['2'] = { outcome: allOf(per.filter(x => x.k === 0), 'additive', 'interacting'), per };"),
  # item 4
  ("const partRead = c => (c.lo >= -PART && c.hi <= PART ? 'in' : c.hi < -PART || c.lo > PART ? 'out' : 'unclear');", "const partRead = c => (c.lo >= -PART && c.hi <= PART ? 'in' : c.lo > PART ? 'out' : 'unclear');"),
  ("read: rb === 'out' || ra === 'out' ? 'open' : rb === 'in' && ra === 'in' ? 'closed' : 'unclear'", "read: rb === 'out' && ra === 'out' ? 'open' : rb === 'in' && ra === 'in' ? 'closed' : 'unclear'"),
  ("read: rb === 'out' || ra === 'out' ? 'open' : rb === 'in' && ra === 'in' ? 'closed' : 'unclear'", "read: rb === 'out' || ra === 'out' ? 'open' : rb === 'in' ? 'closed' : 'unclear'"),
  ("const a = FACT.includes(h) ? 'CXW' : 'CW'; return K.map(k => { const gb = meanOf(H[h].gb[a][k], z)", "const a = FACT.includes(h) ? 'CX' : 'CW'; return K.map(k => { const gb = meanOf(H[h].gb[a][k], z)"),
  # item 5
  ("export const LEGS = Object.freeze([['CX', 'C', FACT], ['CW', 'C', WH], ['CXW', 'C', FACT]]);", "export const LEGS = Object.freeze([['CX', 'C', FACT], ['CW', 'C', FACT], ['CXW', 'C', FACT]]);"),
  ("export const LEGS = Object.freeze([['CX', 'C', FACT], ['CW', 'C', WH], ['CXW', 'C', FACT]]);", "export const LEGS = Object.freeze([['CX', 'C', FACT], ['CW', 'C', WH], ['CXW', 'CX', FACT]]);"),
  ("export const LEGS = Object.freeze([['CX', 'C', FACT], ['CW', 'C', WH], ['CXW', 'C', FACT]]);", "export const LEGS = Object.freeze([['CW', 'C', WH], ['CXW', 'C', FACT]]);"),
  ("out['5'] = { outcome: all.some(x => x.outcome === 'FALSIFIED') ? 'FALSIFIED'", "out['5'] = { outcome: all.every(x => x.outcome === 'FALSIFIED') ? 'FALSIFIED'"),
  ("K.map(k => cellsOf(H[h].bits[ctl][k], H[h].bits[arm][k]))", "K.map(k => cellsOf(H[h].bits[arm][k], H[h].bits[ctl][k]))"),
  ("K.map(k => wsOf(H[h].ws[ctl][k], H[h].ws[arm][k]))", "K.map(k => wsOf(H[h].ws[arm][k], H[h].ws[ctl][k]))"),
  # the rows
  ("if (o('5') === 'FALSIFIED') return 'R5';", ""),
  ("if (o('4') === 'HELD') return 'R1';", "if (o('4') !== 'FALSIFIED') return 'R1';"),
  ("if (o('1') === 'FALSIFIED') return 'R3';", ""),
  ("if (o('3') === 'FALSIFIED') return 'R4';", ""),
  ("if (done('1') && done('3')) return 'R2';", "if (done('1')) return 'R2';"),
  ("const o = i => it[i].outcome, done = i => o(i) === 'HELD' || it[i].nothing;", "const o = i => it[i].outcome, done = i => o(i) === 'HELD';"),
  # the wiring and the bands
  ("gb: of((a, k) => perP(h, a, k, 'GB')), ga: of((a, k) => perP(h, a, k, 'GA'))", "gb: of((a, k) => perP(h, a, k, 'GB')), ga: of((a, k) => perP(h, a, k, 'GB'))"),
  ("return { house, s370: { ga60: K.map(k => s370P('60', k, 'GA')), ga120: K.map(k => s370P('120', k, 'GA')) } };", "return { house, s370: { ga60: K.map(k => s370P('120', k, 'GA')), ga120: K.map(k => s370P('60', k, 'GA')) } };"),
  ("const arms = FACT.includes(h) ? ['C', 'CX', 'CW', 'CXW'] : ['C', 'CW'], of =", "const arms = ['C', 'CX', 'CW', 'CXW'], of ="),
  ("return t === 0 ? 0 : t <= nb ? 1 : t <= nb + 5 ? 2 : 3;", "return t === 0 ? 0 : t < nb ? 1 : t <= nb + 5 ? 2 : 3;"),
  ("export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;", "export const HALF = 0.4, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;"),
  ("export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;", "export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1.5, MINGA = 0.5, PART = 0.5, INTER = 0.5;"),
  ("export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;", "export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.4, PART = 0.5, INTER = 0.5;"),
  ("export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;", "export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.6, INTER = 0.5;"),
  ("export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;", "export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 1;"),
  ("export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;", "export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.7, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-copyb.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
