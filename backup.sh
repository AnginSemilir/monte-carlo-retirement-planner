#!/bin/bash
# Copy D4's finished chunks (the case log with its done line, and the arrays it names) into d4-run/, commit and push.
# Usage: backup.sh            one copy
#        backup.sh --loop PID copy every 30 minutes while PID runs, then once more
set -u
SRC=${D4_SRC:-/home/user/d4-launch/research/solver/results/d4-run}
cd "$(dirname "$0")" || exit 1
once() {
  local n=0 miss=0
  for f in "$SRC"/case*.txt; do
    [ -f "$f" ] || continue
    grep -qE '^ +done ' "$f" || continue
    local units ok=1
    units=$(sed -nE 's/^([A-Z0-9]+) +case \| unit ([A-Z]+)\/W([0-9.]+) c([0-9]+)\/[0-9]+ .*/\1-\2-w\3-c\4.json.gz/p' "$f" | tr 'A-Z' 'a-z' | sed -E 's/^s/S/; s/^([a-z0-9]+)/\U\1/')
    [ -n "$units" ] || { echo "backup: no unit line in $(basename "$f")"; miss=$((miss+1)); continue; }
    for j in $units; do
      { [ -f "$SRC/$j" ] && gzip -t "$SRC/$j" 2>/dev/null; } || { echo "backup: $(basename "$f") done but $j missing or unreadable"; ok=0; }
    done
    [ $ok = 1 ] || { miss=$((miss+1)); continue; }
    for j in $units "$(basename "$f")"; do
      cmp -s "$SRC/$j" "d4-run/$j" || { cp -p "$SRC/$j" "d4-run/$j"; n=$((n+1)); }
    done
  done
  git add -A d4-run
  if ! git diff --cached --quiet; then
    local done_count
    done_count=$(ls d4-run/case*.txt 2>/dev/null | wc -l)
    git commit -q -m "D4 backup: $done_count of 520 chunks ($(date -u '+%d %b %H:%M') UTC)"
    local t
    for t in 2 4 8 16 0; do git push -q -u origin d4-backup && break; [ $t = 0 ] && echo "backup: push failed"; sleep $t; done
    echo "backup $(date -u '+%d %b %H:%M') UTC: $done_count chunks held, $n files new or changed, $miss skipped"
  fi
}
if [ "${1:-}" = --loop ]; then
  while kill -0 "$2" 2>/dev/null; do once; sleep 1800; done
  once; echo "backup: PID $2 gone, last copy made"
else
  once
fi
