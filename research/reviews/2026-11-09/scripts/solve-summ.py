#!/usr/bin/env python3
# The tables of REVIEW.md 2.3 from solve-anchors.mjs's outputs: one row a household and setting, and the pooled paths.
#   python3 solve-summ.py <setting> <output> [<output> ...]        e.g. w2a3b3g2c2-NT-LRVOH-h3-q80x21x64 ../results/out-solve-final-*.txt
import re, sys, math
setting, files = sys.argv[1], sys.argv[2:]
head = re.compile(r'^(S\d+F?) at (\d+) points: .*? (\d+) years, .*?the solve as it is ([\d.]+) s(?: \(its bridge reference ([\d.]+) s\))?; survival ([\d.]+)% on (\d+) paths')
line = re.compile(r'^\s+(\S+): the solve ([\d.]+) s \(([\d.]+) times(?:; its bridge reference ([\d.]+) s)?\); cells (?:on a shortlist|between anchors) (\d+) with ([\d.]+) moves listed.*?the stored move at ([\d.]+)%, the score lost (\S+) points on average, over 0.1 points at ([\d.]+)%, over 1 point at ([\d.]+)%, the worst ([\d.]+).*?paths: (\d+) saved, (\d+) lost of (\d+) \((-?[\d.]+) points(?:, se ([\d.]+))?\); spending delivered (-?[\d.]+) points of target; mean pot left (-?[\d.]+)%')
print('| | The solve as it is | The setting | Table score lost (average; worst cell) | Paths saved, lost | Spending delivered | Mean pot left |')
print('|---|---|---|---|---|---|---|')
S = L = N = 0
for f in files:
    hh = None
    for ln in open(f):
        m = head.match(ln)
        if m: hh = m; continue
        m = line.match(ln)
        if not m or m.group(1) != setting or hh is None: continue
        hid, pts, years, base, bref, surv, n = hh.groups()
        cfg, secs, times, ref, cells, moves, pol, lost, o01, o1, worst, sv, ls, n2, pp, se, spend, pot = m.groups()
        sv, ls, n2 = int(sv), int(ls), int(n2)
        se = se or '%.2f' % (100 * math.sqrt(max(0, sv + ls - (sv - ls) ** 2 / n2)) / n2)
        refs = f' (reference {float(bref):.0f} s)' if bref and float(bref) > 0 else ''
        refn = f' (reference {float(ref):.0f} s)' if ref and float(ref) > 0 else ''
        sg = lambda x, d: ('%+.*f' % (d, float(x))).replace('+0.' + '0' * d, '0.' + '0' * d).replace('-0.' + '0' * d, '0.' + '0' * d) if abs(float(x)) < 0.5 * 10 ** -d else '%+.*f' % (d, float(x))
        print(f'| {hid} | {float(base):.0f} s{refs}, {surv}% | {float(secs):.0f} s{refn}, {times} times | {float(lost):.4f}; {worst} | {sv}, {ls} of {n2:,} ({sg(pp, 2)} points, se {se}) | {sg(spend, 3)} points of target | {sg(pot, 2)}% |')
        S += sv; L += ls; N += n2
if N:
    se = 100 * math.sqrt(max(0, S + L - (S - L) ** 2 / N)) / N
    print(f'| all | | | | {S} saved, {L} lost of {N:,}: {100 * (S - L) / N:+.3f} points (se {se:.3f}) | | |')
