"""TOY Exp 4c: seed dependence of rule (c): rollout seed 4242 (exp34_raw.pkl) vs 4243 (exp4c_raw.pkl)."""
import pickle, numpy as np
A = pickle.load(open('exp34_raw.pkl', 'rb'))['rec']; B = pickle.load(open('exp4c_raw.pkl', 'rb'))['rec']
key = lambda r: (r['hid'], r['pipe'])
Bi = {key(r): r for r in B}
L = ['TOY RESULTS - Exp 4c: seed dependence of rule (c) (rollout seeds 4242 vs 4243; evaluation seed 777 for both)']
for pipe in ('P1', 'P2', 'C'):
    for Nr in (1000, 4000, 8000):
        ch, la, lb = 0, [], []
        for a in [r for r in A if r['pipe'] == pipe]:
            b = Bi[key(a)]
            assert np.allclose(a['R'], b['R'])
            ka, kb = a['roll'][Nr], b['roll'][Nr]; o = int(np.argmax(a['R']))
            ch += ka != kb; la.append(a['R'][o] - a['R'][ka]); lb.append(a['R'][o] - a['R'][kb])
        L.append('[%s] N=%5d/world: choice differs between seeds in %2d/30; mean loss %.5f (seed 4242) vs %.5f (4243); worst %.5f vs %.5f' % (
            pipe, Nr, ch, np.mean(la), np.mean(lb), np.max(la), np.max(lb)))
open('results_exp4c.txt', 'w').write('\n'.join(L) + '\n'); print('\n'.join(L))
