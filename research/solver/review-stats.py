# THE PLAN REVIEWS' RECORD (the maintainer, 26 Sep: "is there anything in the project structure currently that could be
# loosened as it's not benefiting the project aims"). Reads research/solver/review-log.md's receipts. The kinds of finding
# are a rough keyword split of each finding's first 300 characters (a finding can match several kinds, or none): a guide
# to where the reviews' effort goes, not a classification - grade C.
#   python3 research/solver/review-stats.py > research/solver/results-review-record.txt
import os, re, collections, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
L = [l for l in open(os.path.join(HERE, 'review-log.md')) if re.match(r'^- .* \| plan [0-9a-f]{40} \| (PASS|FAIL) \|', l)]
print('THE PLAN REVIEWS\' RECORD (review-log.md\'s receipts; the kinds are a rough keyword split, grade C)')
print('receipts', len(L), 'PASS', sum(' | PASS | ' in l for l in L), 'FAIL', sum(' | FAIL | ' in l for l in L))
T = {'a time or date': r'\b(UK|time|clock|written|timestamp|o.clock)\b',
     'wording, staleness or overclaim': r'(wording|overclaim|claims more|loose|stale|comment|says|reads as|word)',
     'a figure without its file': r'(not in (the )?cited|no results file|no script|without (a|its) (file|script))',
     'the enforcement itself (hooks, checker, gate, smoke)': r'(hook|checker|check-plan|check-prediction|smoke|gate|known limit|unlock|locked)',
     'a result, rule, prediction or default': r'(result|rule|prediction|default|item \d|outcome|falsif|power)'}
kinds, topics = collections.Counter(), collections.Counter()
for l in L:
    for p in re.split(r'(?=\b(?:BLOCKING|MINOR|BACKLOG) \d)', l)[1:]:
        k = p.split()[0]
        kinds[k] += 1
        for t, rx in T.items():
            if re.search(rx, p[:300], re.I): topics[(k, t)] += 1
print('findings by severity', ', '.join(f'{k} {v}' for k, v in sorted(kinds.items())))
for (k, t), v in sorted(topics.items()): print(f'  {k:9s} {t}: {v}')
print('PLAN.md lines:', sum(1 for _ in open(os.path.join(HERE, 'PLAN.md'))), '; commits touching PLAN.md:', subprocess.run(['git', '-C', HERE, 'log', '--oneline', '--', 'PLAN.md'], capture_output=True, text=True).stdout.count('\n'))
