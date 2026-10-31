#!/usr/bin/env python3
# CARRY'S READER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6; the plan-auditor's MINOR 5 and the deep review's retirement pass
# of 8 Oct): each mutation breaks one part of reduce-carry.mjs's gate (G1-G5), statistic, flips, classes, scoring, causes
# or items in a scratch copy, runs the planted set and must see PLANTED CHECK FAILED.
#   python3 research/solver/mutate-reduce-carry.py > research/solver/results-reduce-carry-mutations.txt
from mutate_lib import run
M = [
  ("if (uniq.length !== 1 || !uniq[0]) {", "if (!uniq[0]) {"),
  ("if (st[k].audit !== own) bad.push(", "if (false) bad.push("),
  ("if (a.length !== b.length || a.some((l, i) => l !== b[i])) {", "if (a.length !== b.length) {"),
  # equivalent, left out: `us.length !== 50` made `> 50` (a short run is refused per household and arm before the count can
  # matter), and the seed dropped from G4's N/seed line (traceAgrees checks the seed again)
  ("if (m.length !== 1 || !m[0].done) bad.push(", "if (m.length < 1) bad.push("),
  ("if (m.length !== 1 || !m[0].done) bad.push(", "if (m.length !== 1) bad.push("),
  ("if (ranOf(x.ran) !== ranOf(y.ran)) bad.push(", "if (false) bad.push("),
  ("return moved ? s.replace(/\\s*(tiersAbove|tierState) \\S+/g, '') : s;", "return s.replace(/\\s*(tiersAbove|tierState) \\S+/g, '');"),
  ("return moved ? s.replace(/\\s*(tiersAbove|tierState) \\S+/g, '') : s;", "return s;"),
  ("if (settings(x.joint) !== settings(y.joint)) bad.push(", "if (JSON.stringify(x.joint) !== JSON.stringify(y.joint)) bad.push("),
  ("if (settings(x.joint) !== settings(y.joint)) bad.push(", "if (false) bad.push("),
  ("if (new Set(ys).size !== 1) bad.push(", "if (false) bad.push("),
  ("if (!f || f.saved !== c.saved || f.lost !== c.lost) bad.push(", "if (!f || f.lost !== c.lost) bad.push("),
  ("return SIX.filter(f => a.raw[f] !== b.raw[f])", "return SIX.filter(f => f !== 'survived' && a.raw[f] !== b.raw[f])"),
  ("const departs = Math.abs(sum) >= MIN_SUM && sum !== 0 && Math.abs(ch) >= Z * se;", "const departs = sum !== 0 && Math.abs(ch) >= Z * se;"),
  ("const departs = Math.abs(sum) >= MIN_SUM && sum !== 0 && Math.abs(ch) >= Z * se;", "const departs = Math.abs(sum) >= MIN_SUM && sum !== 0;"),
  ("const departs = Math.abs(sum) >= MIN_SUM && sum !== 0 && Math.abs(ch) >= Z * se;", "const departs = Math.abs(sum) > MIN_SUM && sum !== 0 && Math.abs(ch) >= Z * se;"),
  ("const held = arm === 'SHIP' ? first : second, counter = arm === 'SHIP' ? second : first;", "const held = arm === 'SHIP' ? second : first, counter = arm === 'SHIP' ? first : second;"),
  ("real: held || ra,", "real: held,"),
  ("Number(gap[id]) >= GAP_LO && Number(gap[id]) <= GAP_HI", "Number(gap[id]) > GAP_LO && Number(gap[id]) <= GAP_HI"),
  ("Number(gap[id]) >= GAP_LO && Number(gap[id]) <= GAP_HI", "Number(gap[id]) >= GAP_LO && Number(gap[id]) < GAP_HI"),
  ("Math.min(it[id].saved, it[id].lost) >= CHURN", "Math.min(it[id].saved, it[id].lost) > CHURN"),
  ("const F2 = dep.every(id => fl(id) || cls.hc.includes(id));", "const F2 = dep.every(id => fl(id));"),
  ("const F3 = !nineteen.some(id => H[id].dep && !fl(id));", "const F3 = !nineteen.some(id => H[id].dep);"),
  ("const split = dep.length > 0 && !allFlip && !allHC && !anyOther;", "const split = false;"),
  ("otherBy.every(id => cls.sw.includes(id))", "otherBy.some(id => cls.hc.includes(id))"),
  ("const F1 = { p: P.F1, held: b4.ship.any, edge: b4.ship.any && !b4.ship.real };", "const F1 = { p: P.F1, held: b4.ship.any, edge: false };"),
  ("const F4 = b4.ship.firstRises ?", "const F4 = b4.ship.any ?"),
  ("edge: lit.F2 !== alt.F2 }", "edge: false }"),
  ("return { REOPT: least >= lo && least <= hi,", "return { REOPT: least > lo && least <= hi,"),
  ("if (F.some(f => f.edge)) return 'INCONCLUSIVE';", ""),
  ("return (least.hi < lo || least.lo > hi) ? 'FALSIFIED' : 'INCONCLUSIVE';", "return 'FALSIFIED';"),
  ("if (least.d >= lo && least.d <= hi) return 'HELD';", "if (least.d >= lo && least.d < hi) return 'HELD';"),
]
M = [m for m in M if m[0] != m[1]]
run('reduce-carry.mjs', [(f'{i + 1}: {old[:60]}', old, new) for i, (old, new) in enumerate(M)])
