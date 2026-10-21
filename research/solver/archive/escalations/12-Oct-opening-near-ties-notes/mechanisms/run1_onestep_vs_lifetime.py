"""Checks: (1) table Q-gap at year 0 is one year's effect; (2) forward-only margin freezes the tier;
(3) realised gap between forced openings under the hold vs the table gap; (4) consistent charge model bound c + delta1."""
import numpy as np, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from toy import *

NREF, NQREF = 1200, 20
lg, V = solve_free(NREF, NQREF)
print('tier log-vol', np.round(SIG, 4), 'log-median', np.round(MU, 4))
for W0 in (20.0, 24.0, 28.0, 32.0):
    q = qvals(lg, V[1], (0, 1, 2), NQREF, np.array([np.log(W0)]))[:, 0]
    fx = [np.interp(np.log(W0), *fixed_tier_value(NREF, NQREF, k)) for k in (0, 1, 2)]
    print(f'W0={W0:4.0f}  table Q0 by opening {np.round(q, 5)}  gaps vs tier0 {np.round(q - q[0], 5)}'
          f' | fixed-for-life survival {np.round(fx, 4)} diffs vs tier0 {np.round(np.array(fx) - fx[0], 4)}')

# one-year effect via local expansion at W0=24: dV/dlogW and d2V/dlogW2 of V_1 at W0-1
W0 = 24.0
x = np.log(W0 - 1)
d = 0.02
v = lambda z: np.interp(z, lg, V[1])
V1p, V1pp = (v(x + d) - v(x - d))/(2*d), (v(x + d) - 2*v(x) + v(x - d))/d**2
for k in (1, 2):
    lin = V1p*(MU[k] - MU[0]) + 0.5*V1pp*((MU[k]**2 + SIG[k]**2) - (MU[0]**2 + SIG[0]**2)) + V1pp*0  # 2nd-order expansion about x
    print(f'local expansion at W0=24: V1\'={V1p:.4f} V1\'\'={V1pp:.4f}; tier{k}-tier0 approx {lin:.5f}')

# forward simulation with common random numbers
N = 40000
Z = np.random.default_rng(7).standard_normal((N, T))
res = {}
for m in (0.001, 0.0003, 0.0):
    out = {}
    for k in (0, 1, 2):
        surv, W, paid, sw = simulate(lg, V, W0, k, m, N=N, nq=NQREF, Z=Z)
        out[k] = (surv, W, paid, sw)
    res[m] = out
    s = {k: out[k][0].mean() for k in out}
    print(f'margin {m}: realised survival by forced opening {[round(s[k], 4) for k in (0, 1, 2)]}; switches/path after yr0 '
          f'{[round(out[k][3].mean(), 3) for k in (0, 1, 2)]}')
    for k in (1, 2):
        a, b = out[k][0], out[0][0]
        saved, lost = int((a & ~b).sum()), int((~a & b).sum())
        dif = a.mean() - b.mean()
        se = np.sqrt(((a.astype(float) - b)**2).mean() - dif**2)/np.sqrt(N)
        print(f'   open {k} vs open 0: saved {saved} lost {lost} of {N}; realised gap {dif:+.4f} (SE {se:.4f})')
    # free (unforced) chooser
    surv, W, paid, sw = simulate(lg, V, W0, None, m, N=N, nq=NQREF, Z=Z)
    print(f'   unforced chooser: survival {surv.mean():.4f}, switches/path after yr0 {sw.mean():.3f}')

# per path-year: how often would the stored (free) policy leave the held tier while the margin holds?
surv, W, paid, sw = simulate(lg, V, W0, None, 0.001, N=8000, nq=NQREF, Z=Z[:8000])
# re-simulate recording gains
rng_W = np.full(8000, W0); held = np.zeros(8000, int); alive = np.ones(8000, bool)
cnt_hold_leave = cnt_years = 0
gains = []
for t in range(T):
    lw = np.log(np.maximum(rng_W, 1e-300))
    Q = qvals(lg, V[t+1], (0, 1, 2), NQREF, lw)
    best = Q.argmax(0); gain = Q[best, np.arange(8000)] - Q[held, np.arange(8000)]
    a = alive & (rng_W >= S)
    gains.append(gain[a])
    cnt_hold_leave += int(((best != held) & (gain <= 0.001) & a).sum()); cnt_years += int(a.sum())
    pick = np.where((best != held) & (gain > 0.001), best, held); held = pick
    alive = a
    rng_W = np.where(alive, (rng_W - S)*np.exp(MU[held] + SIG[held]*Z[:8000, t]), 0.0)
g = np.concatenate(gains)
print(f'path-years where the free tables would leave but the 0.001 margin holds: {cnt_hold_leave/cnt_years:.3f}')
print('distribution of the best one-year gain over the held tier along paths: quantiles 50/90/99/99.9%',
      np.round(np.quantile(g, [0.5, 0.9, 0.99, 0.999]), 6), ' share > 1e-3:', round(float((g > 1e-3).mean()), 4))

# item 6 analogue: table price of de-risk opening vs realised gain, by margin
q = qvals(lg, V[1], (0, 1, 2), NQREF, np.array([np.log(W0)]))[:, 0]
for m in (0.001, 0.0):
    for k in (1, 2):
        real = res[m][k][0].mean() - res[m][0][0].mean()
        print(f'margin {m}: opening {k} vs 0: table price {q[k]-q[0]:+.5f}, realised {real:+.5f}, ratio {((q[k]-q[0])/real) if real != 0 else np.nan:.3f}')

# item 9: lost paths of the riskier opening (0) against the safer (2) under the hold
a, b = res[0.001][2], res[0.001][0]
lost_by_risky = a[0] & ~b[0]
end_pot_fail = lost_by_risky & b[2]   # risky path paid every year but ended below P
print(f'paths saved by opening 2 and lost by opening 0: {int(lost_by_risky.sum())}; of these paid every year and ended below P: '
      f'{end_pot_fail.sum()/max(1, lost_by_risky.sum()):.2f}; median shortfall/P {np.median((P - b[1][end_pot_fail])/P) if end_pot_fail.any() else np.nan:.2f}')

# consistent model: tier held in state, charge c in both passes
for c in (0.001,):
    lgc, Vc = solve_charge(NREF, NQREF, c=c)
    Cs = np.array([qvals(lgc, Vc[1][j], (j,), NQREF, np.array([np.log(W0)]))[0, 0] for j in range(3)])
    gaps = Cs - c*(np.arange(3) != 0) - Cs[0]
    # delta1: one-year effect using the stay (tier-0) continuation for both
    d1 = np.array([qvals(lgc, Vc[1][0], (j,), NQREF, np.array([np.log(W0)]))[0, 0] for j in range(3)]) - Cs[0]
    vdiff = np.max(np.abs(Vc[1][1] - Vc[1][0])), np.max(np.abs(Vc[1][2] - Vc[1][0]))
    print(f'charge {c}: year-0 net gaps vs stay {np.round(gaps, 6)}; delta1 (stay continuation) {np.round(d1, 6)};'
          f' max|V1(.,h)-V1(.,0)| {np.round(vdiff, 6)} (bound c)')
    out = {}
    for k in (0, 1, 2):
        out[k] = simulate(lgc, Vc, W0, k, 0.0, N=N, nq=NQREF, charge=c, Z=Z)
    for k in (1, 2):
        a_, b_ = out[k][0], out[0][0]
        dif = a_.mean() - b_.mean(); se = np.sqrt(((a_.astype(float) - b_)**2).mean() - dif**2)/np.sqrt(N)
        print(f'   consistent: open {k} vs 0 realised {dif:+.5f} (SE {se:.5f}) vs table gross gap {Cs[k]-Cs[0]:+.5f}'
              f' [net of charge {gaps[k]:+.5f}]; switches/path {out[k][3].mean():.3f}; saved {int((a_&~b_).sum())} lost {int((~a_&b_).sum())}')
