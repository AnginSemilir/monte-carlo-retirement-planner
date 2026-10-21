# TOY Exp 4b: same pipeline as exp34 on the 21 spread households of Exp 1 (or, with HFILE=None, the 30 near-ties) and a chosen rollout seed.
"""TOY Exp 3-4: coarse-grid artefacts and opening decision rules.
Households: 30 near-tie households (10 per horizon) picked on the FINE product table.
Pipelines (continuation after year 0 always on the BASE coarse grid 30 pts, offset 0):
  P1 product, margin 0.001 | P2 product, margin 0.01 (long-hold regime analogue) |
  C  candidate, charge 0.001 (both passes), margin 0.
Evaluation: forced openings, N_EVAL paths/world, seed 777 (paired, stratified).
Rule (c) rollouts use seed 4242 (independent of evaluation)."""
import sys, json, time, pickle; sys.path.insert(0, '.')
import numpy as np
import toy
from toy import *

STAB_C = False
HFILE = 'households_exp12.json'
RSEED = int(sys.argv[1]) if len(sys.argv) > 1 else 4242
OUT = sys.argv[2] if len(sys.argv) > 2 else 'exp4b_raw.pkl'
N_EVAL = 24000
GRIDS = [(n, off) for n in (28, 30, 32) for off in (0.0, 0.25, 0.5)]
BASE = (30, 0.0)
C = 1e-3
t0 = time.time()

def pick_households(T, tp):
    W = np.linspace(12, 40, 2801)
    S = scores(tp, 0, W)
    g1 = S[:, 1] - S[:, 0]; g21 = S[:, 2] - S[:, 1]
    out = []
    i0 = np.nonzero((g1[:-1] < 0) & (g1[1:] >= 0))[0][0]          # High/Medium crossing
    for tg in (-2e-3, -1e-3, -3e-4, 0.0, 3e-4, 1e-3, 2e-3):
        lo, hi = max(i0 - 400, 0), min(i0 + 400, len(W) - 1)
        out.append(('HM%+.0e' % tg, float(np.interp(tg, g1[lo:hi], W[lo:hi]))))
    i1 = np.nonzero((g21[:-1] < 0) & (g21[1:] >= 0))[0][0]        # Medium/Low crossing
    for tg in (-1e-3, 0.0, 1e-3):
        lo, hi = max(i1 - 300, 0), min(i1 + 300, len(W) - 1)
        out.append(('ML%+.0e' % tg, float(np.interp(tg, g21[lo:hi], W[lo:hi]))))
    return out

PIPES = [('P1', 'product', 1e-3), ('P2', 'product', 1e-2), ('C', 'candidate', 0.0)]
rec = []
for T in (30, 35, 40):
    tpF = solve_product(fine_x(), T, 0.0, FINE_EPS)
    tcF = solve_candidate(fine_x(), T, 0.0, C, FINE_EPS)
    hs = [(h['id'].split('-')[1], h['W0']) for h in json.load(open(HFILE)) if h['T'] == T] if HFILE else pick_households(T, tpF)
    tabs = {}
    for g in GRIDS:
        tabs[('product', g)] = solve_product(coarse_x(*g), T, 0.0, COARSE_EPS)
        tabs[('candidate', g)] = solve_candidate(coarse_x(*g), T, 0.0, C, COARSE_EPS)
    shE = shocks(N_EVAL, T, 777)
    shR = shocks(8000, T, RSEED)
    for name, W0 in hs:
        hid = 'T%d-%s' % (T, name)
        for pname, mode, m in PIPES:
            tF = tpF if mode == 'product' else tcF
            qF = year0(tF, W0)
            qg = {g: year0(tabs[(mode, g)], W0) for g in GRIDS}
            base = tabs[(mode, BASE)]
            cc = C if mode == 'candidate' else 0.0
            outs = [simulate(base, W0, sh=shE, opening=k, margin=m) for k in range(3)]
            sc = [score_paths(o, 0.0, cc) for o in outs]
            R = np.array([strat_mean(s, outs[0]['wj'], outs[0]['N'])[0] for s in sc])
            dSE = np.array([[strat_mean(sc[a] - sc[b], outs[0]['wj'], outs[0]['N'])[1] for b in range(3)] for a in range(3)])
            surv = np.array([strat_mean(o['surv'], o['wj'], o['N'])[0] for o in outs])
            sw = np.array([o['nsw'].mean() for o in outs])
            # rule (c): re-rank top two (base coarse table) by paired rollouts on seed 4242
            top2 = np.argsort(-qg[BASE])[:2]
            roll = {}
            for Nr in (1000, 4000, 8000):
                sub = (shR[0].reshape(3, 8000, T)[:, :Nr].reshape(3 * Nr, T),
                       shR[1].reshape(3, 8000, T)[:, :Nr].reshape(3 * Nr, T), np.repeat(np.arange(3), Nr))
                rv = []
                for k in top2:
                    o = simulate(base, W0, sh=sub, opening=int(k), margin=m)
                    rv.append(strat_mean(score_paths(o, 0.0, cc), o['wj'], o['N'])[0])
                roll[Nr] = int(top2[int(np.argmax(rv))])
            rollg = None
            if STAB_C:
                rollg = {}
                sub = (shR[0].reshape(3, 8000, T)[:, :4000].reshape(12000, T),
                       shR[1].reshape(3, 8000, T)[:, :4000].reshape(12000, T), np.repeat(np.arange(3), 4000))
                for g in GRIDS:
                    tg_ = tabs[(mode, g)]; t2 = np.argsort(-qg[g])[:2]; rv = []
                    for k in t2:
                        o = simulate(tg_, W0, sh=sub, opening=int(k), margin=m)
                        rv.append(strat_mean(score_paths(o, 0.0, cc), o['wj'], o['N'])[0])
                    rollg[g] = int(t2[int(np.argmax(rv))])
            rec.append(dict(hid=hid, T=T, W0=W0, pipe=pname, qF=qF, qg=qg, R=R, dSE=dSE, surv=surv, sw=sw,
                            roll=roll, rollg=rollg))
        print(hid, 'done %.0fs' % (time.time() - t0), flush=True)
    for tb in tabs.values():
        tb.Saux = None
pickle.dump(dict(rec=rec, GRIDS=GRIDS), open(OUT, 'wb'))
print('saved raw, %.0fs' % (time.time() - t0))
