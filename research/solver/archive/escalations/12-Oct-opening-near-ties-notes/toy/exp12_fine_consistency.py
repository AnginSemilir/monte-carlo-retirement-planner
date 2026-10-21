"""TOY Exp 1-2: product inconsistency and candidate consistency on the FINE grid.
Households: T in {30,35,40} x table survival targets; paired CRN, 8000 paths/world."""
import sys, json, time; sys.path.insert(0, '.')
import numpy as np
import toy
from toy import *

TARGETS = [0.30, 0.45, 0.60, 0.70, 0.80, 0.90, 0.95]
HORIZONS = [30, 35, 40]
MARGINS = [1e-3, 3e-4, 0.0, 3e-3, 1e-2]
C = 1e-3
N = 8000

def find_W0(tab, target):
    lo, hi = 2.0, 80.0
    for _ in range(50):
        mid = 0.5 * (lo + hi)
        if year0(tab, mid).max() < target: lo = mid
        else: hi = mid
    return round(0.5 * (lo + hi), 3)

def paired(a, b, out):
    return strat_mean(a - b, out['wj'], out['N'])

def e1_candidate(tab, W0):
    """One-year effect: sum_j pi_j (E_jk - E_j0)[V_j(1, ., held 0)] (score units)."""
    base = W0 - 1.0; v = np.zeros(3)
    for j in range(3):
        for k in range(3):
            p, e, cc = comp(tab, 1, j, base * MULT[j, k], h=0)
            v[k] += PI[j] * ((p + tab.beta * e - cc) @ GHW)
    return v - v[0]

rows1, rows2, hh = [], [], []
t0 = time.time()
for T in HORIZONS:
    tp = solve_product(fine_x(), T, 0.0, FINE_EPS)
    tc = solve_candidate(fine_x(), T, 0.0, C, FINE_EPS)
    sh = shocks(N, T, 1000 + T)
    for tg in TARGETS:
        W0 = find_W0(tp, tg)
        hid = 'T%d-S%02d' % (T, round(100 * tg))
        hh.append(dict(id=hid, T=T, W0=W0))
        qp = year0(tp, W0)
        # ---- product: forced openings under each margin
        res = {}
        for m in MARGINS:
            outs = [simulate(tp, W0, sh=sh, opening=k, margin=m) for k in range(3)]
            S = [strat_mean(o['surv'], o['wj'], o['N']) for o in outs]
            d = [paired(outs[k]['surv'], outs[0]['surv'], outs[0]) for k in (1, 2)]
            sw = [o['nsw'].mean() for o in outs]
            hold = [np.median(o['first_sw'][o['first_sw'] > 0]) for o in outs]
            free = simulate(tp, W0, sh=sh, opening=None, margin=m)
            res[m] = dict(S=S, d=d, sw=sw, hold=hold, open=np.bincount(free['open'], minlength=3).argmax(),
                          Sfree=strat_mean(free['surv'], free['wj'], free['N']))
        rows1.append((hid, W0, qp, res))
        # ---- candidate: forced openings, charge in both passes, margin 0
        qc = year0(tc, W0, 0)
        e1 = e1_candidate(tc, W0)
        outs = [simulate(tc, W0, sh=sh, opening=k) for k in range(3)]
        sc = [score_paths(o, 0.0, C) for o in outs]
        dsc = [paired(sc[k], sc[0], outs[0]) for k in (1, 2)]
        dsv = [paired(outs[k]['surv'], outs[0]['surv'], outs[0]) for k in (1, 2)]
        lvl = [strat_mean(s, outs[0]['wj'], outs[0]['N']) for s in sc]
        sw = [o['nsw'].mean() for o in outs]
        rows2.append((hid, W0, qc, e1, dsc, dsv, lvl, sw))
    print('T', T, 'done %.0fs' % (time.time() - t0), flush=True)

json.dump(hh, open('households_exp12.json', 'w'), indent=1)
L = []
L.append('TOY RESULTS - Exp 1: product mode, fine grid (640 pts), forced openings, paired CRN N=8000/world')
L.append('gap = opening k minus opening 0 (plan tier); table gap = re-scored year-0 table (one-year effect by construction)')
L.append('realised = survival difference, forward chooser continues from held k; +-SE paired, world-stratified')
for m in MARGINS:
    L.append('')
    L.append('--- margin m = %g ---' % m)
    L.append('%-9s %6s %6s | %9s %9s %7s | %9s %9s %7s | %5s %5s %5s | %4s %4s %4s | %s' % (
        'house', 'W0', 'S_tab', 'tab g1', 'real d1', 'ratio1', 'tab g2', 'real d2', 'ratio2',
        'sw0', 'sw1', 'sw2', 'hd0', 'hd1', 'hd2', 'chooser open / S'))
    for hid, W0, qp, res in rows1:
        r = res[m]; g1, g2 = qp[1] - qp[0], qp[2] - qp[0]
        L.append('%-9s %6.2f %6.3f | %+9.5f %+9.5f %7.2f | %+9.5f %+9.5f %7.2f | %5.2f %5.2f %5.2f | %4.0f %4.0f %4.0f | %d / %.4f' % (
            hid, W0, qp.max(), g1, r['d'][0][0], r['d'][0][0] / g1, g2, r['d'][1][0], r['d'][1][0] / g2,
            r['sw'][0], r['sw'][1], r['sw'][2], r['hold'][0], r['hold'][1], r['hold'][2], r['open'], r['Sfree'][0]))
    ses = [r[3][m]['d'][i][1] for r in rows1 for i in (0, 1)]
    L.append('paired SE of realised gaps: median %.5f, max %.5f' % (np.median(ses), np.max(ses)))
L.append('')
L.append('sw = switches per path after year 0; hd = median over all paths of the first-switch year after year 0 (T if a path never switches)')
L.append('')
L.append('TOY RESULTS - Exp 2: candidate mode (tier state, joint worlds, charge c=0.001 both passes, margin 0), fine grid')
L.append('%-9s %6s | %9s %9s %9s %9s | %9s %9s | %9s %9s | %9s %9s | %5s %5s %5s' % (
    'house', 'W0', 'gross g1', 'c+e1(1)', 'gross g2', 'c+e1(2)', 'tab net1', 'real d1', 'tab net2', 'real d2',
    'survd1', 'survd2', 'sw0', 'sw1', 'sw2'))
for hid, W0, qc, e1, dsc, dsv, lvl, sw in rows2:
    L.append('%-9s %6.2f | %+9.5f %+9.5f %+9.5f %+9.5f | %+9.5f %+9.5f | %+9.5f %+9.5f | %+9.5f %+9.5f | %5.2f %5.2f %5.2f' % (
        hid, W0, qc[1] - qc[0] + C, C + e1[1], qc[2] - qc[0] + C, C + e1[2], qc[1] - qc[0], dsc[0][0],
        qc[2] - qc[0], dsc[1][0], dsv[0][0], dsv[1][0], sw[0], sw[1], sw[2]))
ses = [r[4][i][1] for r in rows2 for i in (0, 1)]
L.append('paired SE of realised net-score gaps: median %.5f, max %.5f' % (np.median(ses), np.max(ses)))
viol = [(r[0], i + 1, (r[2][i + 1] - r[2][0] + C) - (C + r[3][i + 1])) for r in rows2 for i in (0, 1)]
L.append('bound gross <= c + e1: max(gross - (c+e1)) = %+.2e ; violations > 1e-6: %d of %d' % (
    max(v[2] for v in viol), sum(v[2] > 1e-6 for v in viol), len(viol)))
L.append('table vs realised net gap: mean |real - table| = %.5f ; share within 2 SE = %.2f' % (
    np.mean([abs(r[4][i][0] - (r[2][i + 1] - r[2][0])) for r in rows2 for i in (0, 1)]),
    np.mean([abs(r[4][i][0] - (r[2][i + 1] - r[2][0])) <= 2 * r[4][i][1] for r in rows2 for i in (0, 1)])))
L.append('levels (opening 0): table vs realised score: ' + '; '.join(
    '%s %.4f/%.4f' % (r[0], r[2][0], r[6][0][0]) for r in rows2[:21:3]))
L.append('runtime %.0fs' % (time.time() - t0))
open('results_exp12.txt', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
