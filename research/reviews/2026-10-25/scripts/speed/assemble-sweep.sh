#!/bin/bash
# results-speed-sweep.txt: every figure of the third sweep, printed by its script from the files the runs wrote
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
echo "THE THIRD SWEEP (the external review's speed work, 25 Oct; EXPLORATORY): the speed checkout, the agent's code at 52b0b6c with e11.patch"
echo
echo "== WHERE THE SWEEP STARTED: the profile with E5, S370 at 45 points (prof-e5.sh: SOLVER_PROFILE=1 node --cpu-prof time-e5.mjs S370 45 E5, on e5.patch's code), read by cpu-top.mjs and share-lines.mjs (the line spans of e5.patch's solve.js)"
P5=$(ls $D/prof/S370-HRT3-E5.cpu/*.cpuprofile | head -1)
node /home/claude/monte-carlo-retirement-planner/research/reviews/2026-10-25/scripts/speed/cpu-top.mjs $P5 12
node $D/share-lines.mjs $P5 solver/solve.js "scoring each layer (E5's phase B)=1214-1232" "the memo's hashing and probing (memoFind, memoPut)=871-895" "each move's lookups of next year's tables=1175-1177"
echo
echo "== IDENTITY: bundle-identity.mjs, each household in one process (the reference E5; each cut alone; all five; each plant on top of all five)"
for f in bundle-identity2-S224-6.txt bundle-identity2-S370-4.txt; do echo "-- $f"; cat $D/$f; done
echo
echo "== THE MEMO'S OWN PLANTS UNDER E5 (memo-plant.mjs): which a test of the memo can use there"
for f in memo-plant-S224-6.txt memo-plant-S370-4.txt; do [ -f $D/$f ] && cat $D/$f; done
echo
echo "== WHERE THE BRIDGE READER READS (reader-years.mjs, 4 points): E11's plant can bite only in those years"
for f in reader-years-S224.txt reader-years-S370.txt; do [ -f $D/$f ] && cat $D/$f; done
echo
echo "== TIMINGS (sweep-read.mjs over time7/ and time6/; each solve one process a core, two at a time on this machine's two cores)"
node $D/sweep-read.mjs $D/time7 $D/time6 $D/split $D/pair
echo
echo "== THE SPLIT (split-time.mjs, alone on the machine: one core, then the split across both; e3pcls off in both, declared)"
for f in $D/split/*.json; do [ -f "$f" ] && tail -1 "$f"; done
echo
echo "== THE CANDIDATE AS IT STANDS, UNCHANGED ON THIS CODE: time-e5.mjs S248 6 CAND (the hash before the cuts: 583780ad104ff04e, time/S248-6-CAND.json)"
tail -1 $D/time7/S248-6-CAND-regress.json
echo
echo "== WHAT IS LEFT: the profile with all five, S370 at 45 points (node --cpu-prof time-e5.mjs S370 45 ALL; one process a core, two at a time; no SOLVER_PROFILE), read by cpu-top.mjs and cpu-lines.mjs"
P=$(ls $D/prof/S370-HRT3-ALL.cpu/*.cpuprofile | head -1)
node /home/claude/monte-carlo-retirement-planner/research/reviews/2026-10-25/scripts/speed/cpu-top.mjs $P 22
echo "-- the hottest lines (function:line on e11.patch's code)"
node $D/cpu-lines.mjs $P readValues,locInto,expit,solve,readV,grow,flow 14
echo "-- spans (share-lines.mjs, the line spans of e11.patch's grid.js and solve.js)"
node $D/share-lines.mjs $P solver/grid.js "the corner sums=398-399" "the log-odds (expit)=41" "the axis's log (locInto)=313"
node $D/share-lines.mjs $P solver/solve.js "E8's ids, once a cell=1213-1233" "E8's memo, probe and put=1247-1259+1283" "each move's lookups of next year's tables (E9)=1238-1241" "copying a position before it grows=1266" "E7's mixture, once a cell=1292-1303" "scoring each layer (phase B, with E7)=1304-1326"
