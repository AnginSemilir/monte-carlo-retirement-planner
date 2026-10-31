#!/usr/bin/env python3
# 7AM'S REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7am.mjs's gate, item or arithmetic in a
# scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must apply
# exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1).
#   python3 research/solver/mutate-reduce-7am.py > research/solver/results-reduce-7am-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7am.mjs'), os.path.join(HERE, 'zz-mut-7am.mjs')
base = open(SRC).read()
M = [
    ("the gate accepts a missing unit", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }", "if (k > 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }"),
    ("the gate accepts a unit twice", "if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }", "if (k < 1) bad.push(`${id} ${a}/${l}: ${k} ${what} lines, not 1`); }"),
    ("the gate accepts an unregistered unit", "{ bad.push(`${tag}: not a registered unit`); continue; }", "{ continue; }"),
    ("the gate ignores a unit not done", "if (!u.done) bad.push(`${tag}: not done`);", ""),
    ("the gate ignores the unit settings", "if (u.lambda !== LAMBDA || u.tier !== 'own'", "if (false && u.tier !== 'own'"),
    ("the gate ignores P's margin and charge on the ran line", "...(mp ? { switchMargin: '0', switchCharge: CHARGE } : {})", "...({})"),
    ("the gate lets the bundle name a charge", "if (!mp && (field(u.ran, 'switchMargin') !== null", "if (false && (field(u.ran, 'switchMargin') !== null"),
    ("the gate ignores the tier state", "if (field(u.ran, 'tierState') === null)", "if (false)"),
    ("the gate ignores the joint line's margin and charge", "if (u.joint.margin !== (mp ? '0' : '0.001') || u.joint.charge !== (mp ? CHARGE : null))", "if (false)"),
    ("the gate ignores a death charge", "if (u.joint.deathTax !== 0)", "if (false)"),
    ("the gate ignores the reference's ran line", "if (normRan(r.ran) !== normRan(u.ran))", "if (false)"),
    ("the gate ignores a missing reference", "if (!r || !r.ran || !r.joint) { bad.push(", "if (!r || !r.ran || !r.joint) { continue; bad.push("),
    ("the gate ignores the anchor's table", "if (r.table !== u.table)", "if (false)"),
    ("the gate ignores the anchor's gap", "if (!r.gap || r.gap.gap !== u.gap.gap", "if (!r.gap || false"),
    ("the gate ignores a tier real off its set", "if (Math.abs(v - want) > (set === 'linear' ? 0.01 : 0.005) + 1e-9)", "if (false)"),
    ("the gate ignores a tier that did not move", "if (set !== 'linear' && !(UP[set] * (v - o60[n].linear) >= (half ? 0.045 : 0.1) - 1e-9))", "if (false)"),
    ("parse drops the charge", "charge: m[5] ?? null", "charge: null"),
    ("the half sets at a third", "set === 'halfblend' ? o[k].linear + (o[k].blend - o[k].linear) / 2", "set === 'halfblend' ? o[k].linear + (o[k].blend - o[k].linear) / 3"),
    ("the blind part without the linear gap", "C = (B + R) / 2 - L", "C = (B + R) / 2"),
    ("a tie counts as opposite", "return x !== 0 && y !== 0 && x === -y;", "return x === -y;"),
    ("a gap of 0 read as a number", "g === '0' || g === '>1' ||", "g === '>1' ||"),
    ("item 1 HELD without the opposite count", "opp >= OPP_MIN && smooth >= K_OF ? 'HELD'", "smooth >= K_OF ? 'HELD'"),
    ("item 1's smooth bound loosened", "if (s && s.ratio < SMOOTH) smooth++;", "if (s && s.ratio <= 1) smooth++;"),
    ("item 1 FALSIFIED at 4", "jit >= K_OF ? 'FALSIFIED'", "jit >= 4 ? 'FALSIFIED'"),
    ("item 2 counts the knife edge", "if (x.id !== KNIFE && ", "if ("),
    ("item 2 FALSIFIED at 1", "moved.length >= 2 ? 'FALSIFIED'", "moved.length >= 1 ? 'FALSIFIED'"),
    ("item 3's kink bound at 0.2", "if (q >= Q_KINK) kink++;", "if (q >= 0.2) kink++;"),
    ("item 3 FALSIFIED at 1", "curved >= K_OF ? 'FALSIFIED'", "curved >= 1 ? 'FALSIFIED'"),
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
    h.write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC | reduce-7am.mjs {sha} | {len(M) - len(escaped)} of {len(M)} caught | escaped: {'; '.join(escaped) or 'none'}\n")
sys.exit(bad)
