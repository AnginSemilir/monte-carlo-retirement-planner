#!/usr/bin/env python3
"""
THE PATTERN SEARCH FOR HOW AN EMPLOYEE PAYS INTO THEIR PENSION (D154 (3); the reviewer's finding 1 on b75232c2, and MINORs 1
and 3 of its second look, research/solver/reviews/2026-11-27-pension-route-2.md).

Each place the route is read changed alone, one at a time, on a copy of the tree this runs in (its tracked files as they
stand in the working tree, the engine built there), the engine rebuilt where src/App.jsx moves, and
research/tests/pension-route.test.mjs run whole on the copy; it prints, for each change, the checks that fail. Two kinds of
change: the read put back to the NIC class (`selfEmployed`), the code before D154 (3); and, for the forward run's and the
exact model's taxable pay, everyone priced as net pay (`true`), the direction the second look found the test did not read.
With --capsweep the one change no check catches, allocateBudget's earnings cap, is swept instead: allocateBudget on the
copy's own engine against the engine with the cap's read put back and, the control, against the engine with the gross-up's
put back (research/solver/pension-route-capsweep.mjs). research/solver/pension-route-results.sh prints
research/solver/results-pension-route.txt from these.

  python3 research/solver/pension-route-mutations.py [-j 3]
  python3 research/solver/pension-route-mutations.py --capsweep
"""
import os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True, check=True).stdout.strip()
# [name, file, the text as it is, the change]
SITES = [
    ['engine-taxablepay', 'src/App.jsx', "P, ROUTE_PLANT.rule === 'enginepay' ? o.selfEmployed : o.reliefTaxOnly) * frac;", "P, o.selfEmployed) * frac;"],
    ['engine-takehome', 'src/App.jsx', "calculateUKTaxAndNIC(pay, P, o.selfEmployed) - netCostOfPensionContrib(penContrib, pay, P, o.reliefTaxOnly);", "calculateUKTaxAndNIC(pay, P, o.selfEmployed) - netCostOfPensionContrib(penContrib, pay, P, o.selfEmployed);"],
    ['engine-warning', 'src/App.jsx', "else if (o.reliefTaxOnly && P.erPass > 0 && ROUTE_PLANT.rule !== 'nowarn')", "else if (o.selfEmployed && P.erPass > 0 && ROUTE_PLANT.rule !== 'nowarn')"],
    ['savesplit', 'src/App.jsx', "se = !!o.reliefTaxOnly", "se = !!o.selfEmployed"],
    ['alloc-cap', 'src/App.jsx', "o.salary * passThroughFactor(P, strategyRelief(o))", "o.salary * passThroughFactor(P, o.selfEmployed)"],
    ['alloc-grossup', 'src/App.jsx', "grossUpNetIncremental(netAmt, o.salary, P, penGross[i], cap, strategyRelief(o))", "grossUpNetIncremental(netAmt, o.salary, P, penGross[i], cap, o.selfEmployed)"],
    ['alloc-netcost', 'src/App.jsx', "netCostOfPensionContrib(penGross[i], o.salary, P, strategyRelief(o))", "netCostOfPensionContrib(penGross[i], o.salary, P, o.selfEmployed)"],
    ['alloc-floor', 'src/App.jsx', "netCostOfPensionContrib(penFloorGross[i], o.salary, P, strategyRelief(o))", "netCostOfPensionContrib(penFloorGross[i], o.salary, P, o.selfEmployed)"],
    ['outlay', 'src/App.jsx', "netCostOfPensionContrib(c, salaryAtYear(o, t), cfg, strategyRelief(o))", "netCostOfPensionContrib(c, salaryAtYear(o, t), cfg, o.selfEmployed)"],
    ['env', 'src/App.jsx', "netCostOfPensionContrib(currentPen[i], o.salary, cfg, strategyRelief(o))", "netCostOfPensionContrib(currentPen[i], o.salary, cfg, o.selfEmployed)"],
    ['relief-words', 'src/App.jsx', "owners.every(strategyRelief) ? 'tax relief'", "owners.every(o => o.selfEmployed) ? 'tax relief'"],
    ['panel-words', 'src/App.jsx', "ctx.owners.every(strategyRelief);", "ctx.owners.every(o => o.selfEmployed);"],
    ['fast-pay', 'src/solver/fast.js', "yr.pay[t] = E.taxablePayOf(salary, yr.con[0][t], P, o.reliefTaxOnly)", "yr.pay[t] = E.taxablePayOf(salary, yr.con[0][t], P, o.selfEmployed)"],
    ['fast-paysave', 'src/solver/fast.js', "yr.paySave[v][t] = E.taxablePayOf(salary, yr.saveCon[v][0][t], P, o.reliefTaxOnly)", "yr.paySave[v][t] = E.taxablePayOf(salary, yr.saveCon[v][0][t], P, o.selfEmployed)"],
    ['model-taxablepay', 'src/solver/model.js', "E.taxablePayOf(E.salaryAtYear(o, t), penContrib, P, reliefOf(o))", "E.taxablePayOf(E.salaryAtYear(o, t), penContrib, P, o.selfEmployed)"],
    ['model-takehome', 'src/solver/model.js', "E.netCostOfPensionContrib(penContrib, pay, P, reliefOf(o));", "E.netCostOfPensionContrib(penContrib, pay, P, o.selfEmployed);"],
    ['household-takehome', 'src/solver/household.js', "P, planted('houseroute') ? o.selfEmployed : o.reliefTaxOnly)", "P, o.selfEmployed)"],
    ['household-partown', 'src/solver/household.js', "P, planted('houseroute') ? own.part.selfEmployed : own.part.reliefTaxOnly)", "P, own.part.selfEmployed)"],
    # everyone priced as net pay, at the two reads only a run with the pass-through set can see (the second look, MINOR 1)
    ['fast-pay-allnet', 'src/solver/fast.js', "yr.pay[t] = E.taxablePayOf(salary, yr.con[0][t], P, o.reliefTaxOnly)", "yr.pay[t] = E.taxablePayOf(salary, yr.con[0][t], P, true)"],
    ['fast-paysave-allnet', 'src/solver/fast.js', "yr.paySave[v][t] = E.taxablePayOf(salary, yr.saveCon[v][0][t], P, o.reliefTaxOnly)", "yr.paySave[v][t] = E.taxablePayOf(salary, yr.saveCon[v][0][t], P, true)"],
    ['model-taxablepay-allnet', 'src/solver/model.js', "E.taxablePayOf(E.salaryAtYear(o, t), penContrib, P, reliefOf(o))", "E.taxablePayOf(E.salaryAtYear(o, t), penContrib, P, true)"],
]
SITE = {s[0]: s for s in SITES}


def copy_tree(dest):
    """the tree's tracked files as they stand in the working tree, node_modules linked, the engine built"""
    files = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, capture_output=True, check=True).stdout.split(b'\0')
    for f in files:
        if not f:
            continue
        rel = f.decode()
        src = os.path.join(ROOT, rel)
        if not os.path.isfile(src):
            continue  # a tracked file deleted in the working tree
        out = os.path.join(dest, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        shutil.copy2(src, out)
    os.symlink(os.path.join(ROOT, 'node_modules'), os.path.join(dest, 'node_modules'))
    build(dest)


def build(tree):
    subprocess.run(['python3', 'research/build-engine.py'], cwd=tree, capture_output=True, check=True)


def mutate(tree, name):
    """apply one change; returns the file's text before it, to restore"""
    _, f, old, new = SITE[name]
    path = os.path.join(tree, f)
    src = open(path).read()
    if src.count(old) != 1:
        raise SystemExit(f'{name} ({f}): the text to change found {src.count(old)} times, not once')
    open(path, 'w').write(src.replace(old, new))
    if f == 'src/App.jsx':
        build(tree)
    return src


def restore(tree, name, src):
    f = SITE[name][1]
    open(os.path.join(tree, f), 'w').write(src)
    if f == 'src/App.jsx':
        build(tree)


def run_sites(tree, names):
    lines = {}
    for name in names:
        src = mutate(tree, name)
        try:
            r = subprocess.run(['node', 'research/tests/pension-route.test.mjs'], cwd=tree, capture_output=True, text=True, timeout=1800)
            fails = sorted({int(m.group(1)) for m in re.finditer(r'^  FAIL (\d+)\.', r.stdout, re.M)})
            lines[name] = f"{name} ({SITE[name][1]}): checks failing {', '.join(map(str, fails)) or 'none'}"
        finally:
            restore(tree, name, src)
        print(lines[name], file=sys.stderr, flush=True)
    return lines


def main():
    args = sys.argv[1:]
    jobs = int(args[args.index('-j') + 1]) if '-j' in args else 3
    work = tempfile.mkdtemp(prefix='pension-route-')
    try:
        if '--capsweep' in args:
            tree = os.path.join(work, 'tree')
            copy_tree(tree)
            engines = {'base': os.path.join(work, 'engine-base.mjs')}
            shutil.copy(os.path.join(tree, 'research/engine.mjs'), engines['base'])
            for name in ['alloc-cap', 'alloc-grossup']:
                src = mutate(tree, name)
                engines[name] = os.path.join(work, f'engine-{name}.mjs')
                shutil.copy(os.path.join(tree, 'research/engine.mjs'), engines[name])
                restore(tree, name, src)
            sweep = os.path.join(ROOT, 'research/solver/pension-route-capsweep.mjs')
            for label, name in [('the earnings cap put back', 'alloc-cap'), ('the control, the gross-up put back', 'alloc-grossup')]:
                r = subprocess.run(['node', sweep, engines['base'], engines[name]], capture_output=True, text=True, check=True)
                print(f'{label}: {r.stdout.strip()}', flush=True)
            return
        names = [s[0] for s in SITES]
        trees = [os.path.join(work, f'tree{i}') for i in range(jobs)]
        for t in trees:
            copy_tree(t)
        share = [names[i::jobs] for i in range(jobs)]
        with ThreadPoolExecutor(jobs) as pool:
            parts = list(pool.map(run_sites, trees, share))
        lines = {k: v for p in parts for k, v in p.items()}
        for name in names:
            print(lines[name])
        caught = sum(1 for v in lines.values() if 'failing none' not in v)
        print(f'MUTATIONS: {caught} of {len(names)} caught')
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    main()
