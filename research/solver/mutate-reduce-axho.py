#!/usr/bin/env python3
# AX-HO'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part
# of reduce-axho.mjs's gate, parse, differing-moves count or items in a scratch copy, runs the planted set on the copy and
# must see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt; the launcher refuses a
# reducer with no all-caught run as it stands, check-prediction.mjs mutationProblems).
#   python3 research/solver/mutate-reduce-axho.py > research/solver/results-reduce-axho-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (j.id !== HOUSE[arm]) bad.push(", "if (false) bad.push("),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("J1: { readerRef: 'adaptive', readerSplit: 'rs', floor: '52500' }", "J1: { readerRef: 'adaptive', floor: '52500' }"),
  ("J1: { readerRef: 'adaptive', readerSplit: 'rs', floor: '52500' }", "J1: { readerSplit: 'rs', floor: '52500' }"),
  ("J3: { readerRef: 'adaptive', readerSplit: 'rs', floor: '5000' }", "J3: { readerRef: 'adaptive', floor: '5000' }"),
  ("J2: { readerRef: 'order', readerSplit: 'null', floor: '52500' }", "J2: { readerRef: 'order', readerSplit: 'null' }"),
  ("J4: { readerRef: 'order', readerSplit: 'null', floor: '5000' }", "J4: { readerSplit: 'null', floor: '5000' }"),
  ("J1: ['armTook', 'adaptTook', 'pairTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'engTook']", "J1: ['armTook', 'adaptTook', 'pairTook', 'ownTook', 'identity', 'qfTook', 'layerTook']"),
  ("J4: ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook']", "J4: ['armTook', 'ownTook', 'qfTook', 'layerTook']"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1] ||", "if (!x || !(x[1] > 0) ||"),
  ("j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 ||", "j.adaptive.nz !== NZ ||"),
  ("if (S380F && (!j.pair || j.pair[0] !== 12 || j.pair[1] !== 14)) bad.push(", "if (S380F && (!j.pair || j.pair[0] !== 12)) bad.push("),
  ("if (!j.moves[w] || !(j.moves[w].py >= npw)) bad.push(", "if (!j.moves[w]) bad.push("),
  ("for (let w = 0; w < 3; w++) for (let b = 0; b < 4; b++) if (!j.tail.some(", "for (let w = 0; w < 3; w++) for (let b = 0; b < 3; b++) if (!j.tail.some("),
  ("if (!x || x.from !== npw || x.to !== xs - 1 || x.n !== xs - npw ||", "if (!x || x.from !== npw || x.n !== xs - npw ||"),
  ("const o = j.sims.OWNO0; if (!o || o.n !== Math.min(npw, OVERLAP)) bad.push(", "const o = j.sims.OWNO0; if (false) bad.push("),
  ("if (!j1.own || !j.own || j1.own.ai !== j.own.ai) bad.push(", "if (!j1.own || !j.own) bad.push("),
  ("if (!j1.tables[w] || !j.tables[w] || j1.tables[w].text !== j.tables[w].text) bad.push(", "if (!j1.tables[w] || !j.tables[w] || j1.tables[w].OWN !== j.tables[w].OWN) bad.push("),
  ("const d = j.sims[`D${w}`]; if (!d || d.n !== npw || d.ai !== 14) bad.push(", "const d = j.sims[`D${w}`]; if (!d || d.n !== npw) bad.push("),
  ("const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(", "const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w]) bad.push("),
  ("!Buffer.from(o, 'base64').equals(Buffer.from(a.bits.OWN0, 'base64').subarray(0, Math.min(npw, OVERLAP)))", "false"),
  ("if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }", "if (!f) { continue; }"),
  # the parse
  ("text: m.slice(4).filter(Boolean).join(' ')", "text: m.slice(4, 6).join(' ')"),
  # the differing moves
  ("if (x === NOMOVE || y === NOMOVE) continue;", "if (x === NOMOVE && y === NOMOVE) continue;"),
  ("both++; if (x !== y) { py++; d = true; }", "both++; if (x !== y) { py++; }"),
  # items
  ("out['1'] = harmItem([0, 1].map(k => ({ k, ...paired(S('J1', k), S('J2', k)) })));", "out['1'] = harmItem([0, 1].map(k => ({ k, ...paired(S('J2', k), S('J1', k)) })));"),
  ("const margin = marginRel(100 * x.bAlive / x.N);", "const margin = 0.5;"),
  ("return { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED'", "return { outcome: oc.every(x => x.outcome === 'harm') ? 'FALSIFIED'"),
  ("const c2 = [0, 1, 2].map(k =>", "const c2 = [0, 1].map(k =>"),
  ("const over2 = x => x.lo >= OUT2, under2 = x => x.hi <= -OUT2,", "const over2 = x => x.lo >= OUT2, under2 = x => false,"),
  ("export function gapOf(table, c, N, alpha = ALPHA2)", "export function gapOf(table, c, N, alpha = 0.05)"),
  ("const g3 = [0, 1].map(k => ({ k, ...meanOf(G('J1', k), Z2) }));", "const g3 = [0, 1].map(k => ({ k, ...meanOf(G('J1', k), 1) }));"),
  ("out['3'] = { outcome: g3.some(out3) ? 'FALSIFIED' : g3.every(in3) ? 'HELD'", "out['3'] = { outcome: g3.some(out3) ? 'FALSIFIED' : g3.some(in3) ? 'HELD'"),
  ("g4 = [0, 1, 2].map(k => ({ k, ...meanOf(G('J3', k), Z3) }));", "g4 = [0, 1].map(k => ({ k, ...meanOf(G('J3', k), Z3) }));"),
  ("out['4'] = { outcome: h4.outcome === 'FALSIFIED' || g4.some(out3) ? 'FALSIFIED'", "out['4'] = { outcome: h4.outcome === 'FALSIFIED' ? 'FALSIFIED'"),
  ("export const IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;", "export const IN2 = 2, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;"),
  ("export const IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;", "export const IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.5;"),
  # the pooling
  ("const w = xs.map(x => 1 / (x.se * x.se))", "const w = xs.map(x => 1 / x.se)"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-axho.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
