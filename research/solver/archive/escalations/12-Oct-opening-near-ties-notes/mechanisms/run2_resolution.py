"""Table resolution in the toy: grid vs quadrature error of the year-0 gap, node-shift and 28/30/32 dispersion,
exact one-step gap at the true state, error scaling with n, half-step signatures."""
import numpy as np, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from toy import *
W0 = 28.0; x0 = np.log(W0)
def gap_at(lg, V, nq, x=x0):
    q = qvals(lg, V[1], (0, 1, 2), nq, np.array([x]))[:, 0]; return q - q[0], q
ref_lg, ref_V = solve_free(1200, 20)
gref, qref = gap_at(ref_lg, ref_V, 20)
print('reference gaps (1200 pts, 20 GH)', np.round(gref, 6), ' V0', round(float(qref.max()), 5))
for n, nq in ((1200, 5), (30, 20), (30, 5), (60, 5), (120, 5)):
    lg, V = solve_free(n, nq); g, q = gap_at(lg, V, nq)
    print(f'n={n:4d} GH={nq:2d}: gaps {np.round(g, 6)}  error vs ref {np.round(g - gref, 6)}  V0 {q.max():.5f} (ref {qref.max():.5f})')
# dispersion across admissible 30-point variants (node shifts) and 28/32 points, product quadrature (5)
rows = []
for n, sh in ((30, 0), (30, .25), (30, .5), (30, .75), (28, 0), (32, 0)):
    lg, V = solve_free(n, 5, shift=sh); g, q = gap_at(lg, V, 5)
    lg2 = lg; ge, _ = gap_at(lg, V, 20)  # exact one-step re-score at the true state with next year's (coarse) table
    rows.append((n, sh, g[1], g[2], ge[1], ge[2]))
    print(f'variant n={n} shift={sh}: product gap 1-0 {g[1]:+.6f} 2-0 {g[2]:+.6f} | one-step re-scored with 20 GH: {ge[1]:+.6f} {ge[2]:+.6f}')
r = np.array(rows)
print('dispersion (SD) across 6 variants: gap1', round(r[:, 2].std(ddof=1), 6), 'gap2', round(r[:, 3].std(ddof=1), 6),
      '| mean error vs ref', round(r[:, 2].mean() - gref[1], 6), round(r[:, 3].mean() - gref[2], 6))
# error scaling of the year-0 table optimism (table value at W0 vs realised survival of the chooser on those tables)
Z = np.random.default_rng(11).standard_normal((40000, T))
for n in (15, 30, 60, 120):
    lg, V = solve_free(n, 20)
    tv = qvals(lg, V[1], (0, 1, 2), 20, np.array([x0]))[:, 0].max()
    s = simulate(lg, V, W0, None, 0.0, N=40000, nq=20, Z=Z)[0].mean()
    print(f'optimism scaling: n={n:4d} table {tv:.4f} realised {s:.4f} table-realised {tv - s:+.4f}  table-ref {tv - qref.max():+.5f}')
# half-step signatures on the coarse (30, GH5) gap as a function of the starting point
lg, V = solve_free(30, 5); h = lg[1] - lg[0]
xs = x0 + np.linspace(-1.5*h, 1.5*h, 601)
gl = qvals(lg, V[1], (0, 2), 5, xs); gc = gl[1] - gl[0]
glr = qvals(ref_lg, ref_V[1], (0, 2), 20, xs); gr = glr[1] - glr[0]
err = gc - gr
print(f'cell h={h:.4f}; coarse-minus-reference gap(2-0) across 3 cells: mean {err.mean():+.6f} range [{err.min():+.6f},{err.max():+.6f}]'
      f'; reference gap varies {gr.min():+.6f}..{gr.max():+.6f}')
# periodicity check: correlation of err(x) with err(x+h)
k = int(round(h/(xs[1]-xs[0])))
print('periodicity: corr(err(x), err(x+h)) =', round(float(np.corrcoef(err[:-k], err[k:])[0, 1]), 3),
      '; corr(err(x), err(x+h/2)) =', round(float(np.corrcoef(err[:-k//2], err[k//2:])[0, 1]), 3))
def ev_od(f, i, s):
    return f[i+s] + f[i-s] - 2*f[i], f[i+s] - f[i-s]
i0 = 300
for name, f in (('coarse', gc), ('reference', gr)):
    for frac in (1.0, 0.5, 0.25):
        s = int(round(frac*k)); e, o = ev_od(f, i0, s)
        print(f'half-step test on {name}: step {frac:.2f} cell: even part {e:+.2e} odd part {o:+.2e}')
np.save('scan_err.npy', np.vstack([xs, gc, gr]))
