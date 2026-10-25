#!/bin/bash
# purpose-test units one after another on one core, on the agent's code at 52b0b6c (worktree /home/claude/pt-wt): the
# candidate with HR and the third tier step at 45 points; items "<household> <weight>". A unit whose JSON is there is
# skipped. Starts no unit it cannot expect to finish before DEADLINE seconds (the harness stops a background run at 2
# hours): exits 3, and a rerun carries on.
P=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/purpose
cd /home/claude/pt-wt
DEADLINE=${DEADLINE:-7000}; t0=$(date +%s); longest=0
for item in "$@"; do
  set -- $item; h=$1; w=$2
  [ -f $P/out/$h-w$w.json ] && { echo "-- $h W$w: there already"; continue; }
  gone=$(( $(date +%s) - t0 ))
  if [ $longest -gt 0 ] && [ $(( gone + longest * 5 / 4 )) -gt $DEADLINE ]; then echo "STOPPED before $h W$w: ${gone} s gone, the longest unit ${longest} s; rerun to carry on"; exit 3; fi
  a=$(date +%s)
  PTS=45 MENUPLUS=hr TIERS_BELOW=3 OUTDIR=$P/out node research/solver/audit-bestof-latest.mjs $h 0.0223606797749979 $w 20 800 6 > $P/logs/$h-w$w.log 2>&1 || { echo "FAILED $h W$w"; tail -5 $P/logs/$h-w$w.log | cut -c1-300; exit 1; }
  d=$(( $(date +%s) - a )); [ $d -gt $longest ] && longest=$d
  echo "== $h W$w: ${d} s"; grep -E "^SUMMARY|^PLANT" $P/logs/$h-w$w.log | cut -c1-330
done
echo "QUEUE DONE"
