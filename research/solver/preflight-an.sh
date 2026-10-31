#!/bin/bash
# AN's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-an.md), at a fifteenth of the points and
# 40 paths a world, seed 7002: (A) BN-off - NODE-AX's BN preflight job rerun on this code against the saved one, bit for bit
# (compare-preflight.mjs); (B) AN, read by reduce-an.mjs --preflight (its gate and file; no figure read); (C) the plants, each
# of which must make the job refuse (exit 3): arm (armTook), drift, choice and step (refTook, at its registered sample and
# by year: the plan-auditor's FAIL of 15 Oct 15:37 UK), and NODE-AX's layer, own, quad and held on the copied ledger. PAR jobs at a time (default 4).
set -u
OUT=research/solver/results/an-preflight
rm -rf "$OUT"; mkdir -p "$OUT/bn" "$OUT/an"
for p in arm drift choice step layer own quad held; do mkdir -p "$OUT/plant-$p"; done
printf '%s\n' bn an arm drift choice step layer own quad held | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/an-preflight
  case {} in
    bn) DIAGNODEAX_OUT=$O/bn node research/solver/audit-nodeax.mjs 15 40 part 0/2 7002 > $O/bn/case0.txt 2>&1; echo "bn exit $?" > $O/bn/exit.txt ;;
    an) DIAGAN_OUT=$O/an node research/solver/audit-an.mjs 15 40 part 0/1 7002 > $O/an/case0.txt 2>&1; echo "an exit $?" > $O/an/exit.txt ;;
    *) AN_PLANT={} DIAGAN_OUT=$O/plant-{} node research/solver/audit-an.mjs 15 40 part 0/1 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
cat "$OUT/bn/exit.txt" "$OUT/an/exit.txt"
echo "A. $(node research/solver/compare-preflight.mjs research/solver/results/nodeax-preflight "$OUT/bn" S360-BN-P60S15Q5.json.gz case0.txt | tail -1)"
grep -hE "adaptive |checks " "$OUT/an/case0.txt" | cut -c1-220
echo "B. $(node research/solver/reduce-an.mjs "$OUT/an" 40 15 --preflight | tail -2 | tr '\n' ' ')"
# each plant must refuse on its own check, not on an earlier one (the first preflight, 15 Oct: every job stopped at armTook,
# the meta not naming the reference, and an exit-code check counted seven plants refused)
bad=0
[ "$(cat "$OUT/an/exit.txt")" = "an exit 0" ] || { echo "AN ITSELF DID NOT FINISH - the preflight fails"; bad=1; }
want() { case $1 in arm) echo "the job's settings did not take";; drift|choice|step) echo "does not match its own rule run forward";; layer) echo "the ledger does not close on every path";;
  own) echo "the ledger does not close on every path (ownTook";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "is filed under a layer other than the tiers held";; esac; }
for p in arm drift choice step layer own quad held; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-an:' "$OUT/plant-$p/case0.txt" | head -1); echo "C. $e: $(echo "$m" | cut -c1-170)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the eight plants refused, each on its own check (exit 3)"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
