#!/usr/bin/env python3
"""Extract every tagged BLOCKING finding from plan-auditor FAIL receipts (LLM-LIMITATIONS.md's rule: the first tag of
each 'BLOCKING n.'), count by tag, and print the overclaim ones with whether they turn on an evidence-grade label.
Usage: python3 -I blocking.py <review-log.md> [--show]"""
import re, sys
lines = open(sys.argv[1], encoding='utf-8').read().split('\n')
show = '--show' in sys.argv
fails = [l for l in lines if re.search(r'\| FAIL \| plan-auditor', l)]
items = []
for l in fails:
    head = re.match(r'^- (\d{1,2} [A-Z][a-z]+),? (\d{2}:\d{2}) UK', l)
    when = head.group(1) + ' ' + head.group(2) if head else '?'
    # split the receipt into findings at 'BLOCKING n.' / 'MINOR n.' / 'BACKLOG n.' markers
    parts = re.split(r'(?=(?:BLOCKING|MINOR(?: \(carried \d+\))?|BACKLOG) \d+\.?\s)', l)
    for p in parts:
        m = re.match(r'^BLOCKING (\d+)\.? \[T:([a-z-]+)(?::[a-z0-9-]+)?\]', p)
        if m:
            items.append((when, int(m.group(1)), m.group(2), p))
tags = {}
for it in items:
    tags[it[2]] = tags.get(it[2], 0) + 1
print('tagged BLOCKING findings:', len(items))
for k, v in sorted(tags.items(), key=lambda x: -x[1]):
    print(f'  {v:4d} {k}')
over = [it for it in items if it[2] == 'overclaim']
print('overclaim BLOCKING:', len(over))
gradeword = re.compile(r'\bgrade[sd]?\b|\bgrade [ABCD]\b|\bgraded\b', re.I)
g = [it for it in over if gradeword.search(it[3][:700])]
print('  of which name a grade in the first 700 characters:', len(g))
if show:
    for it in over:
        flag = 'G' if gradeword.search(it[3][:700]) else ' '
        print(f'--- [{flag}] {it[0]} BLOCKING {it[1]}: {it[3][:420]}')
