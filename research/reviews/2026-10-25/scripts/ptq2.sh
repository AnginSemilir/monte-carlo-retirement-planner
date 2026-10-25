#!/bin/bash
# purpose-test chunks one after another on one core, on the agent's code at 52b0b6c (worktree /home/claude/pt-wt): the
# candidate with HR and the third tier step at 45 points; items "<household> <weight> <from> <to>", positions from..to-1
# of the unit's 20 (the same positions, moves and paths as a whole run). A chunk whose JSON is there is skipped. Starts
# no chunk it cannot expect to finish before DEADLINE seconds (the harness stops a background run at 2 hours): exits 3.
P=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/purpose
cd /home/claude/pt-wt
DEADLINE=${DEADLINE:-7000}; t0=$(date +%s); longest=0
for item in "$@"; do
  set -- $item; h=$1; w=$2; a0=$3; a1=$4; tag=$h-w$w-p$a0-$a1
  [ -f $P/out/$tag.json ] && { echo "-- $tag: there already"; continue; }
  gone=$(( $(date +%s) - t0 ))
  if [ $longest -gt 0 ] && [ $(( gone + longest * 5 / 4 )) -gt $DEADLINE ]; then echo "STOPPED before $tag: ${gone} s gone, the longest chunk ${longest} s; rerun to carry on"; exit 3; fi
  a=$(date +%s)
  PTS=45 MENUPLUS=hr TIERS_BELOW=3 OUTDIR=$P/out POS_FROM=$a0 POS_TO=$a1 node research/solver/audit-bestof-latest.mjs $h 0.0223606797749979 $w 20 800 6 > $P/logs/$tag.log 2>&1 || { echo "FAILED $tag"; tail -5 $P/logs/$tag.log | cut -c1-300; exit 1; }
  d=$(( $(date +%s) - a )); [ $d -gt $longest ] && longest=$d
  echo "== $tag: ${d} s"; grep -E "^SUMMARY|^PLANT" $P/logs/$tag.log | cut -c1-330
done
echo "QUEUE DONE"
