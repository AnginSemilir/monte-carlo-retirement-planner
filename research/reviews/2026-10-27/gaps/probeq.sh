#!/bin/bash
# The plan-variant probes' queue (GAPS-SWEEP.md, Part B): every worker walks the same ordered list and claims a unit by making
# its directory under probe/claim (atomic), so two workers on two cores never run the same unit. Run from the code under test.
#   bash probeq.sh            (one worker; start one a core)
G=/home/claude/monte-carlo-retirement-planner/research/reviews/2026-10-27/gaps
mkdir -p $G/probe/claim
UNITS="S302F-BASE S302F-MOREISA S302F-MOREPEN S330F-BASE S330F-MOREISA S330F-MOREPEN S342F-BASE S342F-MOREISA S342F-MOREPEN
S370-BASE S370-LUMP S380-BASE S380-LUMP S224-BASE S224-LUMP S362-BASE S362-LUMP S380-ISA2ISA S224-ISA2ISA
S370-BUF0 S380-BUF0 S224-BUF0 S362-BUF0 S370-BUF24 S380-BUF24 S224-BUF24 S362-BUF24"
for tag in $UNITS; do
  [ -f $G/probe/$tag.json ] && continue
  mkdir $G/probe/claim/$tag 2>/dev/null || continue
  id=${tag%-*}; arm=${tag##*-}
  node $G/plan-probe.mjs $id $arm $G/probe/$tag.json 8000 > $G/probe/$tag.log 2>&1 || { echo "FAILED $tag"; tail -4 $G/probe/$tag.log; continue; }
  echo "== $(TZ=Europe/London date +%H:%M) $(tail -1 $G/probe/$tag.log | cut -c1-360)"
done
echo "QUEUE DONE $(TZ=Europe/London date +%H:%M)"
