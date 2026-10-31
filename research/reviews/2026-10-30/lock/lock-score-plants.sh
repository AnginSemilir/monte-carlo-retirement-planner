#!/bin/bash
# THE LOCKED RUN'S SCORER, ITS CHECKS PLANTED (EXPLORATORY): each plant is a copy of results-lock-run.txt with one fault;
# the scorer must refuse it (exit 1) or, for a scoring plant, score the planted item as the plant implies. One line a plant.
#   bash lock-score-plants.sh      (results-lock-score-plants.txt)
cd "$(dirname "$0")" || exit 2
T=$(mktemp -d); R=results-lock-run.txt
plant() { # name, sed expression, what catches it ("refused" or a pattern the output must hold)
  sed -E "$2" "$R" > "$T/$1.txt"
  if cmp -s "$R" "$T/$1.txt"; then echo "  $1: THE PLANT CHANGED NOTHING (an error)"; return; fi
  out=$(node lock-score.mjs "$T/$1.txt" 2>&1); code=$?
  if [ "$3" = refused ]; then [ $code -ne 0 ] && echo "  $1: caught (refused: ${out#lock-score: })" || echo "  $1: NOT CAUGHT"
  else echo "$out" | grep -qE "$3" && echo "  $1: caught ($(echo "$out" | grep -oE "$3" | head -1))" || echo "  $1: NOT CAUGHT"; fi
}
echo "The locked run's scorer against planted faults in its input (copies of $R)"
plant not-fair 's/^FAIR: /NOT FAIR: /' refused
plant no-fair-line '/^FAIR: /d' refused
plant missing-household '/^  S050   APP/d' refused
plant household-survival '0,/^(         D10MLK )([0-9.]+)%/s//\1199.9%/' refused
plant pooled-pair 's/^(  D10MLK less DIAL10M: )([+-][0-9.]+)/\1+9.99/' refused
plant no-equal-survival '/^At equal survival/d' refused
plant score-verdict 's/(retired years 1-5, EZ less D10MLK: .*: )(EZ LOWER|EZ HIGHER|NOT SEPARATED)$/\1PLANTED/' refused
rm -rf "$T"
