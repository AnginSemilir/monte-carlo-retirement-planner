"""TOY Exp 1b: product inconsistency at near-ties with high N (48000 paths/world, seed 2024), fine grid.
Adds (i) the static lifetime gap (hold tier k forever vs hold 0 forever; fixed-policy fine solve),
(ii) per-world table vs realised gaps (the product tables are per-world optimal = know the world)."""
import sys, time; sys.path.insert(0, '.')
import numpy as np
from toy import *
N = 48000; t0 = time.time()

def solve_static(x, T, k, eps=1e-9):
    tab = Tab(x, T, 'product', 0.0, 0.0, eps); n = tab.n
    tab.L = np.zeros((T, 3, n)); tab.E = np.zeros((T, 3, n))
    alive = tab.W >= 1.0; base = np.maximum(tab.W - 1.0, 0.0)
    for t in range(T - 1, -1, -1):
        for j in range(3):
            p, e, _ = comp(tab, t + 1, j, base[:, None] * MULT[j, k][None, :])
            tab.L[t, j] = logit(np.where(alive, p @ GHW, 0.0), eps); tab.E[t, j] = np.where(alive, e @ GHW, 0.0)
    return tab

def static_value(tab, k, W0):
    v = 0.0
    for j in range(3):
        p, _, _ = comp(tab, 1, j, (W0 - 1) * MULT[j, k]); v += PI[j] * (p @ GHW)
    return v

L = ['TOY RESULTS - Exp 1b: near-tie households, product mode, fine grid, N=48000/world (paired, seed 2024)',
     'tab = year-0 table gap (one-year effect); real(m) = realised survival gap with forward chooser margin m;',
     'static = gap if each opening were held for life (fixed-policy solve); per-world: table | realised (m=0.01)']
for T in (35, 40):
    tp = solve_product(fine_x(), T, 0.0, FINE_EPS)
    st = [solve_static(fine_x(), T, k) for k in range(3)]
    W = np.linspace(12, 40, 2801); S = scores(tp, 0, W); g1 = S[:, 1] - S[:, 0]; g21 = S[:, 2] - S[:, 1]
    i0 = np.nonzero((g1[:-1] < 0) & (g1[1:] >= 0))[0][0]; i1 = np.nonzero((g21[:-1] < 0) & (g21[1:] >= 0))[0][0]
    W_HM = float(np.interp(0.0, g1[i0 - 400:i0 + 400], W[i0 - 400:i0 + 400]))
    W_ML = float(np.interp(0.0, g21[i1 - 300:i1 + 300], W[i1 - 300:i1 + 300]))
    g2 = S[:, 2] - S[:, 0]
    i2 = np.nonzero((g2[:-1] < 0) & (g2[1:] >= 0))[0][0]
    W_HL = float(np.interp(0.0, g2[i2 - 300:i2 + 300], W[i2 - 300:i2 + 300]))
    sh = shocks(N, T, 2024)
    for name, W0, k in (('HM tie', W_HM, 1), ('HM tie x1.03', 1.03 * W_HM, 1), ('HL tie (q2=q0)', W_HL, 2), ('ML tie (q2 vs q0)', W_ML, 2)):
        q = year0(tp, W0)
        stat = static_value(st[k], k, W0) - static_value(st[0], 0, W0)
        line = 'T%d %-18s W0 %6.2f S %.3f | tab g%d %+.5f | static %+.5f |' % (T, name, W0, q.max(), k, q[k] - q[0], stat)
        pw = ''
        for m in (1e-3, 1e-2):
            o0 = simulate(tp, W0, sh=sh, opening=0, margin=m); ok = simulate(tp, W0, sh=sh, opening=k, margin=m)
            d, se = strat_mean(ok['surv'] - o0['surv'], o0['wj'], N)
            line += ' real(%g) %+.5f+-%.5f sw %.2f/%.2f |' % (m, d, se, o0['nsw'].mean(), ok['nsw'].mean())
            if m == 1e-2:
                for j in range(3):
                    pk, _, _ = comp(tp, 1, j, (W0 - 1) * MULT[j, k]); p0, _, _ = comp(tp, 1, j, (W0 - 1) * MULT[j, 0])
                    tj = pk @ GHW - p0 @ GHW
                    sel = o0['wj'] == j; dj = (ok['surv'][sel] - o0['surv'][sel])
                    pw += ' w%d %+.4f|%+.4f+-%.4f' % (j, tj, dj.mean(), dj.std(ddof=1) / np.sqrt(sel.sum()))
        L.append(line); L.append('    per-world (table | realised m=0.01):' + pw)
    print('T', T, '%.0fs' % (time.time() - t0), flush=True)
open('results_exp1b.txt', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
