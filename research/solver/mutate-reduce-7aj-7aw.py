#!/usr/bin/env python3
# 7AJ'S AND 7AW'S REDUCERS' PLANTED CHECKS, SHOWN TO FAIL (RULES.md rule 6 and the mutation rule; the plan-auditor's
# BACKLOG 8 on PLAN.md 0c7e1b64af: neither had a mutation run, though 7aj's and 7aw's rows rest on them, and 7u's reducer
# is built on them). The two files are the same code but for the estate weight and their comments, so one list runs on
# both: each mutation breaks one part of the gate, the trace check or an item in a scratch copy, runs the copy's planted
# set and must see PLANTED CHECK FAILED. Written after both tests were read (7aj 7 Oct, 7aw 8 Oct): a mutation that
# escapes names a planted check those reads lacked, recorded in results-mutation-history.txt and carried into 7u's
# reducer as a plant; it does not reopen either read by itself (their gates passed on real logs, results-7aj.txt and
# results-7aw.txt).
#   python3 research/solver/mutate-reduce-7aj-7aw.py > research/solver/results-reduce-7aj-7aw-mutations.txt
import sys
from mutate_lib import run
M = [
  # the gate: the units
  ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }", "if (k > 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }"),
  ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }", "if (k < 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }"),
  ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
  ("the gate ignores the unit line's lambda", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (u.tier !== 'own'"),
  ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${tag}: no solve line`);", ""),
  ("the gate accepts a missing ran line", "if (!u.ran) bad.push(`${tag}: no ran line`);\n    else {", "if (!u.ran) {}\n    else {"),
  ("the gate ignores the estate weight", "bequestWeight: W, ...WANT_ARM[u.arm] };", "...WANT_ARM[u.arm] };"),
  ("the gate ignores the paths", "seed: SEED, paths: String(n), grid:", "seed: SEED, grid:"),
  ("the gate ignores the points (and the grid that names them)", "pts, seed: SEED, paths: String(n), grid: `total${pts}x6x6`,", "seed: SEED, paths: String(n),"),
  ("the gate takes SHIP with the reader", "SHIP: { bridgeRead: 'false', bridgeStep: null,", "SHIP: { bridgeStep: null,"),
  ("the gate takes SHIP with the tier state", "bridgeStep: null, tierState: null, switchMargin: '0.001'", "bridgeStep: null, switchMargin: '0.001'"),
  ("the gate takes SHIP with the interpolated allowance axis", "switchCharge: '0', e3: 'false', pclsInterp: 'false' }", "switchCharge: '0', e3: 'false' }"),
  ("the gate takes CAND without Q's step", "CAND: { bridgeRead: 'reader', bridgeStep: 'exact', switchMargin", "CAND: { bridgeRead: 'reader', switchMargin"),
  ("the gate takes CAND without the charge", "switchMargin: '0', switchCharge: '0.001', e3: 'true'", "switchMargin: '0', e3: 'true'"),
  ("the gate takes CAND without e3", "switchCharge: '0.001', e3: 'true', pclsInterp: 'true' }", "switchCharge: '0.001', pclsInterp: 'true' }"),
  ("the gate takes CAND without the tier state", "if (isC && !field(u.ran, 'tierState')) bad.push", "if (false) bad.push"),
  ("the gate takes a readerRef, coverage, holdTier or death tax on the ran line", "for (const k of ['holdTier', 'readerRef', 'coverage', 'deathTax']) if (field(u.ran, k) !== null)", "for (const k of []) if (field(u.ran, k) !== null)"),
  ("the gate takes other tiers", "if (!tiersOk(field(u.ran, 'tiers'), reals)) bad.push", "if (false) bad.push"),
  ("the tiers check takes a sixth tier", "return Object.keys(m).length === TIERS.length && TIERS.every", "return TIERS.every"),
  ("the gate accepts a missing gap line", "if (!u.gap) bad.push(`${tag}: no year-0 gap line`);", ""),
  ("the gate ignores the joint flag", "if (u.joint.joint !== isC) bad.push", "if (false) bad.push"),
  ("the gate ignores the solve's margin", "if (u.joint.margin !== (isC ? '0' : '0.001')) bad.push", "if (false) bad.push"),
  ("the gate ignores a pension death charge", "if (u.joint.deathTax !== 0) bad.push", "if (false) bad.push"),
  ("the gate accepts world lines", "if (u.worlds.length) bad.push", "if (false) bad.push"),
  ("the gate accepts a missing run line", "if (!u.run) bad.push(`${tag}: no run line`);", ""),
  ("the done line is not required", "if (!u.done) bad.push(`${tag}: no done line`);", ""),
  ("the gate strips minPot within a household", "const ARM_FIELDS = ['tierState',", "const ARM_FIELDS = ['minPot', 'tierState',"),
  ("the gate refuses a tier above in one arm only", "'pclsInterp', 'tiersAbove'];", "'pclsInterp'];"),
  ("the gate ignores a settings difference within a household", "if (u.ran && ref && strip(u.ran) !== strip(ref.ran)) bad.push", "if (false) bad.push"),
  ("the gate ignores the scale within a household", "(u.joint.scale !== refJ.joint.scale || u.joint.cap !== refJ.joint.cap)", "(u.joint.cap !== refJ.joint.cap)"),
  # the traces
  ("the trace agreement ignores the arm", "j.arm === `${arm}/${l}` && ['code'", "['code'"),
  ("the trace agreement ignores the stamp", "['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k])", "true"),
  ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);", ");"),
  ("the trace tolerance ten times wider", "SIM_TOL = 5e-5 + 1e-9", "SIM_TOL = 5e-4 + 1e-9"),
  ("a trace off its log is not refused", "if (!traceAgrees(t, ST, u.arm, u.label, u.run.sim, n)) { bad.push(", "if (false) { bad.push("),
  # item 1
  ("item 1 reads harm the wrong way round", "p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });", "p: mcnemarHarmP(k.saved, k.lost), margin: margin(id) }; });"),
  ("item 1 at the margin 0.25 everywhere", "p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });", "p: mcnemarHarmP(k.lost, k.saved), margin: 0.25 }; });"),
  ("the margins: S130 at 0.25", "['share 0.95', 'S360', 'S128', 'S130', 'S370'].includes(id) ? 0.5 : 0.25", "['share 0.95', 'S360', 'S128', 'S370'].includes(id) ? 0.5 : 0.25"),
  ("item 1 without Holm", "legs.forEach((l, i) => { l.pHolm = adj[i];", "legs.forEach((l, i) => { l.pHolm = l.p;"),
  ("item 1 passes without the unconditional interval", "l.pass = o.outcome === 'no material harm' && l.u.lo > -l.margin;", "l.pass = o.outcome === 'no material harm';"),
  ("item 1's interval unguarded", "const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);", "const guardedU = k => survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA);"),
  ("item 1 FALSIFIED only when every household reads harm", "outcome: tri(legs.every(l => l.pass), legs.some(l => l.o === 'harm')) }); }", "outcome: tri(legs.every(l => l.pass), legs.every(l => l.o === 'harm')) }); }"),
  # item 2
  ("item 2 takes a lower end at minus the margin", "outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) }); }", "outcome: tri(legs.every(l => l.lo >= -l.margin), legs.some(l => l.hi < -l.margin)) }); }"),
  ("item 2 FALSIFIED on a lower end", "outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) }); }", "outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.lo < -l.margin)) }); }"),
  ("item 2 at the margin 0.25 everywhere", "const legs = PANEL.map(id => ({ id, ...WL(id), margin: margin(id) }));", "const legs = PANEL.map(id => ({ id, ...WL(id), margin: 0.25 }));"),
  # item 3
  ("item 3 HELD without the mean", "legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M", "legs.every(l => l.lo > SPEND_H)"),
  ("item 3 FALSIFIED without the mean", "legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M", "legs.some(l => l.hi < SPEND_H)"),
  ("item 3's household line at -6%", "SPEND_H = -0.05", "SPEND_H = -0.06"),
]
ok = [run(t, M, exit=False) for t in ('reduce-7aj.mjs', 'reduce-7aw.mjs')]
sys.exit(0 if all(ok) else 1)
