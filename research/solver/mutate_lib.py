# THE SHARED MUTATION RUNNER (the process review, deep-review-log.md 4 Oct 13:52 UK: the mutation history stopped silently
# at 7aq, because each test's script carried its own loop and the later ones dropped the history line). Every mutation
# script calls run(): it checks the true script passes its planted set, applies each mutation (old -> new, exactly once)
# to a scratch copy, runs the copy's planted set and counts it caught when the copy reports a planted failure (the marker,
# or a non-zero exit); it prints each outcome and ALWAYS appends one line to results-mutation-history.txt - first runs,
# failed runs and a true script that fails its own planted set included - and exits 1 on any mutation not applied or not
# caught.
#   from mutate_lib import run; run('reduce-7xx.mjs', M)
import datetime, hashlib, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
HISTORY = os.path.join(HERE, 'results-mutation-history.txt')

def history(target, sha, caught, total, escaped):
    with open(HISTORY, 'a') as h:
        h.write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC | {target} {sha} | {caught} of {total} caught | escaped: {'; '.join(escaped) or 'none'}\n")

def run(target, M, args=('--planted',), marker='PLANTED CHECK FAILED', exit=True):
    src = os.path.join(HERE, target)
    dst = os.path.join(HERE, 'zz-mut-' + os.path.basename(target))
    base = open(src).read()
    sha = hashlib.sha256(base.encode()).hexdigest()[:12]
    r = subprocess.run(['node', src, *args], capture_output=True, text=True)
    if r.returncode != 0 or marker in r.stdout:
        print('THE TRUE SCRIPT FAILS ITS PLANTED SET:\n' + r.stdout[-2000:])
        history(target, sha, 0, len(M), ['the true script fails its planted set'])
        if exit: sys.exit(1)
        return False
    caught, bad = 0, []
    try:
        for name, old, new in M:
            n = base.count(old)
            if n != 1: bad.append(f'NOT APPLIED ({n} matches): {name}'); continue
            open(dst, 'w').write(base.replace(old, new))
            r = subprocess.run(['node', dst, *args], capture_output=True, text=True)
            if marker in r.stdout or r.returncode != 0: caught += 1; print(f'caught: {name}')
            else: bad.append(f'NOT CAUGHT: {name}')
    finally:
        if os.path.exists(dst): os.remove(dst)
    for b in bad: print(b)
    print(f'{caught} of {len(M)} mutations caught')
    history(target, sha, caught, len(M), bad)
    if exit: sys.exit(1 if bad else 0)
    return not bad
