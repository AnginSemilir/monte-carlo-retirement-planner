#!/usr/bin/env python3
"""Count 7u item 1 and item 5 households by sign of change, by verdict, and the gains >= 1.75."""
import re, sys
path = sys.argv[1]
lines = open(path).read().split('\n')
def block(start_pat):
    out = []
    on = False
    for l in lines:
        if l.startswith(start_pat):
            on = True
            continue
        if on:
            if re.match(r'^\d\. ', l):
                break
            m = re.match(r'^\s+(\S.*?)\s+(\d+) saved/(\d+) lost of 8000.*change ([+-]\d+\.\d+) \(exact (-?\d+\.\d+) to (-?\d+\.\d+); unconditional (-?\d+\.\d+) to (-?\d+\.\d+)\)\s+margin (\S+)\s+(.*)$', l)
            if m:
                out.append(dict(h=m.group(1), saved=int(m.group(2)), lost=int(m.group(3)), ch=float(m.group(4)),
                                elo=float(m.group(5)), ehi=float(m.group(6)), ulo=float(m.group(7)), uhi=float(m.group(8)),
                                margin=float(m.group(9)), verdict=m.group(10)))
    return out
for item in ('1. survival at the estate weight 0.02', '5. survival at the estate weight 0.01'):
    b = block(item)
    print(item, 'households:', len(b))
    up = [r for r in b if r['ch'] > 0]
    down = [r for r in b if r['ch'] < 0]
    zero = [r for r in b if r['ch'] == 0]
    print('  up', len(up), 'down', len(down), 'zero', len(zero))
    print('  down:', ', '.join(f"{r['h']} {r['ch']}" for r in down))
    verdicts = {}
    for r in b:
        verdicts.setdefault(r['verdict'], []).append(r['h'])
    for v, hs in verdicts.items():
        print('  verdict', repr(v), len(hs), hs if len(hs) < 6 else '')
    big = sorted([r for r in b if r['ch'] >= 1.75], key=lambda r: -r['ch'])
    print('  gains >= 1.75:', len(big), ', '.join(f"{r['h']} {r['ch']}" for r in big))
    # half-widths of the exact interval for households with discordant paths
    hw = sorted(((r['ehi'] - r['elo']) / 2, r['h']) for r in b if r['saved'] + r['lost'] > 0)
    print('  exact-interval half-widths (min, median, max):', hw[0], hw[len(hw)//2], hw[-1])
    mid = [(round((r['ehi'] - r['elo']) / 2, 3), r['h']) for r in b if r['saved'] + r['lost'] >= 50]
    print('  half-widths where >=50 discordant paths:', sorted(mid))
