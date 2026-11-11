#!/usr/bin/env python3
"""Pools couple-approx.mjs's outputs over the couples: for each arm, the range of its speed against the path as it is
and against the flat path, the paths saved and lost against the flat path with the paired difference and its standard
error, and the unweighted mean of each couple's change in the pot left and in the spending delivered.

  python3 couple-approx-summ.py results/out-couple-approx-45-*.txt
An arm run on fewer paths (#N) is pooled on the paths it ran.
"""
import math
import re
import sys

head = re.compile(r'^(\S+).* at (\d+) points \(solve (\d+) s\), seed (\d+), (\d+) years, bridge years (\d+) and (\d+): as it is ([\d.]+) ms a path \((\d+) paths\); flat ([\d.]+) ms \(([\d.]+) times; (\d+) paths, (\d+) surviving, ([\d.]+)%\); .*bit for bit: (\w+)')
arm = re.compile(r'^\s+(\S+)\s+([\d.]+) ms a path\s+([\d.]+) times as it is, ([\d.]+) flat \| (\d+) saved, (\d+) lost \((-?[\d.]+) points, se ([\d.]+)\) \| pot left (-?[\d.]+)% \| spending (-?[\d.]+)% \| paths that differ at all (\d+) of (\d+)')
check = re.compile(r'every value both ways \((\d+) paths, every option off\): (\d+) valued, (\d+) differ; every ranking both ways: (\d+) ranked, (\d+) differ')

couples, arms, order = [], {}, []
for path in sys.argv[1:]:
    c = None
    for line in open(path):
        m = head.match(line)
        if m:
            c = dict(id=m.group(1), pts=int(m.group(2)), years=int(m.group(5)), bridge=(int(m.group(6)), int(m.group(7))), asis=float(m.group(8)), flat=float(m.group(10)), paths=int(m.group(12)), surv=float(m.group(14)), same=m.group(15))
            couples.append(c)
            continue
        m = check.search(line)
        if m and c:
            c['check'] = (int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5)))
            continue
        m = arm.match(line)
        if m and c:
            name = m.group(1)
            if name not in arms:
                arms[name] = []
                order.append(name)
            arms[name].append(dict(id=c['id'], ms=float(m.group(2)), x_asis=float(m.group(3)), x_flat=float(m.group(4)), saved=int(m.group(5)), lost=int(m.group(6)), pot=float(m.group(9)), spend=float(m.group(10)), moved=int(m.group(11)), n=int(m.group(12))))

print(f"{len(couples)} couples at {' and '.join(str(p) for p in sorted(set(c['pts'] for c in couples)))} points; the path as it is on its first paths, the flat path and every arm on the paths named")
print('  couple        years  bridge years  as it is  flat      times  flat path survival  identity on the first paths  every value both ways')
for c in couples:
    ck = c.get('check')
    print(f"  {c['id']:13s} {c['years']:5d}  {c['bridge'][0]:2d} and {c['bridge'][1]:2d}     {c['asis']:7.1f}  {c['flat']:7.1f}  {c['asis'] / c['flat']:5.2f}  {c['surv']:6.2f}% of {c['paths']}     {c['same']:5s}                        {f'{ck[1]} of {ck[0]} differ; rankings {ck[3]} of {ck[2]}' if ck else '-'}")
print()
print('  arm                                        times as it is   times flat    saved  lost  of paths   difference (points)  se      pot left  spending  paths that differ')
for name in order:
    rows = arms[name]
    n = sum(r['n'] for r in rows)
    s, l = sum(r['saved'] for r in rows), sum(r['lost'] for r in rows)
    d = (s - l) / n
    se = math.sqrt(max(s + l - (s - l) ** 2 / n, 0)) / n
    xa, xf = [r['x_asis'] for r in rows], [r['x_flat'] for r in rows]
    pot, sp = sum(r['pot'] for r in rows) / len(rows), sum(r['spend'] for r in rows) / len(rows)
    mv = sum(r['moved'] for r in rows)
    print(f"  {name:42s} {min(xa):5.2f} to {max(xa):5.2f}   {min(xf):4.2f} to {max(xf):4.2f}  {s:5d} {l:5d}  {n:6d}     {100 * d:+.3f}              {100 * se:.3f}   {pot:+.2f}%    {sp:+.3f}%   {100 * mv / n:.0f}%")
    worst = min(rows, key=lambda r: (r['saved'] - r['lost']) / r['n'])
    potw = max(rows, key=lambda r: abs(r['pot']))
    print(f"      the couple furthest down: {worst['id']} {worst['saved']} saved, {worst['lost']} lost of {worst['n']}; the largest change in the pot left: {potw['id']} {potw['pot']:+.2f}%")
