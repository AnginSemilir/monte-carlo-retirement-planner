#!/usr/bin/env python3
# NODE-1'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; every mutant caught before launch): each mutation breaks one
# part of reduce-node1.mjs's gate, items, cause map, reach or read in a scratch copy, runs the planted set on the copy and
# must see PLANTED CHECK FAILED (mutate_lib.py, which logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-reduce-node1.py > research/solver/results-reduce-node1-mutations.txt
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
  ("if (!j.checks.armTook || j.checks.armTook[0] !== 1)", "if (!j.checks.armTook)"),
  ("if (!j.solve) bad.push(", "if (false) bad.push("),
  ("if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(", "if (false) bad.push("),
  ("if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(", "if (!s) bad.push("),
  ("if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(", "if (!s || s.n !== npw || s.bridge < s.ok) bad.push("),
  ("if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(", "if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push("),
  ("j.checks.forceIdentity[0] !== FI || j.checks.forceIdentity[1] !== FI", "j.checks.forceIdentity[0] !== j.checks.forceIdentity[1]"),
  ("if (!f) bad.push(`${k}: its file ${j.file} is missing`);", "if (!f) ;"),
  ("if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x]))", "if (!f.stamp)"),
  ("if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(", "if (!x) bad.push("),
  # the reach
  ("return [0, 1, 2].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length;", "return [0, 1].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length;"),
  ("return [0, 1, 2].filter(k => bn.tables[k].OWN !== bo.tables[k].OWN).length;", "return 3;"),
  # item 1
  ("const s = bn.sims[`OWN${k}`], [l, h] = cp(s.ok, s.n, 2 * a1), D = bn.tables[k].OWN - bo.tables[k].OWN;", "const s = bn.sims[`OWN${k}`], [l, h] = cp(s.ok, s.n, 2 * a1), D = bn.tables[k].OWN - 0;"),
  ("const s = bn.sims[`OWN${k}`], [l, h] = cp(s.ok, s.n, 2 * a1), D = bn.tables[k].OWN - bo.tables[k].OWN;", "const s = bn.sims[`OWN${k}`], [l, h] = cp(s.ok, s.n, 4 * a1), D = bn.tables[k].OWN - bo.tables[k].OWN;"),
  ("const G = 100 * s.ok / s.n - bo.tables[k].OWN,", "const G = 100 * s.ok / s.n - bn.tables[k].OWN,"),
  ("const shown = q(Glo) > 0,", "const shown = q(Glo) >= 0,"),
  ("const shown = q(Glo) > 0,", "const shown = true,"),
  ("const Slo = shown ? (D >= 0 ? D / Ghi : D / Glo) : -Infinity,", "const Slo = shown ? (D >= 0 ? D / Glo : D / Ghi) : -Infinity,"),
  ("Shi = shown ? (D >= 0 ? D / Glo : D / Ghi) : Infinity;", "Shi = shown ? (D >= 0 ? D / Ghi : D / Glo) : Infinity;"),
  ("Shi = shown ? (D >= 0 ? D / Glo : D / Ghi) : Infinity;", "Shi = shown ? D / Glo : Infinity;"),
  ("c1.every(x => x.Slo >= SHARE_HELD) ? 'HELD'", "c1.every(x => x.Slo > SHARE_HELD) ? 'HELD'"),
  ("c1.every(x => x.Slo >= SHARE_HELD) ? 'HELD'", "c1.some(x => x.Slo >= SHARE_HELD) ? 'HELD'"),
  ("c1.every(x => x.Shi <= SHARE_FALS) ? 'FALSIFIED'", "c1.every(x => x.Shi < SHARE_FALS) ? 'FALSIFIED'"),
  ("c1.every(x => x.Shi <= SHARE_FALS) ? 'FALSIFIED'", "c1.some(x => x.Shi <= SHARE_FALS) ? 'FALSIFIED'"),
  ("const c1 = [0, 1].map(k => shareOf(bn, bo, k));", "const c1 = [1, 2].map(k => shareOf(bn, bo, k));"),
  ("out.over = out.off.some(x => x.bn.lo > OVER);", "out.over = out.off.some(x => x.bn.lo >= OVER);"),
  ("out.over = out.off.some(x => x.bn.lo > OVER);", "out.over = out.off.slice(0, 2).some(x => x.bn.lo > OVER);"),
  ("out.over = out.off.some(x => x.bn.lo > OVER);", "out.over = out.off.some(x => x.bn.d > OVER);"),
  ("export function offOf(table, ok, n, al) { const [l, h] = cp(ok, n, al); return { d: q(table - 100 * ok / n), lo: q(table - 100 * h), hi: q(table - 100 * l) }; }", "export function offOf(table, ok, n, al) { const [l, h] = cp(ok, n, al); return { d: q(table - 100 * ok / n), lo: q(table - 100 * l), hi: q(table - 100 * h) }; }"),
  # item 2
  ("const t2 = ref2 ? [0, 1, 2].map(k => !!ref2.tables[k] && bo.tables[k].OWN === ref2.tables[k].OWN)", "const t2 = ref2 ? [0, 1].map(k => !!ref2.tables[k] && bo.tables[k].OWN === ref2.tables[k].OWN)"),
  ("return !!b && a.bits === b.bits && a.bitsB === b.bitsB;", "return !!b && a.bits === b.bits;"),
  ("return !!b && a.bits === b.bits && a.bitsB === b.bitsB;", "return !!b;"),
  ("outcome: !ref2 ? 'INCONCLUSIVE' : t2.some(x => !x) ? 'FALSIFIED'", "outcome: !ref2 ? 'HELD' : t2.some(x => !x) ? 'FALSIFIED'"),
  ("t2.some(x => !x) ? 'FALSIFIED' : r2.every(Boolean) ? 'HELD' : 'INCONCLUSIVE'", "t2.some(x => !x) ? 'FALSIFIED' : 'HELD'"),
  # the causes
  ("'O152-NODE': ok2 ? ({ HELD: 'held', FALSIFIED: 'not' }[o1] || 'open') : 'open',", "'O152-NODE': ({ HELD: 'held', FALSIFIED: 'not' }[o1] || 'open'),"),
  ("'O152-MODEL': ok2 ? ({ HELD: 'not', FALSIFIED: 'held' }[o1] || 'open') : 'open' };", "'O152-MODEL': ok2 ? ({ HELD: 'held', FALSIFIED: 'not' }[o1] || 'open') : 'open' };"),
  ("const o1 = out['1'].outcome, ok2 = out['2'].outcome === 'HELD';", "const o1 = out['1'].outcome, ok2 = out['2'].outcome !== 'FALSIFIED';"),
  # the reported figures
  ("if (A[i] && !B[i]) a++; else if (!A[i] && B[i]) b++;", "if (A[i] && !B[i]) a++;"),
  ("const j = arm === 'BN' ? bn : bo, w = j.tables.map(t => t.w)", "const j = arm === 'BN' ? bn : bo, w = j.tables.map(t => 1 / 3)"),
  # the read end to end
  ("L.push(`1. the explicit share nodes", "L.push(`1 the explicit share nodes"),
  ("for (const [c, v] of Object.entries(it.causes)) L.push(`=> ${c} ${v}`);", "for (const [c, v] of Object.entries(it.causes).slice(1)) L.push(`=> ${c} ${v}`);"),
  ("L.push(`OUTCOME: ${['1', '2'].map", "L.push(`OUTCOME: ${['1'].map"),
  ("L.push(`REALISED item 1: ${f4(it['1'].cells[0].S)}`);", ""),
  ("L.push(`OVER-CORRECTION (BN's table above its runs by more than ${OVER} point, shown, in any world): ${it.over ? 'YES' : 'NO'}`);", ""),
  # the rounding
  ("export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);", "export const q = x => x;"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-node1.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
