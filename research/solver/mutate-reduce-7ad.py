#!/usr/bin/env python3
# THE 7AD REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7ad.mjs's reading, rule or
# gate in a scratch copy beside it, runs the planted set on the copy, and must see PLANTED CHECK FAILED. Every mutation must
# apply exactly as written; the true script must pass. Any mutation not applied or not caught fails the script (exit 1). The
# stamp gate lives in fair-gate.mjs (requireFairLogs); 7aa's and 7ac's gates are their reducers' (mutated there,
# results-reduce-7aa-mutations.txt and results-reduce-7ac-mutations.txt); the paired cells are reduce-7v.mjs's, the exact
# interval stats.mjs's.
#   python3 research/solver/mutate-reduce-7ad.py > research/solver/results-reduce-7ad-mutations.txt
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'reduce-7ad.mjs'), os.path.join(HERE, 'zz-mut-7ad.mjs')
base = open(SRC).read()
M = [
    # the gate: the jobs
    ("the gate accepts a missing job", "if (k !== 1) bad.push(`${id} ${arm}/${grid}/W${w}: ${k} job lines, not 1`)", "if (k > 1) bad.push(`${id} ${arm}/${grid}/W${w}: ${k} job lines, not 1`)"),
    ("the gate accepts a job twice", "if (k !== 1) bad.push(`${id} ${arm}/${grid}/W${w}: ${k} job lines, not 1`)", "if (k < 1) bad.push(`${id} ${arm}/${grid}/W${w}: ${k} job lines, not 1`)"),
    ("the gate accepts an unregistered job", "{ bad.push(`${tagJ}: not a registered job`); continue; }", "{ continue; }"),
    ("the gate ignores the job line's settings", "if (j.lambda !== LAMBDA || j.tier !== 'own'", "if (false && j.tier !== 'own'"),
    ("the gate ignores the job's points", "if (j.points !== pts || j.quad !== quad) bad.push", "if (j.quad !== quad) bad.push"),
    ("the gate accepts an unregistered solve", "if (!want.includes(tag)) bad.push", "if (false) bad.push"),
    ("the gate accepts a missing 7aa unit", "if (!r) { bad.push(`${L}: no 7aa ${tag} unit to compare with`); continue; }", "if (!r) continue;"),
    ("the gate accepts a missing solve line", "if (u.table === undefined) bad.push(`${L}: no solve line`);", ""),
    # the ran line
    ("the gate ignores the estate weight", "if (field(u.ran, 'bequestWeight') !== j.w) bad.push", "if (false) bad.push"),
    ("the gate ignores the tier state", "if (!!field(u.ran, 'tierState') !== (tag === 'TS+J')) bad.push", "if (false) bad.push"),
    ("the gate does not read a held tier, Q's fix or the reader's reference", "for (const k of ['holdTier', 'bridgeStep', 'readerRef']) if (field(u.ran, k)) bad.push", "for (const k of []) if (field(u.ran, k)) bad.push"),
    ("the gate ignores the paths", "if (field(u.ran, 'paths') !== String(N) || field(u.ran, 'seed') !== SEED) bad.push", "if (field(u.ran, 'seed') !== SEED) bad.push"),
    ("the gate ignores the ran line's grid", "if (field(u.ran, 'pts') !== String(pts) || field(u.ran, 'quad') !== String(quad)) bad.push", "if (false) bad.push"),
    ("the gate reads the finer grids' ran line whole-cloth equal to 7aa's but for nothing", "else if (stripGrid(u.ran) !== stripGrid(r.ran)) bad.push", "else if (false) bad.push"),
    ("the gate strips more than the grid from the ran line", "const stripGrid = ran => (ran || '').replace(", "const stripGrid = ran => (ran || '').replace(/minPot \\S+/, 'minPot _').replace("),
    # the 30x5 identity with 7aa
    ("the gate ignores the 30x5 table", "if (j.grid === '30x5' && u.table !== undefined && u.table !== r.table) bad.push", "if (false) bad.push"),
    ("the gate ignores the 30x5 gap", "else if (j.grid === '30x5' && (!r.gap || u.gap.gap !== r.gap.gap || u.gap.open1e3", "else if (j.grid === '30x5' && (!r.gap || u.gap.open1e3"),
    # the joint line
    ("the gate accepts TS+J per world", "if (u.joint.joint !== (tag === 'TS+J')) bad.push", "if (false) bad.push"),
    ("the gate ignores the solved margin", "if (u.joint.margin !== '0.001') bad.push", "if (false) bad.push"),
    ("the gate ignores the scale", "if (!r.joint || u.joint.scale !== r.joint.scale || u.joint.cap !== r.joint.cap) bad.push", "if (!r.joint || u.joint.cap !== r.joint.cap) bad.push"),
    # the moves
    ("the gate accepts a missing moves line", "if (!u.moves) bad.push(`${L}: no moves line`);\n      else {", "if (false) bad.push(`${L}: no moves line`);\n      else if (u.moves) {"),
    ("the gate accepts a STAY move leaving the held tiers", "if (!keeps(u.moves.stayTier)) bad.push", "if (false) bad.push"),
    ("the gate accepts a BEST move keeping the held tiers", "if (u.gap && u.gap.gap !== '0' && keeps(u.moves.bestTier)) bad.push", "if (false) bad.push"),
    ("the gate accepts BEST and STAY apart at gap 0", "if (u.gap && u.gap.gap === '0' && u.moves.best !== u.moves.stay) bad.push", "if (false) bad.push"),
    ("the gate accepts any chosen move", "if (u.moves.chosen !== (keeps(u.moves.chosenTier) ? u.moves.stay : u.moves.best)) bad.push", "if (false) bad.push"),
    # the prices
    ("the gate accepts a missing price line", "if (!u.price) bad.push(`${L}: no price line`);\n      else {", "if (false) bad.push(`${L}: no price line`);\n      else if (u.price) {"),
    ("the gate ignores the mixture's price", "if (Number.isFinite(g) && g > 0 && !(Math.abs(u.price.mixture / 100 - g) <= PRICE_TOL * g)) bad.push", "if (false) bad.push"),
    ("the gate's price tolerance ten times looser", "PRICE_TOL = 1e-3, LFL_TOL", "PRICE_TOL = 1e-2, LFL_TOL"),
    ("the gate ignores the like-for-like sum", "if (!(Math.abs(u.price.whole - u.price.mixture) <= LFL_TOL * Math.abs(u.price.mixture) + 1e-12)) bad.push", "if (false) bad.push"),
    ("the gate accepts two world lines", "if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k])) bad.push", "if (u.worlds.length > 3) bad.push"),
    ("the gate ignores the world lines' sum", "if (!(Math.abs(sum('whole') - u.price.whole) <= tol('whole')) || !(Math.abs(sum('surv') - u.price.surv) <= tol('surv'))) bad.push", "if (false) bad.push"),
    ("the world lines' tolerance a hundred times looser", "WTOL = 5e-5;", "WTOL = 5e-3;"),
    # the node runs
    ("the gate accepts node runs for the product", "if (u.nodes.length) bad.push(`${L}: node runs for the product`);", ""),
    ("the gate ignores which worlds have node runs", "if (u.nodes.filter(Boolean).length !== nw.length || nw.some(k => !u.nodes[k])) bad.push", "if (false) bad.push"),
    ("node runs at every world at every grid", "export const nodeWorlds = grid => (grid === '30x5' ? [0, 1, 2] : [0]);", "export const nodeWorlds = grid => [0, 1, 2];"),
    ("the gate ignores the node paths", "if (nd.paths !== wn) bad.push", "if (false) bad.push"),
    ("the gate ignores the node's position", "if (u.worlds[k] && Math.abs(nd.z - u.worlds[k].z) > 1e-4) bad.push", "if (false) bad.push"),
    ("the gate ignores OPEN0 leaving the held tiers", "if (nd.heldO !== nd.paths) bad.push", "if (false) bad.push"),
    ("the gate ignores TS+J's year-0 move on the node paths", "if (nd.heldJ !== (leaves ? 0 : nd.paths)) bad.push", "if (false) bad.push"),
    ("the gate ignores the first 1000 paths against 7ac", "if (nd && (!cw || Math.abs(nd.firstJ - cw.simJ) > 1e-9 || Math.abs(nd.firstO - cw.simO) > 1e-9)) bad.push", "if (false) bad.push"),
    ("the gate reads the first 1000 paths' OPEN0 only", "Math.abs(nd.firstJ - cw.simJ) > 1e-9 || Math.abs(nd.firstO - cw.simO) > 1e-9", "Math.abs(nd.firstO - cw.simO) > 1e-9"),
    ("the gate accepts a missing done line", "if (!j.done) bad.push", "if (false) bad.push"),
    # the traces
    ("a trace's survival read loosely", "Math.abs(j.sim - sim) <= SIM_TOL);", "Math.abs(j.sim - sim) <= 1e-3);"),
    ("a trace's world not read", "j.arm === `${arm}/${rule}/${grid}/W${w}/world${k}`", "j.arm.startsWith(`${arm}/${rule}/${grid}/W${w}`)"),
    ("the trace name without the grid", "export const traceName = (id, arm, grid, rule, k, w) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${grid}-", "export const traceName = (id, arm, grid, rule, k, w) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-"),
    # O47's yearly share
    ("the de-risk share counts every year a path is off the plan's tiers", "if (T.tier[i * T.Y + t] !== 0) { out[t]++; break; }", "if (T.tier[i * T.Y + t] !== 0) { out[t]++; }"),
    ("the de-risk share from year 1", "for (let t = 0; t < Math.min(years, T.Y); t++) if (T.tier", "for (let t = 1; t < Math.min(years, T.Y); t++) if (T.tier"),
    # the items
    ("item 1 at alpha 0.05", "ALPHA1 = 0.025", "ALPHA1 = 0.05"),
    ("item 1 priced low against the interval's upper end", "o: price < iv.lo ? 'priced low'", "o: price < iv.hi ? 'priced low'"),
    ("item 1 on bridge 4 alone", "outcome: tri(i1, x => x.o === 'priced low'", "outcome: tri(i1.slice(0, 1), x => x.o === 'priced low'"),
    ("item 1 falsified only if priced high", "x => x.o === 'priced low', x => x.o !== 'priced low')", "x => x.o === 'priced low', x => x.o === 'priced high')"),
    ("item 1 reads world 1", "price = u.worlds[0].surv; return { id, price, iv, o:", "price = u.worlds[1].surv; return { id, price, iv, o:"),
    ("item 2 without the mispricing", "outcome: tri(i2, x => x.rise >= 0.2 && x.closes", "outcome: tri(i2, x => x.rise >= 0.2"),
    ("item 2 at a 10% rise", "outcome: tri(i2, x => x.rise >= 0.2 && x.closes", "outcome: tri(i2, x => x.rise >= 0.1 && x.closes"),
    ("item 2's falsifier at 20%", "x => x.rise >= 0.2 && x.closes, x => x.rise < 0.1)", "x => x.rise >= 0.2 && x.closes, x => x.rise < 0.2)"),
    ("item 2's mispricing from any sign", "closes: m30 !== null && m60 !== null && m30 > 0 && m60 <= (2 / 3) * m30", "closes: m30 !== null && m60 !== null && m60 <= (2 / 3) * m30"),
    ("item 2's mispricing at 60x5 read from the 30x5 node", "m60 = miss(id, '60x5')", "m60 = miss(id, '30x5') + P(id, '30x5', 'TS+J').worlds[0].surv - P(id, '60x5', 'TS+J').worlds[0].surv"),
    ("item 2 counts a mispricing where TS+J keeps the held tiers", "const leaves = (id, grid) => { const u = P(id, grid, 'TS+J'); return !u.moves || u.moves.chosen !== u.moves.stay; };", "const leaves = (id, grid) => true;"),
    ("item 2 a half, not a third", "m60 <= (2 / 3) * m30", "m60 <= (1 / 2) * m30"),
    ("item 3 reads TS+J", "const g30 = g(id, '30x5', 'PRODUCT'), g60 = g(id, '60x5', 'PRODUCT')", "const g30 = g(id, '30x5', 'TS+J'), g60 = g(id, '60x5', 'TS+J')"),
    ("item 4's comparison reversed", "outcome: tri(i4, x => x.rq < x.rp, x => x.rq > x.rp)", "outcome: tri(i4, x => x.rq > x.rp, x => x.rq < x.rp)"),
    ("item 4 reads the product", "rq = g(id, '30x15', 'TS+J') / g30 - 1", "rq = g(id, '30x15', 'PRODUCT') / g30 - 1"),
    ("three outcomes: never FALSIFIED", "const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');", "const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : 'INCONCLUSIVE');"),
    ("three outcomes: HELD on either unit", "const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');", "const tri = (xs, yes, no) => (xs.some(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');"),
]
def run(f):
    p = subprocess.run(['node', f, '--planted'], capture_output=True, text=True)
    return p.stdout.strip() + p.stderr.strip()
bad = 0
out = run(SRC)
last = out.splitlines()[-1] if out else ''
if not last.startswith('planted (') or 'FAIL' in out:
    print(f'FAIL: the true script does not pass its planted set: {last[:200]}'); sys.exit(1)
print(f'true script: {last}')
try:
    for name, a, b in M:
        if base.count(a) != 1:
            print(f'FAIL  {name}: the mutation does not apply ({base.count(a)} matches)'); bad = 1; continue
        open(DST, 'w').write(base.replace(a, b))
        o = run(DST)
        if 'PLANTED CHECK FAILED' in o:
            first = next((l[5:180] for l in o.splitlines() if l.startswith('FAIL')), next((l[:180] for l in o.splitlines() if 'PLANTED CHECK FAILED' in l), ''))
            print(f'caught  {name}: {first}')
        else: print(f'FAIL  {name}: NOT CAUGHT'); bad = 1
finally:
    if os.path.exists(DST): os.remove(DST)
print(f'\n{len(M)} mutations: ' + ('every one caught' if not bad else 'SOME NOT CAUGHT'))
sys.exit(bad)
