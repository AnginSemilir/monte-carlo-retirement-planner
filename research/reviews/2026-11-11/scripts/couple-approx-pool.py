#!/usr/bin/env python3
"""Pools couple-approx-full.mjs's '#DATA' lines over chunks and couples and reads item 12's rule
(../../2026-11-09/EXPERIMENTS-AND-PORTS.md, item 12, as pushed at 6ef22176; ../ITEM12-RUN.md):

  python3 couple-approx-pool.py results/item12/out-item12-*.txt

For each arm: each couple's paths saved and lost against the flat path with the paired difference, its standard error and
95% interval (1.96 se); the spending delivered in points of target with its paired standard error; the pot left and the
lifetime tax as a change in the mean; each person's tiers held; then the pooled figures and the rule's five parts.
Pooled survival is over every path. Pooled spending and pot are the unweighted mean of the couples' figures (each couple
has the same number of paths); the pot is also given as the ratio of the summed pots.
"""
import json
import math
import sys

rows = []
for path in sys.argv[1:]:
    text = open(path).read()
    if 'IDENTITY FAILED' in text:
        sys.exit(f'{path}: IDENTITY FAILED')
    for line in text.splitlines():
        if line.startswith('#DATA '):
            rows.append(json.loads(line[6:]))
if not rows:
    sys.exit('no #DATA lines: a check that ran on nothing')
seeds = sorted(set(r['seed'] for r in rows))
arms, couples = [], []
for r in rows:
    if r['arm'] not in arms:
        arms.append(r['arm'])
    if r['id'] not in couples:
        couples.append(r['id'])
print(f"{len(rows)} arm-chunks, seed {', '.join(str(s) for s in seeds)}, {len(couples)} couples: {', '.join(couples)}")


def paired(s, l, n):
    d = (s - l) / n
    se = math.sqrt(max(s + l - (s - l) ** 2 / n, 0)) / n
    return 100 * d, 100 * se


for arm in arms:
    print(f'\n==== {arm} against the flat path on the whole menu ====')
    print('  couple          paths   flat survival  saved  lost  difference (points; 95% interval)   spending, points of target (se)  pot left  lifetime tax  tiers held: flat | arm (pension/ISA, each person)        times flat')
    per = []
    for cid in couples:
        ch = [r for r in rows if r['arm'] == arm and r['id'] == cid]
        if not ch:
            continue
        offs = sorted((r['offset'], r['n']) for r in ch)
        for (o1, n1), (o2, _) in zip(offs, offs[1:]):
            if o1 + n1 > o2:
                sys.exit(f'{cid} {arm}: chunks overlap')
        n = sum(r['n'] for r in ch)
        S, L = sum(r['saved'] for r in ch), sum(r['lost'] for r in ch)
        d, se = paired(S, L, n)
        target = ch[0]['target']
        sd = sum(r['spendArm'] - r['spendBase'] for r in ch)
        sd2 = sum(r['spendD2'] for r in ch)
        sp = 100 * sd / n / target
        sp_se = 100 * math.sqrt(max(sd2 - sd * sd / n, 0) / (n * (n - 1))) / target if n > 1 else 0.0   # of the mean paired difference
        pot = 100 * (sum(r['potArm'] for r in ch) / sum(r['potBase'] for r in ch) - 1)
        tax = 100 * (sum(r['taxArm'] for r in ch) / sum(r['taxBase'] for r in ch) - 1)
        tb = [sum(r['tiersBase'][i] for r in ch) for i in range(5)]
        ta = [sum(r['tiersArm'][i] for r in ch) for i in range(5)]
        tbm, tam = [tb[i] / tb[0] for i in range(1, 5)], [ta[i] / ta[0] for i in range(1, 5)]
        tdiff = max(abs(x - y) for x, y in zip(tbm, tam))
        ms_b = sum(r['msBase'] * r['n'] for r in ch) / n
        ms_a = sum(r['msArm'] * r['n'] for r in ch) / n
        per.append(dict(id=cid, n=n, S=S, L=L, d=d, se=se, sp=sp, sp_se=sp_se, pot=pot, tax=tax, tdiff=tdiff, potB=sum(r['potBase'] for r in ch), potA=sum(r['potArm'] for r in ch), x=ms_b / ms_a))
        fmt = lambda v: '/'.join(f'{x:.3f}' for x in v[:2]) + ' ' + '/'.join(f'{x:.3f}' for x in v[2:])
        print(f"  {cid:14s} {n:6d}   {100 * sum(r['baseSurv'] for r in ch) / n:6.2f}%       {S:5d} {L:5d}  {d:+.3f} ({d - 1.96 * se:+.3f} to {d + 1.96 * se:+.3f})        {sp:+.3f} ({sp_se:.3f})                  {pot:+.2f}%   {tax:+.2f}%      {fmt(tbm)} | {fmt(tam)}   {ms_b / ms_a:.2f}")
    N = sum(p['n'] for p in per)
    S, L = sum(p['S'] for p in per), sum(p['L'] for p in per)
    d, se = paired(S, L, N)
    k = len(per)
    sp = sum(p['sp'] for p in per) / k
    sp_se = math.sqrt(sum(p['sp_se'] ** 2 for p in per)) / k
    pot = sum(p['pot'] for p in per) / k
    pot_ratio = 100 * (sum(p['potA'] for p in per) / sum(p['potB'] for p in per) - 1)
    worst = min(per, key=lambda p: p['d'])
    below = [p['id'] for p in per if p['d'] + 1.96 * p['se'] < -0.3]
    potlow = min(per, key=lambda p: p['pot'])
    tmax = max(per, key=lambda p: p['tdiff'])
    print(f"  pooled over {k} couples, {N} paths: {S} saved, {L} lost: {d:+.3f} points, se {se:.3f}, 95% interval {d - 1.96 * se:+.3f} to {d + 1.96 * se:+.3f}")
    print(f"    spending {sp:+.3f} points of target (se {sp_se:.3f}); pot left {pot:+.2f}% (the mean of the couples'; {pot_ratio:+.2f}% as the ratio of the summed pots); the lowest couple's pot {potlow['id']} {potlow['pot']:+.2f}%; times the flat path {min(p['x'] for p in per):.2f} to {max(p['x'] for p in per):.2f}")
    print(f"    the couple furthest down: {worst['id']} {worst['d']:+.3f} ({worst['d'] - 1.96 * worst['se']:+.3f} to {worst['d'] + 1.96 * worst['se']:+.3f}); the largest difference in a person's mean tier held: {tmax['id']} {tmax['tdiff']:.3f}")
    ok = lambda b: 'HOLDS' if b else 'FAILS'
    print(f"  the rule: 1. pooled lower end above -0.1: {ok(d - 1.96 * se > -0.1)} | 2. no couple wholly below -0.3: {ok(not below)}{' (' + ', '.join(below) + ')' if below else ''} | 3. spending not lower by more than 0.05 points: {ok(sp >= -0.05)}; by more than 0.1 (D65's example): {ok(sp >= -0.1)} | 4. pooled pot not lower by more than 0.5% and no couple's by more than 1%: {ok(pot >= -0.5 and potlow['pot'] >= -1)} | 5. each person's tiers within 0.01: {ok(tmax['tdiff'] <= 0.01)}")
    if k < 8 or any(p['n'] != per[0]['n'] for p in per):
        print(f"  NOT COMPLETE: {k} couples, paths a couple {sorted(set(p['n'] for p in per))}: the rule is read on eight couples at 16,000 paths each")
