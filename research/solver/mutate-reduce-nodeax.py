#!/usr/bin/env python3
# NODE-AX'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one
# part of reduce-nodeax.mjs's gate, items, clearance, cause map, reach or read in a scratch copy, runs the planted set on
# the copy and must see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-nodeax.py > research/solver/results-reduce-nodeax-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("n = (byKey[k] || []).length; if (n !== 1)", "n = (byKey[k] || []).length; if (n > 1)"),
  ("n = (byKey[k] || []).length; if (n !== 1)", "n = (byKey[k] || []).length; if (n < 1)"),
  ("if (!j.done) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])", "['audit'].some(f => j.stamp[f] !== st0[f])"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.seed !== seed"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("grid: `total${pts}x${reg[3]}x6`, shareNodes:", "shareNodes:"),
  ("shareNodes: j.arm === 'BN' ? NODES_A : 'none' })", "})"),
  ("readerRef: 'order', readerChance: 'null',", "readerChance: 'null',"),
  ("e3pcls: 'true', switchMargin", "switchMargin"),
  ("line: '0.5', mix: '3', floor: '5000' };", "line: '0.5', mix: '3' };"),
  ("for (const c of ['armTook', 'nodeTook', 'readTook', 'ownTook', 'identity'])", "for (const c of ['armTook', 'readTook', 'ownTook', 'identity'])"),
  ("for (const c of ['armTook', 'nodeTook', 'readTook', 'ownTook', 'identity'])", "for (const c of ['armTook', 'nodeTook', 'ownTook', 'identity'])"),
  ("for (const c of ['armTook', 'nodeTook', 'readTook', 'ownTook', 'identity'])", "for (const c of ['armTook', 'nodeTook', 'readTook', 'identity'])"),
  ("for (const c of ['armTook', 'nodeTook', 'readTook', 'ownTook', 'identity'])", "for (const c of ['armTook', 'nodeTook', 'readTook', 'ownTook'])"),
  ("if (!x || !(x[1] > 0) || x[0] !== x[1] ||", "if (!x || x[0] !== x[1] ||"),
  ("if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(", "if (false) bad.push("),
  ("if (!j.solve) bad.push(", "if (false) bad.push("),
  ("if (!j.bridge || !j.bridge.length) bad.push(", "if (!j.bridge) bad.push("),
  ("if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(", "if (false) bad.push("),
  ("if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(", "if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push("),
  ("if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(", "if (!s || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push("),
  ("if (!j.ledger[w] || KEYS.some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(", "if (false) bad.push("),
  ("if (!f) bad.push(`${k}: its file ${j.file} is missing`);", "if (!f) ;"),
  ("if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x]))", "if (!f.stamp)"),
  ("if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(", "if (!x) bad.push("),
  ("if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(", "if (!a) bad.push("),
  # the reach
  ("return [0, 1, 2].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length;", "return [0, 1].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length;"),
  # the intervals
  ("return { m: q(m), lo: q(m - Z * se), hi: q(m + Z * se), se }; }", "return { m: q(m), lo: q(m - se), hi: q(m + se), se }; }"),
  ("const r = num.map((x, i) => x - F * den[i])", "const r = num.map((x, i) => x)"),
  ("se = Math.sqrt(v / n) / Math.abs(md);", "se = Math.sqrt(v / n);"),
  # item 0
  ("[0, 1, 2].every(k => !!b.tables[k] && a.tables[k].OWN === b.tables[k].OWN)", "[0, 1].every(k => !!b.tables[k] && a.tables[k].OWN === b.tables[k].OWN)"),
  ("[0, 1, 2].every(k => b.runs && b.runs[k] === a.sims[`OWN${k}`].bits)", "[0, 1].every(k => b.runs && b.runs[k] === a.sims[`OWN${k}`].bits)"),
  ("outcome: !n1 ? 'INCONCLUSIVE' : !t0 ? 'FALSIFIED' : r0 ? 'HELD' : 'INCONCLUSIVE'", "outcome: !n1 ? 'HELD' : !t0 ? 'FALSIFIED' : r0 ? 'HELD' : 'INCONCLUSIVE'"),
  ("outcome: !n1 ? 'INCONCLUSIVE' : !t0 ? 'FALSIFIED' : r0 ? 'HELD' : 'INCONCLUSIVE'", "outcome: !n1 ? 'INCONCLUSIVE' : !t0 ? 'FALSIFIED' : 'HELD'"),
  # item 1
  ("shown = G.hi <= SHOWN_G;", "shown = G.hi < SHOWN_G;"),
  ("shown = G.hi <= SHOWN_G;", "shown = G.m <= SHOWN_G;"),
  ("out['1'] = { outcome: c1.every(x => x.shown && x.F.lo >= F_HELD) ? 'HELD'", "out['1'] = { outcome: c1.every(x => x.shown && x.F.lo > F_HELD) ? 'HELD'"),
  ("out['1'] = { outcome: c1.every(x => x.shown && x.F.lo >= F_HELD) ? 'HELD'", "out['1'] = { outcome: c1.some(x => x.shown && x.F.lo >= F_HELD) ? 'HELD'"),
  ("out['1'] = { outcome: c1.every(x => x.shown && x.F.lo >= F_HELD) ? 'HELD'", "out['1'] = { outcome: c1.every(x => x.F.lo >= F_HELD) ? 'HELD'"),
  ("c1.every(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };", "c1.every(x => x.shown && x.F.hi < F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };"),
  ("c1.every(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };", "c1.some(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c1 };"),
  ("const c1 = [0, 1].map(k =>", "const c1 = [1, 2].map(k =>"),
  ("F = ratioOf(P('BN', 'AA', k), P('BN', 'GB', k)), shown", "F = ratioOf(P('BN', 'WA', k), P('BN', 'GB', k)), shown"),
  # item 2
  ("shown = A.hi <= SHOWN_A;", "shown = A.hi <= SHOWN_G;"),
  ("out['2'] = { outcome: c2.every(x => x.shown && x.F.lo >= F_HELD) ? 'HELD'", "out['2'] = { outcome: c2.some(x => x.shown && x.F.lo >= F_HELD) ? 'HELD'"),
  ("c2.every(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c2 };", "c2.some(x => x.shown && x.F.hi <= F_FALS) ? 'FALSIFIED' : 'INCONCLUSIVE', cells: c2 };"),
  ("F = ratioOf(P('BN', 'AL', k), P('BN', 'AA', k)), shown", "F = ratioOf(P('BN', 'GL', k), P('BN', 'GB', k)), shown"),
  # item 3
  ("out['3'] = { outcome: D.hi <= KNOWN ? 'HELD'", "out['3'] = { outcome: D.hi < KNOWN ? 'HELD'"),
  ("out['3'] = { outcome: D.hi <= KNOWN ? 'HELD'", "out['3'] = { outcome: D.m <= KNOWN ? 'HELD'"),
  ("D.lo >= KNOWN_F ? 'FALSIFIED' : 'INCONCLUSIVE', D };", "D.lo > KNOWN_F ? 'FALSIFIED' : 'INCONCLUSIVE', D };"),
  ("const ao = P('BO', 'AA', 0), an = P('BN', 'AA', 0)", "const ao = P('BO', 'AA', 1), an = P('BN', 'AA', 1)"),
  # the clearance and the causes
  ("return Math.abs(r) <= q(0.5 * Math.abs(g)); });", "return Math.abs(r) < q(0.5 * Math.abs(g)); });"),
  ("return Math.abs(r) <= q(0.5 * Math.abs(g)); });", "return true; });"),
  ("out.clear = [0, 1].every(k =>", "out.clear = [0].every(k =>"),
  ("const ok = out['0'].outcome === 'HELD' && out['3'].outcome === 'HELD' && out.clear;", "const ok = out['0'].outcome === 'HELD' && out.clear;"),
  ("const ok = out['0'].outcome === 'HELD' && out['3'].outcome === 'HELD' && out.clear;", "const ok = out['3'].outcome === 'HELD' && out.clear;"),
  ("'N2-SHARE': ok ? ({ HELD: 'held', FALSIFIED: 'not' }[out['1'].outcome] || 'open') : 'open',", "'N2-SHARE': ok ? ({ HELD: 'held', FALSIFIED: 'not' }[out['2'].outcome] || 'open') : 'open',"),
  ("LATE: ok ? ({ HELD: 'held', FALSIFIED: 'not' }[out['2'].outcome] || 'open') : 'open' };", "LATE: ok ? ({ HELD: 'held', FALSIFIED: 'open' }[out['2'].outcome] || 'open') : 'open' };"),
  # the split
  ("closes: q(r.B0.m - r.X.m - r.T.m - r.GB.m - r.GA.m)", "closes: q(r.B0.m - r.X.m - r.T.m - r.GB.m)"),
  ("sort((p, s) => Math.abs(s[1]) - Math.abs(p[1]))[0][0];", "sort((p, s) => s[1] - p[1])[0][0];"),
  # the read end to end
  ("L.push(`1. the pension share carries", "L.push(`1 the pension share carries"),
  ("for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);", "for (const [c, v] of Object.entries(it.causes).slice(1)) L.push(`=> ${c} ${v}`);"),
  ("L.push(`OUTCOME: ${['0', '1', '2', '3'].map", "L.push(`OUTCOME: ${['0', '1', '2'].map"),
  ("L.push(`REALISED item 1: ${f4(it['1'].cells[0].F.F)}`);", ""),
  ("${it.clear ? 'YES' : 'NO'}", "${'YES'}"),
  ("for (const s of it.split) L.push(", "for (const s of it.split.slice(1)) L.push("),
  # the rounding
  ("export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);", "export const q = x => x;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-nodeax.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
