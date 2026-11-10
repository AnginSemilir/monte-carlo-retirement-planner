# EXPLORATORY (external review, 9 Nov): D34's two error rates under a two-stage rule, by simulation.
# A couple's paired paths: each path saved with chance ps, lost with chance pl (ps + pl = the discordance d, pl - ps = the true loss).
# One stage: n = 19,000, harm flagged when the observed loss is above 0.25 + 1.645 se (D34's normal check, se from the realised discordance).
# Two stages: after n1 paths the couple stops, unflagged, when its observed change is at or above +b1 points; otherwise it runs to 19,000 and is read as above.
import numpy as np
rng = np.random.default_rng(4242)
N, REPS = 19000, 400000
def run(d, loss_pts, n1, b1):
    pl, ps = (d + loss_pts / 100) / 2, (d - loss_pts / 100) / 2
    # stage 1
    k1 = rng.multinomial(n1, [ps, pl, 1 - ps - pl], size=REPS)
    k2 = rng.multinomial(N - n1, [ps, pl, 1 - ps - pl], size=REPS)
    s, l = k1[:, 0] + k2[:, 0], k1[:, 1] + k2[:, 1]
    se = 100 * np.sqrt((s + l) / N) / np.sqrt(N)
    flag_one = (100 * (l - s) / N) > 0.25 + 1.645 * se
    stop = (100 * (k1[:, 0] - k1[:, 1]) / n1) >= b1
    flag_two = flag_one & ~stop
    return flag_one.mean(), flag_two.mean(), stop.mean()
print('discordance, true loss (points): harm flagged one stage / two stages; stopped at stage 1')
for n1, b1 in [(5000, 0.5), (5000, 0.0), (4000, 0.5)]:
    print(f'-- stage 1 at {n1} paths, stop at an observed change of +{b1} points or more')
    for d in [0.09, 0.1245]:
        for loss in [1.0, 0.25]:
            a, b, st = run(d, loss, n1, b1)
            print(f'   d {100*d:.2f}%, a true loss of {loss}: {a:.4f} / {b:.4f}; stopped {st:.4f}')
    for gain in [0.0, 0.5, 1.0, 2.0, 5.0, 10.0]:
        d = max(0.10, gain / 100 + 0.02)
        a, b, st = run(d, -gain, n1, b1)
        print(f'   d {100*d:.1f}%, a true gain of {gain}: stopped at stage 1 {st:.3f}, so {n1 + (1-st)*(N-n1):.0f} paths on average ({100*(n1 + (1-st)*(N-n1))/N:.0f}% of 19,000)')
