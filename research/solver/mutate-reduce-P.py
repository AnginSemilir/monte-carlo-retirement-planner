#!/usr/bin/env python3
# THE P REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-P.mjs's gate, measure or rule
# in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The stamp
# gate lives in fair-gate.mjs (requireFairLogs); the pooled interval is reduce-7ae.mjs's, the paired cells reduce-7v.mjs's.
#   python3 research/solver/mutate-reduce-P.py > research/solver/results-reduce-P-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-P.mjs'), os.path.join(HERE, 'zz-mut-P.mjs')
base = open(SRC).read()
M = [
    # the gate: the jobs
    ("the gate accepts a missing job", "if (k !== 1) bad.push(`${jobKey(kind, id, a, w, g)}: ${k} job lines, not 1`)", "if (k > 1) bad.push(`${jobKey(kind, id, a, w, g)}: ${k} job lines, not 1`)"),
    ("the gate accepts a job twice", "if (k !== 1) bad.push(`${jobKey(kind, id, a, w, g)}: ${k} job lines, not 1`)", "if (k < 1) bad.push(`${jobKey(kind, id, a, w, g)}: ${k} job lines, not 1`)"),
    ("the gate accepts an unregistered job", "{ bad.push(`${tagJ}: not a registered job`); continue; }", "{ continue; }"),
    ("the gate ignores the job line's settings", "if (j.lambda !== LAMBDA || j.tier !== 'own'", "if (false && j.tier !== 'own'"),
    ("the gate ignores the points", "if (j.points !== (pts ? Number(pts) : gp) || j.quad !== gq)", "if (j.quad !== gq)"),
    ("the gate accepts a missing reference", "if (!ref) bad.push(`${tagJ}: no reference to compare with", "if (false) bad.push(`${tagJ}: no reference to compare with"),
    ("setting 1e-3 dropped from the jobs", "export const SETTINGS = ['P', '0', '1e-3'];", "export const SETTINGS = ['P', '0'];"),
    # the lines and settings
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${L}: no solve line`);", ""),
    ("the gate ignores the ran line", "if (u.ran !== wantRan) bad.push", "if (false) bad.push"),
    ("the ran line's charge not required at P", "(mg === 'P' ? `${base} switchCharge ${CHARGE}` : base)", "base"),
    ("the gate ignores the joint flag", "if (!u.joint.joint) bad.push", "if (false) bad.push"),
    ("the gate ignores the margin", "if (u.joint.margin !== (mg === '1e-3' ? '0.001' : '0')) bad.push", "if (false) bad.push"),
    ("the gate ignores the charge", "if (u.joint.charge !== (mg === 'P' ? CHARGE : '0')) bad.push", "if (false) bad.push"),
    ("the gate ignores a pension death charge", "if (u.joint.deathTax !== 0) bad.push", "if (false) bad.push"),
    ("the gate ignores the scale", "(!ref.joint || u.joint.scale !== ref.joint.scale || u.joint.cap", "(!ref.joint || u.joint.cap"),
    ("the gate accepts a missing gap line", "if (!u.gap) bad.push(`${L}: no gap line`);", ""),
    # the moves and the price
    ("the gate accepts an opening off the plan's tiers", "if (M.held[0] !== 0 || M.held[1] !== 0) bad.push", "if (false) bad.push"),
    ("the gate accepts STAY leaving", "if (!keeps(M.stayTier, M.held)) bad.push", "if (false) bad.push"),
    ("the gate accepts a chosen move not BEST at margin 0", "if (mg !== '1e-3' && M.chosen !== M.best) bad.push", "if (false) bad.push"),
    ("the price not the gap plus the charge", "Math.abs(u.price.mixture / 100 - (g + c)) <= PRICE_TOL * g", "Math.abs(u.price.mixture / 100 - g) <= 2 * g"),
    ("the like-for-like sum unchecked", "if (!(Math.abs(u.price.whole - u.price.mixture) <= LFL_TOL * Math.abs(u.price.mixture) + 1e-12)) bad.push", "if (false) bad.push"),
    ("the world lines unchecked", "if (!(Math.abs(sum('whole') - u.price.whole) <= tol('whole')) || !(Math.abs(sum('surv') - u.price.surv) <= tol('surv'))) bad.push", "if (false) bad.push"),
    ("a missing world line accepted", "if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k])) bad.push", "if (false) bad.push"),
    # identity with 7ae
    ("settings 0 and 1e-3 not held to 7ae's table", "if (u.table !== e.table) bad.push", "if (false) bad.push"),
    ("setting 1e-3 not held to 7ae", "if (mg !== 'P' && ref && ref.e) {", "if (mg === '0' && ref && ref.e) {"),
    # the node
    ("the gate accepts a missing node line", "if (!nd) { bad.push(`${L}: no node line`); continue; }", "if (!nd) { continue; }"),
    ("the gate ignores the node's paths", "if (nd.paths !== wn) bad.push", "if (false) bad.push"),
    ("the gate ignores the node's z against 7ae's", "if (ref && ref.z !== null && nd.z !== ref.z) bad.push", "if (false) bad.push"),
    ("the gate accepts OPEN0 leaving the held tiers", "if (nd.held0.OPEN0 !== nd.paths) bad.push", "if (false) bad.push"),
    ("the gate accepts TS+J against its chosen move", "if (lv !== null && nd.held0['TS+J'] !== (lv ? 0 : nd.paths)) bad.push", "if (false) bad.push"),
    ("the gate accepts a WA run at 1e-3", "if (mg === '1e-3' ? nd.sim.WA !== null || nd.held0.WA !== null :", "if (mg === '1e-3' ? false :"),
    ("the done line not required", "if (!j.done) bad.push(`${tagJ}: no done line`);", ""),
    # traces
    ("the trace agreement ignores the count", "j.stamp && j.N === count && String", "j.stamp && String"),
    ("the trace agreement ignores the arm", "j.arm === `${arm}/${rule}/M${m}/W${w}/world0` && ['code'", "['code'"),
    ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);", ");"),
    ("the trace name drops the setting", "-m${m.toLowerCase()}-${rule", "-${rule"),
    # the measures
    ("the churn counts a failed path's zero bytes", "if (f !== -1 && f <= y) break;", ""),
    ("the churn counts a de-risk as riskier", "if (b < a) rr[i]++;", "if (b !== a) rr[i]++;"),
    ("the paired sum's interval without its standard error", "return { d, se, lo: d - Z95 * se, hi: d + Z95 * se };", "return { d, se, lo: d, hi: d };"),
    # the rules
    ("item 1 at M1 0.5", "export const M1 = 0.35, M2 = 0.23;", "export const M1 = 0.5, M2 = 0.23;"),
    ("item 2 at M2 0.35", "export const M1 = 0.35, M2 = 0.23;", "export const M1 = 0.35, M2 = 0.35;"),
    ("item 1 against 1e-3's OPEN0", "const p = pooledOf('OPEN0', '0', 'OPEN0', 'P');", "const p = pooledOf('OPEN0', '1e-3', 'OPEN0', 'P');"),
    ("item 1 never falsified", "outcome: tri(p.lo > -M1, p.hi < -M1) }); }", "outcome: tri(p.lo > -M1, false) }); }"),
    ("item 2 held on the point", "outcome: tri(p.lo > -M2, p.hi < -M2) }); }", "outcome: tri(p.d > -M2, p.hi < -M2) }); }"),
    ("item 2 against margin 0's TS+J", "const p = pooledOf('TS+J', '1e-3', 'TS+J', 'P');", "const p = pooledOf('TS+J', '0', 'TS+J', 'P');"),
    ("H3 the whole excess, not half", "H3 = ex.d / 2, sep", "H3 = ex.d, sep"),
    ("items 3 and 4 read with nothing to separate", "sep = ex.lo > 0;", "sep = true;"),
    ("item 3 reads WA", "{ const p = pairedSum(R('TS+J', 'P'), R('TS+J', '1e-3'));", "{ const p = pairedSum(R('WA', 'P'), R('TS+J', '1e-3'));"),
    ("item 4 reads TS+J at margin 0", "{ const p = pairedSum(R('WA', '0'), R('TS+J', '1e-3'));", "{ const p = pairedSum(R('TS+J', '0'), R('TS+J', '1e-3'));"),
    ("item 5 compares the pension tier alone", "same: g.length === 3 && g.every(x => sameArr(x, g[0]))", "same: g.length === 3 && g.every(x => x[0] === g[0][0])"),
    ("item 5 held on one unit", "tri(legs.every(l => l.same), legs.every(l => !l.same))", "tri(legs.some(l => l.same), legs.every(l => !l.same))"),
    ("the Q branch inverted", "(open === null ? 'not measured' : open ? 'P leaves", "(open === null ? 'not measured' : !open ? 'P leaves"),
]
def run(f):
    p = subprocess.run(['node', f, '--planted'], capture_output=True, text=True)
    return p.stdout.strip() + p.stderr.strip()
bad = 0
out = run(SRC)
last = out.splitlines()[-1] if out else ''
if not last.startswith('planted (') or 'FAIL' in out:
    print(f'FAIL: the true script does not pass its planted set: {last[:200]}'); sys.exit(1)
print(f'true script: {last}')
try:
    for name, a, b in M:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the mutation does not apply ({base.count(a)} matches)'); bad = 1; continue
        open(DST, 'w').write(base.replace(a, b))
        o = run(DST)
        if 'PLANTED CHECK FAILED' in o:
            first = next((l[5:180] for l in o.splitlines() if l.startswith('FAIL')), next((l[:180] for l in o.splitlines() if 'PLANTED CHECK FAILED' in l), ''))
            print(f'caught  {name}: {first}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
