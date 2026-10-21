"""Which ingredient makes the coarse year-0 gap's even part non-monotone? Re-score year 0 with 20 GH on the coarse
(30, GH5) tables; and a 60-point solve with GH5. Steps of 1, 1/2, 1/4, 1/8 cell, at three starting points."""
import numpy as np, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from toy import *
x0 = np.log(28.0)
lg30, V30 = solve_free(30, 5); h = lg30[1] - lg30[0]
lg60, V60 = solve_free(60, 5)
lgr, Vr = solve_free(1200, 20)
def gap(lg, V, nq, x): q = qvals(lg, V[1], (0, 2), nq, np.atleast_1d(x)); return q[1] - q[0]
for off in (0.0, 0.33, 0.61):
    xc = x0 + off*h
    for name, (lg, V, nq) in {'30pt GH5 (product-like)': (lg30, V30, 5), '30pt tables, yr0 re-scored GH20': (lg30, V30, 20),
                              '60pt GH5': (lg60, V60, 5), 'reference': (lgr, Vr, 20)}.items():
        es = []
        for fr in (1, .5, .25, .125):
            s = fr*h; g = gap(lg, V, nq, [xc - s, xc, xc + s]); es.append(g[0] + g[2] - 2*g[1])
        es = np.array(es)
        print(f'start +{off:.2f} cell | {name:32s} even part at steps 1,1/2,1/4,1/8 cell: {np.array2string(es, precision=2)}'
              f'  ratios {np.array2string(es[:-1]/es[1:], precision=1)} (smooth: 4)')
