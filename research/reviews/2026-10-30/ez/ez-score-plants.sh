#!/bin/bash
# EZ'S SCORER, ITS CHECKS PLANTED (EXPLORATORY): each plant is a copy of results-ez-run.txt with one fault; the scorer must
# refuse it (exit 1) or, for the scoring plant, score the planted item MISSED. Prints one line a plant.
#   bash ez-score-plants.sh      (results-ez-score-plants.txt)
cd "$(dirname "$0")" || exit 2
T=$(mktemp -d); R=results-ez-run.txt
plant() { # name, sed expression, what catches it ("refused" or a pattern the output must hold)
  sed "$2" "$R" > "$T/$1.txt"
  if cmp -s "$R" "$T/$1.txt"; then echo "  $1: THE PLANT CHANGED NOTHING (an error)"; return; fi
  out=$(node ez-score.mjs "$T/$1.txt" 2>&1); code=$?
  if [ "$3" = refused ]; then [ $code -ne 0 ] && echo "  $1: caught (refused: ${out#ez-score: })" || echo "  $1: NOT CAUGHT"
  else echo "$out" | grep -q "$3" && echo "  $1: caught ($(echo "$out" | grep -o "$3"))" || echo "  $1: NOT CAUGHT"; fi
}
echo "EZ's scorer against planted faults in its input (copies of $R)"
plant not-fair 's/^FAIR: /NOT FAIR: /' refused
plant no-fair-line '/^FAIR: /d' refused
plant household-pair 's/EZ less CAND -1.10 (se 0.36/EZ less CAND -0.10 (se 0.36/' refused
plant household-survival 's/^\(         EZ \)94.0%, first year 80.0%/\197.0%, first year 80.0%/' refused
plant pooled-pair 's/EZ less CAND, survival -0.84 (se 0.12/EZ less CAND, survival -0.54 (se 0.12/' refused
plant retirees 's/^\(         EZ 98.1%, first year \)90.0%/\180.0%/' refused
plant missing-household '/^  S340F  APP/d' refused
plant score-years-1-5 's/^\(  EZ       survival 96.1%; the first retired year 89.0% (the retirees 82.5%); by retired years 1-5 \)91.1%/\199.1%/' '2\. retired years 1-5: EZ 99.1%.*MISSED'
rm -rf "$T"
