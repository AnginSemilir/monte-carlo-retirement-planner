#!/usr/bin/env python3
# NE-GRID C'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; held to every mutant caught before launch, O144): each mutation
# breaks one part of reduce-negrid-c.mjs's gate, intervals, items or cause map in a scratch copy, runs the planted set on
# the copy and must see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-negrid-c.py > research/solver/results-reduce-negrid-c-mutations.txt
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
  ("Object.entries({ ...COMMON, readerBlend: BLEND[j.arm] })", "Object.entries({ ...COMMON })"),
  ("Object.entries({ ...COMMON, readerBlend: BLEND[j.arm] })", "Object.entries({ readerBlend: BLEND[j.arm] })"),
  ("if ((j.arm === 'ORDER') !== (field(ran, 'readerRef') === 'order'))", "if (j.arm === 'ORDER' && field(ran, 'readerRef') !== 'order')"),
  ("if ((j.arm === 'ORDER') !== (field(ran, 'readerRef') === 'order'))", "if (j.arm !== 'ORDER' && field(ran, 'readerRef') === 'order')"),
  ("if (field(ran, 'pts') !== String(pts)) bad.push(", "if (false) bad.push("),
  ("if (field(ran, 'grid') !== `total${pts}x${reg[3]}x${reg[3]}`)", "if (false)"),
  ("if (field(ran, 'mix') !== '3')", "if (false)"),
  ("j.pair.P !== PAIRS[j.id][0] || j.pair.D", "j.pair.D"),
  ("j.pair.tP !== '0,0' || j.pair.tD !== '2,2' || j.pair.lP !== j.pair.lD", "j.pair.tP !== '0,0' || j.pair.lP !== j.pair.lD"),
  ("j.pair.tP !== '0,0' || j.pair.tD !== '2,2' || j.pair.lP !== j.pair.lD", "j.pair.tP !== '0,0' || j.pair.tD !== '2,2'"),
  ("else if (j.arm !== 'LOR' && j.reader.clampN !== 0) bad.push(", "else if (false) bad.push("),
  ("if (j.tables.length !== 3 || j.tables.some((x, i) => x.k !== i))", "if (j.tables.length > 3)"),
  ("const need = [['P', npw * mult], ['D', npw],", "const need = [['P', npw], ['D', npw],"),
  ("if (!s || s.n !== np) bad.push(", "if (!s) bad.push("),
  ("...(j.own && j.pair && j.own.ai !== j.pair.P && j.own.ai !== j.pair.D ? [['OWN', npw]] : [])", "...([])"),
  ("j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi", "j.checks.forceIdentity[0] !== j.checks.forceIdentity[1]"),
  ("j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi", "j.checks.forceIdentity[0] !== fi"),
  ("if (!f) bad.push(`${k}: its file ${j.file} is missing`);", "if (!f) ;"),
  ("if (!f.stamp || !j.stamp || ['code', 'audit', 'prediction'].some(x => f.stamp[x] !== j.stamp[x]))", "if (!f.stamp)"),
  ("typeof f.bits[nm] !== 'string' || sha16(Buffer.from(f.bits[nm], 'base64')) !== s.bits", "typeof f.bits[nm] !== 'string'"),
  ("typeof f.bits[nm] !== 'string' || sha16(Buffer.from(f.bits[nm], 'base64')) !== s.bits", "f.bits[nm] !== undefined && sha16(Buffer.from(f.bits[nm], 'base64')) !== s.bits"),
  # the intervals
  ("const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * h, hi: table - 100 * l };", "const [l, h] = clopperPearson(ok, n, 2 * a1); return { d: table - 100 * ok / n, lo: table - 100 * l, hi: table - 100 * h };"),
  ("const a1 = ALPHA / 6;", "const a1 = ALPHA / 2;"),
  # item 1
  ("const counted = q(Math.abs(m1)) >= GMIN;", "const counted = q(Math.abs(m1)) > GMIN;"),
  ("const counted = q(Math.abs(m1)) >= GMIN;", "const counted = true;"),
  ("for (const o of ['P', 'D']) for (const k of [0, 1]) {", "for (const o of ['P', 'D']) for (const k of [0, 1, 2]) {"),
  ("out[1] = { outcome: read3(cells, c => c.r <= SECOND, c => c.r >= FIRST), cells, lorCells };", "out[1] = { outcome: read3(cells, c => c.r < SECOND, c => c.r >= FIRST), cells, lorCells };"),
  ("out[1] = { outcome: read3(cells, c => c.r <= SECOND, c => c.r >= FIRST), cells, lorCells };", "out[1] = { outcome: read3(cells, c => c.r <= SECOND, c => c.r > FIRST), cells, lorCells };"),
  ("r: counted ? q(Math.abs(m2) / Math.abs(m1)) : null", "r: counted ? q(m2 / m1) : null"),
  ("const t30 = B1[id][arm].coarse[k][o], t60 = B1[id][arm].fine[k][o], t120 = jt(id, label).tables[k][o], m1 = t60 - t30, m2 = t120 - t60;", "const t30 = B1[id][arm].coarse[k][o], t60 = B1[id][arm].fine[k][o], t120 = jt(id, label).tables[k][o], m1 = t60 - t30, m2 = t120 - t30;"),
  ("['S224', 'BASE', 'BASE/P120S6Q5'], ['S380', 'LOR', 'LOR/P120S6Q5']]) for (const o", "['S380', 'LOR', 'LOR/P120S6Q5']]) for (const o"),
  ("(arm === 'LOR' ? lorCells : cells).push(", "cells.push("),
  ("return cc.length && cc.every(hold) ? 'HELD'", "return cc.every(hold) ? 'HELD'"),
  ("return cc.length && cc.every(hold) ? 'HELD' : cc.length && cc.every(fals)", "return cc.length && cc.some(hold) ? 'HELD' : cc.length && cc.every(fals)"),
  ("cc.length && cc.every(fals) ? 'FALSIFIED'", "cc.length && cc.some(fals) ? 'FALSIFIED'"),
  # item 2
  ("out[2] = { outcome: u2.some(x => q(x.hi) < -UNDER) ? 'HELD'", "out[2] = { outcome: u2.some(x => q(x.d) < -UNDER) ? 'HELD'"),
  ("out[2] = { outcome: u2.some(x => q(x.hi) < -UNDER) ? 'HELD'", "out[2] = { outcome: u2.some(x => q(x.hi) <= -UNDER) ? 'HELD'"),
  ("u2.every(x => q(Math.abs(x.d)) <= UNDER) ? 'FALSIFIED'", "u2.every(x => q(Math.abs(x.d)) < UNDER) ? 'FALSIFIED'"),
  ("u2.every(x => q(Math.abs(x.d)) <= UNDER) ? 'FALSIFIED'", "u2.every(x => q(x.d) <= UNDER) ? 'FALSIFIED'"),
  ("const j2 = jt('S224', 'BASE/P120S6Q5'), u2 = [0, 1].map(", "const j2 = jt('S224', 'BASE/P120S6Q5'), u2 = [0, 1, 2].map("),
  # items 3 and 4
  ("const rise = j.tables[x.k].P - B1.S224.BASE.fine[x.k].P, counted = q(-x.u) >= GMIN;", "const rise = j.tables[x.k].P - B1.S224.BASE.fine[x.k].P, counted = q(-x.u) > GMIN;"),
  ("const rise = j.tables[x.k].P - B1.S224.BASE.fine[x.k].P, counted = q(-x.u) >= GMIN;", "const rise = j.tables[x.k].P - B1.S224.BASE.fine[x.k].P, counted = q(Math.abs(x.u)) >= GMIN;"),
  ("frac: counted ? q(rise / -x.u) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac < LITTLE), cells: c }; };\n  out['3']", "frac: counted ? q(rise / -x.u) : null }; }); return { outcome: read3(c, x => x.frac > CARRY, x => x.frac < LITTLE), cells: c }; };\n  out['3']"),
  ("frac: counted ? q(rise / -x.u) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac < LITTLE), cells: c }; };\n  out['3']", "frac: counted ? q(rise / -x.u) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac <= LITTLE), cells: c }; };\n  out['3']"),
  ("out['3'] = carry('BASE/P60S6Q15'); out['4'] = carry('BASE/P60S12Q5');", "out['3'] = carry('BASE/P60S12Q5'); out['4'] = carry('BASE/P60S12Q5');"),
  ("out['3'] = carry('BASE/P60S6Q15'); out['4'] = carry('BASE/P60S12Q5');", "out['3'] = carry('BASE/P60S6Q15'); out['4'] = carry('BASE/P60S6Q15');"),
  ("const under60 = [0, 1].map(k => { const s = b1Runs224[k]; return { k, u: B1.S224.BASE.fine[k].P - 100 * s.ok / s.n }; });", "const under60 = [0, 1].map(k => { const s = b1Runs224[k]; return { k, u: B1.S224.BASE.coarse[k].P - 100 * s.ok / s.n }; });"),
  # items 5-7
  ("const dropped = b4.tables[x.k].P - j.tables[x.k].P, counted = q(x.o) >= GMIN;", "const dropped = b4.tables[x.k].P - j.tables[x.k].P, counted = q(Math.abs(x.o)) >= GMIN;"),
  ("const dropped = b4.tables[x.k].P - j.tables[x.k].P, counted = q(x.o) >= GMIN;", "const dropped = j.tables[x.k].P - b4.tables[x.k].P, counted = q(x.o) >= GMIN;"),
  ("frac: counted ? q(dropped / x.o) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac < LITTLE), cells: c }; };", "frac: counted ? q(dropped / x.o) : null }; }); return { outcome: read3(c, x => x.frac >= CARRY, x => x.frac < 0), cells: c }; };"),
  ("out['5'] = fall('BASE/P60S12Q5'); out['6'] = fall('BASE/P120S6Q5'); out['7'] = fall('ORDER/P60S6Q5');", "out['5'] = fall('BASE/P60S12Q5'); out['6'] = fall('ORDER/P60S6Q5'); out['7'] = fall('ORDER/P60S6Q5');"),
  ("out['5'] = fall('BASE/P60S12Q5'); out['6'] = fall('BASE/P120S6Q5'); out['7'] = fall('ORDER/P60S6Q5');", "out['5'] = fall('BASE/P120S6Q5'); out['6'] = fall('BASE/P120S6Q5'); out['7'] = fall('ORDER/P60S6Q5');"),
  # item 8
  ("w5.every(x => q(Math.abs(x.d)) <= CTRL) ? 'HELD'", "w5.every(x => q(Math.abs(x.d)) < CTRL) ? 'HELD'"),
  ("w5.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED'", "w5.some(x => q(x.lo) > CTRL) ? 'FALSIFIED'"),
  ("w5.some(x => q(x.lo) > CTRL || q(x.hi) < -CTRL) ? 'FALSIFIED'", "w5.some(x => q(x.d) > CTRL || q(x.d) < -CTRL) ? 'FALSIFIED'"),
  ("o5 = j5.own.ai === j5.pair.P ? 'P' : j5.own.ai === j5.pair.D ? 'D' : 'OWN';", "o5 = 'P';"),
  # the causes
  ("'RG-WSLOW': out[1].outcome === 'FALSIFIED' ? 'held' : out[1].outcome === 'HELD' ? 'not' : 'open',", "'RG-WSLOW': out[1].outcome === 'FALSIFIED' ? 'held' : 'not',"),
  ("'RG-PATHS': out[2].outcome === 'FALSIFIED' && lucky ? 'held'", "'RG-PATHS': out[2].outcome === 'FALSIFIED' ? 'held'"),
  ("q(j2.tables[k].P - 100 * extra.first4k(k) / NPW) < -UNDER", "q(j2.tables[k].P - 100 * extra.first4k(k) / NPW) <= -UNDER"),
  ("const lucky = [0, 1].some(", "const lucky = [0].some("),
  ("q(x.o) >= q(0.5 * extra.over30[k])", "q(x.o) > q(0.5 * extra.over30[k])"),
  ("'S364-W': out['6'].outcome === 'HELD' ? 'held' : out['6'].outcome === 'FALSIFIED' && keepsMost ? 'not' : 'open',", "'S364-W': out['6'].outcome === 'HELD' ? 'held' : out['6'].outcome === 'FALSIFIED' ? 'not' : 'open',"),
  ("'S364-W': out['6'].outcome === 'HELD' ? 'held' : out['6'].outcome === 'FALSIFIED' && keepsMost ? 'not' : 'open',", "'S364-W': out['5'].outcome === 'HELD' ? 'held' : out['6'].outcome === 'FALSIFIED' && keepsMost ? 'not' : 'open',"),
  # the read end to end (the bug of the plan-auditor's BLOCKING 1 of 12 Oct 08:12 UK, planted back)
  ("at ${it[8].o}: ${it[8].w.map(", "at ${it[5].o}: ${it[5].w.map("),
  ("for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);", "for (const [c, v] of Object.entries(it.causes).slice(1)) L.push(`=> ${c} ${v}`);"),
  ("'RG-UNMASK': out[2].outcome === 'HELD' && (out['3'].outcome === 'HELD' || out['4'].outcome === 'HELD') ? 'held'", "'RG-UNMASK': out[2].outcome === 'HELD' ? 'held'"),
  ("'RG-UNMASK': out[2].outcome === 'HELD' && (out['3'].outcome === 'HELD' || out['4'].outcome === 'HELD') ? 'held'", "'RG-UNMASK': out[2].outcome === 'HELD' && out['3'].outcome === 'HELD' ? 'held'"),
  ("'S364-REF': { HELD: 'held', FALSIFIED: 'not' }[out['7'].outcome] || 'open',", "'S364-REF': { HELD: 'held' }[out['7'].outcome] || 'open',"),
  # the rounding the boundaries are read on
  ("export const q = x => Math.round(x * 1e9) / 1e9;", "export const q = x => x;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-negrid-c.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
