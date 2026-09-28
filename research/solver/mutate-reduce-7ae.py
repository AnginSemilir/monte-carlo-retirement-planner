#!/usr/bin/env python3
# THE 7AE REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ae.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); 7aa's, 7ac's and 7ad's gates are their reducers' (mutated there); the
# paired cells are reduce-7v.mjs's, the exact interval stats.mjs's.
#   python3 research/solver/mutate-reduce-7ae.py > research/solver/results-reduce-7ae-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ae.mjs'), os.path.join(HERE, 'zz-mut-7ae.mjs')
base = open(SRC).read()
M = [
    # the gate: the jobs
    ("the gate accepts a missing job", "if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} job lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/W${w}: ${k} job lines, not 1`)"),
    ("the gate accepts a job twice", "if (k !== 1) bad.push(`${id} ${arm}/W${w}: ${k} job lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/W${w}: ${k} job lines, not 1`)"),
    ("the gate accepts an unregistered job", "{ bad.push(`${tagJ}: not a registered job`); continue; }", "{ continue; }"),
    ("the gate accepts lines given twice", "if (j.dup.length) bad.push", "if (false) bad.push"),
    ("the gate ignores the job line's settings", "if (j.lambda !== LAMBDA || j.tier !== 'own'", "if (false && j.tier !== 'own'"),
    ("the gate ignores the job's points", "if (j.points !== 30 || j.quad !== 5) bad.push", "if (j.quad !== 5) bad.push"),
    ("the gate accepts a missing 7aa unit", "if (!r) bad.push(`${tagJ}: no 7aa TS+J unit to compare with`);", ""),
    ("the gate accepts a missing 7ad job", "if (!r7) bad.push(`${tagJ}: no 7ad 30x5 TS+J job to compare with`);", ""),
    ("the gate accepts a missing margin", "if (!u) { bad.push(`${L}: no lines`); continue; }", "if (!u) continue;"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${L}: no solve line`);", ""),
    # the ran line
    ("the gate ignores the estate weight", "if (field(u.ran, 'bequestWeight') !== j.w) bad.push", "if (false) bad.push"),
    ("the gate reads the margin-0 ran line as 7aa's unchanged", "const want = mg === '0' ? `${r.ran} switchMargin 0` : r.ran;", "const want = r.ran;"),
    ("the gate reads the 1e-3 ran line with a switchMargin too", "const want = mg === '0' ? `${r.ran} switchMargin 0` : r.ran;", "const want = `${r.ran} switchMargin 0`;"),
    ("the gate does not compare the ran line with 7aa's", "if (u.ran !== want) bad.push", "if (false) bad.push"),
    # the solve against 7aa's
    ("the gate does not compare the 1e-3 table", "if (mg === '1e-3' && r && u.table !== undefined && u.table !== r.table) bad.push", "if (false) bad.push"),
    ("the gate compares the margin-0 table with 7aa's too", "if (mg === '1e-3' && r && u.table !== undefined && u.table !== r.table) bad.push", "if (r && u.table !== undefined && u.table !== r.table) bad.push"),
    ("the gate does not compare the 1e-3 gap", "else if (mg === '1e-3' && r && (!r.gap || u.gap.gap !== r.gap.gap", "else if (false && (!r.gap || u.gap.gap !== r.gap.gap"),
    ("the gate ignores the joint flag", "if (!u.joint.joint) bad.push", "if (false) bad.push"),
    ("the gate ignores the solve's margin", "if (u.joint.margin !== marginOf(mg)) bad.push", "if (false) bad.push"),
    ("the gate reads both margins as 0.001", "const marginOf = m => (m === '0' ? '0' : '0.001');", "const marginOf = m => '0.001';"),
    ("the gate ignores the scale", "if (r && (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap)) bad.push", "if (false) bad.push"),
    # the moves and prices
    ("the gate accepts an opening off the plan's tiers", "if (hp !== 0 || hi !== 0) bad.push", "if (false) bad.push"),
    ("the gate accepts a STAY leaving the held tiers", "if (!keeps(u.moves.stayTier)) bad.push", "if (false) bad.push"),
    ("the gate accepts a margin-0 move that is not BEST", "if (mg === '0' && u.moves.chosen !== u.moves.best) bad.push", "if (false) bad.push"),
    ("the gate accepts a price off the gap", "!(Math.abs(u.price.mixture / 100 - g) <= PRICE_TOL * g)) bad.push", "false) bad.push"),
    ("the gate accepts world lines off the price", "if (!(Math.abs(sum('whole') - u.price.whole) <= tol('whole')) || !(Math.abs(sum('surv') - u.price.surv) <= tol('surv'))) bad.push", "if (false) bad.push"),
    ("the gate accepts two world lines", "if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k])) bad.push", "if (u.worlds.length > 3) bad.push"),
    # the node run
    ("the gate accepts a missing node line", "if (!nd) bad.push(`${L}: no node line`);", "if (!nd) {}"),
    ("the gate ignores the node's paths", "if (nd.paths !== wn) bad.push", "if (false) bad.push"),
    ("the gate ignores the node's shift", "if (u.worlds[0] && Math.abs(nd.z - u.worlds[0].z) > 1e-4) bad.push", "if (false) bad.push"),
    ("the gate ignores OPEN0's opening", "if (nd.heldO !== nd.paths) bad.push", "if (false) bad.push"),
    ("the gate ignores TS+J's opening", "if (nd.heldJ !== (leaves ? 0 : nd.paths)) bad.push", "if (false) bad.push"),
    ("the gate does not compare the first paths with 7ad's", "else if (Math.abs(nd.firstJ - n7.simJ) > 1e-9 || Math.abs(nd.firstO - n7.simO) > 1e-9) bad.push", "else if (false) bad.push"),
    ("the gate does not check 7ad's node count", "else if (n7.paths !== Math.min(FIRST, wn)) bad.push", "else if (false) bad.push"),
    ("the gate compares the first paths at margin 0 too (its own tables)", "if (mg === '1e-3' && r7) {", "if (r7) {"),
    # the decision log
    ("the gate accepts a missing log year", "if (lg.filter(Boolean).length !== YEARS || Array.from({ length: YEARS }, (_, i) => i + 1).some(y => !lg[y]) || lg[0])", "if (lg.filter(Boolean).length < 1)"),
    ("the gate accepts a log whose leaves do not split", "if (both1 !== both2 || both1 < 0 ||", "if (both1 < 0 ||"),
    ("the gate accepts more leaves than held", "|| g.fwdLeave > g.held || g.cellLeave > g.held || g.fwdLeave + g.fwdHoldCellLeave > g.held) bad.push", ") bad.push"),
    ("the gate accepts a margin hold at margin 0", "if (mg === '0' && g.marginHold !== 0) bad.push", "if (false) bad.push"),
    ("the gate refuses any margin hold", "if (mg === '0' && g.marginHold !== 0) bad.push", "if (g.marginHold !== 0) bad.push"),
    ("the gate accepts more margin holds than holds", "if (g.marginHold > g.held - g.fwdLeave) bad.push", "if (false) bad.push"),
    ("the gate accepts more held than run", "if (nd && g.held > nd.paths) bad.push", "if (false) bad.push"),
    ("the done line is not required", "if (!j.done) bad.push(`${tagJ}: no done line`);", ""),
    # the trace helpers
    ("the trace agreement ignores the margin", "j.arm === `${arm}/${rule}/M${m}/W${w}/world0`", "j.arm.replace(/\\/M[^/]+\\//, '/') === `${arm}/${rule}/W${w}/world0`"),
    ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);\n/* the decision log", ");\n/* the decision log"),
    ("the trace name drops the margin", "`${id.replace(/ /g, '_')}-${arm.toLowerCase()}-m${m}-", "`${id.replace(/ /g, '_')}-${arm.toLowerCase()}-"),
    ("the first paths compared on the first alone", "for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false; return true;", "return a[0] === b[0];"),
    ("the first paths compared without their count", "if (!a || !b || a.length < n || b.length < n) return false;", "if (!a || !b) return false;"),
    ("logAgrees counts paths failed before the year", "if (f !== -1 && f < y) continue;", ""),
    ("logAgrees counts every alive path as held", "if (T.tier[i * T.Y + y - 1] !== 0) continue;", ""),
    ("logAgrees takes fewer leaves than traced", "g.fwdLeave < left || g.fwdLeave > left + dying", "g.fwdLeave > left + dying"),
    ("logAgrees ignores the held count", "if (!g || g.held !== held ||", "if (!g ||"),
    # pooled
    ("pooled ignores the shared paths (the units' variances summed)", "for (let i = 0; i < n; i++) { let x = 0; for (const k of ks) x += k.diff[i]; s += x; s2 += x * x; }", "for (let i = 0; i < n; i++) for (const k of ks) { s += k.diff[i]; s2 += k.diff[i] * k.diff[i]; }"),
    # the items
    ("item 1 at 0.8, not 0.85", "tri(ratio >= 0.85 && sp >= pl.lo", "tri(ratio >= 0.8 && sp >= pl.lo"),
    ("item 1 without the interval", "tri(ratio >= 0.85 && sp >= pl.lo, ratio < 0.75 && sp < pl.lo)", "tri(ratio >= 0.85, ratio < 0.75)"),
    ("item 1 falsified at 0.85, not 0.75", "ratio < 0.75 && sp < pl.lo)", "ratio < 0.85 && sp < pl.lo)"),
    ("item 1 reads margin 1e-3", "const u = P(id, '0'), k = K(id, '0'); return { id, leaves", "const u = P(id, '1e-3'), k = K(id, '1e-3'); return { id, leaves"),
    ("item 1 measured where a unit keeps the held tiers", "const ok = all && pl.d > 0;", "const ok = pl.d > 0;"),
    ("item 2 at 5%, not 10%", "tri(a.one >= 0.10 && net >= 0.05, net < 0.02)", "tri(a.one >= 0.05 && net >= 0.05, net < 0.02)"),
    ("item 2 held without the net excess", "tri(a.one >= 0.10 && net >= 0.05, net < 0.02)", "tri(a.one >= 0.10, net < 0.02)"),
    ("item 2 falsified below 5 points net", "tri(a.one >= 0.10 && net >= 0.05, net < 0.02)", "tri(a.one >= 0.10 && net >= 0.05, net < 0.05)"),
    ("item 2 not net of the reverse share", "const net = Math.min(a.one - a.rev,", "const net = Math.min(a.one,"),
    ("item 2 not net of margin 0's share", "grid === null ? Infinity : a.one - grid);", "Infinity);"),
    ("item 2 counts margin 0 however few its path-years", "grid = g.held >= MIN_GRID_PY ? g.one : null;", "grid = g.one;"),
    ("item 2 margin 0's floor at 100 path-years", "MIN_GRID_PY = 1000;", "MIN_GRID_PY = 100;"),
    ("item 2 reads TS+J", "const lg = LOGS(id, m, 'OPEN0');", "const lg = LOGS(id, m, 'TS+J');"),
    ("item 2 swaps the margins", "const a = sh('1e-3'), g = sh('0')", "const a = sh('0'), g = sh('1e-3')"),
    ("item 2 reads all ten years", "for (let y = 1; y <= LOGYEARS; y++) { h += lg[y].held; x += lg[y].fwdHoldCellLeave; r +=", "for (let y = 1; y <= YEARS; y++) { h += lg[y].held; x += lg[y].fwdHoldCellLeave; r +="),
    # item 1's attribution
    ("the attribution credits any price rise", "const priceRose = b.sp - a.sp >= 0.25 * miss && b.sp > a.sp,", "const priceRose = b.sp > a.sp,"),
    ("the attribution credits OPEN0's point estimate", "open0Rose = dO.lo > 0,", "open0Rose = dO.d > 0,"),
    ("the attribution never sees TS+J fall", "tsjFell = dJ.hi < 0;", "tsjFell = false;"),
    ("the attribution reads TS+J's fall as the margin's structure", "const reading = priceRose || open0Rose ?", "const reading = priceRose || open0Rose || tsjFell ?"),
    ("item 3 at 0.025", "iv = survivalChange(k.lost, k.saved, k.N, ALPHA3), price = u.worlds[0].surv, ratio", "iv = survivalChange(k.lost, k.saved, k.N, 0.025), price = u.worlds[0].surv, ratio"),
    ("item 3 falsified without the ratio", "tri(price >= iv.lo, price < iv.lo && ratio < 0.75)", "tri(price >= iv.lo, price < iv.lo)"),
    ("item 3 measured where bridge 4 keeps", "outcome: lv ? tri(price >= iv.lo", "outcome: true ? tri(price >= iv.lo"),
    ("item 3 reads S194", "const u = P('bridge 4', '0'), k = K('bridge 4', '0')", "const u = P('S194', '0'), k = K('S194', '0')"),
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
