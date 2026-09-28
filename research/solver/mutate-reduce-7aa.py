#!/usr/bin/env python3
# THE 7AA REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7aa.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs. The paired cells and the
# Holm families are reduce-7v.mjs's (mutated there, results-reduce-7v-mutations.txt).
#   python3 research/solver/mutate-reduce-7aa.py > research/solver/results-reduce-7aa-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7aa.mjs'), os.path.join(HERE, 'zz-mut-7aa.mjs')
base = open(SRC).read()
M = [
    # the gate
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`)"),
    ("the gate does not read the estate weight", ", bequestWeight: w };", " };"),
    ("the gate strips the minimum pot with the tier state", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ bequestWeight \\S+/, '');", "const strip = s => (s || '').replace(/ tierState \\S+/, '').replace(/ bequestWeight \\S+/, '').replace(/ minPot \\S+/, '');"),
    ("the gate ignores a second setting changed within a case", "if (u.ran && ref && strip(u.ran) !== strip(ref.ran))", "if (false)"),
    ("the gate ignores the scale within a case", "(u.joint.scale !== refJ.joint.scale || u.joint.cap !== refJ.joint.cap)", "(u.joint.cap !== refJ.joint.cap)"),
    ("the gate does not read the seed", "seed: SEED, paths", "paths"),
    ("the gate does not read the path count", "paths: String(N), grid", "grid"),
    ("the gate does not read the points", "pts: PTS, seed", "seed"),
    ("the gate does not read the return points", "quad: '5', finalIntegral", "finalIntegral"),
    ("the gate does not read the final year", "finalIntegral: 'true', bridgeRead", "bridgeRead"),
    ("the gate reads the bridge read the wrong way for OFF", "bridgeRead: u.arm === 'READER' ? 'reader' : 'false', bequestWeight", "bridgeRead: 'reader', bequestWeight"),
    ("the gate does not read the tier state", "if (!!field(u.ran, 'tierState') !== (t !== 'PRODUCT'))", "if (false)"),
    ("the gate reads the tier state on TS+J alone", "if (!!field(u.ran, 'tierState') !== (t !== 'PRODUCT'))", "if (!!field(u.ran, 'tierState') !== (t === 'TS+J'))"),
    ("the gate does not read the held tier, Q's fix or the reference", "for (const k of ['holdTier', 'bridgeStep', 'readerRef'])", "for (const k of [])"),
    ("the gate does not read one policy for every world", "if (u.joint.joint !== (t === 'TS+J'))", "if (false)"),
    ("the gate ignores the solved margin", "if (u.joint.margin !== '0.001')", "if (false)"),
    ("the gate accepts four worlds", "if (u.worlds.length !== 3 ||", "if (u.worlds.length < 3 ||"),
    ("the gate accepts any world path count", "|| u.worlds[k].paths !== WP)", ")"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing gap line", "if (!u.gap) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing run line", "if (!u.run) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing done line", "if (!u.done) bad.push", "if (false) bad.push"),
    ("a trace's seed not compared", "String(j.seed) === SEED && j.arm", "j.arm"),
    ("a trace's arm not compared", "j.arm === `${arm}/${l}` && ", ""),
    ("a trace's survival allowed at three decimals", "export const SIM_TOL = 5e-5 + 1e-9, ALPHA = 0.05;", "export const SIM_TOL = 5e-4 + 1e-9, ALPHA = 0.05;"),
    ("a trace's survival compared strictly inside the rounding", "export const SIM_TOL = 5e-5 + 1e-9, ALPHA = 0.05;", "export const SIM_TOL = 5e-5 - 1e-9, ALPHA = 0.05;"),
    # the whole score
    ("the estate weight fixed at 0.02", "out[i] = 100 * ((alive ? 1 : 0) + wb * est / scale", "out[i] = 100 * ((alive ? 1 : 0) + 0.02 * est / scale"),
    ("the estate uncapped", "est = alive ? Math.min(T.wealth[i * T.Y + T.Y - 1], cap) : 0;", "est = alive ? T.wealth[i * T.Y + T.Y - 1] : 0;"),
    ("the failure charge dropped", "if (T.failYear[i] >= 0) for (let t = T.failYear[i]; t < T.Y; t++) if (spendYears[t]) cut += lambda * (1 - floor) ** 2;", ""),
    ("the whole leg the wrong way round", "d[i] = (sb[i] - 100 * B.survived[i]) - (sa[i] - 100 * A.survived[i]);", "d[i] = (sa[i] - 100 * A.survived[i]) - (sb[i] - 100 * B.survived[i]);"),
    ("the survival part left out of the whole", "return { d: sv.d + m, lo: sv.lo + m - z * se, hi: sv.hi + m + z * se,", "return { d: sv.d + m, lo: m - z * se, hi: m + z * se,"),
    ("the whole interval without the rest's spread", "lo: sv.lo + m - z * se, hi: sv.hi + m + z * se,", "lo: sv.lo + m, hi: sv.hi + m,"),
    # the items
    ("the legs the wrong way round", "k: cells(S(id, arm, label(a, w)), S(id, arm, label(b, w)))", "k: cells(S(id, arm, label(b, w)), S(id, arm, label(a, w)))"),
    ("the margin from the wrong weight", "const out = [], mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, label('PRODUCT', w))));", "const out = [], mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, label('PRODUCT', '0'))));"),
    ("item 1 read at the weight 0.02", "const i1 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0')));", "const i1 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0.02')));"),
    ("item 1 held on one case", "outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain') });", "outcome: i1.some(x => x.o === 'gain') ? 'HELD' : 'INCONCLUSIVE' });"),
    ("item 2 against PRODUCT", "const i2 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'TS', '0')));", "const i2 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0')));"),
    ("item 3 held on one leg", "outcome: i3.every(x => x.o === 'no material harm') ? 'HELD'", "outcome: i3.some(x => x.o === 'no material harm') ? 'HELD'"),
    ("item 3 leaves out S360 under off", "const two = [['S126', 'READER'], ['S194', 'OFF']], harmLegs = [['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];", "const two = [['S126', 'READER'], ['S194', 'OFF']], harmLegs = [['bridge 4', 'READER'], ['S360', 'READER']];"),
    ("item 4 without the survival limit", "const o = surv === 'harm' ? 'harm (the survival limit)' : w.lo > 0 && surv === 'no material harm' ? 'gain'", "const o = w.lo > 0 ? 'gain'"),
    ("item 4 gains on an inconclusive survival", "w.lo > 0 && surv === 'no material harm' ? 'gain'", "w.lo > 0 && surv !== 'harm' ? 'gain'"),
    ("item 4 reads the whole score's point, not its interval", "w.lo > 0 && surv === 'no material harm' ? 'gain' : w.hi < m ?", "w.d > 0 && surv === 'no material harm' ? 'gain' : w.d < m ?"),
    ("item 4 held on one case", "outcome: tri(i4, x => x.o === 'gain', x => x.o === 'no material gain' || x.o.startsWith('harm')) });", "outcome: i4.some(x => x.o === 'gain') ? 'HELD' : 'INCONCLUSIVE' });"),
    ("item 5 reads one case", "const pool = [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER']].map", "const pool = [['S126', 'READER']].map"),
    ("item 5 against PRODUCT", "leg(id, arm, 'TS+J', 'TS', '0.02').k);", "leg(id, arm, 'TS+J', 'PRODUCT', '0.02').k);"),
    ("item 5 held without a gain", "outcome: i5[0].o === 'gain' ? 'HELD'", "outcome: i5[0].o !== 'no material gain' ? 'HELD'"),
    ("item 6 read at W0", "const i6 = harmFamily(harmLegs.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0.02')));", "const i6 = harmFamily(harmLegs.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0')));"),
    ("item 6 held on one leg", "outcome: i6.every(x => x.o === 'no material harm') ? 'HELD'", "outcome: i6.some(x => x.o === 'no material harm') ? 'HELD'"),
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
