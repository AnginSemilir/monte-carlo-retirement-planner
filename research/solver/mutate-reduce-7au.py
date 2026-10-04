#!/usr/bin/env python3
# 7AU'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7au.mjs's gate, run identity
# or items in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation
# must apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7au.py > research/solver/results-reduce-7au-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7au.mjs'), os.path.join(HERE, 'zz-mut-7au.mjs')
base = open(SRC).read()
M = [
    ("the gate ignores a missing job", "if (k !== 1) bad.push(`${kind} ${id} ${a}/W${w}: ${k} job lines, not 1`);", ""),
    ("the gate accepts an unregistered job", "{ bad.push(`${tag}: not a registered job`); continue; }", "{ continue; }"),
    ("the gate ignores a job not done", "if (!j.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores foreign labels", "if (j.other) bad.push(", "if (false) bad.push("),
    ("the gate ignores a missing world line", "|| j.worlds.filter(Boolean).length !== 3)", ")"),
    ("the ran line not held to P's", "if (j.ran !== sizeRan(r.ran, pts, n)) bad.push", "if (false) bad.push"),
    ("the joint line's margin not read", "|| j.joint.margin !== '0' ", ""),
    ("the identity skips the table", "for (const f of ['table', 'gap', 'movesRaw', 'priceRaw', 'worlds'])", "for (const f of ['gap', 'movesRaw', 'priceRaw', 'worlds'])"),
    ("the identity skips the moves", "for (const f of ['table', 'gap', 'movesRaw', 'priceRaw', 'worlds'])", "for (const f of ['table', 'gap', 'priceRaw', 'worlds'])"),
    ("the joint cap not held to P's", " || j.joint.cap !== r.joint.cap)", ")"),
    ("the node count not read", "if (!j.node || j.node.paths !== wn) bad.push", "if (!j.node) bad.push"),
    ("the year-0 hold on the node rules not read", "else for (const rule of NODE_RULES) if (j.node.held0[rule] !== 0) bad.push", "else for (const rule of NODE_RULES) if (false) bad.push"),
    ("the ident line not required", "if (!j.ident || j.ident.paths !== inn) bad.push", "if (j.ident && j.ident.paths !== inn) bad.push"),
    ("the node weights line not required", "if (!j.weights[rule] || j.weights[rule].where !== 'world0' || j.weights[rule].end.length !== 3) bad.push", "if (false) bad.push"),
    ("a missing decision-log year ignored", "for (let y = 1; y <= 10; y++) if (!j.log[rule][y]) { bad.push(`${tag}: no ${rule} decision log for year ${y}`); break; }", ""),
    ("an all line on the node job allowed", "if (j.all || j.identAll) bad.push", "if (false) bad.push"),
    ("the all-world count not read", "if (!j.all || j.all.paths !== na) bad.push", "if (!j.all) bad.push"),
    ("the ident-all line not required", "if (!j.identAll || j.identAll.paths !== inn) bad.push", "if (false) bad.push"),
    ("a node line on an all-world job allowed", "if (j.node || j.ident) bad.push", "if (false) bad.push"),
    ("sameRuns skips the tier", "&& eq(X.tier, Y.tier, n * X.Y);", ";"),
    ("sameRuns reads past the first paths", "eq(X.tier, Y.tier, n * X.Y)", "eq(X.tier, Y.tier, Math.min(X.tier.length, Y.tier.length))"),
    ("sameRuns accepts too few paths", "if (!X || !Y || X.N < n || Y.N < n || X.Y !== Y.Y) return false;", "if (!X || !Y || X.Y !== Y.Y) return false;"),
    ("item 1's premise ignores p", "there = pSlice < ALPHA && mean(dW) > 0", "there = mean(dW) > 0"),
    ("item 1's HELD band at a half", "flipP(dL.map((x, j) => x - (2 / 3) * dW[j]), b, 7102)", "flipP(dL.map((x, j) => x - (1 / 2) * dW[j]), b, 7102)"),
    ("item 1's FALSIFIED band at a half", "flipP(dL.map((x, j) => dW[j] / 3 - x), b, 7103)", "flipP(dL.map((x, j) => dW[j] / 2 - x), b, 7103)"),
    ("item 1's directions swapped", "flipP(dL.map((x, j) => x - (2 / 3) * dW[j]), b, 7102), flipP(dL.map((x, j) => dW[j] / 3 - x), b, 7103)", "flipP(dL.map((x, j) => dW[j] / 3 - x), b, 7103), flipP(dL.map((x, j) => x - (2 / 3) * dW[j]), b, 7102)"),
    ("item 2 harm ignores the whole score", "const harm = l.down.outcome === 'harm' || l.w.hi < -MW;", "const harm = l.down.outcome === 'harm';"),
    ("item 2 safe ignores the guarded interval", "&& l.u.lo > -l.mg && l.w.lo > -MW;", "&& l.w.lo > -MW;"),
    ("item 2 safe at the margin's end", "&& l.w.lo > -MW;", "&& l.w.lo >= -MW;"),
    ("item 2 without Holm", "const h = holm(legs.map(l => l.p));", "const h = legs.map(l => l.p);"),
    ("item 2 HELD on any safe leg", "const read = legs.every(l => l.read === 'SAFE') ? 'HELD'", "const read = legs.some(l => l.read === 'SAFE') ? 'HELD'"),
    ("item 2 reads the gain direction as harm", "l.p = mcnemarHarmP(l.k.lost, l.k.saved);", "l.p = mcnemarHarmP(l.k.saved, l.k.lost);"),
    ("the jobs check reads a different charge", "/switchMargin: 0, switchCharge: 0\\.001/", "/switchMargin: 0, switchCharge: 0\\.002/"),
]
r = subprocess.run(['node', SRC, '--planted'], capture_output=True, text=True)
if r.returncode != 0: print('THE TRUE SCRIPT FAILS ITS PLANTED SET:\n' + r.stdout); sys.exit(1)
caught, bad = 0, []
for name, old, new in M:
    if base.count(old) != 1: bad.append(f'NOT APPLIED ({base.count(old)} matches): {name}'); continue
    open(DST, 'w').write(base.replace(old, new))
    r = subprocess.run(['node', DST, '--planted'], capture_output=True, text=True)
    if 'PLANTED CHECK FAILED' in r.stdout: caught += 1; print(f'caught: {name}')
    else: bad.append(f'NOT CAUGHT: {name}')
if os.path.exists(DST): os.remove(DST)
for b in bad: print(b)
print(f'{caught} of {len(M)} mutations caught')
sys.exit(1 if bad else 0)
