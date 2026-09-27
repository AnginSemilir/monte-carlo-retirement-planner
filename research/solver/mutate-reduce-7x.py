#!/usr/bin/env python3
# THE 7X REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7x.mjs's reading, rule or gate in
# a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs. The whole score's
# paired cells and the Holm families are reduce-7v.mjs's (mutated there, results-reduce-7v-mutations.txt); the switching
# count is read-7t-deep.mjs's.
#   python3 research/solver/mutate-reduce-7x.py > research/solver/results-reduce-7x-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7x.mjs'), os.path.join(HERE, 'zz-mut-7x.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`)"),
    ("the gate ignores a second setting changed within a case", "if (strip(u.ran) !== strip(first.ran))", "if (false)"),
    ("the gate strips the minimum pot with the held tier", "const strip = s => (s || '').replace(/^mix \\S+ /, '')", "const strip = s => (s || '').replace(/ minPot \\S+/, '').replace(/^mix \\S+ /, '')"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the held tier on the ran line", " holdTier: p.hold, finalIntegral", " finalIntegral"),
    ("the gate does not read the worlds on the ran line", "const w = { mix: p.mix, pts", "const w = { pts"),
    ("the gate ignores the hold line", "if (!u.hold || u.hold.pair !== p.hold)", "if (false)"),
    ("the gate ignores the solved margin", "u.joint.margin !== '0.001' || ", ""),
    ("the gate counts no world lines", "if (u.worlds.length !== nw || ", "if (false && "),
    ("the gate reads the worlds with some() over what is there and skips a hole", "Array.from({ length: nw }, (_, k) => u.worlds[k]).some(x => !x || x.paths !== WP)", "u.worlds.some(x => !x || x.paths !== WP)"),
    ("the gate accepts a missing done line", "if (!u.done) bad.push", "if (false) bad.push"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
    ("a trace's arm not compared", "j.arm === label && ", ""),
    ("a trace's survival allowed at three decimals", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-4 + 1e-9;"),
    ("a trace's survival compared strictly inside the rounding", "export const SIM_TOL = 5e-5 + 1e-9;", "export const SIM_TOL = 5e-5 - 1e-9;"),
    # the quantities and items
    ("dT the wrong way round", "const dT = U(id, b).table - U(id, a).table", "const dT = U(id, a).table - U(id, b).table"),
    ("dS the wrong way round", "const k = cells(S(id, a), S(id, b));", "const k = cells(S(id, b), S(id, a));"),
    ("dS unscaled", "dS = 100 * (k.saved - k.lost) / k.N", "dS = (k.saved - k.lost) / k.N"),
    ("within read one-sided", "const within = R => R >= 1 / HI && R <= HI;", "const within = R => R <= HI;"),
    ("item 1 held without a material realised gain", "outcome: f.every((x, j) => fg[j].o === 'gain' && within(x.R)) ? 'HELD'", "outcome: f.every((x, j) => within(x.R)) ? 'HELD'"),
    ("item 1 held on one case", "outcome: f.every((x, j) => fg[j].o === 'gain' && within(x.R)) ? 'HELD'", "outcome: f.some((x, j) => fg[j].o === 'gain' && within(x.R)) ? 'HELD'"),
    ("item 1 falsified at the HELD bound", "fg[j].o === 'gain' && x.R < LO) ? 'FALSIFIED'", "fg[j].o === 'gain' && x.R < 1 / HI) ? 'FALSIFIED'"),
    ("item 2's rise read at the flat bound", "outcome: w.every(x => up(x) >= W_UP) ? 'HELD'", "outcome: w.every(x => up(x) >= W_FLAT) ? 'HELD'"),
    ("item 2 held on one case", "outcome: w.every(x => up(x) >= W_UP) ? 'HELD'", "outcome: w.some(x => up(x) >= W_UP) ? 'HELD'"),
    ("item 3 held without the gain", "outcome: cg[0].o === 'gain' && c.R < LO ? 'HELD'", "outcome: c.R < LO ? 'HELD'"),
    ("item 3's control read in five worlds", "const c = q('share 0.95', 'READER', 3)", "const c = q('share 0.95', 'READER', 5)"),
    ("item 4 held on the sign alone", "outcome: material && big && Math.sign(s.dT) === Math.sign(s.dS) ? 'HELD'", "outcome: Math.sign(s.dT) === Math.sign(s.dS) ? 'HELD'"),
    ("item 4 ignores the size floor", "const big = Math.abs(s.dT) >= SIGN_MIN && Math.abs(s.dS) >= SIGN_MIN;", "const big = true;"),
    ("the margin from the wrong run", "margin: marginFor(survivedShare(S(id, `${arm}/H00/M3`)))", "margin: 0.25"),
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
            first = next((l for l in o.splitlines() if l.startswith('FAIL')), 'an error before the planted set')
            print(f'caught  {name}: {first[5:180]}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
