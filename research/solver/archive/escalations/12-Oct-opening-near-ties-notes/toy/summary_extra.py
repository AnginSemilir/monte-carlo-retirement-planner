"""TOY summary helpers: (i) share of the 21 spread households (Exp 1) whose coarse top-two gap < tau;
(ii) Exp 1 ratio statistics by |table gap| class, parsed from results_exp12.txt."""
import sys, json, re; sys.path.insert(0, '.')
import numpy as np
from toy import *
hh = json.load(open('households_exp12.json'))
L = ['TOY summary extras']
for mode in ('product', 'candidate'):
    gaps = []
    for T in (30, 35, 40):
        tb = solve_product(coarse_x(), T, 0.0, COARSE_EPS) if mode == 'product' else solve_candidate(coarse_x(), T, 0.0, 1e-3, COARSE_EPS)
        for h in [x for x in hh if x['T'] == T]:
            s = np.sort(year0(tb, h['W0'])); gaps.append(s[-1] - s[-2])
    gaps = np.array(gaps)
    L.append('[%s] 21 spread households (S 0.30-0.95): coarse top-two gap quantiles 10/50/90%% = %.4f/%.4f/%.4f; share < 3e-3: %.2f, < 1e-2: %.2f' % (
        mode, *np.quantile(gaps, [.1, .5, .9]), np.mean(gaps < 3e-3), np.mean(gaps < 1e-2)))
txt = open('results_exp12.txt').read().split('--- margin m = ')
for blk in txt[1:]:
    m = blk.split(' ---')[0]
    rows = re.findall(r'^(T\d\d-S\d\d)\s+\S+\s+\S+\s+\|\s+(\S+)\s+(\S+)\s+\S+\s+\|\s+(\S+)\s+(\S+)\s+\S+\s+\|\s+(\S+)\s+(\S+)\s+(\S+)', blk, re.M)
    g = np.array([[float(r[1]), float(r[2])] for r in rows] + [[float(r[3]), float(r[4])] for r in rows])
    sw = np.array([[float(r[5]), float(r[6]), float(r[7])] for r in rows])
    big = np.abs(g[:, 0]) >= 3e-3; small = ~big
    rb = g[big, 1] / g[big, 0]
    L.append('m=%-6s |tab|>=3e-3 (n=%d): ratio median %.2f, IQR %.2f-%.2f | |tab|<3e-3 (n=%d): mean |real-tab| %.4f, sign flips %d | switches/path mean %.2f' % (
        m, big.sum(), np.median(rb), *np.quantile(rb, [.25, .75]), small.sum(), np.mean(np.abs(g[small, 1] - g[small, 0])),
        np.sum(np.sign(g[small, 1]) != np.sign(g[small, 0])), sw.mean()))
open('results_summary_extra.txt', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
