#!/usr/bin/env python3
# NE-BLEND STAGE A'S ESCAPED MUTANTS RUN ON ITS OWN FILES: mutate-reduce-neblend-a.py found mutants its planted set does not
# catch; each escaped mutant is run here on results/diagneblend and its output compared with results-neblend-a.txt, so
# whether any escape could have changed stage A's read is shown, not judged.
#   python3 research/solver/mutants-on-data-neblend-a.py > research/solver/results-neblend-a-mutants-on-data.txt
import os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'reduce-neblend-a.mjs')).read()
M = eval(re.search(r"M = (\[.*?\n\])", open(os.path.join(HERE, 'mutate-reduce-neblend-a.py')).read(), re.S).group(1))
M = [m for m in M if m[0] != m[1]]
hist = [l for l in open(os.path.join(HERE, 'results-mutation-history.txt')) if ' | reduce-neblend-a.mjs ' in l][-1]
escaped = sorted(int(x) for x in re.findall(r'NOT CAUGHT: (\d+):', hist))
ref = open(os.path.join(HERE, 'results-neblend-a.txt')).read()
dst = os.path.join(HERE, 'zz-mut-reduce-neblend-a.mjs')
print(f'the latest history line: {hist.strip()[:80]}...; escaped: {", ".join(map(str, escaped)) or "none"}')
same = 0
try:
    for i in escaped:
        old, new = M[i - 1]
        assert src.count(old) == 1, old
        open(dst, 'w').write(src.replace(old, new))
        r = subprocess.run(['node', dst], capture_output=True, text=True, cwd=os.path.dirname(HERE))
        out = r.stdout
        oc = next((l for l in out.splitlines() if l.startswith('OUTCOME:')), 'no OUTCOME line')
        if out == ref: same += 1; print(f'{i}: identical to results-neblend-a.txt')
        else:
            diff = [(a, b) for a, b in zip(ref.splitlines(), out.splitlines()) if a != b]
            print(f'{i}: differs on {len(diff)} line(s), exit {r.returncode}; {oc}')
            for a, b in diff[:3]: print(f'    was: {a[:160]}\n    now: {b[:160]}')
finally:
    if os.path.exists(dst): os.remove(dst)
print(f'{same} of {len(escaped)} escaped mutants reproduce results-neblend-a.txt byte for byte')
