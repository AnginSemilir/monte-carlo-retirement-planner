#!/usr/bin/env python3
# THE 7AG REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ag.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); the spending measures and sameBits are reduce-7af.mjs's (mutated by
# mutate-reduce-7af.py); the paired cells are reduce-7v.mjs's, the exact interval stats.mjs's.
#   python3 research/solver/mutate-reduce-7ag.py > research/solver/results-reduce-7ag-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ag.mjs'), os.path.join(HERE, 'zz-mut-7ag.mjs')
base = open(SRC).read()
M = [
    # the gate: the units
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("PRODR dropped from the registered units", "...PANEL.filter(([, b]) => b > 0).map(([id]) => [id, ...PRODR]), ['S126'", "['S126'"),
    ("the gate ignores the unit line's settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${tag}: no solve line`);", ""),
    ("the gate ignores the estate weight", "finalIntegral: 'true', bequestWeight: W, bridgeRead:", "finalIntegral: 'true', bridgeRead:"),
    ("the gate ignores the paths", "seed: SEED, paths: String(nOf(u, n)), grid:", "seed: SEED, grid:"),
    ("the registered paths are 7af's 8,000", "export const N = 16000,", "export const N = 8000,"),
    ("the gate ignores the points", "const want = { mix: '3', pts, seed", "const want = { mix: '3', seed"),
    ("the gate ignores the bridge read", "bridgeRead: u.arm === 'READER' ? 'reader' : 'false' };", "};"),
    ("the gate ignores the tier state", "if (!!field(u.ran, 'tierState') !== ts) bad.push", "if (false) bad.push"),
    ("the gate accepts a switchMargin on the ran line", "for (const k of ['holdTier', 'bridgeStep', 'readerRef', 'switchMargin'])", "for (const k of ['holdTier', 'bridgeStep', 'readerRef'])"),
    ("the gate ignores the joint flag", "if (u.joint.joint !== ts) bad.push", "if (false) bad.push"),
    ("the gate ignores the margin", "if (u.joint.margin !== '0.001') bad.push", "if (false) bad.push"),
    ("the gate ignores a pension death charge", "if (u.joint.deathTax !== 0) bad.push", "if (false) bad.push"),
    ("the gate accepts world lines", "if (u.worlds.length) bad.push", "if (false) bad.push"),
    ("the done line is not required", "if (!u.done) bad.push(`${tag}: no done line`);", ""),
    ("the gate strips more within a household (minPot)", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ bridgeRead \\S+/, '');", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ bridgeRead \\S+/, '').replace(/ minPot \\S+/, '');"),
    ("the gate ignores the scale within a household", "(u.joint.scale !== refJ.joint.scale || u.joint.cap", "(u.joint.cap"),
    ("the gate ignores the risk-above decision within a household", " || u.joint.decided !== refJ.joint.decided)) bad.push", ")) bad.push"),
    # traces
    ("the trace agreement ignores the arm", "j.arm === `${arm}/${l}` && ['code'", "['code'"),
    ("the trace agreement ignores the survival", "&& Math.abs(j.sim - sim) <= SIM_TOL);\n\nconst tri", ");\n\nconst tri"),
    ("the trace agreement ignores the count", "j.stamp && j.N === n && String", "j.stamp && String"),
    ("a missing trace is skipped", "if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }", "if (!existsSync(f)) { continue; }"),
    ("a disagreeing trace is kept", "{ bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }", "{ }"),
    # the margins
    ("S124 at the looser 0.5", "export const MARGIN = { S124: 0.25,", "export const MARGIN = { S124: 0.5,"),
    ("S128 at 0.25", "S128: 0.5, S130", "S128: 0.25, S130"),
    ("item 1 at the margin 0.5 everywhere", "return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });", "return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: 0.5 }; });"),
    ("item 1 ignores a margin passed in", "export function items(K, SP, margin = id => MARGIN[id]) {", "export function items(K, SP, margin0) { const margin = id => MARGIN[id];"),
    # item 1
    ("item 1 without Holm", "legs.forEach((l, i) => { l.pHolm = adj[i];", "legs.forEach((l, i) => { l.pHolm = l.p;"),
    ("item 1 reads CAND against PRODR", "const k = K(id, 'CAND', 'SHIP'); return { id, k, p:", "const k = K(id, 'CAND', 'PRODR'); return { id, k, p:"),
    ("item 1 reads the cells the wrong way round", "return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin", "return { id, k, p: mcnemarHarmP(k.saved, k.lost), margin"),
    ("item 1 held on most households", "outcome: tri(legs.every(l => l.o === 'no material harm'), legs.some(l => l.o === 'harm')) }); }", "outcome: tri(legs.filter(l => l.o === 'no material harm').length > 6, legs.some(l => l.o === 'harm')) }); }"),
    ("item 1 never falsified", "legs.some(l => l.o === 'harm')) }); }", "false) }); }"),
    # item 2
    ("item 2 at 10%, not 5%", "SPEND_H = -0.05,", "SPEND_H = -0.10,"),
    ("item 2's mean at 2%, not 1%", "SPEND_M = -0.01;", "SPEND_M = -0.02;"),
    ("item 2 held on the point, not the lower end", "outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M,", "outcome: tri(legs.every(l => l.d > SPEND_H) && mean.d > SPEND_M,"),
    ("item 2 without the mean", "outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M, legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }", "outcome: tri(legs.every(l => l.lo > SPEND_H), legs.some(l => l.hi < SPEND_H)) }); }"),
    ("item 2 held with one household below", "outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo", "outcome: tri(legs.filter(l => l.lo > SPEND_H).length >= 8 && mean.lo"),
    ("item 2 never falsified", "legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }", "false) }); }"),
    # TSOFF and item 3
    ("TSOFF at the nine's path count", "const nOf = (u, n) => (isTsoff(u) ? (n === N ? N_S126 : n) : n);", "const nOf = (u, n) => n;"),
    ("TSOFF not required against 7af's S126 units", "if (!ref126 || ref126.length !== 3) bad.push(`${tag}: 7af's three S126 units not given`);\n      else for", "if (!ref126) { }\n      else for"),
    ("TSOFF's settings not compared with 7af's", "if (u.ran && strip(u.ran) !== strip(v.ran)) bad.push", "if (false) bad.push"),
    ("TSOFF's scale not compared with 7af's", "(u.joint.scale !== v.joint.scale || u.joint.cap", "(u.joint.cap"),
    ("TSOFF dropped from the registered units", ", ['S126', ...TSOFF]];", "];"),
    ("item 3 HELD on the conditional interval", "outcome: tri(ur.lo > -M3, o.outcome === 'harm') };", "outcome: tri(ir.lo > -M3, o.outcome === 'harm') };"),
    ("item 3 never falsified", "outcome: tri(ur.lo > -M3, o.outcome === 'harm') };", "outcome: tri(ur.lo > -M3, false) };"),
    ("item 3 at the margin 0.5", "export const M3 = 0.25;", "export const M3 = 0.5;"),
    ("item 3's unconditional interval from TSOFF against SHIP", "ur = guardedU(r);", "ur = guardedU(t);"),
    ("item 3's harm read the wrong way round", "const p = mcnemarHarmP(r.lost, r.saved), o = outcome({ b: r.lost, c: r.saved,", "const p = mcnemarHarmP(r.saved, r.lost), o = outcome({ b: r.saved, c: r.lost,"),
    ("item 3's harm read on TSOFF against SHIP", "const p = mcnemarHarmP(r.lost, r.saved), o = outcome({ b: r.lost, c: r.saved, N: r.N,", "const p = mcnemarHarmP(t.lost, t.saved), o = outcome({ b: t.lost, c: t.saved, N: t.N,"),
    ("TSOFF's code id not compared", "export const sameCode = (ST, STF) => !!ST && !!STF && ST.code === STF.code;", "export const sameCode = (ST, STF) => true;"),
    # the split
    ("the split ignores the reader", "const who = [lr >= margin ? 'the reader' : null,", "const who = [null,"),
    ("the split ignores the tier state", "lt >= margin ? 'the tier state' : null].filter(Boolean);", "null].filter(Boolean);"),
    ("the split reads the reader against PRODR", "const r = K(id, 'PRODR', 'SHIP'), t = K(id, 'CAND', 'PRODR'), lr", "const r = K(id, 'CAND', 'PRODR'), t = K(id, 'CAND', 'PRODR'), lr"),
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
