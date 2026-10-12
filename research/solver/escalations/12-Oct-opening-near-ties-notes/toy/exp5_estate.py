"""TOY Exp 5: estate term (beta 0.01, 0.02) vs survival-only, FINE grid, near-tie households
(same 30 as Exp 3-4). Openings chosen by each mode's own year-0 rule; realised survival and
score of all three openings under each beta's own continuation. N=16000/world, seed 555."""
import sys, time, pickle; sys.path.insert(0, '.')
import numpy as np
from toy import *

C = 1e-3; N = 16000
t0 = time.time()

def pick_households(T, tp):
    W = np.linspace(12, 40, 2801)
    S = scores(tp, 0, W)
    g1 = S[:, 1] - S[:, 0]; g21 = S[:, 2] - S[:, 1]
    out = []
    i0 = np.nonzero((g1[:-1] < 0) & (g1[1:] >= 0))[0][0]
    for tg in (-2e-3, -1e-3, -3e-4, 0.0, 3e-4, 1e-3, 2e-3):
        lo, hi = max(i0 - 400, 0), min(i0 + 400, len(W) - 1)
        out.append(('HM%+.0e' % tg, float(np.interp(tg, g1[lo:hi], W[lo:hi]))))
    i1 = np.nonzero((g21[:-1] < 0) & (g21[1:] >= 0))[0][0]
    for tg in (-1e-3, 0.0, 1e-3):
        lo, hi = max(i1 - 300, 0), min(i1 + 300, len(W) - 1)
        out.append(('ML%+.0e' % tg, float(np.interp(tg, g21[lo:hi], W[lo:hi]))))
    return out

rec = []
for T in (30, 35, 40):
    tp0 = solve_product(fine_x(), T, 0.0, FINE_EPS)
    hs = pick_households(T, tp0)
    sh = shocks(N, T, 555)
    for beta in (0.0, 0.01, 0.02):
        tabs = {'product': solve_product(fine_x(), T, beta, FINE_EPS),
                'candidate': solve_candidate(fine_x(), T, beta, C, FINE_EPS)}
        for mode, tab in tabs.items():
            for name, W0 in hs:
                q = year0(tab, W0)
                kplain = int(np.argmax(q))
                kprod = kplain if (q[kplain] - q[0] > 1e-3) else 0     # product's margin rule at year 0
                outs = [simulate(tab, W0, sh=sh, opening=k, margin=1e-3) for k in range(3)]
                cc = C if mode == 'candidate' else 0.0
                sc = [score_paths(o, beta, cc) for o in outs]
                surv = [o['surv'] for o in outs]
                wj = outs[0]['wj']
                R = np.array([strat_mean(s, wj, N)[0] for s in sc])
                Sv = np.array([strat_mean(s, wj, N)[0] for s in surv])
                dS = {(a, b): strat_mean(surv[a] - surv[b], wj, N) for a in range(3) for b in range(3)}
                dR = {(a, b): strat_mean(sc[a] - sc[b], wj, N) for a in range(3) for b in range(3)}
                rec.append(dict(hid='T%d-%s' % (T, name), T=T, W0=W0, beta=beta, mode=mode, q=q,
                                kplain=kplain, kprod=kprod, R=R, Sv=Sv, dS=dS, dR=dR))
        print('T', T, 'beta', beta, '%.0fs' % (time.time() - t0), flush=True)
pickle.dump(rec, open('exp5_raw.pkl', 'wb'))
print('saved %.0fs' % (time.time() - t0))
