"""Analyse TOY Exp 5 (exp5_raw.pkl) -> results_exp5.txt"""
import pickle, numpy as np
rec = pickle.load(open('exp5_raw.pkl', 'rb'))
idx = {(r['hid'], r['mode'], r['beta']): r for r in rec}
hids = sorted(set(r['hid'] for r in rec))
L = ['TOY RESULTS - Exp 5: estate term (u(W_T)=1-exp(-W_T/10) if W_T>=1, weight beta) vs survival-only; fine grid;',
     '30 near-tie households; N=16000/world seed 555; realised under each beta\'s own tables/continuation (product: margin 1e-3)']
for mode, rules in (('product', ('kplain', 'kprod')), ('candidate', ('kplain',))):
    for rule in rules:
        for beta in (0.01, 0.02):
            diff = []; 
            for h in hids:
                r0, rb = idx[(h, mode, 0.0)], idx[(h, mode, beta)]
                k0, kb = r0[rule], rb[rule]
                if k0 != kb:
                    dS = rb['dS'][(kb, k0)]; dR = rb['dR'][(kb, k0)]
                    cross = rb['Sv'][kb] - r0['Sv'][k0]
                    diff.append((h, k0, kb, rb['Sv'][k0], rb['Sv'][kb], dS[0], dS[1], dR[0], dR[1], cross, rb['q'][kb] - rb['q'][k0]))
            L.append('')
            L.append('[%s, rule=%s, beta=%.2f] opening differs from survival-only choice in %d/%d households' % (
                mode, 'plain argmax' if rule == 'kplain' else 'margin 1e-3 at year 0', beta, len(diff), len(hids)))
            if diff:
                L.append('   %-14s %3s %3s | %8s %8s | %18s | %18s | %9s | %9s' % ('house', 'k0', 'kb', 'S(k0)', 'S(kb)', 'surv kb-k0 +-SE', 'score kb-k0 +-SE', 'tab gap', 'cross'))
                for d in diff:
                    L.append('   %-14s %3d %3d | %8.4f %8.4f | %+9.5f+-%.5f | %+9.5f+-%.5f | %+9.5f | %+9.5f' % (d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[10], d[9]))
                ds = np.array([d[5] for d in diff]); dr = np.array([d[7] for d in diff])
                L.append('   mean survival change %+.5f (range %+.5f..%+.5f); mean score change %+.5f; survival lost >2SE in %d' % (
                    ds.mean(), ds.min(), ds.max(), dr.mean(), sum(d[5] < -2 * d[6] for d in diff)))
L.append('')
L.append('S(k) = realised survival of opening k under the beta pipeline; surv/score kb-k0 = paired gap under the beta pipeline;')
L.append('tab gap = beta-pipeline year-0 table gap kb-k0 (whole score); cross = S_beta(kb) - S_0(k0) across pipelines, same shocks (no SE).')
# overall survival cost of the estate term on these households
for mode in ('product', 'candidate'):
    for beta in (0.01, 0.02):
        x = [idx[(h, mode, beta)]['Sv'][idx[(h, mode, beta)]['kplain']] - idx[(h, mode, 0.0)]['Sv'][idx[(h, mode, 0.0)]['kplain']] for h in hids]
        L.append('[%s beta=%.2f] mean over households of S_beta(own choice) - S_0(own choice): %+.5f (min %+.5f)' % (mode, beta, np.mean(x), np.min(x)))
open('results_exp5.txt', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
