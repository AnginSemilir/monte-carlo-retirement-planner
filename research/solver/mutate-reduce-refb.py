#!/usr/bin/env python3
# REF-B'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-refb.mjs's gate, reuse gate, items, rows or wiring in a scratch copy, runs the planted set on the copy and must
# see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-refb.py > research/solver/results-reduce-refb-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the jobs are not on one code", "if (false) bad.push(`the jobs are not on one code"),
  ("if (!j.done) bad.push(`${K}: no done line`);", "if (false) bad.push(`${K}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.npw !== npw"),
  ("['S370', 'AN', 30], ['S362', 'AR', 30]", "['S362', 'AR', 30]"),
  ("...COMMON, readerSplit: SPLIT[w.arm], readerCopy: COPY[w.arm], pts:", "...COMMON, readerCopy: COPY[w.arm], pts:"),
  ("...COMMON, readerSplit: SPLIT[w.arm], readerCopy: COPY[w.arm], pts:", "...COMMON, readerSplit: SPLIT[w.arm], pts:"),
  ("export const SPLIT = Object.freeze({ AR: 'rs', ARX: 'rs', AN: 'null' });", "export const SPLIT = Object.freeze({ AR: 'rs', ARX: 'rs', AN: 'rs' });"),
  ("export const SPLIT = Object.freeze({ AR: 'rs', ARX: 'rs', AN: 'null' });", "export const SPLIT = Object.freeze({ AR: 'null', ARX: 'rs', AN: 'null' });"),
  ("export const COPY = Object.freeze({ AR: 'null', ARX: 'extrap', AN: 'null' });", "export const COPY = Object.freeze({ AR: 'null', ARX: 'null', AN: 'null' });"),
  ("export const COPY = Object.freeze({ AR: 'null', ARX: 'extrap', AN: 'null' });", "export const COPY = Object.freeze({ AR: 'extrap', ARX: 'extrap', AN: 'null' });"),
  ("readerBlend: 'null', readerRef: 'adaptive', readerChance: 'null'", "readerBlend: 'null', readerChance: 'null'"),
  ("!j.adaptive.fix || ", ""),
  ("!(j.adaptive.moves > 0) || ", ""),
  ("j.adaptive.nonMono !== 0 || ", ""),
  ("if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor))", "if (!j.nodes)"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];"),
  ("const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];", "const NEED = ['copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];"),
  ("if (j.bridge && peers.some(x => x.bridge.join(',') !== j.bridge.join(','))) bad.push(", "if (false) bad.push("),
  ("if (!j.split[k] || (j.bridge || []).some(", "if (false && (j.bridge || []).some("),
  # the reuse
  ("if (!bOk) bad.push(", "if (false) bad.push("),
  ("if (!xOk) bad.push(", "if (false) bad.push("),
  ("if (!j.stamp || j.stamp.code !== code) bad.push(", "if (false) bad.push("),
  ("if (!j.head || j.head.seed !== SEED) bad.push(", "if (false) bad.push("),
  ("const v = f === 'readerRef' ? 'null' : COMMON[f];", "const v = f === 'readerRef' ? field(j.ran || '', f) : COMMON[f];"),
  ("field(j.ran || '', 'readerCopy') !== (a === 'CX' ? 'extrap' : 'null') || ", ""),
  ("if (!peer || (j.bridge || []).join(',') !== peer.bridge.join(',')) bad.push(", "if (!peer) bad.push("),
  ("if (!j) { bad.push(`the reused ${h} ${a} not found`); continue; }", "if (!j) continue;"),
  # item 1
  ("const read = K.filter(k => Math.abs(mean(P.S362.y12.C[k])) >= MINRES), zr", "const read = K.filter(k => mean(P.S362.y12.C[k]) >= MINRES), zr"),
  ("const per = read.map(k => { const r = removal(P.S362.y12.C[k], P.S362.y12.AN[k], zr), tails", "const per = read.map(k => { const r = removal(P.S362.gb.C[k], P.S362.gb.AN[k], zr), tails"),
  ("const per = read.map(k => { const r = removal(P.S362.gb.C[k], P.S362.gb.AN[k], zr), tin", "const per = read.map(k => { const r = removal(P.S362.y12.C[k], P.S362.y12.AN[k], zr), tin"),
  ("tails, read: r.lo >= THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });", "tails, read: r.lo >= THREEQ ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });"),
  ("tails, read: r.lo >= THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });", "tails, read: r.lo > THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });"),
  ("tails, read: r.lo >= THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });", "tails, read: r.R >= THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });"),
  ("tails, read: r.lo >= THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });", "tails, read: r.lo >= THREEQ && tin ? 'removed' : r.R < QUARTER ? 'kept' : 'unclear' }; });"),
  ("tin = tails.every(c => c.lo >= -TAIL && c.hi <= TAIL)", "tin = tails.every(c => c.d >= -TAIL && c.d <= TAIL)"),
  ("tin = tails.every(c => c.lo >= -TAIL && c.hi <= TAIL)", "tin = tails.slice(0, 1).every(c => c.lo >= -TAIL && c.hi <= TAIL)"),
  ("out['1'] = { outcome: per.length ? allOf(per, 'removed', 'kept') : 'INCONCLUSIVE', per, nothing: !per.length }; }", "out['1'] = { outcome: per.length ? allOf(per, 'removed', 'kept') : 'HELD', per, nothing: !per.length }; }"),
  ("const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD'", "const allOf = (per, yes, no) => (per.every(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD'"),
  ("const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD'", "const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.some(x => x.read === yes) ? 'HELD'"),
  # item 2
  ("const read = K.filter(k => Math.abs(mean(P.S370.y12.C[k])) >= MINRES), z", "const read = K.filter(k => mean(P.S370.y12.C[k]) >= MINRES), z"),
  ("return { k, r, read: r.lo >= THREEQ ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });", "return { k, r, read: r.lo >= HALF_ ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });".replace('HALF_', '0.5')),
  ("const r = removal(P.S370.y12.C[k], P.S370.y12.AN[k], z);", "const r = removal(P.S370.y12.AN[k], P.S370.y12.C[k], z);"),
  # item 3
  ("x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting' : 'unclear' }; }));", "x.d >= -INTER && x.d <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting' : 'unclear' }; }));"),
  ("x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting' : 'unclear' }; }));", "x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER ? 'interacting' : 'unclear' }; }));"),
  ("CW: I.tab.AR[k], CXW: I.tab.ARX[k] }", "CW: I.tab.ARX[k], CXW: I.tab.AR[k] }"),
  ("per = ['S362', 'S370'].flatMap(h =>", "per = ['S362'].flatMap(h =>"),
  # item 4
  ("read: c.lo >= -STILL && c.hi <= STILL ? 'still' : c.hi < -STILL || c.lo > STILL ? 'moved' : 'unclear' }; });", "read: c.lo >= -STILL && c.hi <= STILL ? 'still' : c.hi < -STILL ? 'moved' : 'unclear' }; });"),
  ("read: c.lo >= -STILL && c.hi <= STILL ? 'still' : c.hi < -STILL || c.lo > STILL ? 'moved' : 'unclear' }; });", "read: c.d >= -STILL && c.d <= STILL ? 'still' : c.hi < -STILL || c.lo > STILL ? 'moved' : 'unclear' }; });"),
  # item 5
  ("export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S370', 'S130']], ['ARX', 'C', ['S362', 'S370']], ['AN', 'C', ['S362', 'S370']]]);", "export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S370', 'S130']], ['ARX', 'C', ['S362', 'S370']]]);"),
  ("export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S370', 'S130']], ['ARX', 'C', ['S362', 'S370']], ['AN', 'C', ['S362', 'S370']]]);", "export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S130']], ['ARX', 'C', ['S362', 'S370']], ['AN', 'C', ['S362', 'S370']]]);"),
  ("export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S370', 'S130']], ['ARX', 'C', ['S362', 'S370']], ['AN', 'C', ['S362', 'S370']]]);", "export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S370', 'S130']], ['ARX', 'C', ['S362', 'S370']], ['AN', 'AR', ['S362', 'S370']]]);"),
  ("out['5'] = { outcome: all.some(x => x.outcome === 'FALSIFIED') ? 'FALSIFIED'", "out['5'] = { outcome: all.every(x => x.outcome === 'FALSIFIED') ? 'FALSIFIED'"),
  ("{ cells: K.map(k => cellsOf(bitsF(h, ctl, k), bitsF(h, arm, k)))", "{ cells: K.map(k => cellsOf(bitsF(h, arm, k), bitsF(h, ctl, k)))"),
  # the rows
  ("if (o('5') === 'FALSIFIED') return 'R5';", ""),
  ("if (o('4') === 'FALSIFIED') return 'R3';", ""),
  ("if (o('1') === 'HELD') return 'R1';", "if (o('1') !== 'FALSIFIED') return 'R1';"),
  ("if (o('1') === 'FALSIFIED') return 'R2';", "if (o('2') === 'FALSIFIED') return 'R2';"),
  # the wiring
  ("tails: { AN: K.map(k => [1, 2, 3].map(t => tailOf(ys('S362', 'AN', k), perP('S362', 'AN', k, 'GA'), bridge.S362, t))) }", "tails: { AN: K.map(k => [1, 2, 3].map(t => tailOf(ys('S362', 'AN', k), perP('S362', 'AN', k, 'GB'), bridge.S362, t))) }"),
  ("tails: { AN: K.map(k => [1, 2, 3].map(t => tailOf(ys('S362', 'AN', k), perP('S362', 'AN', k, 'GA'), bridge.S362, t))) }", "tails: { AN: K.map(k => [1, 2, 3].map(t => tailOf(ys('S362', 'C', k), perP('S362', 'AN', k, 'GA'), bridge.S362, t))) }"),
  ("let s = g; for (const u of bridge) if (u >= t) s += y[u][i];", "let s = g; for (const u of bridge) if (u > t) s += y[u][i];"),
  ("let s = g; for (const u of bridge) if (u >= t) s += y[u][i];", "let s = 0; for (const u of bridge) if (u >= t) s += y[u][i];"),
  ("return Float64Array.from(y[1], (v, i) => v + y[2][i]); };", "return Float64Array.from(y[1], (v, i) => v + y[3][i]); };"),
  ("gb: { C: K.map(k => perP('S362', 'C', k, 'GB')), AN: K.map(k => perP('S362', 'AN', k, 'GB')) }", "gb: { C: K.map(k => perP('S362', 'C', k, 'GB')), AN: K.map(k => perP('S362', 'AR', k, 'GB')) }"),
  ("y12: { C: K.map(k => y12('S362', 'C', k)), AN: K.map(k => y12('S362', 'AN', k)) }", "y12: { C: K.map(k => y12('S362', 'C', k)), AN: K.map(k => y12('S362', 'AR', k)) }"),
  ("s130: { gb: { C: K.map(k => perP('S130', 'C', k, 'GB')), AR: K.map(k => perP('S130', 'AR', k, 'GB')) } }", "s130: { gb: { C: K.map(k => perP('S130', 'C', k, 'GB')), AR: K.map(k => perP('S130', 'AR', k, 'GA')) } }"),
  ("return t === 0 ? 0 : t <= nb ? 1 : t <= nb + 5 ? 2 : 3;", "return t === 0 ? 0 : t < nb ? 1 : t <= nb + 5 ? 2 : 3;"),
  # the lines
  ("export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;", "export const QUARTER = 0.25, THREEQ = 0.7, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;"),
  ("export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;", "export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1.5, TAIL = 1, STILL = 0.25, INTER = 0.5;"),
  ("export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;", "export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1.5, STILL = 0.25, INTER = 0.5;"),
  ("export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;", "export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.5, INTER = 0.5;"),
  ("export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;", "export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 1;"),
  ("export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;", "export const QUARTER = 0.4, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;"),
  ("export const LATTICE_LINE = '160x41 nz 128';", "export const LATTICE_LINE = '160x41 nz 64';"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-refb.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
