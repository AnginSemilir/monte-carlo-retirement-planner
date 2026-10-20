#!/usr/bin/env python3
# TOP-CELL'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-topcell.mjs's gate, reuse, reproduction, items, rows, causes or wiring in a scratch copy, runs the planted set on the
# copy and must see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-topcell.py > research/solver/results-reduce-topcell-mutations.txt
from mutate_lib import run
M0 = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the jobs are not on one code", "if (false) bad.push(`the jobs are not on one code"),
  ("if (!j.done) bad.push(`${K}: no done line`);", "if (false) bad.push(`${K}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale || j.head.repro !== repro", "j.head.npw !== npw || j.head.scale !== scale || j.head.repro !== repro"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale || j.head.repro !== repro", "j.head.npw !== npw || j.head.seed !== seed || j.head.repro !== repro"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale || j.head.repro !== repro", "j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale"),
  ("['S370', 'PSNXU', 30], ['S370', 'PX', 30]", "['S370', 'PX', 30]"),
  ("...COMMON, readerRef: REF[w.arm], readerSplit: SPLIT[w.arm], pts:", "...COMMON, readerSplit: SPLIT[w.arm], pts:"),
  ("...COMMON, readerRef: REF[w.arm], readerSplit: SPLIT[w.arm], pts:", "...COMMON, readerRef: REF[w.arm], pts:"),
  ("grid: `total${w.pts}x${nn}x6`, shareNodes: NODED[w.arm] ? SN_LINE : 'none' })", "grid: `total${w.pts}x${nn}x6` })"),
  ("readerBlend: 'null', readerCopy: 'extrap', readerChance: 'null'", "readerBlend: 'null', readerChance: 'null'"),
  ("export const SPLIT = Object.freeze({ PX: 'rs', PX60: 'rs', PSNX: 'rsu',", "export const SPLIT = Object.freeze({ PX: 'rs', PX60: 'rs', PSNX: 'rs',"),
  ("PSNX60: 'rsu', PSNXU: 'ru', CX:", "PSNX60: 'rsu', PSNXU: 'rsu', CX:"),
  ("export const NODED = Object.freeze({ PX: false, PX60: false, PSNX: true,", "export const NODED = Object.freeze({ PX: true, PX60: false, PSNX: true,"),
  ("const PKGA = ['PX', 'PSNX', 'PSNXU', 'PX60', 'PSNX60'];", "const PKGA = ['PX', 'PSNX', 'PSNXU', 'PX60', 'PSNX60', 'CX'];"),
  ("!A.fix || A.stepAll !== STEPS[w.arm] || ", "!A.fix || "),
  ("A.ref !== 'adaptive' || !A.fix || ", "A.ref !== 'adaptive' || "),
  ("!(A.moves > 0) || A.nonMono !== 0 || A.lattice", "A.nonMono !== 0 || A.lattice"),
  ("!(A.moves > 0) || A.nonMono !== 0 || A.lattice", "!(A.moves > 0) || A.lattice"),
  ("if (!ad && (!A || A.ref !== 'null' || A.fix || A.stepAll || A.lattice !== 'none')) bad.push(", "if (false) bad.push("),
  ("for (const c of [...NEED, ...(STEPS[w.arm] ? ['stepTook'] : [])])", "for (const c of NEED)"),
  ("if (!STEPS[w.arm] && j.checks.stepTook) bad.push(", "if (false) bad.push("),
  ("if (STEPS[w.arm] && !j.steps.length) bad.push(", "if (false) bad.push("),
  ("if (ad && !j.pr31.length) bad.push(", "if (false) bad.push("),
  ("if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor))", "if (!j.nodes)"),
  ("if (!j.nodes || j.nodes.list !== (NODED[w.arm] ? SN_LINE : 'the uniform six')) bad.push(", "if (false) bad.push("),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];"),
  ("export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC', 'RH']);", "export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC']);"),
  ("if (js[0].bridge && peers.some(x => x.bridge.join(',') !== js[0].bridge.join(','))) bad.push(", "if (false) bad.push("),
  # the reuse
  ("if (!bOk) bad.push('COPY-B\\'s gate did not pass over its own files');", "if (false) bad.push('COPY-B\\'s gate did not pass over its own files');"),
  ("if (!reproOk) bad.push(", "if (false) bad.push("),
  ("if (!peer || !peer.stamp || reproCode !== peer.stamp.code) bad.push(", "if (false) bad.push("),
  ("if (!j.head || j.head.seed !== SEED) bad.push(`the reused", "if (false) bad.push(`the reused"),
  ("if (field(ran, 'readerSplit') !== 'null' || field(ran, 'shareNodes') !== 'none' || ", "if ("),
  ("for (const f of Object.keys(COMMON)) if (field(ran, f) !== COMMON[f]) bad.push(`the reused", "for (const f of Object.keys(COMMON)) if (false) bad.push(`the reused"),
  ("if (!peer || (j.bridge || []).join(',') !== (peer.bridge || []).join(',')) bad.push(`the reused", "if (false) bad.push(`the reused"),
  ("if (!j) { bad.push(`the reused ${h} ${a} not found`); continue; }", "if (!j) continue;"),
  # the reproduction
  ("for (const s of ['COPY-X', 'COPY-W', 'COPY-B']) if (!ok[s]) bad.push(", "for (const s of ['COPY-X', 'COPY-B']) if (!ok[s]) bad.push("),
  ("if (!c.job.stamp || c.job.stamp.code !== code) bad.push(", "if (false) bad.push("),
  ("if (!c.file[g] || c.file[g][x] !== v) bad.push(", "if (!c.file[g]) bad.push("),
  ("const groups = { per: c.oldFile.per || {}, bits: c.oldFile.bits || {}, moves: c.oldFile.moves || {}, states: c.oldFile.states || {} };", "const groups = { per: c.oldFile.per || {}, bits: c.oldFile.bits || {}, moves: c.oldFile.moves || {} };"),
  ("const groups = { per: c.oldFile.per || {}, bits: c.oldFile.bits || {}, moves: c.oldFile.moves || {}, states: c.oldFile.states || {} };", "const groups = { per: c.oldFile.per || {}, bits: c.oldFile.bits || {}, states: c.oldFile.states || {} };"),
  ("if (!(x in o) && !(g === 'per' && /^RH\\d+$/.test(x))) bad.push(", "if (false) bad.push("),
  ("if (!Object.keys(ta).length || Object.keys(ta).length !== Object.keys(tb).length || Object.entries(ta).some(([x, v]) => tb[x] !== v)) bad.push(", "if (false) bad.push("),
  ("c.old.tables[k].OWN !== c.job.tables[k].OWN || ", ""),
  ("if (c.src !== src) bad.push(", "if (false) bad.push("),
  ("if (!c.old.head || c.old.head.seed !== SEED || !c.job.head || c.old.head.npw !== c.job.head.npw) bad.push(", "if (false) bad.push("),
  ("if ((c.oldFile.bridge || []).join(',') !== (c.file.bridge || []).join(',')) bad.push(", "if (false) bad.push("),
  ("if (!c || !c.old || !c.oldFile || !c.job || !c.file) { bad.push(", "if (!c || !c.old || !c.job || !c.file) { bad.push("),
  ("['S130', 'CX', 30, 'COPY-B'], ['S130', 'CXW', 60, 'COPY-B']]);", "['S130', 'CX', 30, 'COPY-B']]);"),
  # item 1
  ("const read = P.sup.filter(x => Math.abs(mean(x.c)) >= MINSUP)", "const read = P.sup.filter(x => Math.abs(mean(x.c)) >= 0)"),
  ("r.lo >= KEEP && rem.lo >= -REM && rem.hi <= REM ? 'held'", "r.R >= KEEP && rem.lo >= -REM && rem.hi <= REM ? 'held'"),
  ("r.lo >= KEEP && rem.lo >= -REM && rem.hi <= REM ? 'held'", "r.lo >= KEEP ? 'held'"),
  ("r.hi < HALF || rem.lo > OUT || rem.hi < -OUT ? 'falsified'", "r.hi < HALF ? 'falsified'"),
  ("r.hi < HALF || rem.lo > OUT || rem.hi < -OUT ? 'falsified'", "r.hi < HALF || rem.lo > OUT ? 'falsified'"),
  ("export const KEEP = 0.75, HALF = 0.5,", "export const KEEP = 0.7, HALF = 0.5,"),
  ("z = zFor(0.05 / Math.max(1, 2 * read.length));\n    const per = read.map(x => ({ k: x.k, pts: x.pts, ...supCell", "z = zFor(0.05);\n    const per = read.map(x => ({ k: x.k, pts: x.pts, ...supCell"),
  # item 2
  ("read: r.hi < STILL ? 'still' : r.lo >= MOVED ? 'moved' : 'unclear'", "read: r.d < STILL ? 'still' : r.lo >= MOVED ? 'moved' : 'unclear'"),
  ("read: r.hi < STILL ? 'still' : r.lo >= MOVED ? 'moved' : 'unclear'", "read: r.hi < STILL ? 'still' : r.lo > MOVED ? 'moved' : 'unclear'"),
  ("sa = ma.lo > 0 ? [1] : ma.hi < 0 ? [-1] : [1, -1]", "sa = ma.d > 0 ? [1] : [-1]"),
  ("const d = meanOf(Float64Array.from(a, (v, i) => y * b[i] - x * v), z);", "const d = meanOf(Float64Array.from(a, (v, i) => b[i] - v), z);"),
  ("nm: K.flatMap(k => [...OTHERY.map(t =>", "nm: [0, 1].flatMap(k => [...OTHERY.map(t =>"),
  ("export const STEPY = Object.freeze([3, 7]), OTHERY = Object.freeze([1, 2, 4, 5, 6]);", "export const STEPY = Object.freeze([3, 7]), OTHERY = Object.freeze([2, 4, 5, 6]);"),
  # item 3
  ("const label = within(lv60, LEVEL) && within(dS, NEAR) ? 'W'", "const label = within(lv60, LEVEL) ? 'W'"),
  (": within(lvS, LEVEL) && within(d60, NEAR) ? 'TOPC'", ": within(lvS, LEVEL) ? 'TOPC'"),
  (": past(d60, LEVER) && past(dS, LEVER) ? 'BOTH'", ": past(d60, LEVER) ? 'BOTH'"),
  (": within(dB, NEAR) ? 'NEITHER' : 'unclear';", ": 'NEITHER';"),
  ("past = (c, b) => c.lo >= b || c.hi <= -b;", "past = (c, b) => c.d >= b || c.d <= -b;"),
  # item 4
  ("read = cand.filter(x => P.top[x.h] >= TOPMIN)", "read = cand"),
  ("const cand = P.br.filter(x => Math.abs(mean(x.c)) >= MINRES)", "const cand = P.br"),
  # item 5
  ("out['5'] = { outcome: legs.some(l => l.hw.outcome === 'FALSIFIED') ? 'FALSIFIED'", "out['5'] = { outcome: legs.some(l => l.hw.outcome === 'FALSIFIED' && !l.maint) ? 'FALSIFIED'"),
  ("maint: hw.outcome === 'FALSIFIED' && mx.d > 0 };", "maint: hw.outcome === 'FALSIFIED' };"),
  ("legs.every(l => l.hw.outcome === 'HELD') ? 'HELD' : 'INCONCLUSIVE'", "legs.some(l => l.hw.outcome === 'HELD') ? 'HELD' : 'INCONCLUSIVE'"),
  # the rows
  ("if (o('5') === 'FALSIFIED') return 'RH';\n  if (o('2') === 'FALSIFIED') return 'RM';", "if (o('2') === 'FALSIFIED') return 'RM';\n  if (o('5') === 'FALSIFIED') return 'RH';"),
  ("if (o('2') === 'FALSIFIED') return 'RM';\n  if (o('1') === 'FALSIFIED') return 'RN';", "if (o('1') === 'FALSIFIED') return 'RN';\n  if (o('2') === 'FALSIFIED') return 'RM';"),
  ("if (o('1') === 'HELD' && o('2') === 'HELD') return 'RS';", "if (o('1') === 'HELD') return 'RS';"),
  ("if (o('4') === 'FALSIFIED') return 'RB';", ""),
  # the causes
  ("plan = y.every(x => x.d.lo >= -Y1P && x.d.hi <= Y1P)", "plan = y.some(x => x.d.lo >= -Y1P && x.d.hi <= Y1P)"),
  ("rise = y.every(x => x.d.lo >= Y1R)", "rise = y.some(x => x.d.lo >= Y1R)"),
  ("Math.sign(x.sup) !== Math.sign(x.cop) && Math.abs(x.sup) >= Y1R && Math.abs(x.cop) >= Y1R", "Math.abs(x.sup) >= Y1R && Math.abs(x.cop) >= Y1R"),
  ("sn = y.every(x => x.topShare >= HALF)", "sn = y.every(x => x.topShare >= 0)"),
  ("tcp = un && !sn ? 'TCP-UNMASK' : sn && !un ? 'TCP-SNREAD'", "tcp = un ? 'TCP-UNMASK' : sn ? 'TCP-SNREAD'"),
  ("if (x.topA[i] || x.topB[i]) top += v;", "if (x.topA[i]) top += v;"),
  ("const tc = it['1'].outcome === 'HELD' ? 'TC-SUPPORT'", "const tc = it['1'].outcome !== 'FALSIFIED' ? 'TC-SUPPORT'"),
  # the wiring
  ("sup: [{ k: 0, pts: 30, c: sy('S370', 'PX', 0, STEPY), x: sy('S370', 'PSNX', 0, STEPY) }", "sup: [{ k: 0, pts: 30, c: sy('S370', 'PX', 0, STEPY), x: sy('S370', 'PSNXU', 0, STEPY) }"),
  ("{ k: 1, pts: 60, c: sy('S370', 'PX60', 1, STEPY), x: sy('S370', 'PSNX60', 1, STEPY) }]", "{ k: 1, pts: 60, c: sy('S370', 'PX60', 0, STEPY), x: sy('S370', 'PSNX60', 1, STEPY) }]"),
  ("o192: Object.fromEntries(['PX', 'PSNX', 'PX60', 'PSNX60'].map(a => [a, sy('S370', a, 1, [1, 2])]))", "o192: Object.fromEntries(['PX', 'PSNX', 'PX60', 'PSNX60'].map(a => [a, sy('S370', a, 1, [1])]))"),
  ("[[30, 'CX', 'SNRX'], [60, 'CXW', 'SNRXW']]", "[[30, 'CX', 'SNRX'], [60, 'CX', 'SNRXW']]"),
  ("top: { S130: topF('S130', 'CX'), S128: topF('S128', 'CX') }", "top: { S130: topF('S130', 'CX'), S128: topF('S130', 'CX') }"),
  ("const topV = (h, a, k) => Float64Array.from(stF(h, a, k, 1), v => (v >= TOP ? 1 : 0));", "const topV = (h, a, k) => Float64Array.from(stF(h, 'PX', k, 1), v => (v >= TOP ? 1 : 0));"),
  ("const o = (i * nb + bi) * D, p = st[o], W = st[o] + st[o + 1] + st[o + 2];", "const o = (i * nb + bi) * D, p = st[o + 1], W = st[o] + st[o + 1] + st[o + 2];"),
  ("if (!Number.isFinite(v)) continue; n++; if (v >= TOP) top++;", "n++; if (v >= TOP) top++;"),
  # the pin
  ("['S370', 'PSNX60', 60], ['S370', 'PX60', 60]", "['S370', 'PX60', 60], ['S370', 'PSNX60', 60]"),
]
# each mutation named by its place: the part of the reducer it breaks (the comment above it) and the text it changes
M = [(f"{i:02d} {old[:70]}", old, new) for i, (old, new) in enumerate(M0)]
run('reduce-topcell.mjs', M)
