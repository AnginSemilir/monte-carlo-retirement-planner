"""TOY Exp 3b: convergence of the year-0 gap error with the number of wealth points (0.1..60, offset 0 and 1/2),
log-odds vs linear-probability survival interpolation; the 30 Exp-3/4 households, both modes. Tables only."""
import sys, pickle, time; sys.path.insert(0, '.')
import numpy as np
import toy
from toy import *
D = pickle.load(open('exp34_raw.pkl', 'rb')); rec = D['rec']
hh = sorted(set((r['T'], r['W0'], r['hid']) for r in rec))
t0 = time.time()
L = ['TOY RESULTS - Exp 3b: year-0 gap error (coarse - fine 640 pts) vs number of wealth points; 30 near-tie households x 2 gaps',
     'err = mean signed error; |err| = mean absolute; flip = share of households whose plain-argmax opening differs from the fine one']
L.append('%-10s %-6s %5s %7s | %10s %10s %6s | %10s %10s %6s' % ('mode', 'space', 'n', 'offset', 'err', '|err|', 'flip', 'err(off)', '|err|(off)', 'flip'))
for mode in ('product', 'candidate'):
    fine = {}
    for T in (30, 35, 40):
        SPACE['v'] = 'logit'
        tF = solve_product(fine_x(), T, 0.0, FINE_EPS) if mode == 'product' else solve_candidate(fine_x(), T, 0.0, 1e-3, FINE_EPS)
        for (TT, W0, hid) in hh:
            if TT == T: fine[hid] = year0(tF, W0)
    for space in ('logit', 'prob'):
        SPACE['v'] = space
        for n in ((20, 30, 40, 60, 90, 120, 240) if space == 'logit' else (30, 60, 120)):
            res = []
            for off in (0.0, 0.5):
                errs, flips = [], []
                for T in (30, 35, 40):
                    x = coarse_x(n, off)
                    tb = solve_product(x, T, 0.0, COARSE_EPS) if mode == 'product' else solve_candidate(x, T, 0.0, 1e-3, COARSE_EPS)
                    for (TT, W0, hid) in hh:
                        if TT != T: continue
                        q = year0(tb, W0); qf = fine[hid]
                        errs += [(q[1] - q[0]) - (qf[1] - qf[0]), (q[2] - q[0]) - (qf[2] - qf[0])]
                        flips.append(int(np.argmax(q)) != int(np.argmax(qf)))
                res.append((np.mean(errs), np.mean(np.abs(errs)), np.mean(flips)))
            L.append('%-10s %-6s %5d %7s | %+10.2e %10.2e %6.2f | %+10.2e %10.2e %6.2f' % (mode, space, n, '0 / 1/2', *res[0], *res[1]))
    print(mode, '%.0fs' % (time.time() - t0), flush=True)
SPACE['v'] = 'logit'
open('results_exp3b.txt', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
