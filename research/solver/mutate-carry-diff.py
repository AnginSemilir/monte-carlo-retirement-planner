#!/usr/bin/env python3
# CARRY-DIFF'S PLANTED CHECKS, SHOWN TO FAIL (RULES.md rule 6): each mutation breaks one part of carry-diff.mjs's parse,
# match or diff in a scratch copy, runs its planted set and must see PLANTED CHECK FAILED.
#   python3 research/solver/mutate-carry-diff.py > research/solver/results-carry-diff-mutations.txt
from mutate_lib import run
M = [
  ("the filter ignored", "const T = to.units.filter(u => Object.entries(filter).every(([k, v]) => u.f[k] === v));", "const T = to.units;"),
  ("an empty side or no shared household not an error", "if (!shared.length) throw new Error(", "if (false) throw new Error("),
  ("households in the new panel only not named", "onlyTo: [...idsT].filter(id => !idsF.has(id)), arms: {} };", "onlyTo: [], arms: {} };"),
  ("matched by household alone, not arm", "const a = from.units.filter(u => u.id === id && u.arm === arm), b = T.filter(u => u.id === id && u.arm === arm);", "const a = from.units.filter(u => u.id === id), b = T.filter(u => u.id === id && u.arm === arm);"),
  ("a field on the new side only read as the same", "if (x === undefined && y !== undefined) ot.add(y); else", "if (false) ot.add(y); else"),
  ("differences not counted", "else if (x !== y) { n++;", "else if (false) { n++;"),
  ("the joint line not read", "m = JOINT.exec(L); if (m && m[1] === cur.label)", "m = JOINT.exec(L); if (false)"),
  ("the joint margin folded into the ran line's", "cur.f[k === 'switchMargin' ? 'jointMargin' : k] = v;", "cur.f[k] = v;"),
  ("a ran line under another unit's label read", "m = RAN.exec(L); if (m && m[1] === cur.label)", "m = RAN.exec(L); if (m)"),
  ("the stamps not read", "m = STAMP.exec(L); if (m) { stamps.add(", "m = STAMP.exec(L); if (false) { stamps.add("),
]
run('carry-diff.mjs', M)
