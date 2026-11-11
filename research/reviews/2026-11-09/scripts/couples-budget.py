#!/usr/bin/env python3
"""The couples' re-run's first stage, projected from the agent's own pilot (research/solver/results-couples-sizing-d4b.txt
on the working branch) with a couple's path made faster by the factors given. Arithmetic over that file's timings only: no
result of any run is read, and no panel couple is named (the pilot's two are 'the library pilot' and 'the younger pilot').

  python3 couples-budget.py <results-couples-sizing-d4b.txt> --candc LIB YOUNG --shipc LIB YOUNG [--solve F] [--shipc-paths N] [--label TEXT]

--candc, --shipc: how many times faster a path of that arm runs, for the library cohort and the younger cohort (1 = as
registered). --solve: how many times faster each person's CANDC table solves (1 unless the faster solve is switched on). --shipc-paths: the
paths a SHIPC unit runs in the first stage (5,000 as registered).
The sizing's model, reproduced first so the projection stands on it: a unit's time is its cohort's pilot unit's, scaled by
its years over the pilot's (the library cohort's mean years over 28; the younger cohort's 61 over 61); 20 couples a cohort,
two estate weights, 5,000 paths a unit in the first stage; the rollout beside the engine takes the path's factor too (it is
the same joint move in the exact model; not measured apart).
"""
import re
import sys

args = sys.argv[1:]
path = args[0]


def opt(name, n, default):
    if name in args:
        i = args.index(name)
        return [float(x) for x in args[i + 1:i + 1 + n]]
    return default


candc = opt('--candc', 2, [1.0, 1.0])
shipc = opt('--shipc', 2, [1.0, 1.0])
solve = opt('--solve', 1, [1.0])[0]
shipc_paths = opt('--shipc-paths', 1, [5000.0])[0]
label = args[args.index('--label') + 1] if '--label' in args else ''

text = open(path).read()
pilots = re.findall(r'pilot \S+ \((\d+) years\): (.*)', text)
if len(pilots) != 2:
    sys.exit('expected the two pilot lines')
mean_years = float(re.search(r'the horizons: library \d+ to \d+ years \(mean ([\d.]+)', text).group(1))
said = re.search(r'the first stage ([\d.]+) core-hours \(200 chunks; the solves ([\d.]+), the engine ([\d.]+), the rollout beside ([\d.]+)\)', text)
said = [float(x) for x in said.groups()]


def units(line):
    out = {}
    for arm, w, s, e, b in re.findall(r'(CANDC|SHIPC)/([\d.]+) the solve (\d+) s, the engine ([\d.]+) ms a path, beside (\d+) s', line):
        out.setdefault(arm, []).append((float(s), float(e), float(b)))
    app = float(re.search(r'APP/- the solve \d+ s, the engine ([\d.]+) ms a path', line).group(1))
    return out, app


PATHS, COUPLES = 5000, 20
rows = {}
for (years, line), cohort in zip(pilots, ['library', 'younger']):
    u, app = units(line)
    scale = mean_years / float(years) if cohort == 'library' else 1.0
    for arm in ('CANDC', 'SHIPC'):
        s = sum(x[0] for x in u[arm]) * scale * COUPLES / 3600
        e = sum(x[1] for x in u[arm]) * scale * COUPLES * PATHS / 3.6e6
        b = sum(x[2] for x in u[arm]) * scale * COUPLES / 3600
        rows[(cohort, arm)] = (s, e, b)
    rows[(cohort, 'APP')] = (0.0, app * scale * COUPLES * PATHS / 3.6e6, 0.0)

tot = [sum(r[i] for r in rows.values()) for i in range(3)]
print(f"the sizing's first stage reproduced from its pilot lines: solves {tot[0]:.1f}, engine {tot[1]:.1f}, the rollout beside {tot[2]:.1f}: {sum(tot):.1f} core-hours (the file: {said[1]}, {said[2]}, {said[3]}: {said[0]})")
if abs(sum(tot) - said[0]) > 0.15:
    sys.exit('the reproduction is not the file\'s figure: stop')
print('  as registered, by cohort and arm (solves + engine + beside, core-hours):')
for (cohort, arm), (s, e, b) in rows.items():
    if arm != 'APP':
        print(f'    {cohort:8s} {arm}: {s:5.1f} + {e:5.1f} + {b:4.1f} = {s + e + b:6.1f}')


def project(with_shipc):
    t = 0.0
    for (cohort, arm), (s, e, b) in rows.items():
        if arm == 'APP':
            t += e
            continue
        if arm == 'SHIPC' and not with_shipc:
            continue
        f = (candc if arm == 'CANDC' else shipc)[0 if cohort == 'library' else 1]
        share = shipc_paths / PATHS if arm == 'SHIPC' else 1.0   # the rollout beside runs the first 500 paths either way
        t += s / (solve if arm == 'CANDC' else 1.0) + (e * share + b) / f   # SHIPC's tables are the product's: the faster solve is not theirs
    return t


print(f"projected{' (' + label + ')' if label else ''}: a CANDC path {candc[0]:g} times faster in the library cohort and {candc[1]:g} in the younger, a SHIPC path {shipc[0]:g} and {shipc[1]:g}, each CANDC solve {solve:g}, a SHIPC unit on {shipc_paths:g} paths:")
for with_shipc in (True, False):
    t = project(with_shipc)
    print(f"  {'the three arms' if with_shipc else 'without SHIPC'}: {t:6.1f} core-hours, {t / 4:5.1f} hours on four cores ({sum(tot) / t:.1f} times less than as registered)")
