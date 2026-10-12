"""Flatness between tiers, estate term size, item-7 arithmetic, 2-epsilon check, margin-rule discontinuity, CRN sample sizes."""
import numpy as np, sys
from scipy import stats
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import toy
from toy import *
W0 = 28.0; x0 = np.log(W0)
# ---- flatness: continuous equity weight, fixed for life and for one year
cm = np.polyfit(EQ, np.log1p(MED), 2)
def tier_params(w):
    s = np.sqrt((w*SE_)**2 + ((1-w)*SB_)**2 + 2*w*(1-w)*RHO*SE_*SB_); return np.polyval(cm, w), s
ws = np.linspace(0.1, 0.9, 33)
toy.MU = np.concatenate([MU, [0.0]]); toy.SIG = np.concatenate([SIG, [0.0]])
lgr, Vr = solve_free(1200, 20)
life, one = [], []
for w in ws:
    toy.MU[5], toy.SIG[5] = tier_params(w)
    life.append(np.interp(x0, *fixed_tier_value(600, 20, 5)))
    one.append(qvals(lgr, Vr[1], (5,), 20, np.array([x0]))[0, 0])
life, one = np.array(life), np.array(one)
for name, f in (('fixed-for-life', life), ('one-year (free continuation)', one)):
    i = int(np.argmax(f)); sl = slice(max(0, i-6), min(len(ws), i+7))
    a, b, c = np.polyfit(ws[sl], f[sl], 2); wstar = -b/(2*a); kappa = -2*a
    print(f'{name}: argmax w={ws[i]:.3f} (quadratic vertex {wstar:.3f}), curvature kappa={kappa:.4f}, half*kappa*0.2^2={0.5*kappa*0.04:.5f};'
          f' value at tiers 0.9/0.7/0.5: {np.round(np.interp([0.9, 0.7, 0.5], ws, f), 5)}')
toy.MU, toy.SIG = MU, SIG
# ---- estate term: lambda * log1p((W_T-P)/W0) for W_T > P (product 'logfloor', estateScale 1)
for lam in (0.01, 0.02):
    lge, Ve = solve_free(1200, 20, lam=lam, W0=W0)
    ge = qvals(lge, Ve[1], (0, 1, 2), 20, np.array([x0]))[:, 0]
    fx = [np.interp(x0, *fixed_tier_value(1200, 20, k, lam=lam, W0=W0)) for k in (0, 1, 2)]
    fx0 = [np.interp(x0, *fixed_tier_value(1200, 20, k)) for k in (0, 1, 2)]
    q0 = qvals(lgr, Vr[1], (0, 1, 2), 20, np.array([x0]))[:, 0]
    print(f'estate lam={lam}: one-year gap change from the estate term {np.round((ge-ge[0])-(q0-q0[0]), 6)};'
          f' fixed-for-life estate-term difference vs tier 0 {np.round((np.array(fx)-fx[0])-(np.array(fx0)-fx0[0]), 5)}')
# ---- item 7: share of verdict disagreements -> ratio of spreads (independent zero-mean normals)
k, n = 36, 220; p = k/n; ci = stats.beta.ppf([0.025, 0.975], [k, k+1], [n-k+1, n-k])
print(f'item 7: p={p:.4f} (95% CI {ci[0]:.3f}-{ci[1]:.3f}) -> sigma_aux/sigma_surv = tan(pi p) = {np.tan(np.pi*p):.3f}'
      f' (CI {np.tan(np.pi*ci[0]):.3f}-{np.tan(np.pi*ci[1]):.3f})')
rng = np.random.default_rng(3); X = rng.standard_normal(10**6); Y = np.tan(np.pi*p)*rng.standard_normal(10**6)
print('   Monte Carlo check of disagreement rate:', round(float(np.mean(np.sign(X) != np.sign(X+Y))), 4))
# ---- raise credit arithmetic (product code: 0.003*sqrt(min(0.2, level-1)))
for lv in (1.05, 1.1, 1.2):
    print(f'raise credit per raised year at level {lv}: {0.003*np.sqrt(min(0.2, lv-1)):.2e}')
# ---- 2-epsilon check: coarse (30, GH5) tables vs reference at W0
lgc, Vc = solve_free(30, 5)
qc = qvals(lgc, Vc[1], (0, 1, 2), 5, np.array([x0]))[:, 0]
qr = qvals(lgr, Vr[1], (0, 1, 2), 20, np.array([x0]))[:, 0]
zz, ww = gh(20); nxt = np.log(W0 - S) + MU[:3, None] + SIG[:3, None]*zz[None, :]
eps = np.max(np.abs(np.interp(nxt, lgc, Vc[1]) - np.interp(nxt, lgr, Vr[1])))
eQ = qc - qr
print(f'2-eps check: sup |V1hat - V1*| on the year-1 support = {eps:.4f}; Q errors by tier {np.round(eQ, 5)};'
      f' coarse pick {int(np.argmax(qc))} ref pick {int(np.argmax(qr))}; one-step loss {qr.max()-qr[int(np.argmax(qc))]:.5f} <= 2eps {2*eps:.4f};'
      f' differential error |e_a - e_b| max {np.max(np.abs(np.subtract.outer(eQ, eQ))):.5f}')
# ---- margin as a backward RULE (no charge) creates value jumps of size m; a charge creates only kinks
def solve_rule(n, nq, m):
    lg, h = grid(n); V = np.tile(terminal(lg), (3, 1))
    for t in range(T-1, -1, -1):
        C = np.stack([qvals(lg, V[j], (j,), nq, lg)[0] for j in range(3)])
        best = C.max(0); V = np.stack([np.where(best - C[hh] > m, best, C[hh]) for hh in range(3)])
        if t == 20: V20 = V.copy()
    return lg, V20
for m in (0.001, 0.01):
    lg_, Vh = solve_rule(2400, 20, m)
    jumps = np.abs(np.diff(Vh[0])); smooth = np.median(jumps)
    print(f'backward margin RULE m={m}: largest one-cell step in V(.,tier0) at t=20 {jumps.max():.5f} (median step {smooth:.2e}) -> jump of ~m')
    lg_, Vch = solve_charge(2400, 20, c=m)
    print(f'   charge c={m}: largest one-cell step {np.abs(np.diff(Vch[20][0])).max():.5f}')
# ---- paired CRN sample sizes: SE of a paired difference ~ sqrt(d/N) for discordant share d (net small)
for d in (0.005, 0.02, 0.063):
    for res in (1e-3, 3e-4, 1e-4):
        print(f'discordant share {d}: paths for 2 SE <= {res:g}: {int(np.ceil(4*d/res**2)):,}')
