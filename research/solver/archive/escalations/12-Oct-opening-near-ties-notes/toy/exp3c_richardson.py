"""TOY Exp 3c: (i) Richardson bias estimate from two coarse solves (30+40, 30+60 points) vs fine;
(ii) fine grid's own error (640 vs 1280 points); (iii) quadrature: GH5 vs GH9 on the fine grid. Tables only."""
import sys, pickle, time; sys.path.insert(0, '.')
import numpy as np
from numpy.polynomial.hermite_e import hermegauss
import toy
from toy import *
D = pickle.load(open('exp34_raw.pkl', 'rb')); rec = D['rec']
hh = sorted(set((r['T'], r['W0'], r['hid']) for r in rec))
L = ['TOY RESULTS - Exp 3c: Richardson extrapolation of the year-0 gap, fine-grid self-check, quadrature check (30 households x 2 gaps)']
def gaps(tab, W0): q = year0(tab, W0); return np.array([q[1] - q[0], q[2] - q[0]]), q
for mode in ('product', 'candidate'):
    S = lambda x, T: solve_product(x, T, 0.0, COARSE_EPS) if mode == 'product' else solve_candidate(x, T, 0.0, 1e-3, COARSE_EPS)
    SF = lambda x, T: solve_product(x, T, 0.0, FINE_EPS) if mode == 'product' else solve_candidate(x, T, 0.0, 1e-3, FINE_EPS)
    E = {k: [] for k in ('30', '40', '60', 'R30+40', 'R30+60', 'fine640-1280', 'GH9-GH5')}
    F = {k: [] for k in ('30', '40', '60', 'R30+40', 'R30+60')}
    for T in (30, 35, 40):
        tabs = {n: S(coarse_x(n, 0.0), T) for n in (30, 40, 60)}
        tF = SF(fine_x(), T); tF2 = SF(make_grid(n=1280, lo=0.1, hi=100.0), T)
        for (TT, W0, hid) in hh:
            if TT != T: continue
            gF, qF = gaps(tF, W0); kF = int(np.argmax(qF))
            g = {n: gaps(tabs[n], W0) for n in (30, 40, 60)}
            for n in (30, 40, 60):
                E[str(n)] += list(g[n][0] - gF); F[str(n)].append(int(np.argmax(g[n][1])) != kF)
            for n2 in (40, 60):
                r = ((29 / (n2 - 1)) ** -2)  # error ratio err30/err_n2 for 2nd order: (d30/dn2)^2
                r = (29.0 / (n2 - 1)) ** 0  # placeholder (overwritten below)
                ratio = ((n2 - 1) / 29.0) ** 2           # err30 / err_n2
                gR = g[n2][0] + (g[n2][0] - g[30][0]) / (ratio - 1)
                qR = g[n2][1] + (g[n2][1] - g[30][1]) / (ratio - 1)
                E['R30+%d' % n2] += list(gR - gF); F['R30+%d' % n2].append(int(np.argmax(qR)) != kF)
            E['fine640-1280'] += list(gF - gaps(tF2, W0)[0])
    # quadrature check on the fine grid (product/candidate), GH9 vs GH5, T=35 only
    gx9, gw9 = hermegauss(9)
    save = (toy.GHX, toy.GHW)
    for T in (35,):
        t5 = SF(fine_x(), T)
        toy.GHX, toy.GHW = gx9, gw9 / np.sqrt(2 * np.pi); toy.set_tiers()
        t9 = SF(fine_x(), T)
        for (TT, W0, hid) in hh:
            if TT == T: E['GH9-GH5'] += list(gaps(t9, W0)[0] - gaps(t5, W0)[0])
        toy.GHX, toy.GHW = save; toy.set_tiers()
    L.append('')
    L.append('[%s] %-14s %10s %10s %10s %8s' % (mode, 'variant', 'mean err', 'mean|err|', 'max|err|', 'flip'))
    for k, v in E.items():
        v = np.array(v)
        L.append('[%s] %-14s %+10.2e %10.2e %10.2e %8s' % (mode, k, v.mean(), np.abs(v).mean(), np.abs(v).max(),
                 ('%.2f' % np.mean(F[k])) if k in F else '-'))
L.append('')
L.append('R30+n: gap_n + (gap_n - gap_30)/((29/(n-1))^-2 - 1), assumes 2nd-order error in the cell width (cost: 2 solves).')
L.append('fine640-1280: fine-grid gap minus a 1280-point gap (the fine grid\'s own resolution error); GH9-GH5: quadrature effect, T=35.')
open('results_exp3c.txt', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
