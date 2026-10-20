#!/usr/bin/env python3
# O191'S READ'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each mutation breaks one part of read-o191.mjs in a scratch copy and
# must see PLANTED CHECK FAILED (mutate_lib.py logs the run to results-mutation-history.txt).
#   python3 research/solver/mutate-read-o191.py > research/solver/results-read-o191-mutations.txt
from mutate_lib import run
M = [
 ("for (const t of F.bridge) if (t > t0) s += F.per", "for (const t of F.bridge) if (t >= t0) s += F.per"),
 ("export const isaFirst = ai => Math.floor(Math.floor(ai / 15) / 3) % 2 === 1;", "export const isaFirst = ai => Math.floor(ai / 15) % 2 === 1;"),
 ("if (t0 === 1 && !isaFirst(mA[i * Y + 1]) && isaFirst(mB[i * Y + 1])) cellPaths.push(i);", "if (!isaFirst(mA[i * Y + 1]) && isaFirst(mB[i * Y + 1])) cellPaths.push(i);"),
 ("if (t0 < 0 || !br.includes(t0)) continue;", "if (t0 < 0) continue;"),
 ("for (const i of cellPaths) y[i] += 0.01;", "for (const i of cellPaths) y[i] += 0.001;"),
 ("if (plant === 'y3') B = { ...B, per: { ...B.per } };", ""),
 ("const d = st(cellPaths.map(i => 100 * (bB[i] - bA[i])))", "const d = st(cellPaths.map(i => 100 * (bA[i] - bB[i])))"),
 ("mS += W[k] * ds.m;", "mS += ds.m / 3;"),
]
run('read-o191.mjs', [(f'{i+1}: {o[:50]}', o, n) for i, (o, n) in enumerate(M)])
