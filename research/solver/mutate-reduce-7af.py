#!/usr/bin/env python3
# THE 7AF REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7af.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); 7aa's gate is its reducer's (mutated there); the
# paired cells are reduce-7v.mjs's, the exact interval stats.mjs's.
#   python3 research/solver/mutate-reduce-7af.py > research/solver/results-reduce-7af-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7af.mjs'), os.path.join(HERE, 'zz-mut-7af.mjs')
base = open(SRC).read()
M = [
    # the gate: the units
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("PRODR on every household", "...PANEL.filter(([, b]) => b > 0).map(([id]) => [id, ...PRODR])];", "...PANEL.map(([id]) => [id, ...PRODR])];"),
    ("the gate ignores the unit line's settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${tag}: no solve line`);", ""),
    ("the gate ignores the estate weight", "finalIntegral: 'true', bequestWeight: W, bridgeRead:", "finalIntegral: 'true', bridgeRead:"),
    ("the gate ignores the paths", "seed: SEED, paths: String(n), grid:", "seed: SEED, grid:"),
    ("the gate ignores the points", "const want = { mix: '3', pts, seed", "const want = { mix: '3', seed"),
    ("the gate ignores the bridge read", "bridgeRead: u.arm === 'READER' ? 'reader' : 'false' };", "};"),
    ("the gate ignores the tier state", "if (!!field(u.ran, 'tierState') !== ts) bad.push", "if (false) bad.push"),
    ("the gate accepts a switchMargin on the ran line", "for (const k of ['holdTier', 'bridgeStep', 'readerRef', 'switchMargin'])", "for (const k of ['holdTier', 'bridgeStep', 'readerRef'])"),
    ("the gate ignores the joint flag", "if (u.joint.joint !== ts) bad.push", "if (false) bad.push"),
    ("the gate ignores the margin", "if (u.joint.margin !== '0.001') bad.push", "if (false) bad.push"),
    ("the gate accepts world lines", "if (u.worlds.length) bad.push", "if (false) bad.push"),
    ("the done line is not required", "if (!u.done) bad.push(`${tag}: no done line`);", ""),
    ("the gate strips more within a household (minPot)", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ bridgeRead \\S+/, '');", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ bridgeRead \\S+/, '').replace(/ minPot \\S+/, '');"),
    ("the gate ignores the scale within a household", "(u.joint.scale !== refJ.joint.scale || u.joint.cap", "(u.joint.cap"),
    ("the gate ignores the risk-above decision within a household", " || u.joint.decided !== refJ.joint.decided)) bad.push", ")) bad.push"),
    # identity with 7aa
    ("identity: the table not compared", "if (u.table !== r.table) bad.push", "if (false) bad.push"),
    ("identity: the ran line not compared", "if (u.ran !== r.ran) bad.push", "if (false) bad.push"),
    ("identity: the gap not compared", "if (!u.gap || !r.gap || u.gap.gap !== r.gap.gap", "if (false && u.gap.gap !== r.gap.gap"),
    ("identity: the run not compared", "if (!u.run || !r.run || Math.abs(u.run.sim - r.run.sim) > 1e-9) bad.push", "if (false) bad.push"),
    # traces
    ("the trace agreement ignores the arm", "j.arm === `${arm}/${l}` && ['code'", "['code'"),
    ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);\nexport const sameBits", ");\nexport const sameBits"),
    ("bits compared without their length", "!!a && !!b && a.length === b.length && a.every", "!!a && !!b && a.every"),
    # spending
    ("spending years: any path of one arm only", "for (const T of [X, Y]) for (let i = 0; i < T.N; i++)", "for (const T of [X]) for (let i = 0; i < T.N; i++)"),
    ("spending per path summed, not averaged", "out[i] = s / n; }", "out[i] = s; }"),
    ("the spending change's se omitted", "return { a: ma, b: mb, d, se, lo: d - z * se, hi: d + z * se };", "return { a: ma, b: mb, d, se, lo: d, hi: d };"),
    # item 1
    ("item 1 without Holm", "legs.forEach((l, i) => { l.pHolm = adj[i];", "legs.forEach((l, i) => { l.pHolm = l.p;"),
    ("item 1 at the margin 0.5 everywhere", "margin: marginFor(SIM(id, 'SHIP')) }; });", "margin: 0.5 }; });"),
    ("item 1 reads CAND against PRODR", "const k = K(id, 'CAND', 'SHIP'); return { id, k, p:", "const k = K(id, 'CAND', 'PRODR'); return { id, k, p:"),
    ("item 1 reads the cells the wrong way round", "const k = K(id, 'CAND', 'SHIP'); return { id, k, p: mcnemarHarmP(k.lost, k.saved)", "const k = K(id, 'CAND', 'SHIP'); return { id, k, p: mcnemarHarmP(k.saved, k.lost)"),
    ("item 1 held on most households", "outcome: tri(legs.every(l => l.o === 'no material harm'), legs.some(l => l.o === 'harm')) }); }", "outcome: tri(legs.filter(l => l.o === 'no material harm').length > 12, legs.some(l => l.o === 'harm')) }); }"),
    ("item 1 never falsified", "legs.some(l => l.o === 'harm')) }); }", "false) }); }"),
    # item 2
    ("item 2 at 10%, not 5%", "SPEND_H = -0.05,", "SPEND_H = -0.10,"),
    ("item 2's mean at 2%, not 1%", "SPEND_M = -0.01;", "SPEND_M = -0.02;"),
    ("item 2 held on the point, not the lower end", "outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M,", "outcome: tri(legs.every(l => l.d > SPEND_H) && mean.d > SPEND_M,"),
    ("item 2 without the mean", "outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M, legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }", "outcome: tri(legs.every(l => l.lo > SPEND_H), legs.some(l => l.hi < SPEND_H)) }); }"),
    ("item 2 held with one household below", "outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo", "outcome: tri(legs.filter(l => l.lo > SPEND_H).length >= 15 && mean.lo"),
    # the split
    ("the split ignores the reader", "const who = [lr >= margin ? 'the reader' : null,", "const who = [null,"),
    ("the split ignores the tier state", "lt >= margin ? 'the tier state' : null].filter(Boolean);", "null].filter(Boolean);"),
    ("the split without the no-bridge rule", "if (!hasBridge(id)) return 'the tier state (no bridge: the reader reads as off)';", ""),
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
