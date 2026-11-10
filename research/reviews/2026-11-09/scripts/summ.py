import re, sys
for f in sys.argv[1:]:
    L = open(f).read().splitlines()
    if not L: continue
    m = re.match(r'(\S+) at (\d+) points \(solve (\d+) s.*whole menu: a path ([\d.]+) ms, survival ([\d.]+)% on (\d+) paths; replay (\d+) paths, (\d+) decisions', L[0])
    if m: print(f'{m[1]} at {m[2]} points: whole menu {m[4]} ms a path, survival {m[5]}% on {m[6]} paths; {m[8]} decisions replayed')
    for l in L[1:]:
        m = re.match(r'\s+([a-z@0-9.-]+): ([\d.]+) moves listed; a different move at ([\d.]+)% of decisions \(over 0.01 points of score given up at ([\d.]+)%, over 0.1 at ([\d.]+)%, over 1 at ([\d.]+)%; mean (\S+) points, worst ([\d.]+)\).*\| a path ([\d.]+) ms \(([\d.]+) times\), whole-menu fallbacks (\d+); survival ([\d.]+)% \((\d+) saved, (\d+) lost\); spending delivered (\S+) points of target; mean pot left (\S+)%', l)
        if m: print(f'   {m[1]:11s} {m[2]:>6s} listed | differs {m[3]}%, >0.01pt {m[4]}%, >0.1pt {m[5]}%, >1pt {m[6]}%, mean {m[7]}, worst {m[8]} | {m[9]} ms x{m[10]} | {m[13]} saved {m[14]} lost | spend {m[15]} | pot {m[16]}%')
