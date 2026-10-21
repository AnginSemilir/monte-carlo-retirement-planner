"""TOY Exp 2b: candidate consistency with larger charges c in {0.003, 0.01} (toy analogues of the
product's long-hold regime), fine grid, the 21 Exp-1 households, N=8000/world, seed 1000+T."""
import sys, json, time; sys.path.insert(0, '.')
import numpy as np
from toy import *
hh = json.load(open('households_exp12.json')); t0 = time.time()
L = ['TOY RESULTS - Exp 2b: candidate mode with charge c (both passes, margin 0), fine grid, paired N=8000/world']
for c in (0.003, 0.01):
    L.append(''); L.append('--- c = %g ---' % c)
    L.append('%-9s | %9s %9s | %9s %9s | %9s %9s %7s | %9s %9s %7s | %5s %5s %5s' % (
        'house', 'gross g1', 'c+e1(1)', 'gross g2', 'c+e1(2)', 'tab net1', 'real d1', 'SE', 'tab net2', 'real d2', 'SE', 'sw0', 'sw1', 'sw2'))
    viol, dev, within = [], [], []
    for T in (30, 35, 40):
        tc = solve_candidate(fine_x(), T, 0.0, c, FINE_EPS); sh = shocks(8000, T, 1000 + T)
        for h in [x for x in hh if x['T'] == T]:
            W0 = h['W0']; q = year0(tc, W0, 0)
            v = np.zeros(3)
            for j in range(3):
                for k in range(3):
                    p, e, cc = comp(tc, 1, j, (W0 - 1) * MULT[j, k], h=0); v[k] += PI[j] * ((p - cc) @ GHW)
            e1 = v - v[0]
            outs = [simulate(tc, W0, sh=sh, opening=k) for k in range(3)]
            sc = [score_paths(o, 0.0, c) for o in outs]
            d = [strat_mean(sc[k] - sc[0], outs[0]['wj'], 8000) for k in (1, 2)]
            L.append('%-9s | %+9.5f %+9.5f | %+9.5f %+9.5f | %+9.5f %+9.5f %7.5f | %+9.5f %+9.5f %7.5f | %5.2f %5.2f %5.2f' % (
                h['id'], q[1] - q[0] + c, c + e1[1], q[2] - q[0] + c, c + e1[2], q[1] - q[0], d[0][0], d[0][1],
                q[2] - q[0], d[1][0], d[1][1], *[o['nsw'].mean() for o in outs]))
            for k in (1, 2):
                viol.append((q[k] - q[0] + c) - (c + e1[k])); dev.append(abs(d[k - 1][0] - (q[k] - q[0]))); within.append(dev[-1] <= 2 * d[k - 1][1])
    L.append('bound gross <= c+e1: max excess %+.2e, violations>1e-6 %d/%d; mean |real-table| %.5f; within 2SE %.2f' % (
        max(viol), sum(np.array(viol) > 1e-6), len(viol), np.mean(dev), np.mean(within)))
L.append('runtime %.0fs' % (time.time() - t0))
open('results_exp2b.txt', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
