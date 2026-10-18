#!/usr/bin/env python3
# FOOT-S366'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one
# part of reduce-foot.mjs's gate, inert check or items in a scratch copy, runs the planted set on the copy and must see
# PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-foot.py > research/solver/results-reduce-foot-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (j.id !== HOUSE[arm]) bad.push(", "if (false) bad.push("),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("J1F: { readerSplit: 'rs', floor: '29000' }", "J1F: { floor: '29000' }"),
  ("J1D: { readerSplit: 'null', floor: '29000' }", "J1D: { floor: '29000' }"),
  ("K1: { readerSplit: 'rs', floor: '9000' }", "K1: { readerSplit: 'rs' }"),
  ("shareNodes: 'none', readerRef: 'adaptive' };", "shareNodes: 'none' };"),
  ("const NEED = ['armTook', 'adaptTook', 'footTook', 'ownTook', 'identity', 'qfTook', 'layerTook'];", "const NEED = ['armTook', 'adaptTook', 'ownTook', 'identity', 'qfTook', 'layerTook'];"),
  ("const NEED = ['armTook', 'adaptTook', 'footTook', 'ownTook', 'identity', 'qfTook', 'layerTook'];", "const NEED = ['armTook', 'adaptTook', 'footTook', 'ownTook', 'qfTook', 'layerTook'];"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1] ||", "if (!x || !(x[1] > 0) ||"),
  ("if (!j.foot || j.foot.on !== FOOT[arm] || (FOOT[arm] && !(j.foot.live > 0))) bad.push(", "if (!j.foot || j.foot.on !== FOOT[arm]) bad.push("),
  ("if (!j.foot || j.foot.on !== FOOT[arm] || (FOOT[arm] && !(j.foot.live > 0))) bad.push(", "if (!j.foot || (FOOT[arm] && !(j.foot.live > 0))) bad.push("),
  ("if (!j.bridge || !j.bridge.includes(4)) bad.push(", "if (!j.bridge) bad.push("),
  ("if (!j.moves[w] || !(j.moves[w].py >= npw)) bad.push(", "if (!j.moves[w]) bad.push("),
  ("const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(", "const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w]) bad.push("),
  ("if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }", "if (!f) { continue; }"),
  # the inert check
  ("for (const x of new Set([...Object.keys(A), ...Object.keys(B)])) { n++; if (A[x] !== B[x]) off.push(`${nm} ${x}`); }", "for (const x of Object.keys(B)) { n++; if (A[x] !== B[x]) off.push(`${nm} ${x}`); }"),
  ("for (const nm of ['per', 'bits', 'moves', 'tables'])", "for (const nm of ['per', 'bits', 'moves'])"),
  # items
  ("const c1 = { k: 0, ...meanOf(Y('J1F', 0, 4), Z1) };", "const c1 = { k: 0, ...meanOf(Y('J1F', 0, 3), Z1) };"),
  ("const band = (x, IN, OUT) => (x.lo >= -IN && x.hi <= IN ? 'HELD' : x.lo >= OUT || x.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');", "const band = (x, IN, OUT) => (x.hi <= IN ? 'HELD' : x.lo >= OUT || x.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');"),
  ("const band = (x, IN, OUT) => (x.lo >= -IN && x.hi <= IN ? 'HELD' : x.lo >= OUT || x.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');", "const band = (x, IN, OUT) => (x.lo >= -IN && x.hi <= IN ? 'HELD' : x.lo >= OUT ? 'FALSIFIED' : 'INCONCLUSIVE');"),
  ("const sideOf = (x, OUT) => (x.lo >= OUT ? 'over' : x.hi <= -OUT ? 'under' : null);", "const sideOf = (x, OUT) => (x.hi <= -OUT ? 'under' : null);"),
  ("const c2 = [0, 1, 2].map(k =>", "const c2 = [0, 1].map(k =>"),
  ("const over2 = x => x.lo >= OUT2, under2 = x => x.hi <= -OUT2,", "const over2 = x => x.lo >= OUT2, under2 = x => false,"),
  ("const yd = Y('J1D', 0, 4), y1 = Y('J1', 0, 4), c3 = { k: 0, ...meanOf(yd.map((v, i) => v - y1[i]), Z1) };", "const yd = Y('J1D', 0, 4), y1 = Y('J1', 0, 4), c3 = { k: 0, ...meanOf(yd, Z1) };"),
  ("out['4'] = harmItem([0, 1].map(k => ({ k, ...paired(S('J1F', k), S('J2', k)) })));", "out['4'] = harmItem([0, 1].map(k => ({ k, ...paired(S('J2', k), S('J1F', k)) })));"),
  ("const margin = marginRel(100 * x.bAlive / x.N);", "const margin = 0.5;"),
  ("return { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED'", "return { outcome: oc.every(x => x.outcome === 'harm') ? 'FALSIFIED'"),
  ("export const IN1 = 0.5, OUT1 = 1.0, IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;", "export const IN1 = 0.75, OUT1 = 1.0, IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;"),
  ("export const IN1 = 0.5, OUT1 = 1.0, IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;", "export const IN1 = 0.5, OUT1 = 1.0, IN2 = 2.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;"),
  ("export const IN1 = 0.5, OUT1 = 1.0, IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;", "export const IN1 = 0.5, OUT1 = 1.0, IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 2.5;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-foot.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
