#!/usr/bin/env python3
# AO'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part of
# reduce-ao.mjs's gate, parse or items in a scratch copy, runs the planted set on the copy and must see PLANTED CHECK FAILED
# (mutate_lib.py, which logs the run to results-mutation-history.txt; the launcher refuses a reducer with no all-caught run
# as it stands, check-prediction.mjs mutationProblems).
#   python3 research/solver/mutate-reduce-ao.py > research/solver/results-reduce-ao-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("AO: { readerRef: 'adaptive', readerSplit: 'null', floor: '205000' }", "AO: { readerSplit: 'null', floor: '205000' }"),
  ("AOL: { readerRef: 'adaptive', readerSplit: 'null', floor: '205000' }", "AOL: { readerSplit: 'null', floor: '205000' }"),
  ("AOL: ['320x41', 256]", "AOL: ['160x41', 128]"),
  ("CO: { readerRef: 'order', readerSplit: 'null', floor: '205000' }", "CO: { readerSplit: 'null', floor: '205000' }"),
  ("line: '0.5', mix: '3', shareNodes: 'none' };", "line: '0.5', mix: '3' };"),
  ("['armTook', 'pairTook', 'forceIdentity', ...(adaptive ? ['adaptTook'] : [])]", "['armTook', 'pairTook', 'forceIdentity']"),
  ("['armTook', 'pairTook', 'forceIdentity', ...(adaptive ? ['adaptTook'] : [])]", "['armTook', 'forceIdentity', ...(adaptive ? ['adaptTook'] : [])]"),
  ("['armTook', 'pairTook', 'forceIdentity', ...(adaptive ? ['adaptTook'] : [])]", "['armTook', 'pairTook', ...(adaptive ? ['adaptTook'] : [])]"),
  ("['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook']", "['armTook', 'adaptTook', 'ownTook', 'identity', 'qfTook', 'layerTook']"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1] ||", "if (!x || !(x[1] > 0) ||"),
  ("if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(", "if (false) bad.push("),
  ("j.adaptive.lattice !== LATTICE[arm][0] || ", ""),
  ("j.adaptive.nz !== LATTICE[arm][1] || ", ""),
  ("j.adaptive.nonMono !== 0 || ", ""),
  ("if (!j.pair || j.pair[0] !== PAIR[0] || j.pair[1] !== PAIR[1]) bad.push(", "if (!j.pair) bad.push("),
  ("if (!sp || sp.n !== npw * PMULT[arm] || sp.ai !== PAIR[0]) bad.push(", "if (!sp || sp.ai !== PAIR[0]) bad.push("),
  ("for (let w = 0; w < 3; w++) for (let b = 0; b < 4; b++) if (!j.tail.some(", "for (let w = 0; w < 3; w++) for (let b = 0; b < 3; b++) if (!j.tail.some("),
  ("if (!j.refTail) bad.push(`${arm}: no tail check summary`);", ""),
  ("if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${arm}: its file is stamped by other code`);", ""),
  ("if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(", "if (!x) bad.push("),
  ("if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`A6: its file's", "if (!a) bad.push(`A6: its file's"),
  # item 1
  ("const inside = x => x.lo >= -IN1 && x.hi <= IN1, over = x => x.lo >= OUT1, under = x => x.hi <= -OUT1;", "const inside = x => x.hi <= IN1, over = x => x.lo >= OUT1, under = x => x.hi <= -OUT1;"),
  ("const inside = x => x.lo >= -IN1 && x.hi <= IN1, over = x => x.lo >= OUT1, under = x => x.hi <= -OUT1;", "const inside = x => x.lo >= -IN1 && x.hi <= IN1, over = x => x.m >= OUT1, under = x => x.hi <= -OUT1;"),
  ("const inside = x => x.lo >= -IN1 && x.hi <= IN1, over = x => x.lo >= OUT1, under = x => x.hi <= -OUT1;", "const inside = x => x.lo >= -IN1 && x.hi <= IN1, over = x => x.lo >= OUT1, under = x => false;"),
  ("out['1'] = readItem([1, 2].map(k => ({ k, ...lnRead(...R('AO', k)) })));", "out['1'] = readItem([0, 1].map(k => ({ k, ...lnRead(...R('AO', k)) })));"),
  ("const [plo, phi] = clopperPearson(c, N, alpha), r = 100 * c / N;", "const [plo, phi] = clopperPearson(c, N, 0.2), r = 100 * c / N;"),
  ("hi: plo > 0 ? q(Math.log(table / (100 * plo))) : Infinity", "hi: plo > 0 ? q(Math.log(table / (100 * plo))) : 0"),
  ("IN1 = Math.log(2), OUT1 = Math.log(3),", "IN1 = Math.log(2.2), OUT1 = Math.log(3),"),
  # item 2
  ("const inside = x => x.lo >= -IN2 && x.hi <= IN2, under = x => x.hi <= -OUT2, over = x => x.lo >= OUT2;", "const inside = x => x.hi <= IN2, under = x => x.hi <= -OUT2, over = x => x.lo >= OUT2;"),
  ("const g = [0, 1].map(k => ({ k, ...meanOf(P('A6', 'GB', k)) }));", "const g = [0, 2].map(k => ({ k, ...meanOf(P('A6', 'GB', k)) }));"),
  ("Z = 2.241402727604947,", "Z = 1.959963984540054,"),
  # item 3
  ("if (b[i] && !a[i]) lost++; else if (a[i] && !b[i]) saved++;", "if (a[i] && !b[i]) lost++; else if (b[i] && !a[i]) saved++;"),
  ("out['3'] = { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED'", "out['3'] = { outcome: oc.every(x => x.outcome === 'harm') ? 'FALSIFIED'"),
  ("const pr = [0, 1].map(k => ({ k, ...paired(S('A6', k), S('BO', k)) }));", "const pr = [0, 2].map(k => ({ k, ...paired(S('A6', k), S('BO', k)) }));"),
  # the mean's interval and the luck adjustment
  ("const se = Math.sqrt(v / n);", "const se = Math.sqrt(v / n) / 2;"),
  ("return { m: q(beta[0]), se:", "return { m: q(beta[0] + 0.01), se:"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-ao.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
