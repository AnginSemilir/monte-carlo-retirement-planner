#!/usr/bin/env python3
# NE-EDGE'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; held to every mutant caught before launch, O144): each mutation
# breaks one part of reduce-needge.mjs's gate, intervals, items, cause map or read in a scratch copy, runs the planted set on
# the copy and must see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-needge.py > research/solver/results-reduce-needge-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("n = (byKey[k] || []).length; if (n !== 1)", "n = (byKey[k] || []).length; if (n > 1)"),
  ("n = (byKey[k] || []).length; if (n !== 1)", "n = (byKey[k] || []).length; if (n < 1)"),
  ("if (!j.done) bad.push(", "if (false) bad.push("),
  ("['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])", "['audit'].some(f => j.stamp[f] !== st0[f])"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.seed !== seed"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.npw !== npw || j.head.scale !== scale"),
  ("j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale", "j.head.seed !== seed || j.head.scale !== scale"),
  ("if (j.pts !== pts) bad.push(", "if (false) bad.push("),
  ("if (!j.checks.armTook || j.checks.armTook[0] !== 1)", "if (!j.checks.armTook)"),
  ("if (!j.checks.pairTook || j.checks.pairTook[0] !== 1)", "if (!j.checks.pairTook)"),
  ("Object.entries({ ...COMMON, readerSplit: SPLIT[j.arm] })", "Object.entries({ ...COMMON })"),
  ("Object.entries({ ...COMMON, readerSplit: SPLIT[j.arm] })", "Object.entries({ readerSplit: SPLIT[j.arm] })"),
  ("if (field(ran, 'pts') !== String(pts)) bad.push(", "if (false) bad.push("),
  ("if (field(ran, 'grid') !== `total${pts}x${reg[3]}x${reg[3]}`)", "if (false)"),
  ("if (field(ran, 'mix') !== '3')", "if (false)"),
  ("if (field(ran, 'floor') !== String(FLOORS[j.id])) bad.push(", "if (false) bad.push("),
  ("if (field(ran, 'line') !== '0.5') bad.push(", "if (false) bad.push("),
  ("if (PROBED.has(k)) { const pb = j.probe || [];", "if (false) { const pb = j.probe || [];"),
  ("if (Math.abs(x.sup[0] + x.clip[0] + x.copy[0] - 1) > 1e-5)", "if (Math.abs(x.sup[0] + x.clip[0] + x.copy[0] - 1) > 1e-1)"),
  ("if (Math.abs(x.plain - x.del - x.res) > 1e-4)", "if (Math.abs(x.plain - x.del - x.res) > 1e-2)"),
  ("j.pair.P !== PAIRS[j.id][0] || j.pair.D", "j.pair.D"),
  ("j.pair.tP !== '0,0' || j.pair.tD !== '2,2' || j.pair.lP !== j.pair.lD", "j.pair.tP !== '0,0' || j.pair.lP !== j.pair.lD"),
  ("else if (j.reader.clampN !== 0) bad.push(", "else if (false) bad.push("),
  ("if (j.tables.length !== 3 || j.tables.some((x, i) => x.k !== i))", "if (j.tables.length > 3)"),
  ("if (!s || s.n !== np) bad.push(", "if (!s) bad.push("),
  ("...(j.own && j.pair && j.own.ai !== j.pair.P && j.own.ai !== j.pair.D ? [['OWN', npw]] : [])", "...([])"),
  ("j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi", "j.checks.forceIdentity[0] !== j.checks.forceIdentity[1]"),
  ("if (!f) bad.push(`${k}: its file ${j.file} is missing`);", "if (!f) ;"),
  ("if (!f.stamp || !j.stamp || ['code', 'audit', 'prediction'].some(x => f.stamp[x] !== j.stamp[x]))", "if (!f.stamp)"),
  ("typeof f.bits[nm] !== 'string' || sha16(Buffer.from(f.bits[nm], 'base64')) !== s.bits", "typeof f.bits[nm] !== 'string'"),
  # the identity control
  ("if (!a || !b || a.raw.join(' ') !== b.raw.join(' '))", "if (!a || !b)"),
  ("if (!t || t.ok !== s.ok || t.n !== s.n || t.bits !== s.bits)", "if (!t || t.n !== s.n || t.bits !== s.bits)"),
  ("if (!t || t.ok !== s.ok || t.n !== s.n || t.bits !== s.bits)", "if (!t || t.ok !== s.ok || t.n !== s.n)"),
  # the intervals
  ("const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * h, hi: table - 100 * l };", "const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * l, hi: table - 100 * h };"),
  ("const a1 = ALPHA / 4;", "const a1 = ALPHA / 2;"),
  # items 1 and 2
  ("counted = ob >= GMIN;", "counted = ob > GMIN;"),
  ("counted = ob >= GMIN;", "counted = true;"),
  ("worst: counted ? q(1 - o.hi / ob) : null, best: counted ? q(1 - o.lo / ob) : null", "worst: counted ? q(1 - o.d / ob) : null, best: counted ? q(1 - o.lo / ob) : null"),
  ("worst: counted ? q(1 - o.hi / ob) : null, best: counted ? q(1 - o.lo / ob) : null", "worst: counted ? q(1 - o.hi / ob) : null, best: counted ? q(1 - o.d / ob) : null"),
  ("cc.every(c => c.worst >= REMOVE) ? 'HELD'", "cc.every(c => c.worst > REMOVE) ? 'HELD'"),
  ("cc.every(c => c.worst >= REMOVE) ? 'HELD'", "cc.some(c => c.worst >= REMOVE) ? 'HELD'"),
  ("cc.every(c => c.best < KEEP) ? 'FALSIFIED'", "cc.every(c => c.best <= KEEP) ? 'FALSIFIED'"),
  ("cc.every(c => c.best < KEEP) ? 'FALSIFIED'", "cc.some(c => c.best < KEEP) ? 'FALSIFIED'"),
  ("return { outcome: cc.length && cc.every(c => c.worst", "return { outcome: cc.every(c => c.worst"),
  ("const j = jt('S364', arm), cells = [0, 1].map(k => {", "const j = jt('S364', arm), cells = [0, 1, 2].map(k => {"),
  ("out['1'] = removal('RZ'); out['2'] = removal('RS');", "out['1'] = removal('RS'); out['2'] = removal('RS');"),
  ("out['1'] = removal('RZ'); out['2'] = removal('RS');", "out['1'] = removal('RZ'); out['2'] = removal('RZ');"),
  # item 3
  ("out['3'] = { outcome: c3.every(x => q(Math.abs(x.d)) <= CTRL) ? 'HELD'", "out['3'] = { outcome: c3.every(x => q(Math.abs(x.d)) < CTRL) ? 'HELD'"),
  ("c3.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED'", "c3.some(x => q(x.lo) > CTRL) ? 'FALSIFIED'"),
  ("c3.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED'", "c3.some(x => q(x.d) > CTRL || q(x.d) < -CTRL) ? 'FALSIFIED'"),
  ("const nameOf = j => (j.own.ai === j.pair.P ? 'P' : j.own.ai === j.pair.D ? 'D' : 'OWN');", "const nameOf = j => (j.own.ai === j.pair.P ? 'P' : 'OWN');"),
  ("const c3 = ['RZ', 'RS'].flatMap(", "const c3 = ['RZ'].flatMap("),
  # item 4
  ("out['4'] = { outcome: c4.every(x => Math.abs(x.d) <= TBL) ? 'HELD'", "out['4'] = { outcome: c4.every(x => Math.abs(x.d) < TBL) ? 'HELD'"),
  ("c4.some(x => Math.abs(x.d) >= TBLF) ? 'FALSIFIED'", "c4.some(x => Math.abs(x.d) > TBLF) ? 'FALSIFIED'"),
  ("return [0, 1].flatMap(k => ['P', 'D'].map(o => ({ arm, k, o, d: q(j.tables[k][o] - B1S380[k][o]) })));", "return [0, 1, 2].flatMap(k => ['P', 'D'].map(o => ({ arm, k, o, d: q(j.tables[k][o] - B1S380[k][o]) })));"),
  ("const c4 = ['RZ', 'RS'].flatMap(", "const c4 = ['RZ'].flatMap("),
  # items 5 and 6
  ("x.read = x.b + x.c === 0 ? { d: 0, lo: 0, hi: 0, outcome: 'no material harm' } :", "x.read ="),
  ("x.margin = marginRel(x.sP);", "x.margin = 0.5;"),
  ("x.pHolm = adj[i];", "x.pHolm = x.p;"),
  ("return { outcome: cells.every(x => x.read.outcome === 'no material harm') ? 'HELD' : cells.some(x => x.read.outcome === 'harm') ? 'FALSIFIED'", "return { outcome: cells.some(x => x.read.outcome === 'no material harm') ? 'HELD' : cells.some(x => x.read.outcome === 'harm') ? 'FALSIFIED'"),
  ("const cells = [0, 1, 2].map(k => {\n      const p = bitsOf(j, `P${k}`)", "const cells = [0, 1].map(k => {\n      const p = bitsOf(j, `P${k}`)"),
  ("if (p[i] && !o[i]) b++; else if (!p[i] && o[i]) c++;", "if (!p[i] && o[i]) b++; else if (p[i] && !o[i]) c++;"),
  ("out['5'] = opening('RZ'); out['6'] = opening('RS'); out.baseOpening = opening('BASE');", "out['5'] = opening('RZ'); out['6'] = opening('RZ'); out.baseOpening = opening('BASE');"),
  ("out['5'] = opening('RZ'); out['6'] = opening('RS'); out.baseOpening = opening('BASE');", "out['5'] = opening('RZ'); out['6'] = opening('RS'); out.baseOpening = opening('RZ');"),
  # the causes
  ("'R-CARRIES': { HELD: 'held', FALSIFIED: 'not' }[o1] || 'open',", "'R-CARRIES': { HELD: 'held' }[o1] || 'open',"),
  ("o2 === 'FALSIFIED' && (o1 === 'HELD' || o1 === 'FALSIFIED') && reaches ? 'not' : 'open',", "o2 === 'FALSIFIED' && reaches ? 'not' : 'open',"),
  ("'S364-RUNSCALED': o2 === 'HELD' ? 'held'", "'S364-RUNSCALED': o1 === 'HELD' ? 'held'"),
  # RS's reach (the plan-auditor's BLOCKING 1 of 13 Oct 02:54 UK)
  ("o2 === 'FALSIFIED' && (o1 === 'HELD' || o1 === 'FALSIFIED') && reaches ? 'not' : 'open',", "o2 === 'FALSIFIED' && (o1 === 'HELD' || o1 === 'FALSIFIED') ? 'not' : 'open',"),
  ("c2.every(c => reachS(c.k) !== null && reachS(c.k) >= REACH)", "c2.every(c => reachS(c.k) !== null && reachS(c.k) > REACH)"),
  ("c2.every(c => reachS(c.k) !== null && reachS(c.k) >= REACH)", "c2.some(c => reachS(c.k) !== null && reachS(c.k) >= REACH)"),
  ("const pbS = (jt('S364', 'RS') || {}).probe, c2 = out['2'].cells.filter(c => c.counted);", "const pbS = (jt('S364', 'RS') || {}).probe, c2 = out['2'].cells;"),
  ("if (!(x.reach >= 0 && x.reach <= 1)) bad.push(", "if (false) bad.push("),
  ("const pbS = (jt('S364', 'RS') || {}).probe", "const pbS = (jt('S364', 'RZ') || {}).probe"),
  # the read end to end
  ("L.push(`6. under RS, S364's own opening", "L.push(`6 under RS, S364's own opening"),
  ("for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);", "for (const [c, v] of Object.entries(it.causes).slice(1)) L.push(`=> ${c} ${v}`);"),
  ("L.push(`OUTCOME: ${['1', '2', '3', '4', '5', '6']", "L.push(`OUTCOME: ${['1', '2', '3', '4', '5']"),
  # every item planted to its three outcomes, and cases naming only the items
  ("const m = /: (\\d+) (HELD|INCONCLUSIVE|FALSIFIED)$/.exec(what);", "const m = /: (\\d) (HELDX|INCONCLUSIVE|FALSIFIED)$/.exec(what);"),
  # (the check that every item is planted to its three outcomes guards the planted set itself, so no plant can catch its
  # removal; the mutant above shows it firing)
  # the rounding the boundaries are read on
  ("export const q = x => Math.round(x * 1e9) / 1e9;", "export const q = x => x;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-needge.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
