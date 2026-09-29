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
    ("the gate ignores OPEN2's pair against 7ae's 1e-3 opening", "if (core && ref && (!ref.t1e3 || !ref.t1e3.moves || !sameArr(ref.t1e3.moves.chosenTier, DERISK))) bad.push", "if (false) bad.push"),
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
    # the node, the log and the all-world run
    ("the gate accepts a missing node line", "if (!nd) bad.push(`${L}: no node line`);", "if (!nd) {}"),
    ("the gate ignores the node's paths", "if (nd.paths !== wn) bad.push", "if (false) bad.push"),
    ("the gate ignores the node's z against 7ae's", "if (ref && ref.z !== null && nd.z !== ref.z) bad.push", "if (false) bad.push"),
    ("the gate accepts OPEN0 leaving the held tiers", "if (nd.held0.OPEN0 !== nd.paths) bad.push", "if (false) bad.push"),
    ("the gate accepts OPEN2 keeping the held tiers", "if (nd.held0.OPEN2 !== 0) bad.push", "if (false) bad.push"),
    ("the gate accepts TS+J against its chosen move", "if (lv !== null && nd.held0['TS+J'] !== (lv ? 0 : nd.paths)) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing decision-log year", "if (lg.filter(Boolean).length !== YEARS || Array.from({ length: YEARS }, (_, i) => i + 1).some(y => !lg[y]) || lg[0]) {", "if (false) {"),
    ("the gate accepts an inconsistent decision log", "if (both1 !== both2 || both1 < 0 || g.fwdLeave > g.held", "if (false || g.fwdLeave > g.held"),
    ("the gate accepts a margin hold at margin 0", "if (mg !== '1e-3' && g.marginHold !== 0) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing all-world line", "if (!u.all) bad.push(`${L}: no all-world line`);", "if (!u.all) {}"),
    ("the gate ignores the all-world paths", "if (u.all.paths !== na) bad.push", "if (false) bad.push"),
    ("the gate accepts the all-world TS+J against its chosen move", "if (lv !== null && u.all.held0 !== (lv ? 0 : u.all.paths)) bad.push", "if (false) bad.push"),
    ("the done line not required", "if (!j.done) bad.push(`${tagJ}: no done line`);", ""),
    ("share 0.95's grid ran line keeps 7af's points", "return ran.replace(/(^| )pts \\d+(?= |$)/, `$1pts ${p}`)", "return ran.replace(/(^| )pts \\d+(?= |$)/, `$1pts 30`)"),
    # traces
    ("the trace agreement ignores the count", "j.stamp && j.N === count && String", "j.stamp && String"),
    ("the trace agreement ignores the arm and place", "j.arm === `${arm}/${rule}/M${m}/W${w}/${where}` && ['code'", "['code'"),
    ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);", ");"),
    ("the trace name drops the place", "-${where}@w${w}.json.gz`", "@w${w}.json.gz`"),
    # the measures
    ("the churn counts a failed path's zero bytes", "if (f !== -1 && f <= y) break;", ""),
    ("the churn counts a de-risk as riskier", "if (b < a) rr[k][i]++;", "if (b !== a) rr[k][i]++;"),
    ("the churn's bands shifted", "export const BANDS = [[1, 5], [6, 25], [26, 999]];", "export const BANDS = [[1, 6], [7, 25], [26, 999]];"),
    ("the net share without the reverse", "net: held ? (one - rev) / held : 0 };", "net: held ? one / held : 0 };"),
    ("the net share over ten years", "for (let y = 1; y <= LOGYEARS; y++) { held += lg[y].held;", "for (let y = 1; y <= 10; y++) { held += lg[y].held;"),
    # the rules
    ("item 1 at M1 0.5", "export const M1 = 0.35, M2 = 0.23,", "export const M1 = 0.5, M2 = 0.23,"),
    ("item 2 at M2 0.35", "export const M1 = 0.35, M2 = 0.23,", "export const M1 = 0.35, M2 = 0.35,"),
    ("the whole-score margin 0.5", "MW = 0.25, M5 = 0.25;", "MW = 0.5, M5 = 0.25;"),
    ("item 1 against 1e-3's OPEN0", "const p = pooledOf('OPEN0', '0', 'OPEN0', 'P');", "const p = pooledOf('OPEN0', '1e-3', 'OPEN0', 'P');"),
    ("item 1 never falsified", "outcome: tri(p.lo > -M1, p.hi < -M1) }); }", "outcome: tri(p.lo > -M1, false) }); }"),
    ("item 2 held on the point", "outcome: tri(p.lo > -M2, p.hi < -M2) }); }", "outcome: tri(p.d > -M2, p.hi < -M2) }); }"),
    ("item 2 reads TS+J, not OPEN2", "const p = pooledOf('OPEN2', '1e-3', 'OPEN2', 'P');", "const p = pooledOf('TS+J', '1e-3', 'TS+J', 'P');"),
    ("item 3 reads all worlds", "const w = W('S194', 'world0', ['OPEN2', '1e-3'], ['OPEN2', 'P']);", "const w = W('S194', 'all', ['OPEN2', '1e-3'], ['OPEN2', 'P']);"),
    ("item 4 reads P, not margin 0", "const w = W('S194', 'all', ['TS+J', '1e-3'], ['TS+J', '0']);", "const w = W('S194', 'all', ['TS+J', '1e-3'], ['TS+J', 'P']);"),
    ("item 5 without Holm", "legs.forEach((l, i) => { l.pHolm = adj[i];", "legs.forEach((l, i) => { l.pHolm = l.p;"),
    ("item 5 without the guarded unconditional end", "l.pass = l.o.outcome === 'no material harm' && l.u.lo > -M5 && l.w.lo > -MW;", "l.pass = l.o.outcome === 'no material harm' && l.w.lo > -MW;"),
    ("item 5 without the whole score", "l.pass = l.o.outcome === 'no material harm' && l.u.lo > -M5 && l.w.lo > -MW; l.harm = l.o.outcome === 'harm' || l.w.hi < -MW;", "l.pass = l.o.outcome === 'no material harm' && l.u.lo > -M5; l.harm = l.o.outcome === 'harm';"),
    ("item 5 cells the wrong way round", "const k = K(id, '1e-3', 'P'); return", "const k = K(id, 'P', '1e-3'); return"),
    ("item 6 compares the pension tier alone", "same: g.length === 3 && g.every(x => sameArr(x, g[0]))", "same: g.length === 3 && g.every(x => x[0] === g[0][0])"),
    ("item 6 held on one unit", "tri(legs.every(l => l.same), legs.every(l => !l.same))", "tri(legs.some(l => l.same), legs.every(l => !l.same))"),
    ("item 7 reads TS+J's log", "const s = netShare(LOG('P', 'OPEN0')), ok", "const s = netShare(LOG('P', 'TS+J')), ok"),
    ("item 7 without its floor", "ok = s.held >= MIN_PY;", "ok = true;"),
    ("item 7 at 5 points to hold", "NET_HELD = 0.02, NET_FALSE = 0.05;", "NET_HELD = 0.05, NET_FALSE = 0.05;"),
    ("the Q branch read where the opening flips", "(open === null ? 'not measured' : !stable ?", "(open === null ? 'not measured' : false ?"),
    ("the Q branch inverted", ": open ? 'P leaves", ": !open ? 'P leaves"),
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
