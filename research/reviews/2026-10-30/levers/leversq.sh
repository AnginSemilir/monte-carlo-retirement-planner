#!/bin/bash
# The levers test's queue (LEVERS.md): every worker walks the same ordered list (the longest arms first) and claims a unit
# by making its directory (atomic). A worker stops claiming once QUEUE_MINUTES (default 95) have passed, so its last unit
# ends inside the harness's two-hour limit; relaunch it to go on. The units go outside git, in $UNITS.
#   UNITS=<dir> bash leversq.sh            (from the root of the code under test)
G=/home/claude/monte-carlo-retirement-planner/research/reviews/2026-10-30/levers
: "${UNITS:?set UNITS}"
STOP=$(( $(date +%s) + 60 * ${QUEUE_MINUTES:-95} ))
mkdir -p $UNITS/claim
H="S090 S030 S328F S188 S304F S368 S050 S340F"
LIST=""
for a in CAND FLEXHOLD FIXCAND FIXHOLD FIXAPP FIXAPPT APP APPT; do for h in $H; do LIST="$LIST $h-$a"; done; done
for tag in $LIST; do
  id=${tag%-*}; arm=${tag##*-}; low=$(echo $arm | tr 'A-Z' 'a-z')
  [ -f $UNITS/$id-$low.json.gz ] && continue
  [ $(date +%s) -ge $STOP ] && { echo "QUEUE PAUSED $(TZ=Europe/London date +%H:%M): ${QUEUE_MINUTES:-95} minutes spent; relaunch to go on"; exit 0; }
  mkdir $UNITS/claim/$tag 2>/dev/null || continue
  node $G/levers-audit.mjs 1000 $UNITS $id $arm > $UNITS/$tag.log 2>&1 || { echo "FAILED $tag"; tail -3 $UNITS/$tag.log; continue; }
  echo "== $(TZ=Europe/London date +%H:%M) $(tail -1 $UNITS/$tag.log | cut -c1-300)"
done
echo "QUEUE DONE $(TZ=Europe/London date +%H:%M)"
