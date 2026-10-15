#!/bin/bash
# AN's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-an.md), at a fifteenth of the points and
# 40 paths a world, seed 7002: (A) BN-off - NODE-AX's BN preflight job rerun on this code against the saved one, bit for bit
# (compare-preflight.mjs); (B) AN, read by reduce-an.mjs --preflight (its gate and file; no figure read); (C) the plants, each
# of which must make the job refuse (exit 3): arm (armTook), drift and choice (refTook), and NODE-AX's layer, own, quad and
# held on the copied ledger; step (Step 0's smear) is printed, not required to refuse. PAR jobs at a time (default 4).
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
bad=0
for p in arm drift choice layer own quad held; do
  e=$(cat "$OUT/plant-$p/exit.txt"); echo "C. $e: $(grep -h 'audit-an:' "$OUT/plant-$p/case0.txt" | head -1 | cut -c1-170)"
  [ "$e" = "plant $p exit 3" ] || { echo "PLANT $p NOT REFUSED - the preflight fails"; bad=1; }
done
echo "C. $(cat "$OUT/plant-step/exit.txt") (printed only): $(grep -h 'refTook\|step AN' "$OUT/plant-step/case0.txt" | head -2 | cut -c1-160 | tr '\n' ' ')"
[ $bad -eq 0 ] && echo "the seven plants refused (exit 3)"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
