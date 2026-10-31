#!/usr/bin/env python3
# 7AQ'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7aq.mjs's gate, item or arithmetic in a
# scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7aq.py > research/solver/results-reduce-7aq-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7aq.mjs'), os.path.join(HERE, 'zz-mut-7aq.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }", "if (k > 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }", "if (k < 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores a unit not done", "if (!u.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores the unit settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate ignores a missing signed line", "if ((u.nSigned || 0) !== 1)", "if ((u.nSigned || 0) > 1)"),
    ("the gate ignores two signed lines", "if ((u.nSigned || 0) !== 1)", "if ((u.nSigned || 0) < 1)"),
    ("the gate ignores the ran line's charge", "switchMargin: '0', switchCharge: CHARGE };", "switchMargin: '0' };"),
    ("the gate ignores the reader", "bridgeRead: 'reader', mix: '3', switchMargin", "mix: '3', switchMargin"),
    ("the gate ignores the joint line's margin", "if (u.joint.margin !== '0' || u.joint.charge !== CHARGE)", "if (u.joint.charge !== CHARGE)"),
    ("the gate ignores the joint line's charge", "if (u.joint.margin !== '0' || u.joint.charge !== CHARGE)", "if (u.joint.margin !== '0')"),
    ("the gate ignores a death charge", "if (u.joint.deathTax !== 0)", "if (false)"),
    ("the gate skips the signed cross-check", "    if (e) bad.push(`${tag}: ${e}`);\n", ""),
    ("the gate skips identity with 7am", "if (set === 'logblend' || set === 'reversed') {", "if (false) {"),
    ("the identity ignores a missing 7am record", "{ bad.push(`${tag}: no 7am record of this unit`); continue; }", "{ continue; }"),
    ("the identity skips the table", "if (r.table !== u.table) bad.push(`${tag}: table ${u.table}, 7am's ${r.table}`);", ""),
    ("the identity skips the ran line", "if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not 7am's for this unit`);", ""),
    ("the identity skips the gap", "if (r.gap.gap !== u.gap.gap || r.gap.open1e3", "if (r.gap.open1e3"),
    ("the identity skips the opening", " || r.gap.open0 !== u.gap.open0) bad.push", ") bad.push"),
    ("the pair check ignores a missing P record", "{ bad.push(`${tag}: no P record for ${u.id}`); continue; }", "{ continue; }"),
    ("the pair check skips the half ran line", "if (normRan(r.ran) !== normRan(u.ran)) bad.push(`${tag}: its ran line is not P's record's but for the path count`);", ""),
    ("the record check ignores P's linear gap", "if (!r || !pos(r.gap && r.gap.gap)) bad.push", "if (!r) bad.push"),
    ("the record check ignores 7am's full-step gaps", "if (!m || !pos(m.gap && m.gap.gap)) bad.push(`${id}: 7am's ${set} gap", "if (!m) bad.push(`${id}: 7am's ${set} gap"),
    ("the record check ignores the bundle's half gaps", "if (!m || !pos(m.gap && m.gap.gap)) bad.push(`${id}: 7am's bundle", "if (!m) bad.push(`${id}: 7am's bundle"),
    # not run: pos() taking 0 as positive is an equivalent mutation (reduce-7am.mjs num() reads a printed gap of 0 as no number,
    # so a zero never reaches pos())
    ("the tiers check ignores a value off its set", "if (Math.abs(v - want) > 0.005 + 1e-9)", "if (false)"),
    ("the tiers check ignores the move's size", "if (!(up * (v - o60[n].linear) >= (half ? 0.045 : 0.1) - 1e-9))", "if (false)"),
    ("split's blind part is (B - R)/2", "{ F: (b - r) / 2, C: (b + r) / 2 - l }", "{ F: (b - r) / 2, C: (b - r) / 2 - l }"),
    ("q reads the half against the half", "Math.abs(half.C) / Math.abs(full.C) : null;", "Math.abs(half.C) / Math.abs(half.C) : null;"),
    ("item 2 compares with the bundle's full step", "Math.abs(half.C) / Math.abs(bh.C) : null;", "Math.abs(half.C) / Math.abs(bf.C) : null;"),
    ("smooth at q 0.4", "q <= Q_SMOOTH + 1e-9", "q <= Q_KINK + 1e-9"),
    ("non-smooth at q 0.33", "kink: (q !== null && q >= Q_KINK - 1e-9)", "kink: (q !== null && q >= Q_SMOOTH - 1e-9)"),
    ("under at two thirds", "vs <= UNDER + 1e-9", "vs <= NOT_UNDER + 1e-9"),
    ("not under at a third", "vs >= NOT_UNDER - 1e-9", "vs >= UNDER - 1e-9"),
    ("a family's majority is any member", "maj: k > ids.length / 2", "maj: k > 0"),
    ("item 1 HELD on any family", "const o1 = sm.every(f => f.maj)", "const o1 = sm.some(f => f.maj)"),
    ("item 1 FALSIFIED on one family", "kk.filter(f => f.maj).length >= 2 ? 'FALSIFIED'", "kk.filter(f => f.maj).length >= 1 ? 'FALSIFIED'"),
    ("item 2 HELD on any family", "const o2 = un.every(f => f.maj)", "const o2 = un.some(f => f.maj)"),
    ("item 2 FALSIFIED on one family", "nu.filter(f => f.maj).length >= 2 ? 'FALSIFIED'", "nu.filter(f => f.maj).length >= 1 ? 'FALSIFIED'"),
    ("parse misses the signed line", "const SIGNL = /^\\s+signed ", "const SIGNL = /^\\s+signd "),
    ("the families drop share 0.90", "['share 0.50', 'share 0.90', 'bridge 0', 'bridge 1', 'S126']]", "['share 0.50', 'bridge 0', 'bridge 1', 'S126']]"),
    ("a unit dropped from UNITS", "['halfblend', 'halfreversed'].map(set => [id, 'READER', labelOf(PTAG, set)]))];", "['halfblend'].map(set => [id, 'READER', labelOf(PTAG, set)]))];"),
    ("the beyond band dropped", "const beyond = q !== null && q < Q_BEYOND - 1e-9,", "const beyond = false,"),
    ("smooth ignores the lower bound", "smooth: q !== null && q >= Q_BEYOND - 1e-9 && q <= Q_SMOOTH", "smooth: q !== null && q <= Q_SMOOTH"),
    ("smooth ignores F", "&& q <= Q_SMOOTH + 1e-9 && fIn,", "&& q <= Q_SMOOTH + 1e-9,"),
    ("F off ignored", "|| beyond || fOff,", "|| beyond,"),
    ("F read where |F| is under |C|", "Math.abs(full.F) >= Math.abs(full.C) ? half.F / full.F : null", "true ? half.F / full.F : null"),
    ("F's smooth band widened to F's outer band", "(r >= F_IN[0] - 1e-9 && r <= F_IN[1] + 1e-9)", "(r >= F_OUT[0] - 1e-9 && r <= F_OUT[1] + 1e-9)"),
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
    h.write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC | reduce-7aq.mjs {sha} | {len(M) - len(escaped)} of {len(M)} caught | escaped: {'; '.join(escaped) or 'none'}\n")
sys.exit(bad)
