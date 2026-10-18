#!/usr/bin/env python3
# HO-DEP'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one part of
# reduce-hodep.mjs's gate, inert comparison, items or rows in a scratch copy, runs the planted set on the copy and must see
# PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-hodep.py > research/solver/results-reduce-hodep-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("if (js.length !== 1) { bad.push(", "if (js.length < 1) { bad.push("),
  ("for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(", "for (const x of jobs) if (false) bad.push("),
  ("if (j.id !== house[arm]) bad.push(", "if (false) bad.push("),
  ("if (!j.done) bad.push(`${arm}: no done line`);", "if (false) bad.push(`${arm}: no done line`);"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("readerRef: REF[arm], readerSplit: SPLIT[arm], pts:", "readerSplit: SPLIT[arm], pts:"),
  ("readerRef: REF[arm], readerSplit: SPLIT[arm], pts:", "readerRef: REF[arm], pts:"),
  ("if (!j.guard || j.guard.floor !== j.guard.rule || field(ran, 'floor') !== String(j.guard.floor))", "if (!j.guard)"),
  ("if (!j.guard || j.guard.ref !== REF[arm] || j.guard.fix !== FOOT[arm] || j.guard.unfixed)", "if (!j.guard || j.guard.ref !== REF[arm] || j.guard.fix !== FOOT[arm])"),
  ("const NEED = ['armTook', 'footTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];", "const NEED = ['armTook', 'footTook', 'ownTook', 'identity', 'qfTook', 'layerTook'];"),
  ("...(REF[arm] === 'adaptive' ? ['adaptTook'] : [])", "...[]"),
  ("if (!j.foot || j.foot.on !== FOOT[arm] || (FOOT[arm] && !(j.foot.live > 0)))", "if (!j.foot || j.foot.on !== FOOT[arm])"),
  ("if (!j.foot || j.foot.on !== FOOT[arm] || (FOOT[arm] && !(j.foot.live > 0)))", "if (!j.foot || (FOOT[arm] && !(j.foot.live > 0)))"),
  ("const t = j.tables[w]; if (!t ||", "const t = j.tables[w]; if (false ||"),
  ("for (const x of [...KEYS, 'WS']) {", "for (const x of [...KEYS]) {"),
  ("if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5)", "if (false)"),
  ("if (!house2 || house2 === 'S362' || house2 === 'S366')", "if (house2 === 'S362' || house2 === 'S366')"),
  # the inert comparison
  ("if (shared && (!(x in A) || !(x in B))) continue; n++; if (A[x] !== B[x]) off.push(`${nm} ${x}`);", "if (shared && (!(x in A) || !(x in B))) continue; n++;"),
  ("if (shared && (!(x in A) || !(x in B))) continue; n++;", "n++;"),
  # the items
  ("return { outcome: s.outcome === 'harm' || wm.outcome === 'harm' ? 'FALSIFIED'", "return { outcome: s.outcome === 'harm' ? 'FALSIFIED'"),
  ("s.outcome === 'no material harm' && wm.outcome === 'no material harm' ? 'HELD'", "s.outcome === 'no material harm' ? 'HELD'"),
  ("const s = mixtureOutcome(mixtureChange(cells)), wm = wsMix(ws, s.margin);", "const s = mixtureOutcome(mixtureChange(cells), 0.25), wm = wsMix(ws, s.margin);"),
  ("out['3'] = { outcome: [...a3, m3].some(x => beyond(x, OUT3))", "out['3'] = { outcome: [m3].some(x => beyond(x, OUT3))"),
  ("'FALSIFIED' : inside(m3, IN3) ? 'HELD' : 'INCONCLUSIVE', per: a3, mix: m3 };", "'FALSIFIED' : Math.abs(m3.m) <= IN3 ? 'HELD' : 'INCONCLUSIVE', per: a3, mix: m3 };"),
  ("adv = beyond(O, ADV4) && Math.abs(A.m) <= ADV4,", "adv = beyond(O, ADV4),"),
  ("worse = beyond(A, ADV4) && Math.abs(O.m) <= ADV4,", "worse = false,"),
  ("sameT = [0, 1, 2].every(k => Math.abs(P.acc[h].A[k].table - P.acc[h].O[k].table) <= SAME4);", "sameT = Math.abs(P.acc[h].A[1].table - P.acc[h].O[1].table) <= SAME4;"),
  ("out['4'] = { outcome: hh.some(x => x.adv) && !hh.some(x => x.worse) ? 'HELD'", "out['4'] = { outcome: hh.some(x => x.adv) ? 'HELD'"),
  ("hh.every(x => x.sameT) && !hh.some(x => x.adv) ? 'FALSIFIED'", "hh.some(x => x.sameT) && !hh.some(x => x.adv) ? 'FALSIFIED'"),
  ("export const accMix = (rows, alpha = ALPHA3, w = MIX3W) => { const per = rows.map(x => accOf(x.table, x.c, x.N, alpha)), m = per.reduce((t, x, k) => t + w[k] * x.m, 0);", "export const accMix = (rows, alpha = ALPHA3, w = MIX3W) => { const per = rows.map(x => accOf(x.table, x.c, x.N, alpha)), m = per.reduce((t, x, k) => t + x.m / 3, 0);"),
  ("const z = zFor(level), d = per.reduce((t, x, k) => t + w[k] * x.d, 0)", "const z = zFor(level), d = per.reduce((t, x, k) => t + x.d / 3, 0)"),
  ("outcome: lo > -margin ? 'no material harm' : hi < 0 && -d >= margin ? 'harm' : 'inconclusive' };", "outcome: lo > -margin ? 'no material harm' : hi < 0 ? 'harm' : 'inconclusive' };"),
  # the rows
  ("if (o('1') === 'FALSIFIED' || o('2') === 'FALSIFIED') return 'R2';", "if (o('1') === 'FALSIFIED') return 'R2';"),
  ("if (o('1') === 'HELD' && o('2') === 'HELD' && o('3') === 'HELD' && o('4') === 'HELD') return 'R1';", "if (o('1') === 'HELD' && o('3') === 'HELD' && o('4') === 'HELD') return 'R1';"),
  ("if (o('3') === 'FALSIFIED') return 'R4';", ""),
  # the bands
  ("export const IN3 = 1.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.5;", "export const IN3 = 2.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.5;"),
  ("export const IN3 = 1.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.5;", "export const IN3 = 1.5, OUT3 = 6, ADV4 = 1, SAME4 = 0.5;"),
  ("export const IN3 = 1.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.5;", "export const IN3 = 1.5, OUT3 = 3, ADV4 = 4, SAME4 = 0.5;"),
  ("export const IN3 = 1.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.5;", "export const IN3 = 1.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.1;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-hodep.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
