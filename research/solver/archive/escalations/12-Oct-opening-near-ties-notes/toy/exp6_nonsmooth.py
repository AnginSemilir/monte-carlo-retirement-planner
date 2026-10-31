"""TOY Exp 6: non-smoothness of the year-0 gap. W0 -> W0*(1+-h); odd = (g+ - g-)/2,
even = (g+ + g-)/2 - g0. Smooth: odd ~ h, even ~ h^2. Kink at/near W0: even ~ |h|.
Step (snap): odd and even jump to O(1) once h crosses the snap boundary, non-monotone.
Variants: fine / coarse(30) optimal tables; coarse fixed-policy (no max in the backward
pass: always tier 0) to isolate interpolation; coarse with W0 snapped to nearest node."""
import sys, time; sys.path.insert(0, '.')
import numpy as np
import toy
from toy import *

T = 35; C = 1e-3
HS = [1e-5, 3e-5, 1e-4, 3e-4, 1e-3, 3e-3, 1e-2, 3e-2, 1e-1]

def solve_fixed(x, T, k_fixed=0, eps=1e-6):
    """Product-style tables with NO max: continuation always tier k_fixed."""
    tab = Tab(x, T, 'product', 0.0, 0.0, eps); n = tab.n
    tab.L = np.zeros((T, 3, n)); tab.E = np.zeros((T, 3, n)); tab.POL = np.zeros((T, 3, n), int)
    alive = tab.W >= 1.0; base = np.maximum(tab.W - 1.0, 0.0)
    for t in range(T - 1, -1, -1):
        for j in range(3):
            Wn = base[:, None] * MULT[j, k_fixed][None, :]
            p, e, _ = comp(tab, t + 1, j, Wn)
            tab.L[t, j] = logit(np.where(alive, p @ GHW, 0.0), eps)
            tab.E[t, j] = np.where(alive, e @ GHW, 0.0)
    return tab

tpF = solve_product(fine_x(), T, 0.0, FINE_EPS)
W = np.linspace(12, 40, 2801); S = scores(tpF, 0, W)
g1 = S[:, 1] - S[:, 0]; g21 = S[:, 2] - S[:, 1]
i0 = np.nonzero((g1[:-1] < 0) & (g1[1:] >= 0))[0][0]
i1 = np.nonzero((g21[:-1] < 0) & (g21[1:] >= 0))[0][0]
W_HM = float(np.interp(0.0, g1[i0 - 400:i0 + 400], W[i0 - 400:i0 + 400]))
W_ML = float(np.interp(0.0, g21[i1 - 300:i1 + 300], W[i1 - 300:i1 + 300]))
xc = coarse_x(30, 0.0)
variants = {
    'fine product': (tpF, False),
    'coarse product': (solve_product(xc, T, 0.0, COARSE_EPS), False),
    'coarse fixed-policy (no max)': (solve_fixed(xc, T, 0), False),
    'coarse product + W0 snap': (None, True),
    'fine candidate': (solve_candidate(fine_x(), T, 0.0, C, FINE_EPS), False),
    'coarse candidate': (solve_candidate(xc, T, 0.0, C, COARSE_EPS), False),
}
variants['coarse product + W0 snap'] = (variants['coarse product'][0], True)

def gapf(tab, snap, W0, kind):
    if snap:
        W0 = float(np.exp(xc[np.argmin(np.abs(xc - np.log(W0)))]))
    q = year0(tab, W0)
    if kind == 'q1-q0': return q[1] - q[0]
    if kind == 'q2-q1': return q[2] - q[1]
    if kind == 'best-q0': return max(q[1], q[2]) - q[0]

L = ['TOY RESULTS - Exp 6: non-smoothness of the year-0 gap (T=35). h is relative: W0*(1+-h).',
     'cols: h | g(W0) | odd=(g+ - g-)/2 | even=(g+ + g-)/2 - g0 | odd/h | even/h | even/h^2']
cases = [('HM tie (W0=%.3f)' % W_HM, W_HM, 'q1-q0'), ('HM tie, W0+2%% (W0=%.3f)' % (1.02 * W_HM), 1.02 * W_HM, 'q1-q0'),
         ('ML tie (W0=%.3f)' % W_ML, W_ML, 'q2-q1'), ('ML tie best gap max(q1,q2)-q0', W_ML, 'best-q0')]
summ = []
for cname, W0, kind in cases:
    for vname, (tab, snap) in variants.items():
        g0 = gapf(tab, snap, W0, kind)
        L.append(''); L.append('%s | %s | %s | g0=%+.6f' % (cname, vname, kind, g0))
        rows = []
        for h in HS:
            gp = gapf(tab, snap, W0 * (1 + h), kind); gm = gapf(tab, snap, W0 * (1 - h), kind)
            odd = 0.5 * (gp - gm); even = 0.5 * (gp + gm) - g0
            rows.append((h, odd, even))
            L.append('  %7.0e | %+.3e | %+.3e | %+.3e | %+.3e | %+.3e | %+.3e' % (h, g0, odd, even, odd / h, even / h, even / h**2))
        hs = np.array([r[0] for r in rows]); ev = np.array([r[2] for r in rows]); od = np.array([r[1] for r in rows])
        # summary: slope of log|even| vs log h over h in [1e-4, 1e-2] (2 = smooth, 1 = kink, 0 = step)
        sel = (hs >= 1e-4) & (hs <= 1e-2) & (np.abs(ev) > 1e-14)
        pe = np.polyfit(np.log(hs[sel]), np.log(np.abs(ev[sel])), 1)[0] if sel.sum() >= 3 else np.nan
        sel2 = (hs >= 1e-4) & (hs <= 1e-2) & (np.abs(od) > 1e-14)
        po = np.polyfit(np.log(hs[sel2]), np.log(np.abs(od[sel2])), 1)[0] if sel2.sum() >= 3 else np.nan
        mono = np.all(np.diff(np.abs(ev)) >= -1e-15)
        summ.append((cname, vname, pe, po, mono, ev[HS.index(1e-3)], ev[HS.index(1e-2)], od[HS.index(1e-3)], od[HS.index(1e-2)]))
L.append(''); L.append('SUMMARY: power-law slope of |even| and |odd| vs h over h in [1e-4,1e-2] (smooth: even 2, odd 1; kink: even 1; step: 0)')
L.append('%-34s %-30s %7s %7s %6s %10s %10s %10s %10s' % ('case', 'variant', 'p_even', 'p_odd', 'mono', 'even@1e-3', 'even@1e-2', 'odd@1e-3', 'odd@1e-2'))
for s in summ:
    L.append('%-34s %-30s %7.2f %7.2f %6s %+10.2e %+10.2e %+10.2e %+10.2e' % s)
open('results_exp6.txt', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[-30:]))

# ---------------- 6b: snap-edge and coarse tie point, with node-crossing counts
L2 = ['', 'TOY RESULTS - Exp 6b: snap step and year-0 argmax kink; nx = number of quadrature points (tiers in the gap,',
      '3 worlds x 5 nodes) crossing a grid node between W0(1-h) and W0(1+h)']
def ncross(x, W0, h, ks):
    c = 0
    for j in range(3):
        for k in ks:
            a = np.log((W0 * (1 - h) - 1) * MULT[j, k]); b = np.log((W0 * (1 + h) - 1) * MULT[j, k])
            c += np.sum((x[None, :] > a[:, None]) & (x[None, :] <= b[:, None]))
    return c
tc = variants['coarse product'][0]
i = np.searchsorted(xc, np.log(W_HM)); mid = 0.5 * (xc[i - 1] + xc[i])
W_edge = float(np.exp(mid + 0.003))
Wsc = np.linspace(W_ML * 0.85, W_ML * 1.15, 3001); Sc = scores(tc, 0, Wsc); d21 = Sc[:, 2] - Sc[:, 1]
ic = np.nonzero((d21[:-1] < 0) & (d21[1:] >= 0))[0]
W_cML = float(np.interp(0.0, d21[ic[0]:ic[0] + 2], Wsc[ic[0]:ic[0] + 2])) if len(ic) else np.nan
cases2 = [('snap edge (log-dist 0.003 above a snap boundary)', W_edge, 'q1-q0', [('coarse product + W0 snap', tc, True), ('coarse product', tc, False)]),
          ('coarse ML tie, best gap (W0=%.3f)' % W_cML, W_cML, 'best-q0', [('coarse product', tc, False), ('fine product', tpF, False)]),
          ('HM tie q1-q0, crossings', W_HM, 'q1-q0', [('coarse product', tc, False), ('fine product', tpF, False)])]
for cname, W0, kind, vv in cases2:
    for vname, tab, snap in vv:
        g0 = gapf(tab, snap, W0, kind); L2.append('%s | %s | g0=%+.6f' % (cname, vname, g0))
        xx = xc if 'coarse' in vname else fine_x()
        for h in HS:
            gp = gapf(tab, snap, W0 * (1 + h), kind); gm = gapf(tab, snap, W0 * (1 - h), kind)
            odd = 0.5 * (gp - gm); even = 0.5 * (gp + gm) - g0
            L2.append('  %7.0e | odd %+.3e | even %+.3e | odd/h %+.3e | even/h %+.3e | nx %d' % (
                h, odd, even, odd / h, even / h, ncross(xx, W0, h, [0, 1, 2])))
open('results_exp6.txt', 'a').write('\n'.join(L2) + '\n')
print('\n'.join(L2))
