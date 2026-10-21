"""Same toy, margin scaled to the product's margin/typical-gain ratio (toy gains ~5x product's), W0=28."""
import numpy as np, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from toy import *
lg, V = solve_free(1200, 20)
W0 = 28.0; N = 40000
Z = np.random.default_rng(7).standard_normal((N, T))
q = qvals(lg, V[1], (0, 1, 2), 20, np.array([np.log(W0)]))[:, 0]
fx = [np.interp(np.log(W0), *fixed_tier_value(1200, 20, k)) for k in (0, 1, 2)]
print('table gaps vs 0', np.round(q - q[0], 5), ' fixed-for-life diffs vs 0', np.round(np.array(fx) - fx[0], 4))
for m in (0.0, 0.005, 0.01, 0.02, 0.05, 1.0):
    out = {k: simulate(lg, V, W0, k, m, N=N, nq=20, Z=Z) for k in (0, 1, 2)}
    line = f'margin {m:5}: switches/path after yr0 {[round(out[k][3].mean(), 3) for k in (0, 1, 2)]};'
    for k in (1, 2):
        a, b = out[k][0], out[0][0]; real = a.mean() - b.mean()
        line += f' open{k}-open0 realised {real:+.4f} (saved {int((a&~b).sum())}/lost {int((~a&b).sum())}) price/realised {(q[k]-q[0])/real:.2f};'
    print(line)
    if m in (0.02, 1.0):
        a, b = out[2], out[0]
        lost = a[0] & ~b[0]; ep = lost & b[2]
        print(f'   item-9 analogue: lost by riskier opening {int(lost.sum())}, paid every year but ended below P {ep.sum()/max(1,lost.sum()):.2f},'
              f' median shortfall/P {np.median((P-b[1][ep])/P):.2f}')
