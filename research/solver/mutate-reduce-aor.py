#!/usr/bin/env python3
# AOR'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part of
# reduce-aor.mjs's gate, parse or items in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED
# (mutate_lib.py, which logs the run to results-mutation-history.txt; the launcher refuses a reducer with no all-caught run
# as it stands, check-prediction.mjs mutationProblems).
#   python3 research/solver/mutate-reduce-aor.py > research/solver/results-reduce-aor-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("line: '0.5', mix: '3', shareNodes: 'none', readerRef: 'adaptive' };", "line: '0.5', mix: '3', shareNodes: 'none' };"),
  ("AOP: { readerSplit: 'null', floor: '205000' }", "AOP: { floor: '205000' }"),
  ("ARS: { readerSplit: 'rs', floor: '205000' }", "ARS: { floor: '205000' }"),
  ("A6RS: { readerSplit: 'rs', floor: '5000' }", "A6RS: { floor: '5000' }"),
  ("['armTook', 'adaptTook', 'pairTook', 'forceIdentity', 'decompTook']", "['armTook', 'adaptTook', 'pairTook', 'forceIdentity']"),
  ("['armTook', 'adaptTook', 'pairTook', 'forceIdentity', 'decompTook']", "['armTook', 'adaptTook', 'pairTook', 'decompTook']"),
  ("['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook']", "['armTook', 'adaptTook', 'ownTook', 'identity', 'qfTook', 'layerTook']"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1] ||", "if (!x || !(x[1] > 0) ||"),
  ("if (!d || !d.ok || d.reads !== 5 || !r || r.filter(Boolean).length !== 5) bad.push(", "if (!d || d.reads !== 5 || !r || r.filter(Boolean).length !== 5) bad.push("),
  ("if (!d || !d.ok || d.reads !== 5 || !r || r.filter(Boolean).length !== 5) bad.push(", "if (!d || !d.ok || !r) bad.push("),
  ("for (let w = 0; w < 3; w++) for (let b = 0; b < 4; b++) if (!j.tail.some(", "for (let w = 0; w < 3; w++) for (let b = 0; b < 3; b++) if (!j.tail.some("),
  ("['P', 'D', 'OWN'].some(x => ao.job.tables[w][x] !== j.tables[w][x])", "['D', 'OWN'].some(x => ao.job.tables[w][x] !== j.tables[w][x])"),
  ("!Buffer.from(a, 'base64').equals(Buffer.from(b, 'base64').subarray(0, npw))", "false"),
  ("if (forceIdentityFix) {}", "if (forceIdentityFix) {}"),
  # the stamps by audit
  ("if (codes.size !== 1) bad.push(", "if (false) bad.push("),
  ("if (kinds.length !== 2 || !kinds.includes('A6RS') || !kinds.includes('S364')) bad.push(", "if (!kinds.includes('A6RS') || !kinds.includes('S364')) bad.push("),
  # the runs
  ("match = a.length <= b.length && a.equals(b.subarray(0, a.length));", "match = true;"),
  ("const src = match ? b : a;", "const src = a;"),
  # items
  ("const judge = c => (c.lo >= -IN && c.hi <= IN ? 'HELD' : c.lo >= OUT || c.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');", "const judge = c => (c.hi <= IN ? 'HELD' : c.lo >= OUT || c.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');"),
  ("const judge = c => (c.lo >= -IN && c.hi <= IN ? 'HELD' : c.lo >= OUT || c.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');", "const judge = c => (c.lo >= -IN && c.hi <= IN ? 'HELD' : c.lo >= OUT ? 'FALSIFIED' : 'INCONCLUSIVE');"),
  ("const side = c => (c.lo >= OUT ? 'over' : c.hi <= -OUT ? 'under' : null);", "const side = c => (c.hi <= -OUT ? 'under' : null);"),
  ("const c1 = { k: 0, ...one([D0, AO0.c, AO0.N], 0.05) };", "const c1 = { k: 0, ...one([D0, AO0.c, AO0.N], 0.5) };"),
  ("const r0 = RUN(0), c2 = { k: 0, match: r0.match, ...one([TAB(0), r0.c, r0.N], 0.05) };", "const r0 = RUN(1), c2 = { k: 0, match: r0.match, ...one([TAB(0), r0.c, r0.N], 0.05) };"),
  ("out['3'] = readItem([1, 2].map(k =>", "out['3'] = readItem([0, 1].map(k =>"),
  ("const pr = [0, 1].map(k => ({ k, ...paired(S('A6RS', k), S('A6', k)) }));", "const pr = [0, 1].map(k => ({ k, ...paired(S('A6', k), S('A6RS', k)) }));"),
  ("out['4'] = { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED'", "out['4'] = { outcome: oc.every(x => x.outcome === 'harm') ? 'FALSIFIED'"),
  ("export const IN = Math.log(2), OUT = Math.log(3);", "export const IN = Math.log(2.5), OUT = Math.log(3);"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-aor.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
