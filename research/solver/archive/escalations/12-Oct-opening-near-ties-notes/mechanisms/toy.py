"""Toy decumulation model used to check the derivations (not the product).
Assumptions (judgement): spend 1/yr real for T=40 withdrawals, success = pay every year AND end with W_T >= P (P = 1 year).
Tier log-returns: median m_k (brief), log-vol from equity weight with sigma_e=0.16, sigma_b=0.06, rho=0.1.
One common shock z per year (common random numbers across tiers). Linear interpolation in log wealth.
"""
import numpy as np
from numpy.polynomial.hermite_e import hermegauss

MED = np.array([0.0497, 0.0465, 0.0418, 0.0355, 0.0276])
EQ = np.array([0.9, 0.7, 0.5, 0.3, 0.1])
SE_, SB_, RHO = 0.16, 0.06, 0.10
SIG = np.sqrt((EQ*SE_)**2 + ((1-EQ)*SB_)**2 + 2*EQ*(1-EQ)*RHO*SE_*SB_)
MU = np.log1p(MED)
T, S, P = 40, 1.0, 1.0
WMIN, WMAX = 0.1, 60.0


def gh(n):
    x, w = hermegauss(n)
    return x, w/np.sqrt(2*np.pi)


def grid(n, shift=0.0):
    lo, hi = np.log(WMIN), np.log(WMAX)
    h = (hi-lo)/(n-1)
    return lo + shift*h + h*np.arange(n), h


def interp(lg, v, lw):
    # linear in log wealth, clamped; below S at a withdrawal date the path fails (handled by caller)
    return np.interp(lw, lg, v)


def terminal(lg, lam=0.0, W0=1.0):
    W = np.exp(lg)
    v = (W >= P).astype(float)
    if lam > 0:
        v = v + lam*np.where(W > P, np.log1p((W-P)/W0), 0.0)
    return v


def qvals(lg, vnext, tiers, nq, lw_now):
    """Q_k at wealth exp(lw_now) for each tier k: E[V_{t+1}((W-S) R_k)]; zero if W < S."""
    x, w = gh(nq)
    W = np.exp(lw_now)
    ok = W >= S
    base = np.log(np.maximum(W - S, 1e-300))
    out = np.zeros((len(tiers),) + np.shape(lw_now))
    for j, k in enumerate(tiers):
        nxt = base[..., None] + MU[k] + SIG[k]*x
        out[j] = np.where(ok, (interp(lg, vnext, nxt)*w).sum(-1), 0.0)
    return out


def solve_free(n=30, nq=5, tiers=(0, 1, 2), shift=0.0, lam=0.0, W0=1.0):
    """Free-switching tables (the product's backward pass, single world)."""
    lg, h = grid(n, shift)
    V = [None]*(T+1)
    V[T] = terminal(lg, lam, W0)
    for t in range(T-1, -1, -1):
        Q = qvals(lg, V[t+1], tiers, nq, lg)
        V[t] = Q.max(0)
    return lg, V


def fixed_tier_value(n, nq, k, lam=0.0, W0=1.0):
    lg, h = grid(n)
    v = terminal(lg, lam, W0)
    for t in range(T-1, -1, -1):
        v = qvals(lg, v, (k,), nq, lg)[0]
    return lg, v


def solve_charge(n=30, nq=5, tiers=(0, 1, 2), c=0.001, shift=0.0):
    """Tier held in the state, charge c per switch in the backward pass (the candidate, single world)."""
    lg, h = grid(n, shift)
    K = len(tiers)
    V = [None]*(T+1)
    V[T] = np.tile(terminal(lg), (K, 1))
    for t in range(T-1, -1, -1):
        C = np.stack([qvals(lg, V[t+1][j], (tiers[j],), nq, lg)[0] for j in range(K)])  # C[j]: hold tier j this year
        Vt = np.empty_like(C)
        for hh in range(K):
            Vt[hh] = np.max(C - c*(np.arange(K) != hh)[:, None], axis=0)
        V[t] = Vt
    return lg, V


def simulate(lg, V, W0, open_tier, margin, N=20000, seed=1, nq=5, tiers=(0, 1, 2), charge=None, held0=0, Z=None):
    """Forward chooser re-scoring at the true state; margin = forward-only hysteresis; charge = consistent model.
    Returns survived flags, end wealth, paid-every-year flag, switches after year 0."""
    rng = np.random.default_rng(seed)
    if Z is None:
        Z = rng.standard_normal((N, T))
    W = np.full(N, float(W0))
    alive = np.ones(N, bool)
    held = np.full(N, held0)
    sw = np.zeros(N)
    for t in range(T):
        lw = np.log(np.maximum(W, 1e-300))
        if charge is None:
            Q = qvals(lg, V[t+1], tiers, nq, lw)                      # (K, N)
        else:
            Q = np.stack([qvals(lg, V[t+1][j], (tiers[j],), nq, lw)[0] for j in range(len(tiers))])
            Q = Q - charge*(np.arange(len(tiers))[:, None] != held[None, :])
        if t == 0 and open_tier is not None:
            pick = np.full(N, open_tier)
        else:
            best = Q.argmax(0)
            gain = Q[best, np.arange(N)] - Q[held, np.arange(N)]
            pick = np.where((best != held) & (gain > margin), best, held)
            if t > 0:
                sw += (pick != held)
        held = pick
        alive &= W >= S
        R = np.exp(MU[np.array(tiers)[held]] + SIG[np.array(tiers)[held]]*Z[:, t])
        W = np.where(alive, (W - S)*R, 0.0)
    paid = alive.copy()
    surv = paid & (W >= P)
    return surv, W, paid, sw
