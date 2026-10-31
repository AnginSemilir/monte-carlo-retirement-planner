"""TOY 1-D decumulation solver: 3 risk tiers, 3 return worlds, survival score.

TOY MODEL ONLY. Wealth W is in years of spending (s = 1). Spending is paid at the
start of each year; a path fails if W < 1 at a payment date, or if W_T < 1 (end pot
= one year's spending). No mortality, annuities, tax, pension share, bridge years,
spending choice or learning about the world.

Modes
  product   : per-world tables solved as if switching were free (per-world argmax);
              forward chooser re-scores tiers at the path's true W with the world
              weights PI, keeps the held tier unless best beats it by margin m.
  candidate : held tier is a state; one move for all worlds (weighted score);
              switch charge c in backward and forward passes, margin 0.
Grids: log-spaced nodes; survival interpolated in log-odds (clamp eps), estate and
charge tables linearly, all in log W; max-then-interpolate; flat extrapolation.
Terminal condition and the W<1 ruin region are applied analytically.
"""
import numpy as np
from numpy.polynomial.hermite_e import hermegauss

SIG_E, SIG_B, RHO = 0.17, 0.06, 0.10          # real equity / bond log-vol, correlation
W_EQ = np.array([0.9, 0.5, 0.1])              # tier 0 (plan, High), 1, 2
MED = np.array([0.0497, 0.0418, 0.0276])      # real median annual return
MU = np.log1p(MED)
SIG = np.sqrt(W_EQ**2 * SIG_E**2 + (1 - W_EQ)**2 * SIG_B**2
              + 2 * W_EQ * (1 - W_EQ) * RHO * SIG_E * SIG_B)
TAU = 0.015                                   # parameter-uncertainty scale (equity mean)
ZW = np.array([-np.sqrt(3.0), 0.0, np.sqrt(3.0)])
PI = np.array([1 / 6, 2 / 3, 1 / 6])
SHIFT = ZW[:, None] * TAU * W_EQ[None, :]     # [world, tier] shift of the log mean
_gx, _gw = hermegauss(5)
GHX, GHW = _gx, _gw / np.sqrt(2 * np.pi)
MULT = np.exp(MU[None, :, None] + SHIFT[:, :, None] + SIG[None, :, None] * GHX[None, None, :])
KEST = 10.0                                   # estate utility scale (years of spending)


def set_tiers(w_eq=(0.9, 0.5, 0.1), med=(0.0497, 0.0418, 0.0276), tau=0.015):
    """Reset the tier menu (module globals). Default = the specified toy tiers."""
    global W_EQ, MED, MU, SIG, TAU, SHIFT, MULT
    W_EQ = np.array(w_eq, float); MED = np.array(med, float); MU = np.log1p(MED)
    SIG = np.sqrt(W_EQ**2 * SIG_E**2 + (1 - W_EQ)**2 * SIG_B**2
                  + 2 * W_EQ * (1 - W_EQ) * RHO * SIG_E * SIG_B)
    TAU = tau
    SHIFT = ZW[:, None] * TAU * W_EQ[None, :]
    MULT = np.exp(MU[None, :, None] + SHIFT[:, :, None] + SIG[None, :, None] * GHX[None, None, :])


def close_tiers(lam):
    """'Close' calibration: tiers moved a fraction lam of the way from High to the
    specified tiers (equity weight and median), shrinking one-year tier effects."""
    w = 0.9 - lam * (0.9 - np.array([0.9, 0.5, 0.1]))
    m = 0.0497 - lam * (0.0497 - np.array([0.0497, 0.0418, 0.0276]))
    set_tiers(w, m)


def u_est(W):
    """Capped bequest utility in [0,1): 1-exp(-W/10) if W>=1 else 0."""
    W = np.asarray(W, float)
    return np.where(W >= 1.0, 1.0 - np.exp(-np.maximum(W, 0.0) / KEST), 0.0)


def make_grid(n=30, lo=0.1, hi=60.0, offset=0.0):
    d = (np.log(hi) - np.log(lo)) / (n - 1)
    return np.log(lo) + (np.arange(n) + offset) * d


def logit(p, eps):
    p = np.clip(p, eps, 1 - eps)
    return np.log(p) - np.log1p(-p)


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


class Tab:
    def __init__(self, x, T, mode, beta, c, eps):
        self.x, self.T, self.mode, self.beta, self.c, self.eps = x, T, mode, beta, c, eps
        self.W = np.exp(x)
        self.n = len(x)
        self.space = SPACE['v']

    def enc(self, p):
        return logit(p, self.eps) if self.space == 'logit' else p


SPACE = {'v': 'logit'}   # survival interpolation space for NEW solves: 'logit' (product) or 'prob'


def comp(tab, t, j, Wq, h=None):
    """Survival, estate, charge components at time t (start of year t) for world j
    (and held tier h in candidate mode), interpolated at wealth Wq (any shape)."""
    Wq = np.asarray(Wq, float)
    if t == tab.T:
        p = (Wq >= 1.0).astype(float)
        return p, u_est(Wq), np.zeros_like(Wq)
    xq = np.log(np.maximum(Wq, 1e-300))
    if tab.mode == 'product':
        L, E = tab.L[t, j], tab.E[t, j]
        C = None
    else:
        L, E, C = tab.L[t, j, h], tab.E[t, j, h], tab.C[t, j, h]
    p = sigmoid(np.interp(xq, tab.x, L)) if tab.space == 'logit' else np.interp(xq, tab.x, L)
    e = np.interp(xq, tab.x, E)
    cc = np.interp(xq, tab.x, C) if C is not None else np.zeros_like(Wq)
    dead = Wq < 1.0
    p = np.where(dead, 0.0, p)
    e = np.where(dead, 0.0, e)
    cc = np.where(dead, 0.0, cc)
    return p, e, cc


def solve_product(x, T, beta=0.0, eps=1e-6):
    tab = Tab(x, T, 'product', beta, 0.0, eps)
    n = tab.n
    tab.L = np.zeros((T, 3, n)); tab.E = np.zeros((T, 3, n)); tab.POL = np.zeros((T, 3, n), int)
    alive = tab.W >= 1.0
    base = np.maximum(tab.W - 1.0, 0.0)
    for t in range(T - 1, -1, -1):
        for j in range(3):
            Wn = base[:, None, None] * MULT[j][None, :, :]
            p, e, _ = comp(tab, t + 1, j, Wn)
            P = p @ GHW; Ek = e @ GHW
            S = P + beta * Ek
            k = S.argmax(1)
            r = np.arange(n)
            Pk = np.where(alive, P[r, k], 0.0); Ekk = np.where(alive, Ek[r, k], 0.0)
            tab.L[t, j] = tab.enc(Pk); tab.E[t, j] = Ekk; tab.POL[t, j] = k
    return tab


def solve_candidate(x, T, beta=0.0, c=0.001, eps=1e-6):
    tab = Tab(x, T, 'candidate', beta, c, eps)
    n = tab.n
    tab.L = np.zeros((T, 3, 3, n)); tab.E = np.zeros((T, 3, 3, n)); tab.C = np.zeros((T, 3, 3, n))
    tab.POL = np.zeros((T, 3, n), int)
    alive = tab.W >= 1.0
    base = np.maximum(tab.W - 1.0, 0.0)
    r = np.arange(n)
    for t in range(T - 1, -1, -1):
        P = np.zeros((3, 3, n)); Ek = np.zeros((3, 3, n)); Ck = np.zeros((3, 3, n))
        for j in range(3):
            for k in range(3):
                Wn = base[:, None] * MULT[j, k][None, :]
                p, e, cc = comp(tab, t + 1, j, Wn, h=k)
                P[j, k] = p @ GHW; Ek[j, k] = e @ GHW; Ck[j, k] = cc @ GHW
        J = (PI[:, None, None] * (P + beta * Ek - Ck)).sum(0)        # [k, i]
        for h in range(3):
            Sh = J - c * (np.arange(3)[:, None] != h)
            ks = Sh.argmax(0)
            tab.POL[t, h] = ks
            for j in range(3):
                tab.L[t, j, h] = tab.enc(np.where(alive, P[j, ks, r], 0.0))
                tab.E[t, j, h] = np.where(alive, Ek[j, ks, r], 0.0)
                tab.C[t, j, h] = np.where(alive, Ck[j, ks, r] + c * (ks != h), 0.0)
    return tab


def scores(tab, t, W, h=None, parts=False):
    """Weighted score of each tier for a move at the start of year t at wealth W
    (1-D array). Candidate mode includes the charge for leaving held tier h.
    parts=True also returns per-world survival/estate/charge [3(j),N,3(k)]."""
    W = np.atleast_1d(np.asarray(W, float))
    N = len(W)
    base = np.maximum(W - 1.0, 0.0)
    S = np.zeros((N, 3))
    if parts:
        Pp = np.zeros((3, N, 3)); Ep = np.zeros((3, N, 3)); Cp = np.zeros((3, N, 3))
    for j in range(3):
        for k in range(3):
            Wn = base[:, None] * MULT[j, k][None, :]
            p, e, cc = comp(tab, t + 1, j, Wn, h=(k if tab.mode == 'candidate' else None))
            pv, ev, cv = p @ GHW, e @ GHW, cc @ GHW
            S[:, k] += PI[j] * (pv + tab.beta * ev - cv)
            if parts:
                Pp[j, :, k] = pv; Ep[j, :, k] = ev; Cp[j, :, k] = cv
    if tab.mode == 'candidate' and h is not None:
        h = np.broadcast_to(np.asarray(h), (N,))
        S = S - tab.c * (np.arange(3)[None, :] != h[:, None])
    S[W < 1.0] = 0.0
    if parts:
        return S, Pp, Ep, Cp
    return S


AUX_X = np.linspace(0.0, np.log(400.0), 12001)  # auxiliary log-wealth axis (step 0.0005)


def aux_scores(tab):
    """Pre-tabulate the forward chooser's re-scored tier values (before any switch
    charge) on a very fine auxiliary axis, per year: [T, n_aux, 3]. Linear
    interpolation of these replaces exact re-scoring in long simulations
    (error ~1e-6, far below the gaps studied). Cached on the table object."""
    if getattr(tab, 'Saux', None) is None:
        Wa = np.exp(AUX_X)
        tab.Saux = np.stack([scores(tab, t, Wa) for t in range(tab.T)])
    return tab.Saux


def shocks(N, T, seed):
    rng = np.random.default_rng(seed)
    Z1 = rng.standard_normal((3, N, T))
    Z2 = rng.standard_normal((3, N, T))
    Ze = Z1.reshape(3 * N, T)
    Zb = (RHO * Z1 + np.sqrt(1 - RHO**2) * Z2).reshape(3 * N, T)
    wj = np.repeat(np.arange(3), N)
    return Ze, Zb, wj


def simulate(tab, W0, N=8000, seed=1, opening=None, margin=0.001, sh=None,
             open_rule=None, record_tiers=False):
    """Forward run. opening: forced year-0 tier (None -> chooser from held 0).
    Product: switch iff best beats held by > margin. Candidate: argmax incl. charge.
    Returns per-path arrays (world-stratified, N per world)."""
    T = tab.T
    Ze, Zb, wj = sh if sh is not None else shocks(N, T, seed)
    Saux = aux_scores(tab)
    M = len(wj)
    W = np.full(M, float(W0)); h = np.zeros(M, int); alive = np.ones(M, bool)
    nsw = np.zeros(M, int); open_t = np.zeros(M, int); first_sw = np.full(M, T, int)
    tiers = np.full((M, T), -1, int) if record_tiers else None
    for t in range(T):
        alive &= W >= 1.0
        idx = np.nonzero(alive)[0]
        if len(idx) == 0:
            break
        hi = h[idx]
        if t == 0 and opening is not None:
            k = np.full(len(idx), int(opening))
        else:
            xq = np.log(W[idx])
            S = np.stack([np.interp(xq, AUX_X, Saux[t, :, kk]) for kk in range(3)], 1)
            if tab.mode == 'product':
                best = S.argmax(1)
                gain = S[np.arange(len(idx)), best] - S[np.arange(len(idx)), hi]
                k = np.where(gain > margin, best, hi)
            else:
                S = S - tab.c * (np.arange(3)[None, :] != hi[:, None])
                k = S.argmax(1)
        if t == 0:
            open_t[idx] = k
        else:
            chg = k != hi
            nsw[idx] += chg
            fs = idx[chg & (first_sw[idx] == T)]
            first_sw[fs] = t
        h[idx] = k
        if record_tiers:
            tiers[idx, t] = k
        lr = MU[k] + SHIFT[wj[idx], k] + W_EQ[k] * SIG_E * Ze[idx, t] + (1 - W_EQ[k]) * SIG_B * Zb[idx, t]
        W[idx] = (W[idx] - 1.0) * np.exp(lr)
    surv = alive & (W >= 1.0)
    est = u_est(W) * surv
    out = dict(surv=surv.astype(float), est=est, nsw=nsw, open=open_t, wj=wj, WT=W, N=M // 3,
               first_sw=first_sw)
    if record_tiers:
        out['tiers'] = tiers
    return out


def score_paths(out, beta=0.0, c=0.0):
    """Realised per-path score: survival + beta*estate - c*(switches incl. opening)."""
    nswitch = out['nsw'] + (out['open'] != 0)
    return out['surv'] + beta * out['est'] - c * nswitch


def strat_mean(x, wj, N):
    """World-stratified mean and its standard error (weights PI, N paths per world)."""
    m = 0.0; v = 0.0
    for j in range(3):
        xj = x[wj == j]
        m += PI[j] * xj.mean(); v += PI[j]**2 * xj.var(ddof=1) / len(xj)
    return m, np.sqrt(v)


def year0(tab, W0, h0=0):
    """Year-0 weighted scores of the three openings at W0 (re-scored off t=1 tables)."""
    if tab.mode == 'candidate':
        return scores(tab, 0, np.array([W0]), np.array([h0]))[0]
    return scores(tab, 0, np.array([W0]))[0]


FINE = dict(n=640, lo=0.1, hi=100.0)
FINE_EPS = 1e-9
COARSE_EPS = 1e-6


def fine_x():
    return make_grid(**FINE)


def coarse_x(n=30, offset=0.0):
    return make_grid(n=n, lo=0.1, hi=60.0, offset=offset)
