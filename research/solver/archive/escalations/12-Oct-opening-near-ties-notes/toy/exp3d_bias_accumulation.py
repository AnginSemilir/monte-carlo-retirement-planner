"""TOY Exp 3d: where does the coarse-grid gap bias come from? Hybrid product solves: FINE tables for t >= t*,
then (t*-1) backward steps on the COARSE 30-point grid down to t=1; year-0 gap re-scored off the t=1 table.
t*=T -> almost fully coarse; t*=2 -> only the last (year-1) table is coarse. T=35, the 10 T=35 households of Exp 3-4."""
import sys, pickle; sys.path.insert(0, '.')
import numpy as np
from toy import *
T = 35
D = pickle.load(open('exp34_raw.pkl', 'rb')); hh = sorted(set((r['W0'], r['hid']) for r in D['rec'] if r['T'] == T))
tF = solve_product(fine_x(), T, 0.0, FINE_EPS); tC = solve_product(coarse_x(), T, 0.0, COARSE_EPS)
xc = coarse_x(); Wc = np.exp(xc); n = len(xc); alive = Wc >= 1; base = np.maximum(Wc - 1, 0)

def hybrid(tstar, space='logit'):
    h = Tab(xc, T, 'product', 0.0, 0.0, COARSE_EPS); h.space = space
    h.L = np.zeros((T, 3, n)); h.E = np.zeros((T, 3, n))
    for t in range(tstar - 1, 0, -1):
        for j in range(3):
            Wn = base[:, None, None] * MULT[j][None, :, :]
            src = tF if t + 1 >= tstar else h
            p, e, _ = comp(src, t + 1, j, Wn)
            P = p @ GHW; k = P.argmax(1)
            h.L[t, j] = h.enc(np.where(alive, P[np.arange(n), k], 0.0))
    return h

def interp_only(space='logit'):
    """t=1 table = FINE values sampled at the coarse nodes (no coarse recursion at all): pure last-step interpolation."""
    h = Tab(xc, T, 'product', 0.0, 0.0, COARSE_EPS); h.space = space
    h.L = np.zeros((T, 3, n)); h.E = np.zeros((T, 3, n))
    for j in range(3):
        p, _, _ = comp(tF, 1, j, Wc)
        h.L[1, j] = h.enc(np.where(alive, p, 0.0))
    return h

L = ['TOY RESULTS - Exp 3d: source of the coarse gap bias (product, T=35, 10 households x 2 gaps); error = gap - fine gap',
     '%-44s %10s %10s' % ('variant', 'mean err', 'mean|err|')]
def report(name, tab):
    e = []
    for W0, hid in hh:
        q = year0(tab, W0); qf = year0(tF, W0)
        e += [(q[1] - q[0]) - (qf[1] - qf[0]), (q[2] - q[0]) - (qf[2] - qf[0])]
    e = np.array(e); L.append('%-44s %+10.2e %10.2e' % (name, e.mean(), np.abs(e).mean()))
report('fully coarse (30 pts)', tC)
report('fine t=1 values sampled at coarse nodes (log-odds)', interp_only('logit'))
report('fine t=1 values sampled at coarse nodes (prob)', interp_only('prob'))
for ts in (2, 3, 6, 11, 21, 35):
    report('fine t>=%d, coarse steps %d (log-odds)' % (ts, ts - 1), hybrid(ts))
open('results_exp3d.txt', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
