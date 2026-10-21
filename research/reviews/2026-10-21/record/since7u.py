#!/usr/bin/env python3
"""Recount F7's 'since 7u read on 10 Oct' figures from the repository's records.
Usage: python3 -I since7u.py <research/solver dir>
The cut-off is the 7u read row, 10 Oct 03:46 UK (PLAN-HISTORY/PLAN ledger; items/7u.md)."""
import re, sys, os
D = sys.argv[1]
MON = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12}
def key(day, mon, hh, mm):
    return (MON[mon[:3]], int(day), int(hh), int(mm))
CUT = (10, 10, 3, 46)
txt = lambda f: open(os.path.join(D, f), encoding='utf-8').read()

# 1. plan-auditor receipts (PASS/FAIL) after the cut, and FAILs
rl = txt('review-log.md').split('\n')
rec = []
for l in rl:
    m = re.match(r'^- (\d{1,2}) ([A-Z][a-z]+),? (\d{2}):(\d{2}) UK \| plan \S+ \| (PASS|FAIL) \| plan-auditor', l)
    if m:
        rec.append((key(m.group(1), m.group(2), m.group(3), m.group(4)), m.group(5)))
after = [r for r in rec if r[0] > CUT]
print('plan-auditor receipts in all:', len(rec), 'FAIL', sum(1 for r in rec if r[1] == 'FAIL'))
print('after 10 Oct 03:46:', len(after), 'FAIL', sum(1 for r in after if r[1] == 'FAIL'))
after_eq = [r for r in rec if r[0] >= (10, 10, 3, 46)]
print('at or after 10 Oct 03:46:', len(after_eq))
# any other agent kinds in review-log (design reviews etc.)
kinds = {}
for l in rl:
    m = re.match(r'^- (\d{1,2}) ([A-Z][a-z]+),? (\d{2}):(\d{2}) UK \| [^|]+\| (\w+) \| ([\w-]+)', l)
    if m:
        k = (m.group(5), m.group(6))
        kinds[k] = kinds.get(k, 0) + 1
print('review-log line kinds:', kinds)

# 2. deep-review-log receipts after the cut
dl = txt('deep-review-log.md').split('\n')
drec = []
for l in dl:
    m = re.match(r'^- (\d{1,2}) ([A-Z][a-z]+) (\d{2}):(\d{2}) UK \| (\S+)', l)
    if m:
        drec.append((key(m.group(1), m.group(2), m.group(3), m.group(4)), m.group(5), l[:140]))
print('deep-review-log dated lines in all:', len(drec))
da = [r for r in drec if r[0] > CUT]
print('deep-review-log dated lines after cut:', len(da))
kinds = {}
for r in da:
    kinds[r[1]] = kinds.get(r[1], 0) + 1
print('  by second field:', kinds)

# 3. runs.log launches after the cut
rlog = txt('runs.log').split('\n')
runs = []
for l in rlog:
    m = re.match(r'^(\d{2}) ([A-Z][a-z]{2}) (\d{2}):(\d{2}) UK \| (\w+) \| ([^|]+)\|', l)
    if m:
        runs.append((key(m.group(1), m.group(2), m.group(3), m.group(4)), m.group(5), m.group(6).strip()))
ra = [r for r in runs if r[0] > CUT]
print('runs.log entries in all:', len(runs), 'after cut:', len(ra))
pk = {}
for r in ra:
    p = r[2].split(':')[0]
    pk[p] = pk.get(p, 0) + 1
print('  after cut, by prediction field (none = measurement/preflight):', sorted(pk.items(), key=lambda x: -x[1])[:40])
print('  after cut, registered (prediction not none):', sum(1 for r in ra if not r[2].startswith('none')))

# 4. ledger READ rows after the cut, in PLAN.md and PLAN-HISTORY.md
reads = set()
for f in ('PLAN.md', 'PLAN-HISTORY.md'):
    for l in txt(f).split('\n'):
        m = re.match(r'^\| (\d{1,2}) ([A-Z][a-z]{2}) (\d{2}):(\d{2}) \| (.*)', l)
        if not m:
            continue
        k = key(m.group(1), m.group(2), m.group(3), m.group(4))
        if k <= CUT:
            continue
        body = m.group(5)
        head = body[:300]
        if re.search(r'\bREAD\b', head) and not head.startswith('(maintainer') and not head.startswith('(Claude'):
            reads.add((k, head[:90]))
print('ledger rows after cut whose head says READ:', len(reads))
for r in sorted(reads):
    print('   ', r[0], r[1])

# 5. register rows created after the cut: O-ids above O134 present anywhere, and open ones in PLAN.md
plan = txt('PLAN.md'); hist = txt('PLAN-HISTORY.md')
def ids(t, pat):
    return set(int(x) for x in re.findall(pat, t, flags=re.M))
oplan = ids(plan, r'^\| O(\d+) \|'); ohist = ids(hist, r'^\| O(\d+) \|')
allo = oplan | ohist
print('register ids: max', max(allo), '; O132..O200 present', len([i for i in allo if 132 <= i <= 200]), '; O133..O200', len([i for i in allo if 133 <= i <= 200]), '; O135..O200', len([i for i in allo if 135 <= i <= 200]))
missing = [i for i in range(132, 201) if i not in allo]
print('  ids 132..200 not found as rows:', missing)
openrows = []
for l in plan.split('\n'):
    m = re.match(r'^\| O(\d+) \|', l)
    if not m:
        continue
    cells = l.split(' | ')
    status = cells[-1].strip().rstrip('|').strip()
    openrows.append((int(m.group(1)), status[:12]))
op = [i for i, s in openrows if s.lower().startswith('open')]
print('  open rows in PLAN.md with id 132..200:', len([i for i in op if 132 <= i <= 200]), '; 133..200:', len([i for i in op if 133 <= i <= 200]), '; 135..200:', len([i for i in op if 135 <= i <= 200]))
nonopen = [(i, s) for i, s in openrows if 132 <= i <= 200 and not s.lower().startswith('open')]
print('  non-open rows still in PLAN.md (132..200):', nonopen)
# premises
pr = ids(plan, r'^\| PR(\d+) \|') | ids(hist, r'^\| PR(\d+) \|')
print('premises: count', len(pr), 'max', max(pr))
