#!/bin/bash
# The spending curve's queue (SPENDING-CURVE.md, section 4): every worker walks the same ordered list and claims a unit by
# making its directory (atomic), one worker a core. The units go outside git (STATE.md D17), in $UNITS.
#   UNITS=<dir> bash curveq.sh            (from the root of the code under test)
G=/home/claude/monte-carlo-retirement-planner/research/reviews/2026-10-29/curve
: "${UNITS:?set UNITS}"
mkdir -p $UNITS/claim
H="S090 S030 S328F S188 S304F S368 S050 S340F"
LIST=""
for a in APP CAND UTIL HYB; do for h in $H; do LIST="$LIST $h-$a"; done; done
for a in ZERO UTILNM FLAT; do for h in $H; do LIST="$LIST $h-$a"; done; done
for tag in $LIST; do
  id=${tag%-*}; arm=${tag##*-}; low=$(echo $arm | tr 'A-Z' 'a-z')
  [ -f $UNITS/$id-$low.json.gz ] && continue
  mkdir $UNITS/claim/$tag 2>/dev/null || continue
  node $G/curve-audit.mjs 1000 $UNITS $id $arm > $UNITS/$tag.log 2>&1 || { echo "FAILED $tag"; tail -3 $UNITS/$tag.log; continue; }
  echo "== $(TZ=Europe/London date +%H:%M) $(tail -1 $UNITS/$tag.log | cut -c1-300)"
done
echo "QUEUE DONE $(TZ=Europe/London date +%H:%M)"
