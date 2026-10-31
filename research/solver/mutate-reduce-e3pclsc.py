#!/usr/bin/env python3
# E3-PCLS-C'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (RULES.md rule 6 and the mutation rule; the plan-auditor's BACKLOG 8
# on PLAN.md 0c7e1b64af: no mutation run, though E3-PCLS-C's row and e3pcls's research default rest on it). Each mutation
# breaks one part of reduce-e3pclsc.mjs's gate or verdict in a scratch copy, runs its planted set and must see a planted
# failure. Written after the measurement was read (7 Oct): an escape names a check its read lacked, recorded in
# results-mutation-history.txt; it does not reopen the read by itself (its gate passed on real logs, results-e3pclsc.txt).
#   python3 research/solver/mutate-reduce-e3pclsc.py > research/solver/results-reduce-e3pclsc-mutations.txt
from mutate_lib import run
M = [
  # the gate
  ("the gate accepts a missing household", "if (k !== 1) bad.push(`${id}: ${k} case lines, not 1`); }", "if (k > 1) bad.push(`${id}: ${k} case lines, not 1`); }"),
  ("the gate accepts a household not done", "if (!u.done) bad.push(`${u.id}: not done`);", ""),
  ("the gate accepts another grid", "if (u.points !== pts) bad.push(", "if (false) bad.push("),
  ("the gate accepts a missing split line", "if (!s || s.parts !== p || !(s.values > 0)) bad.push(", "if (s && s.parts !== p) bad.push("),
  ("the gate ignores the candidate's settings", "for (const [k, v] of Object.entries(CAND)) if (field(u.ran[a], k) !== v)", "for (const [k, v] of []) if (field(u.ran[a], k) !== v)"),
  ("the gate ignores e3pcls per arm", "if (field(u.ran[a], 'e3pcls') !== (a === 'ON' ? 'true' : 'false')) bad.push(", "if (false) bad.push("),
  ("the gate accepts OFF and ON differing beyond e3pcls", "u.ran.ON.replace(/ e3pcls \\S+/, '') !== u.ran.OFF.replace(/ e3pcls \\S+/, '')", "false"),
  ("the gate accepts a comparison on no arrays", "if (!(u.c.arrays > 0 && u.c.values > 0)) bad.push(", "if (false) bad.push("),
  ("the gate accepts an e3pcls that copied nothing", "if (!(u.c.copied > 0)) bad.push(", "if (false) bad.push("),
  ("the gate accepts a household whose lastPenIn another clause set", "if (u.c.setBy !== expected) bad.push(", "if (false) bad.push("),
  ("the gate accepts a missing plant line", "for (const p of plants) if (!(p in u.plants)) bad.push(", "for (const p of []) if (!(p in u.plants)) bad.push("),
  ("the gate accepts an unregistered plant", "for (const p of Object.keys(u.plants)) if (!plants.includes(p)) bad.push(", "for (const p of []) if (!plants.includes(p)) bad.push("),
  # the verdict
  ("differing values not counted", "if (c.differ !== 0) off.push(", "if (false) off.push("),
  ("the metadata not compared", "if (!u.meta.same) off.push(", "if (false) off.push("),
  ("the reader's counters not compared", "if (!u.meta.reader) off.push(", "if (false) off.push("),
  ("the forward run not compared", "if (u.fwd.differ !== 0) off.push(", "if (false) off.push("),
  ("e3pcls evaluating as many moves passes", "if (!(c.evOn < c.evOff)) off.push(", "if (!(c.evOn <= c.evOff)) off.push("),
  ("a plant at 0 counted caught", "for (const p of plants) if (!(u.plants[p] > 0 || u.plants[p] < 0)) uncaught.push(", "for (const p of []) if (!(u.plants[p] > 0 || u.plants[p] < 0)) uncaught.push("),
  ("the split not compared", "if (s.differ !== 0 || s.cp1 !== s.cpS || s.ev1 !== s.evS) off.push(", "if (false) off.push("),
  ("an uncaught plant read as NOT EXACT", "const v = uncaught.length ? 'PLANT NOT CAUGHT' : off.length ? 'NOT EXACT' : 'EXACT';", "const v = off.length || uncaught.length ? 'NOT EXACT' : 'EXACT';"),
  ("the saving's median off by one", "save.push({ id, pct: 100 * (1 - c.evOn / c.evOff) });", "save.push({ id, pct: 100 * (1 - c.evOn / (c.evOff + 1)) });"),
]
run('reduce-e3pclsc.mjs', M)
