"""Exact Gaussian integral of the piecewise-linear (log-wealth) next-year table: E[f(a+sZ)] = v0 + sum_j s_j [C(x_j)-C(x_j+1)],
C(x) = (a-x)Phi((a-x)/s) + s phi((a-x)/s). Does it restore the smooth s^2 law of the year-0 gap's even part?"""
import numpy as np, sys
from scipy.stats import norm
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from toy import *
def exact_q(lg, v, k, x):
    a = np.log(np.exp(x) - S) + MU[k]; s = SIG[k]
    sl = np.diff(v)/np.diff(lg)
    C = lambda xx: (a[:, None]-xx)*norm.cdf((a[:, None]-xx)/s) + s*norm.pdf((a[:, None]-xx)/s)
    return v[0] + (sl*(C(lg[:-1]) - C(lg[1:]))).sum(1)
x0 = np.log(28.0)
lg30, V30 = solve_free(30, 5); h = lg30[1]-lg30[0]
lgr, Vr = solve_free(1200, 20)
for off in (0.0, 0.33, 0.61):
    xc = x0 + off*h; es = []; gc = None
    for fr in (1, .5, .25, .125):
        xs = np.array([xc - fr*h, xc, xc + fr*h]); g = exact_q(lg30, V30[1], 2, xs) - exact_q(lg30, V30[1], 0, xs)
        es.append(g[0] + g[2] - 2*g[1]); gc = g[1]
    es = np.array(es)
    gr = qvals(lgr, Vr[1], (0, 2), 20, np.array([xc])); gq = qvals(lg30, V30[1], (0, 2), 5, np.array([xc]))
    print(f'start +{off:.2f} cell: exact-integrated 30pt gap {gc:+.5f} (GH5 {gq[1,0]-gq[0,0]:+.5f}, ref {gr[1,0]-gr[0,0]:+.5f});'
          f' even parts {np.array2string(es, precision=2)} ratios {np.array2string(es[:-1]/es[1:], precision=2)}')
