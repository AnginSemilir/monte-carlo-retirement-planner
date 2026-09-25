#!/usr/bin/env bash
# THE REDUCER'S PLANTED CHECKS, SHOWN TO FAIL (rule 6): each line breaks one part of reduce-7e.mjs's rule, gate or
# completeness in a scratch copy (or stats.mjs's harm rule), runs the planted set on it, and must see PLANTED CHECK FAILED.
# The stamp gate lives in fair-gate.mjs (requireFairLogs); its planted faults are in fair-gate.test.mjs.
# The true reducer must pass. Any mutation that is not applied, or that the planted set does not catch, fails the script.
#   bash research/solver/mutate-reduce-7e.sh
set -u
cd "$(dirname "$0")/../.."
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
R=research/solver/reduce-7e.mjs; ABS=$PWD/research/solver/stats.mjs; FG=$PWD/research/solver/fair-gate.mjs; bad=0; n=0
node "$R" --planted > "$T/true.txt" 2>&1 || { echo "FAIL: the true reducer's planted set does not pass"; cat "$T/true.txt"; exit 1; }
echo "true reducer: $(cut -c1-14 "$T/true.txt") checks pass"
mut() { # name, sed expression on the reducer, [sed expression on stats.mjs]
  local S="$ABS"
  if [ -n "${3:-}" ]; then sed "$3" research/solver/stats.mjs > "$T/stats.mjs"; cmp -s research/solver/stats.mjs "$T/stats.mjs" && { echo "FAIL  $1: the mutation was not applied"; bad=1; return; }; S="$T/stats.mjs"; fi
  sed -e "s#'./stats.mjs'#'$S'#" -e "s#'./fair-gate.mjs'#'$FG'#" -e "$2" "$R" > "$T/m.mjs"
  sed -e "s#'./stats.mjs'#'$S'#" -e "s#'./fair-gate.mjs'#'$FG'#" "$R" > "$T/base.mjs"
  if [ -z "${3:-}" ] && cmp -s "$T/base.mjs" "$T/m.mjs"; then echo "FAIL  $1: the mutation was not applied"; bad=1; return; fi
  n=$((n + 1)); out=$(node "$T/m.mjs" --planted 2>&1)
  if grep -q '^PLANTED CHECK FAILED' <<< "$out"; then echo "caught  $1: $(cut -c22-170 <<< "$out")"; else echo "FAIL  $1: NOT CAUGHT"; bad=1; fi
}
mut 'margin always 0.5' 's/const marginOf = marginFor;/const marginOf = () => 0.5;/'
mut 'margin always 0.25' 's/const marginOf = marginFor;/const marginOf = () => 0.25;/'
mut 'the pooled floor at -0.5' 's/POOL_FLOOR = -MARGINS.pooled/POOL_FLOOR = -0.5/'
mut 'no Holm' 's/x.pHolm = adj\[i\];/x.pHolm = x.p;/'
mut 'look 1 at 0.05' 's/LOOK1 = 0.005/LOOK1 = 0.05/'
mut 'look 2 at 0.005' 's/LOOK2 = 0.045/LOOK2 = 0.005/'
mut 'look 2 not used' 's/(open.has(c.id) ? { ...versusOff(look2.find(k => k.id === c.id), 3000, LOOK2), look: 2 } : versusOff(c, 1000, LOOK1))/versusOff(c, 1000, LOOK1)/'
mut 'lost and saved swapped' 's/b: r.dn, c: r.up, N, margin/b: r.up, c: r.dn, N, margin/'
mut 'harm needs no margin (stats.mjs)' 's/NOCHANGE//' 's/if (pHolm < level \&\& -iv.d >= margin)/if (pHolm < level)/'
mut 'no pooled check' 's/if (!(pool.lo > POOL_FLOOR))/if (false)/'
mut 'pooled over every case, not the registered pool' 's/const cls = rows.filter(x => POOL.includes(x.id));/const cls = rows;/'
mut 'pooled over the class flag, not the registered pool' 's/const cls = rows.filter(x => POOL.includes(x.id));/const cls = rows.filter(x => main.find(c => c.id === x.id).cls);/'
mut 'no time bar' 's/if (!(worst <= TIME_BAR))/if (false)/'
mut 'no in-class misread check' 's/Math.abs(gapOf(id)) > 10)/Math.abs(gapOf(id)) > 100)/'
mut 'no inflow misread check' 's/Math.abs(gapOf(id)) > 15)/Math.abs(gapOf(id)) > 150)/'
mut 'the controls not tested' 's/const all = \[...rows, ...r30, ...rCtl\]/const all = [...rows, ...r30]/'
mut 'the gate ignores the seed' "s/seed: '7011', //"
mut 'the gate ignores the path count' 's/paths: String(paths), //'
mut 'the gate ignores the final year' "s/finalIntegral: 'true' }/}/"
mut 'the gate ignores the fold' "s/const want = { mix: '3', /const want = { /"
mut 'the gate ignores the bridge read' "s/if (field(ran, 'bridgeRead') !== BR\[name\])/if (false)/"
mut 'the gate ignores the return points' "s/if (field(ran, 'quad') !== (q || '5'))/if (false)/"
mut 'the gate does not compare arms' 's/if (strip(ran) !== strip(first))/if (false)/'
mut 'no pairs-line completeness' "s/main.filter(c => !c.pairs\['READER-V1'\] || !c.pairs\['READER-V2'\])/main.filter(c => false)/"
mut 'no look-2 completeness' 's/else if (look2.map(c => c.id).sort().join/else if (false \&\& look2.map(c => c.id).sort().join/'
mut 'no controls completeness' "s/if (controls.length !== 3 || controls.some(c => labels(c) !== 'OFF,READER'))/if (false)/"
mut 'no timing completeness' 's/if (Object.keys(time).length !== 3)/if (false)/'
echo "$n mutations"
[ $bad -eq 0 ] && echo "ALL CAUGHT" || { echo "MUTATION CHECK FAILED"; exit 1; }
