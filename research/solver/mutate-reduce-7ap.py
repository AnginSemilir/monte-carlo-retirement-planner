#!/usr/bin/env python3
# 7AP'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ap.mjs's gate, item or arithmetic in a
# scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7ap.py > research/solver/results-reduce-7ap-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ap.mjs'), os.path.join(HERE, 'zz-mut-7ap.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }", "if (k > 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }", "if (k < 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores a unit not done", "if (!u.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores the unit settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate ignores the ran line's path count", "paths: String(npw), ", ""),
    ("the gate ignores the tier state", "if (field(u.ran, 'tierState') === null)", "if (false)"),
    ("the gate ignores readerRef", "if (field(u.ran, 'readerRef') !== null)", "if (false)"),
    ("the gate ignores the switch margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate ignores a death charge", "if (u.joint.deathTax !== 0)", "if (false)"),
    ("the gate ignores a missing axis line", "if (!u.axis) bad.push(`${tag}: no axis line`);", "if (!u.axis) {}"),
    ("the gate ignores which arm is interpolated", "u.axis.interp !== isP(u.label) || ", ""),
    ("the gate ignores the buckets", "|| u.axis.pcls !== '0,0.5,1' ", ""),
    ("the gate skips identity with 7al", "if (!isP(u.label)) {", "if (false) {"),
    ("the gate's identity skips the table", "for (const f of ['table', 'ran', 'gap', 'joint', 'access'])", "for (const f of ['ran', 'gap', 'joint', 'access'])"),
    ("the gate's identity skips the stage lines", "for (const f of ['bref', 'node', 'stage', 'resid', 'cells'])", "for (const f of ['bref', 'node', 'resid', 'cells'])"),
    ("the gate ignores a PCLSI ran line off its twin's", "if (u.ran !== tw.ran)", "if (false)"),
    ("the gate ignores a missing access line", "if (!ac) { bad.push(`${tag}: no access line`); continue; }", "if (!ac) { continue; }"),
    ("the gate ignores a missing lsa year", " || ls.filter(x => x.t === t).length !== 1) {", ") {"),
    ("the gate ignores missing pcell lines", "if (pc.length !== 8 || wl.length !== 4) {", "if (false) {"),
    ("the gate ignores pcell path-years off the resid lines", "if (n2 !== n) bad.push(", "if (false) bad.push("),
    ("the gate ignores a residual sum off the resid lines", "else if (!(Math.abs(s2 - sum) <= ", "else if (false && !(Math.abs(s2 - sum) <= "),
    ("the gate ignores lsa paths off the resid paths", "if (r && r.n !== l.n) {", "if (false) {"),
    ("the gate ignores the paid count", "if (sa[0].n !== br[0].paid)", "if (false)"),
    ("the gate ignores the node sim", "if (Math.abs(100 * sa[0].through / npw - nd[0].sim) > 5e-5 + 1e-9)", "if (false)"),
    ("item 1: h the whole point, not half", "h = d.pt / 2,", "h = d.pt,"),
    ("item 1: HALVED on the point, not the CP low end", "u.pcl.lo >= u.pcl.c - u.h ? 'HALVED'", "u.pcl.pt <= u.h ? 'HALVED'"),
    ("item 1: NOT HALVED without Holm", "u.pH < ALPHA && u.pcl.pt >= u.h ? 'NOT HALVED'", "u.p < ALPHA && u.pcl.pt >= u.h ? 'NOT HALVED'"),
    ("item 1: HELD on one unit", "us.every(u => u.read === 'HALVED') ? 'HELD'", "us.some(u => u.read === 'HALVED') ? 'HELD'"),
    ("item 1: no optimism counts as halved", "u.read = !(u.h > 0) ? 'NO OPTIMISM TO HALVE' :", "u.read = !(u.h > 0) ? 'HALVED' :"),
    # equivalent, not run: the point's threshold alone ('u.pt >= D' to 1) - the tail p is taken at c - D (reduce-7al.mjs readOf),
    # and p under 0.05 there already puts the point above D, so no input reads differently (results-mutation-history.txt 01:04 UTC)
    ("item 2: FALSIFIED on one unit", "us.every(u => u.read === 'OPTIMISTIC') ? 'FALSIFIED'", "us.some(u => u.read === 'OPTIMISTIC') ? 'FALSIFIED'"),
    ("item 3: INCONCLUSIVE read as HELD", "outcome: u.read === 'CALIBRATED' ? 'HELD'", "outcome: u.read !== 'OPTIMISTIC' ? 'HELD'"),
    ("item 1: the overshoot branch dropped", "u.pHUp < ALPHA && u.pcl.pt <= -D ? 'OVERSHOT' : ", ""),
    ("calib: the pessimistic side dropped", "u.pHUp < ALPHA && u.pt <= -D ? 'PESSIMISTIC' : ", ""),
    ("calib: CALIBRATED on the lower end alone", "u.lo >= u.c - D && u.hi <= u.c + D ? 'CALIBRATED'", "u.lo >= u.c - D ? 'CALIBRATED'"),
    ("item 3: a pessimistic control not FALSIFIED", "u.read === 'OPTIMISTIC' || u.read === 'PESSIMISTIC' ? 'FALSIFIED'", "u.read === 'OPTIMISTIC' ? 'FALSIFIED'"),
    ("binomUpper off by one", "1 - binomLower(s - 1, n, q)", "1 - binomLower(s, n, q)"),
    ("the gate ignores stalls over the wall", " || l.stall > l.wall", ""),
    ("parse drops the stall", "stall: +m[10]", "stall: 0"),
    ("parse drops the pcell position", "pos: m[6],", "pos: 'near',"),
    ("parse drops the axis flag", "cur.axis = { interp: m[3] === 'true',", "cur.axis = { interp: true,"),
]
def run(f):
    p = subprocess.run(['node', f, '--planted'], capture_output=True, text=True)
    return p.stdout.strip() + p.stderr.strip()
bad = 0
escaped = []
out = run(SRC)
last = next((l for l in out.splitlines() if l.startswith('planted (')), out.splitlines()[-1] if out else '')
if not last.startswith('planted (') or 'FAIL' in out:
    print(f'FAIL: the true script does not pass its planted set: {last[:200]}'); sys.exit(1)
print(f'true script: {last}')
try:
    for name, a, b in M:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the mutation does not apply ({base.count(a)} matches)'); bad = 1; escaped.append(name + ' (did not apply)'); continue
        open(DST, 'w').write(base.replace(a, b))
        o = run(DST)
        if 'PLANTED CHECK FAILED' in o:
            first = next((l[5:180] for l in o.splitlines() if l.startswith('FAIL')), next((l[:180] for l in o.splitlines() if 'PLANTED CHECK FAILED' in l), ''))
            print(f'caught  {name}: {first}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1; escaped.append(name)
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
# every run, first ones included, appended to the shared history (drafts/framework-feedback-review.md, S2: the first-run
# escapes are the lesson, and the committed receipt above keeps only the last run)
import datetime, hashlib
sha = hashlib.sha256(open(SRC, 'rb').read()).hexdigest()[:12]
with open(os.path.join(HERE, 'results-mutation-history.txt'), 'a') as h:
    h.write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC | reduce-7ap.mjs {sha} | {len(M) - len(escaped)} of {len(M)} caught | escaped: {'; '.join(escaped) or 'none'}\n")
sys.exit(bad)
