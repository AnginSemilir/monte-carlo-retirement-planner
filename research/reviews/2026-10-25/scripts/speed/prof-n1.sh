#!/bin/bash
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/speed3
SOLVER_PROFILE=1 node --cpu-prof --cpu-prof-dir=$D/prof/S370-HRT3-N1.cpu $D/time-n1.mjs S370 > $D/prof/S370-HRT3-N1.json 2>&1 || { echo FAILED; tail -3 $D/prof/S370-HRT3-N1.json; exit 1; }
echo "== S370 HRT3-N1 profiled: $(cut -c1-200 $D/prof/S370-HRT3-N1.json)"
node $D/cpu-top.mjs $D/prof/S370-HRT3-N1.cpu/*.cpuprofile 24
