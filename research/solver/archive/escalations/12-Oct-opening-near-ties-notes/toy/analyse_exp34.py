"""Analyse TOY Exp 3-4 raw results (exp34_raw.pkl) -> results_exp34.txt"""
import pickle, sys, numpy as np
IN = sys.argv[1] if len(sys.argv) > 1 else "exp34_raw.pkl"
OUTF = sys.argv[2] if len(sys.argv) > 2 else "results_exp34.txt"
D = pickle.load(open(IN, 'rb')); rec = D['rec']; GRIDS = D['GRIDS']; BASE = (30, 0.0)
L = []
def gapv(q): return np.array([q[1] - q[0], q[2] - q[0]])
# ---------------- Exp 3: table-gap errors and flips
L.append('[' + IN + '] TOY RESULTS - Exp 3: coarse-grid artefacts (households x mode; 9 grids: n in {28,30,32} x offset {0,1/4,1/2} cell)')
for mode, pipe in (('product', 'P1'), ('candidate', 'C')):
    rr = [r for r in rec if r['pipe'] == pipe]
    eb = np.array([gapv(r['qg'][BASE]) - gapv(r['qF']) for r in rr]).ravel()
    ea = np.array([gapv(r['qg'][g]) - gapv(r['qF']) for r in rr for g in GRIDS]).ravel()
    disp = np.array([np.std([gapv(r['qg'][g]) for g in GRIDS], axis=0, ddof=1) for r in rr]).ravel()
    fg = np.array([gapv(r['qF']) for r in rr]).ravel()
    flips = [len(set(int(np.argmax(r['qg'][g])) for g in GRIDS)) > 1 for r in rr]
    mism = [int(np.argmax(r['qg'][BASE])) != int(np.argmax(r['qF'])) for r in rr]
    # product rule with margin 1e-3 at year 0 (keep 0 unless best beats 0 by 1e-3)
    def mrule(q, d=1e-3):
        k = int(np.argmax(q)); return k if q[k] - q[0] > d else 0
    flipsm = [len(set(mrule(r['qg'][g]) for g in GRIDS)) > 1 for r in rr]
    L.append('[%s] base-grid gap error vs fine: median |err| %.2e, 90%% %.2e, max %.2e; mean err %+.2e' % (
        mode, np.median(np.abs(eb)), np.quantile(np.abs(eb), .9), np.abs(eb).max(), eb.mean()))
    L.append('[%s] all 9 grids: median |err| %.2e, max %.2e; grid-to-grid SD of a gap: median %.2e, max %.2e' % (
        mode, np.median(np.abs(ea)), np.abs(ea).max(), np.median(disp), disp.max()))
    L.append('[%s] fine gaps of these households: median |gap| %.2e; share |fine gap| < grid SD: %.2f' % (
        mode, np.median(np.abs(fg)), np.mean(np.abs(fg) < disp)))
    L.append('[%s] plain-argmax opening flips across the 9 grids: %d/%d households; base argmax != fine argmax: %d/%d; '
             'margin-1e-3 rule flips: %d/%d' % (mode, sum(flips), len(rr), sum(mism), len(rr), sum(flipsm), len(rr)))
    # relative movement of the best-alternative gap across grids (as in the brief: -14% / +28%)
    rel = []
    for r in rr:
        gb = gapv(r['qg'][BASE]); a = int(np.argmax(gb))
        if abs(gb[a]) > 5e-4:
            rel += [(gapv(r['qg'][g])[a] - gb[a]) / abs(gb[a]) for g in GRIDS if g != BASE]
    if rel:
        L.append('[%s] relative move of the best-alternative gap vs base grid (|gap|>5e-4): 10%% %+.0f%%, median %+.0f%%, 90%% %+.0f%%' % (
            mode, 100 * np.quantile(rel, .1), 100 * np.median(rel), 100 * np.quantile(rel, .9)))
L.append('')
L.append('Coarse consistency (repeat of Exp 1-2 on the base coarse grid): table gap vs realised paired gap (N=24000/world)')
for pipe in ('P1', 'P2', 'C'):
    rr = [r for r in rec if r['pipe'] == pipe]
    tg = np.array([gapv(r['qg'][BASE]) for r in rr]).ravel()
    rg = np.array([[r['R'][1] - r['R'][0], r['R'][2] - r['R'][0]] for r in rr]).ravel()
    se = np.array([[r['dSE'][1][0], r['dSE'][2][0]] for r in rr]).ravel()
    sw = np.array([r['sw'] for r in rr])
    L.append('[%s] mean |real - table| %.2e; within 2 SE %.2f; sign disagreement (|real|>2SE) %d/%d; median paired SE %.1e; switches/path by opening %s' % (
        pipe, np.mean(np.abs(rg - tg)), np.mean(np.abs(rg - tg) <= 2 * se), np.sum((np.sign(rg) != np.sign(tg)) & (np.abs(rg) > 2 * se)),
        len(rg), np.median(se), np.round(sw.mean(0), 2)))
# ---------------- Exp 4: decision rules
L.append('')
L.append('TOY RESULTS - Exp 4: opening rules on the coarse base grid; loss = R(best realised opening) - R(rule), realised under the')
L.append('pipeline continuation (coarse base tables), N=24000/world seed 777; rollouts use seed 4242. Units: survival (C: net of charges).')
def rule_choice(r, rule, g=BASE):
    q = r['qg'][g]; k = int(np.argmax(q))
    if rule == 'a argmax': return k
    if rule == 'keep plan tier (always 0)': return 0
    if rule.startswith('b '):
        if 'est' in rule:
            alt = k if k != 0 else int(np.argsort(-q)[1])
            d = 2 * np.std([r['qg'][gg][alt] - r['qg'][gg][0] for gg in GRIDS], ddof=1)
        else:
            d = float(rule.split('=')[1])
        return k if q[k] - q[0] > d else 0
    if rule.startswith('c '):
        Nr = int(rule.split('N=')[1])
        if g == BASE: return r['roll'][Nr]
        return r['rollg'][g] if (r['rollg'] is not None and Nr == 4000) else None
    if rule == 'd unanimity':
        if k == 0: return 0
        return k if all(r['qg'][gg][k] - r['qg'][gg][0] > 0 for gg in GRIDS) else 0
    if rule == 'F fine argmax': return int(np.argmax(r['qF']))
    if rule.startswith('e '):   # hybrid: rollouts (N=8000) only if the top-two table gap < tau
        tau = float(rule.split('tau=')[1]); s = np.sort(q)
        if s[-1] - s[-2] >= tau: return k
        if g == BASE: return r['roll'][8000]
        return None
RULES = ['a argmax', 'b d=1e-4', 'b d=3e-4', 'b d=1e-3', 'b d=est', 'c N=1000', 'c N=4000', 'c N=8000', 'd unanimity',
         'keep plan tier (always 0)', 'F fine argmax', 'e hybrid tau=3e-3', 'e hybrid tau=1e-2']
COST = {'a argmax': (1, 0), 'b d=1e-4': (1, 0), 'b d=3e-4': (1, 0), 'b d=1e-3': (1, 0), 'b d=est': (9, 0),
        'c N=1000': (1, 2 * 3000), 'c N=4000': (1, 2 * 12000), 'c N=8000': (1, 2 * 24000), 'd unanimity': (9, 0),
        'keep plan tier (always 0)': (0, 0), 'F fine argmax': ('fine', 0),
        'e hybrid tau=3e-3': (1, -1), 'e hybrid tau=1e-2': (1, -1)}
for pipe in ('P1', 'P2', 'C'):
    rr = [r for r in rec if r['pipe'] == pipe]
    L.append('')
    L.append('[%s] %d households; oracle = argmax of realised R; oracle != 0 in %d; median paired SE of opening differences %.1e' % (
        pipe, len(rr), sum(int(np.argmax(r['R'])) != 0 for r in rr), np.median([r['dSE'][1][0] for r in rr])))
    L.append('%-26s %9s %9s %8s %8s %8s %8s %6s %12s' % ('rule', 'mean loss', 'worst', 'SE(wst)', '>0.5pt', 'sig>2SE', '!=orac', 'flips', 'solves/paths'))
    for rule in RULES:
        loss, ses, harm, sig, neq, flips = [], [], 0, 0, 0, 0
        for r in rr:
            k = rule_choice(r, rule); o = int(np.argmax(r['R']))
            l = r['R'][o] - r['R'][k]; se = r['dSE'][o][k] if k != o else 0.0
            loss.append(l); ses.append(se); harm += l > 0.005; sig += (k != o) and (l > 2 * se); neq += k != o
            ch = [rule_choice(r, rule, g) for g in GRIDS]
            ch = [c for c in ch if c is not None]
            flips += len(set(ch)) > 1
        loss = np.array(loss); iw = int(np.argmax(loss))
        c = COST[rule]
        cost = '%s / %s' % (c[0], ('%dk x T' % (c[1] // 1000)) if c[1] else '0')
        if c[1] == -1:
            tau = float(rule.split('tau=')[1])
            used = np.mean([np.diff(np.sort(r['qg'][BASE])[-2:])[0] < tau for r in rr])
            cost = '1 / 48k x T on %.0f%%' % (100 * used)
        fl = '%d' % flips if not ((rule.startswith('c ') and rule != 'c N=4000') or rule.startswith('e ')) else 'n/a'
        L.append('%-26s %+9.5f %+9.5f %8.5f %8d %8d %8d %6s %12s' % (rule, loss.mean(), loss.max(), ses[iw], harm, sig, neq, fl, cost))
    # households where rule (a) is harmed
    bad = [(r['hid'], int(np.argmax(r['qg'][BASE])), int(np.argmax(r['R'])), r['R'][int(np.argmax(r['R']))] - r['R'][int(np.argmax(r['qg'][BASE]))])
           for r in rr]
    bad = sorted(bad, key=lambda b: -b[3])[:4]
    L.append('   largest (a) losses: ' + '; '.join('%s a=%d orac=%d loss %+.4f' % b for b in bad))
L.append('')
L.append('cost column: backward solves per household / rollout paths (x T path-years); flips = households whose choice changes across the 9 grids')
L.append('(c) flips computed for N=4000 only (re-solved continuation per grid). Winner\'s curse: the oracle is the argmax of noisy R, so losses of')
L.append('rules that pick a truly-tied alternative are biased upward by O(SE); "sig>2SE" counts losses exceeding twice their paired SE.')
open(OUTF, 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
