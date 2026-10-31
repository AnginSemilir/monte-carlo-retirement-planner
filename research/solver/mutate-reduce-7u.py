#!/usr/bin/env python3
# 7U'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (RULES.md rule 6 and the mutation rule; items/7u.md, 8 Oct item 7): each
# mutation breaks one part of reduce-7u.mjs's gate, stage check, trace check or an item in a scratch copy, runs the planted
# set and must see PLANTED CHECK FAILED. The five checks 7aj's and 7aw's run found missing (a ran, gap or run line; a
# forbidden field on the ran line; the guard on item 1's interval) are among them; panel-7u.mjs's gain set is mutated
# through its own module.
#   python3 research/solver/mutate-reduce-7u.py > research/solver/results-reduce-7u-mutations.txt
from mutate_lib import run
M = [
  # the gate: the units
  ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }", "if (k > 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }"),
  ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }", "if (k < 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }"),
  ("the gate accepts an unregistered unit", "if (!reg) { bad.push(`${tag}: not a registered unit`); continue; }", "if (!reg) { continue; }"),
  ("the gate ignores the unit line's lambda", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (u.tier !== 'own'"),
  ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${tag}: no solve line`);", ""),
  ("the gate accepts a missing ran line", "if (!u.ran) bad.push(`${tag}: no ran line`);\n    else {", "if (!u.ran) {}\n    else {"),
  ("the gate ignores the unit's weight", "finalIntegral: 'true', bequestWeight: w, ...WANT_ARM[u.arm] };", "finalIntegral: 'true', ...WANT_ARM[u.arm] };"),
  ("the gate ignores the seed", "const want = { mix: '3', pts, seed, paths:", "const want = { mix: '3', pts, paths:"),
  ("the gate ignores the paths", "seed, paths: String(n), grid:", "seed, grid:"),
  ("the gate ignores the points and the grid", "const want = { mix: '3', pts, seed, paths: String(n), grid: `total${pts}x6x6`,", "const want = { mix: '3', seed, paths: String(n),"),
  ("the gate takes SHIP with the reader", "SHIP: { bridgeRead: 'false', bridgeStep: null,", "SHIP: { bridgeStep: null,"),
  ("the gate takes SHIP with the tier state", "bridgeStep: null, tierState: null, switchMargin: '0.001'", "bridgeStep: null, switchMargin: '0.001'"),
  ("the gate takes SHIP with e3pcls", "e3: 'false', e3pcls: 'false', pclsInterp: 'false' }", "e3: 'false', pclsInterp: 'false' }"),
  ("the gate takes SHIP with the interpolated allowance axis", "e3pcls: 'false', pclsInterp: 'false' }", "e3pcls: 'false' }"),
  ("the gate takes CAND without Q's step", "CAND: { bridgeRead: 'reader', bridgeStep: 'exact', switchMargin", "CAND: { bridgeRead: 'reader', switchMargin"),
  ("the gate takes CAND without the charge", "switchMargin: '0', switchCharge: '0.001', e3: 'true'", "switchMargin: '0', e3: 'true'"),
  ("the gate takes CAND without e3", "switchCharge: '0.001', e3: 'true', e3pcls: 'true'", "switchCharge: '0.001', e3pcls: 'true'"),
  ("the gate takes CAND without e3pcls", "e3: 'true', e3pcls: 'true', pclsInterp: 'true' }", "e3: 'true', pclsInterp: 'true' }"),
  ("the gate takes CAND without the tier state", "if (isC && !field(u.ran, 'tierState')) bad.push", "if (false) bad.push"),
  ("the gate takes a readerRef or coverage on the ran line", "for (const k of ['holdTier', 'readerRef', 'coverage', 'deathTax']) if (field(u.ran, k) !== null)", "for (const k of ['holdTier', 'deathTax']) if (field(u.ran, k) !== null)"),
  ("the gate takes other tiers", "if (!tiersOk(field(u.ran, 'tiers'), reals)) bad.push", "if (false) bad.push"),
  ("the tiers check takes a sixth tier", "return Object.keys(m).length === TIERS.length && TIERS.every", "return TIERS.every"),
  ("the gate accepts a missing gap line", "if (!u.gap) bad.push(`${tag}: no year-0 gap line`);", ""),
  ("the gate accepts a missing joint line", "if (!u.joint) bad.push(`${tag}: no joint line`);\n    else {", "if (!u.joint) {}\n    else {"),
  ("the gate ignores the joint flag", "if (u.joint.joint !== isC) bad.push", "if (false) bad.push"),
  ("the gate ignores the solve's margin", "if (u.joint.margin !== (isC ? '0' : '0.001')) bad.push", "if (false) bad.push"),
  ("the gate ignores a pension death charge", "if (u.joint.deathTax !== 0) bad.push", "if (false) bad.push"),
  ("the gate accepts world lines", "if (u.worlds.length) bad.push", "if (false) bad.push"),
  ("the gate accepts a missing run line", "if (!u.run) bad.push(`${tag}: no run line`);", ""),
  ("the done line is not required", "if (!u.done) bad.push(`${tag}: no done line`);", ""),
  ("the gate strips minPot within a household", "const ARM_FIELDS = ['tierState',", "const ARM_FIELDS = ['minPot', 'tierState',"),
  ("the gate refuses a tier above in one arm only", "'pclsInterp', 'tiersAbove'];", "'pclsInterp'];"),
  ("the gate pairs the arms across weights", "&& (unitOf(v.id, v.arm, v.label) || [])[3] === w);", ");"),
  ("the gate ignores a settings difference within a household", "if (u.ran && v.ran && strip(u.ran) !== strip(v.ran)) bad.push", "if (false) bad.push"),
  ("the gate ignores the scale within a household", "(u.joint.scale !== v.joint.scale || u.joint.cap !== v.joint.cap)", "(u.joint.cap !== v.joint.cap)"),
  # the stage lines
  ("a stage household without its access line passes", "if (!S || S.access.length !== 1) { bad.push(`${tag}: ${S ? S.access.length : 0} access lines, not 1`); continue; }", "if (!S || S.access.length !== 1) { continue; }"),
  ("a missing resid year passes", "if (S.resid.length !== T + 1 || ts.some((t, i) => t !== i)) bad.push(", "if (false) bad.push("),
  ("year 0 not held to every path", "if (S.resid[0].n !== n) bad.push(", "if (false) bad.push("),
  ("paths rising from year to year pass", "if (S.resid[t].n > S.resid[t - 1].n) {", "if (false) {"),
  ("stage lines outside the six pass", "} else if (S && (S.access.length || S.resid.length)) bad.push(", "} else if (false) bad.push("),
  ("the records not checked", "if (records) for (const w of WEIGHTS) { try { gainSetOf(records[w], RECORDS[w].sha); }", "if (false) for (const w of WEIGHTS) { try { gainSetOf(records[w], RECORDS[w].sha); }"),
  # the stage table
  ("the bridge slice takes access year itself", "bridge: t => t < A0, after", "bridge: t => t <= A0, after"),
  ("the late slice one year too long", "late: t => t > T - LATE }", "late: t => t >= T - LATE }"),
  ("the stage means unweighted by paths", "n += x.n; tb += x.n * x.table; re += x.n * x.realised;", "n += x.n; tb += x.table; re += x.realised;"),
  # the traces
  ("the trace agreement ignores the arm", "j.arm === `${arm}/${l}` && ['code'", "['code'"),
  ("the trace agreement ignores the seed", "String(j.seed) === seed && ", ""),
  ("the trace agreement ignores the stamp", "['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k])", "true"),
  ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);", ");"),
  ("a trace off its log is not refused", "if (!traceAgrees(t, ST, u.arm, u.label, u.run.sim, n, seed)) { bad.push(", "if (false) { bad.push("),
  # the items
  ("item 1 reads harm the wrong way round", "p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });", "p: mcnemarHarmP(k.saved, k.lost), margin: margin(id) }; });"),
  ("item 1 at the margin 0.25 everywhere", "p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });", "p: mcnemarHarmP(k.lost, k.saved), margin: 0.25 }; });"),
  ("item 1 without Holm", "legs.forEach((l, i) => { l.pHolm = adj[i];", "legs.forEach((l, i) => { l.pHolm = l.p;"),
  ("item 1 passes without the unconditional interval", "l.pass = o.outcome === 'no material harm' && l.u.lo > -l.margin;", "l.pass = o.outcome === 'no material harm';"),
  ("item 1's interval unguarded", "const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);", "const guardedU = k => survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA);"),
  ("item 1 FALSIFIED only when every household reads harm", "outcome: tri(legs.every(l => l.pass), legs.some(l => l.o === 'harm')) }); }", "outcome: tri(legs.every(l => l.pass), legs.every(l => l.o === 'harm')) }); }"),
  ("item 1's point the sum, not the mean", "t + 100 * (l.k.saved - l.k.lost) / l.k.N, 0) / legs.length;", "t + 100 * (l.k.saved - l.k.lost) / l.k.N, 0);"),
  ("item 2 takes a lower end at minus the margin", "outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) }); }", "outcome: tri(legs.every(l => l.lo >= -l.margin), legs.some(l => l.hi < -l.margin)) }); }"),
  ("item 2 FALSIFIED on a lower end", "outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) }); }", "outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.lo < -l.margin)) }); }"),
  ("item 2 at the margin 0.25 everywhere", "const legs = PANEL.map(id => ({ id, ...WL(id), margin: margin(id) }))", "const legs = PANEL.map(id => ({ id, ...WL(id), margin: 0.25 }))"),
  ("item 3 HELD without the mean", "legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M", "legs.every(l => l.lo > SPEND_H)"),
  ("item 3 FALSIFIED without the mean", "legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M", "legs.some(l => l.hi < SPEND_H)"),
  ("item 3's household line at -6%", "SPEND_H = -0.05", "SPEND_H = -0.06"),
  ("the floor over every household", "const p = pooledSummed(floor.map(id => K(id)));", "const p = pooledSummed(PANEL.map(id => K(id)));"),
  ("the floor HELD at its lower end's line", "outcome: tri(p.lo > -MARGINS.pooled, p.hi < -MARGINS.pooled) }); }", "outcome: tri(p.lo >= -MARGINS.pooled - 0.05, p.hi < -MARGINS.pooled) }); }"),
  ("the floor FALSIFIED on its lower end", "outcome: tri(p.lo > -MARGINS.pooled, p.hi < -MARGINS.pooled) }); }", "outcome: tri(p.lo > -MARGINS.pooled, p.lo < -MARGINS.pooled) }); }"),
  ("the items at 0.01 numbered as 0.02's", "const base = w === '0.02' ? 0 : 4, out = [];", "const base = 0, out = [];"),
]
PANEL_M = [
  ("the gain line at 0.25, not 0.5", "export const GAIN_MIN = 0.5;", "export const GAIN_MIN = 0.25;"),
  ("one weight's record for both", "export const gainOf = w => gainSetOf(readFileSync(join(HERE, RECORDS[w].file), 'utf8'), RECORDS[w].sha);", "export const gainOf = w => gainSetOf(readFileSync(join(HERE, RECORDS['0.02'].file), 'utf8'), RECORDS['0.02'].sha);"),
  ("a record off its hash read anyway", "if (got !== sha) throw new Error(", "if (false) throw new Error("),
  ("the floor keeps the gain set", "export const floorOf = w => { const g = new Set(gainOf(w)); return PANEL.filter(id => !g.has(id)); };", "export const floorOf = w => { const g = new Set(); return PANEL.filter(id => !g.has(id)); };"),
]
run('reduce-7u.mjs', M, modules=[('panel-7u.mjs', PANEL_M)])
